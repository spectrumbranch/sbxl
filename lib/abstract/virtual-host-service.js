var sbxl = require('../');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

//Constructor
var vhs = function(init) {
    //Check required fields
    if (    init.service 
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
    } else {
        throw new Error('Must be initialized properly.');
    }
};
module.exports = vhs;

//

vhs.prototype.analysis = function(options) {
    var self = this;
	if (!options) {
		options = {};
	}
	return q.all([
		self.getAllSitesAvailable(),
		self.getAllSitesEnabled(),
	]).then(function(results) {
		if (options.verbose) {
			console.log('Apache2 sites-available: ', results[0]);
			console.log('Apache2 sites-enabled: ', results[1]);
			console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
		}
		return results;
	}).then(function(results) {
		return self.handleAnalysisMemory(results[0], options);
	}).catch(console.log.bind(console));
}

vhs.prototype.handleAnalysisMemory = function(sitesAvailable, options) {
    var self = this;
	if (!options) {
		options = {};
	}
	return qfs.stat(util.getAppStorageDirectory() + self.memoryFilename).then(function(stat) {
		if (options.force) {
			//Write over memory if force is true
			console.log('Memory file exists but force option specified. Writing over memory file.');
			return self.writeAnalysisMemory(sitesAvailable);
		} else {
			//Return what already exists if force if false
			console.log('Memory file exists but force option is false. Returning what already exists.');
			return qfs.read(util.getAppStorageDirectory() + self.memoryFilename);
		}
	}).catch(function(err) {
		if (err.code == 'ENOENT') {
			//File doesn't exist, create it
			console.log('Memory file does not yet exist. Creating one now.');
			return self.writeAnalysisMemory(sitesAvailable);
		} else {
			console.log('Unrecognized error: ', err);
			throw err;
		}
	});
}

vhs.prototype.import = function() {
    var self = this;
	//Step 1: get contents of <<storageData>>.json
	return self.getStorageData().then(function(storageData) {
		console.log('Loaded', storageData.length, 'objects from storage.');

		//Step 2: Try to create the virtual-hosts files from the storage data.
		// If there are permission problems, or the file already exists, we should error out here.

		return q.all(storageData.map(function(siteAvailable) {
			//check existence of siteAvailable file
			return qfs.stat(self.sitesAvailableDir + siteAvailable.name).then(function(virtualHost) {
				//file exists, do not overwrite.
				console.log(self.service + ' sites-available [',siteAvailable.name,'] already exists: ', virtualHost.node.atime);
				return null;
			}).catch(function(err) {
				if (err.code == 'ENOENT') {
					//File doesn't exist, create it
					console.log('Virtual Host file does not yet exist. Creating it now for ', siteAvailable.name);
					console.log('Writing: ', self.sitesAvailableDir + siteAvailable.name);
					//console.log('Contents: ', siteAvailable.contents);

					return self.writeSiteAvailable(self.sitesAvailableDir + siteAvailable.name, siteAvailable.contents).then(function() {
						return self.enableSite(siteAvailable.name);
					});
				} else {
					console.log('Unrecognized error: ', err);
					throw err;
				}
			});
		}));
	}).catch(function(err) {
		console.log('Error during import:',err);
	});
}

vhs.prototype.enableSite = function(site) {
	var self = this;
	return self.enableSiteFn(site, self.sitesAvailableDir + site, self.sitesEnabledDir + site);
}

vhs.prototype.writeSiteAvailable = function(path, contents) {
	return qfs.write(path, contents).catch(function(writeError) {
		if (writeError.code == 'EACCES') {
			//Need to quit and tell the user they need sudo.
			console.log('This process may require permissions in order to write file: ', path);
			return;
		} else {
			console.log('Unrecognized error: ', writeError);
			throw err;
		}
	});
}

vhs.prototype.export = function() {
    var self = this;
	return self.getExportData().then(function(exportData) {
		console.log('Retrieved', exportData.length, 'objects');
		return qfs.write(util.getAppStorageDirectory() + self.storageFilename, JSON.stringify(exportData));
	}).catch(console.log.bind(console));
}

vhs.prototype.getExportData = function() {
    var self = this;
	return self.getAllSitesAvailable().then(function(sitesAvailable) {
		return self.processEachSiteAvailable(sitesAvailable).then(function(exportedData) {
			return exportedData;
		})
	}).catch(console.log.bind(console));
}

//Iterates through all sitesAvailable and returns the virtual hosts as an array
vhs.prototype.processEachSiteAvailable = function(sitesAvailable) {
    var self = this;
	return self.analysis({ verbose: false }).then(function(analysisMemory) {
		return q.all(sitesAvailable.filter(function(site) {
			//only return true if it exists in the memory file
			//Filter out sites we don't want to work with
			var analysisMemoryAsJSON = JSON.parse(analysisMemory);
			var keep = false;
			for (var i = 0; i < analysisMemoryAsJSON.sitesAvailable.length; i++) {
				if (analysisMemoryAsJSON.sitesAvailable[i].name === site && analysisMemoryAsJSON.sitesAvailable[i].active === true) {
					keep = true;
					break;
				}
			}
			return keep;
		}).map(function(site) {
			return self.retrieveVirtualHost(site);
		}))
	}).catch(console.log.bind(console));
}

vhs.prototype.getStorageData = function() {
    var self = this;
	return qfs.read(util.getAppStorageDirectory() + self.storageFilename).then(function(importData) {
		return JSON.parse(importData);
	}).catch(console.log.bind(console));
}

vhs.prototype.retrieveVirtualHost = function(site) {
    var self = this;
	return qfs.read(self.sitesAvailableDir + site).then(function(virtualHost) {
		return {
			name: site,
			contents: virtualHost
		};
	}).catch(console.log.bind(console));
}

vhs.prototype.getAllSitesAvailable = function() {
    var self = this;
	return qfs.list(self.sitesAvailableDir);
}

vhs.prototype.getAllSitesEnabled = function() {
    var self = this;
	return qfs.list(self.sitesEnabledDir);
}

vhs.prototype.writeAnalysisMemory = function(sitesAvailable) {
    var self = this;
	//Active all sites for use in other system processes like export, import
	//Users can manually disable sites to have them excluded from these processes
	var preparedList = [];
	for (var i = 0; i < sitesAvailable.length; i++) {
		var preparedSite = {
			name: sitesAvailable[i],
			active: true
		};
		preparedList.push(preparedSite);
	}
	var memory = {
		sitesAvailable: preparedList
	};
	return qfs.write(util.getAppStorageDirectory() + self.memoryFilename , JSON.stringify(memory, null, 4))
		.then(function() {
			return qfs.read(util.getAppStorageDirectory() + self.memoryFilename);
		});
}