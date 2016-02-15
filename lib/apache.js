var sbxl = require('./');

var apache = new sbxl.VirtualHostService();
apache.sitesAvailableDir = '/etc/apache2/sites-available/';
apache.sitesEnabledDir = '/etc/apache2/sites-enabled/';
apache.storageFilename = 'apache.json';
apache.memoryFilename = 'apache.memory.json';
module.exports = apache;


var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

apache.analysis = function(options) {
	if (!options) {
		options = {};
	}
	return q.all([
        apache.getAllSitesAvailable(),
        apache.getAllSitesEnabled(),
    ]).then(function(results) {
    	if (options.verbose) {
	        console.log('Apache2 sites-available: ', results[0]);
	        console.log('Apache2 sites-enabled: ', results[1]);
	        console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    	}
        return results;
    }).then(function(results) {
    	return apache.handleAnalysisMemory(results[0], options);
    }).catch(console.log.bind(console));
}

apache.handleAnalysisMemory = function(sitesAvailable, options) {
	if (!options) {
		options = {};
	}
	return qfs.stat(util.getAppStorageDirectory() + apache.memoryFilename).then(function(stat) {
		if (options.force) {
			//Write over memory if force is true
			console.log('Memory file exists but force option specified. Writing over memory file.');
			return apache.writeAnalysisMemory(sitesAvailable);
		} else {
			//Return what already exists if force if false
			console.log('Memory file exists but force option is false. Returning what already exists.');
			return qfs.read(util.getAppStorageDirectory() + apache.memoryFilename);
		}
	}).catch(function(err) {
		if (err.code == 'ENOENT') {
			//File doesn't exist, create it
			console.log('Memory file does not yet exist. Creating one now.');
			return apache.writeAnalysisMemory(sitesAvailable);
		} else {
			console.log('Unrecognized error: ', err);
			throw err;
		}
	});
}

apache.writeAnalysisMemory = function(sitesAvailable) {
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
	return qfs.write(util.getAppStorageDirectory() + apache.memoryFilename , JSON.stringify(memory, null, 4))
		.then(function() {
			return qfs.read(util.getAppStorageDirectory() + apache.memoryFilename);
		});
}

apache.export = function() {
	return apache.getExportData().then(function(exportData) {
		console.log('Retrieved', exportData.length, 'objects');
		return qfs.write(util.getAppStorageDirectory() + apache.storageFilename, JSON.stringify(exportData));
	}).catch(console.log.bind(console));
}

apache.getExportData = function() {
	return apache.getAllSitesAvailable().then(function(sitesAvailable) {
		return apache.processEachSiteAvailable(sitesAvailable).then(function(exportedData) {
			return exportedData;
		})
	}).catch(console.log.bind(console));
}

//Iterates through all sitesAvailable and returns the virtual hosts as an array
apache.processEachSiteAvailable = function(sitesAvailable) {
	return apache.analysis({ verbose: false }).then(function(analysisMemory) {
		return q.all(sitesAvailable.filter(function(site) {
			//TODO only return true if it exists in the memory file
			//Filter out sites we don't want to work with
			return true;
		}).map(function(site) {
			return apache.retrieveVirtualHost(site);
		}))
	}).catch(console.log.bind(console));
}

apache.getAllSitesAvailable = function() {
	return qfs.list(apache.sitesAvailableDir);
}

apache.getAllSitesEnabled = function() {
	return qfs.list(apache.sitesEnabledDir);
}

apache.retrieveVirtualHost = function(site) {
	return qfs.read(apache.sitesAvailableDir + site).then(function(virtualHost) {
		return {
			name: site,
			contents: virtualHost
		};
	}).catch(console.log.bind(console));
}