const sbxl = require('../../');
const q = sbxl.q;
const qfs = sbxl.qfs;

// Constructor
const vhs = function (init) {
    // Check required fields
    if (init.service
            && init.sitesAvailableDir 
            && init.sitesEnabledDir 
            && init.storageFilename 
            && init.memoryFilename
            && init.enableSiteFn
        ) {
        this.service = init.service;
        this.sitesAvailableDir = init.sitesAvailableDir;
        this.sitesEnabledDir = init.sitesEnabledDir;
        this.storageFilename = init.storageFilename;
        this.memoryFilename = init.memoryFilename;
        this.enableSiteFn = init.enableSiteFn;
        if (init.deepAnalyze) {
        	this.deepAnalyze = init.deepAnalyze;
		}
    } else {
        throw new Error('[DEV-ERROR] sbxl:virtual-host-service: Must be initialized properly.');
    }
};

vhs.prototype.analysis = function ({
   force = false,
   verbose = false
}) {
	return q.all([
		this.getAllSitesAvailable(),
		this.getAllSitesEnabled(),
	]).then(results => {
		const vhAnalysis = {
			sitesAvailable: results[0],
			sitesEnabled: results[1],
			map: {}
		};
		for (let i = 0; i < vhAnalysis.sitesAvailable.length; i++) {
			const site = vhAnalysis.sitesAvailable[i];
			vhAnalysis.map[site] = {
				enabled: false
			};
		}
		for (let j = 0; j < vhAnalysis.sitesEnabled.length; j++) {
			const site = vhAnalysis.sitesEnabled[j];
			if (vhAnalysis.map[site] === undefined) {
				vhAnalysis.map[site] = {};
			}
			vhAnalysis.map[site].enabled = true;
		}
		if (verbose) {
			return this.handleDeepAnalysis(vhAnalysis).then(() => {
				return results;
			});
		}
		return results;
	}).then(results => {
		return this.handleAnalysisMemory(results[0], { force });
	}).catch(console.log.bind(console));
};

vhs.prototype.handleDeepAnalysis = function (vhAnalysis) {
	const serviceName = this.service;

	console.log(serviceName);
	console.table(vhAnalysis.map);

	if (this.deepAnalyze) {
		return Promise.all(vhAnalysis.sitesEnabled.map(site => {
			return this.retrieveVirtualHost(site).then(vh => {
				return this.deepAnalyze(vh);
			}).then(deep => {
				return {
					site,
					...deep
				};
			});
		})).then(deeplyAnalyzedSites => {
			deeplyAnalyzedSites = deeplyAnalyzedSites.reduce((r, a) => {
				const site = a.site;
				delete a.site;
				r[site] = a;
				return r;
			}, {});
			console.table(deeplyAnalyzedSites);
		});
	} else {
		return new Promise(() => {});
	}
};

vhs.prototype.handleAnalysisMemory = function (sitesAvailable, { force = false }) {
	return qfs.stat(sbxl.util.getAppStorageDirectory() + this.memoryFilename).then(stat => {
		if (force) {
			// Write over memory if force is true
			console.log('Memory file exists but force option specified. Writing over memory file.');
			return this.writeAnalysisMemory(sitesAvailable);
		} else {
			// Return what already exists if force if false
			console.log('Memory file exists but force option is false. Returning what already exists.');
			return qfs.read(sbxl.util.getAppStorageDirectory() + this.memoryFilename);
		}
	}).catch(err => {
		if (err.code === 'ENOENT') {
			// File doesn't exist, create it
			console.log('Memory file does not yet exist. Creating one now.');
			return this.writeAnalysisMemory(sitesAvailable);
		} else {
			console.log('Unrecognized error:', err);
			throw err;
		}
	});
};

vhs.prototype.import = function () {
	// Step 1: get contents of <<storageData>>.json
	return this.getStorageData().then(storageData => {
		console.log('Loaded', storageData.length, 'objects from storage.');

		// Step 2: Try to create the virtual-hosts files from the storage data.
		//  If there are permission problems, or the file already exists, we should error out here.
		return q.all(storageData.map(siteAvailable => {
			return this.createSiteAvailable(siteAvailable);
		}));
	}).catch(err => {
		console.log('Error during import:', err);
	});
};

vhs.prototype.createSiteAvailable = function ({ name, contents }) {
	// check existence of siteAvailable file
	return qfs.stat(this.sitesAvailableDir + name).then(virtualHost => {
		// file exists, do not overwrite.
		console.log(this.service, ' sites-available [', name, '] already exists: ', virtualHost.node.atime);
		return null;
	}).catch(err => {
		if (err.code === 'ENOENT') {
			// File doesn't exist, create it
			const fullDir = this.sitesAvailableDir + name;
			console.log('Virtual Host file does not yet exist. Creating it now for', name);
			console.log('Writing:', fullDir);
			//console.log('Contents: ', contents);

			return this.writeSiteAvailable(fullDir, contents).then(() => {
				return this.enableSite(name);
			});
		} else {
			console.log('Unrecognized error:', err);
			throw err;
		}
	});
};

vhs.prototype.enableSite = function (site) {
	return this.enableSiteFn(site, this.sitesAvailableDir + site, this.sitesEnabledDir + site).catch(enableError => {
		if (enableError.code === 'EACCES') {
			// Need to quit and tell the user they need sudo.
			console.log('This process may require elevated permissions.', enableError);
			return false;
		} else {
			console.log('The enable site process had an error, and may require elevated permissions.', enableError);
			return false;
		}
	});
};

vhs.prototype.writeSiteAvailable = function (path, contents) {
	return qfs.write(path, contents).catch(writeError => {
		if (writeError.code === 'EACCES') {
			// Need to quit and tell the user they need sudo.
			console.log('This process may require permissions in order to write file:', path);
			return;
		} else {
			console.log('Unrecognized error:', writeError);
			throw writeError;
		}
	});
};

vhs.prototype.export = function () {
	return this.getExportData().then(exportData => {
		console.log('Retrieved', exportData.length, 'objects');
		return qfs.write(sbxl.util.getAppStorageDirectory() + this.storageFilename, JSON.stringify(exportData));
	}).catch(console.log.bind(console));
};

vhs.prototype.getExportData = function () {
	return this.getAllSitesAvailable().then(sitesAvailable => {
		return this.processEachSiteAvailable(sitesAvailable);
	}).catch(console.log.bind(console));
};

/**
 * Iterates through all sitesAvailable and returns the virtual hosts as an array
  */
vhs.prototype.processEachSiteAvailable = function (sitesAvailable) {
	return this.analysis({ verbose: false }).then(analysisMemory => {
		return q.all(sitesAvailable.filter(site => {
			// Only return true if it exists in the memory file
			// Filter out sites we don't want to work with
			const analysisMemoryAsJSON = JSON.parse(analysisMemory);
			let keep = false;
			for (let i = 0; i < analysisMemoryAsJSON.sitesAvailable.length; i++) {
				if (analysisMemoryAsJSON.sitesAvailable[i].name === site && analysisMemoryAsJSON.sitesAvailable[i].active === true) {
					keep = true;
					break;
				}
			}
			return keep;
		}).map(site => {
			return this.retrieveVirtualHost(site);
		}))
	}).catch(console.log.bind(console));
};

vhs.prototype.getStorageData = function () {
	return qfs.read(sbxl.util.getAppStorageDirectory() + this.storageFilename).then(importData => {
		return JSON.parse(importData);
	}).catch(console.log.bind(console));
};

vhs.prototype.retrieveVirtualHost = function (site) {
	return qfs.read(this.sitesAvailableDir + site).then(virtualHost => {
		return {
			name: site,
			contents: virtualHost
		};
	}).catch(console.log.bind(console));
};

vhs.prototype.getAllSitesAvailable = function () {
	return qfs.list(this.sitesAvailableDir);
};

vhs.prototype.getAllSitesEnabled = function () {
	return qfs.list(this.sitesEnabledDir);
};

/**
 * Writes the memory file for all sitesAvailable, replacing all data in the current memory file if it exists.
 * @param sitesAvailable
 * @returns {PromiseLike<T>}
 */
vhs.prototype.writeAnalysisMemory = function (sitesAvailable) {
	// Users can manually disable sites to have them excluded from these processes
	const preparedList = [];
	for (let i = 0; i < sitesAvailable.length; i++) {
		const preparedSite = {
			name: sitesAvailable[i],
			// active by default for use in processes like export, import
			active: true
		};
		preparedList.push(preparedSite);
	}
	const memory = {
		sitesAvailable: preparedList
	};
	const memoryFilename = sbxl.util.getAppStorageDirectory() + this.memoryFilename;
	const memoryContents = JSON.stringify(memory, null, 4);
	return qfs.write(memoryFilename, memoryContents).then(() => {
		return qfs.read(memoryFilename);
	});
};

module.exports = vhs;
