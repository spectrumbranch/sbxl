const sbxl = require('../');

const apache = new sbxl.VirtualHostService({
    service: 'Apache2',
    sitesAvailableDir: '/etc/apache2/sites-available/',
    sitesEnabledDir: '/etc/apache2/sites-enabled/',
    storageFilename: 'apache.json',
    memoryFilename: 'apache.memory.json',
    enableSiteFn: function(site, sitesAvailable, sitesEnabled) {
    	return sbxl.util.exec('a2ensite ' + site).then(() => {
    		console.log('Successfully enabled apache site', site);
    		return true;
    	}).catch(err => {
    		console.log('apache2 error during enableSiteFn: ', err);
    		return false;
    	});
    }
});
module.exports = apache;
