var sbxl = require('./');

var apache = new sbxl.VirtualHostService({
    service: 'Apache2',
    sitesAvailableDir: '/etc/apache2/sites-available/',
    sitesEnabledDir: '/etc/apache2/sites-enabled/',
    storageFilename: 'apache.json',
    memoryFilename: 'apache.memory.json',
    enableSiteFn: function(site, sitesAvailable, sitesEnabled) {
    	return sbxl.util.exec('a2ensite ' + site).then(function() {
    		console.log('Successfully enabled apache site', site);
    		return true;
    	}).catch(function(err) {
    		console.log('apache2 error during enableSiteFn: ', err);
    		return false;
    	});
    }
});
module.exports = apache;