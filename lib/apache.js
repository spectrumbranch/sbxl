var apache = {};
apache.sitesAvailableDir = '/etc/apache2/sites-available/';
apache.sitesEnabledDir = '/etc/apache2/sites-enabled/';
module.exports = apache;

var sbxl = require('./');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

apache.analysis = function() {
	q.all([
        qfs.list(apache.sitesAvailableDir),
        qfs.list(apache.sitesEnabledDir)
    ]).then(function(results) {
        console.log('Apache2 sites-available: ', results[0]);
        console.log('Apache2 sites-enabled: ', results[1]);
        console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    });
}

apache.export = function() {
	return apache.getExportData().then(function(exportData) {
		console.log(exportData);
		return qfs.write(util.getAppStorageDirectory() + 'apache.json', JSON.stringify(exportData));
	}).catch(console.log.bind(console));
}

apache.getExportData = function() {
	return qfs.list(apache.sitesAvailableDir).then(function(sitesAvailable) {
		return q.all(sitesAvailable.map(function(site) {
			return qfs.read(apache.sitesAvailableDir + site).then(function(virtualHost) {
				return {
					name: site,
					contents: virtualHost
				};
			});
		})).then(function(exportedData) {
			//console.log(exportedData);
			return exportedData;
		})
	}).catch(console.log.bind(console));
}