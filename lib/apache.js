var apache = {};
apache.sitesAvailableDir = '/etc/apache2/sites-available/';
apache.sitesEnabledDir = '/etc/apache2/sites-enabled/';
apache.storageFilename = 'apache.json';
module.exports = apache;

var sbxl = require('./');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

apache.analysis = function(options) {
	//TODO store all sites-available in a memory file if the file doesn't exist
	//If the file exists, only overwrite it if options.force is true
	q.all([
        apache.getAllSitesAvailable(),
        apache.getAllSitesEnabled(),
    ]).then(function(results) {
        console.log('Apache2 sites-available: ', results[0]);
        console.log('Apache2 sites-enabled: ', results[1]);
        console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    }).catch(console.log.bind(console));
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
	return q.all(sitesAvailable.map(function(site) {
		return apache.retrieveVirtualHost(site);
	})).catch(console.log.bind(console));;
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