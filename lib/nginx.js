var sbxl = require('./');

var nginx = new sbxl.VirtualHostService({
    service: 'Nginx',
    sitesAvailableDir: '/etc/nginx/sites-available/',
    sitesEnabledDir: '/etc/nginx/sites-enabled/',
    storageFilename: 'nginx.json',
    memoryFilename: 'nginx.memory.json',
    enableSiteFn: function(site, sitesAvailable, sitesEnabled) {
    	return sbxl.util.exec('ln -s ' + sitesAvailable + ' ' + sitesEnabled).then(function() {
    		console.log('Successfully enabled nginx site', site);
    		return true;
    	}).catch(function(err) {
    		console.log('nginx error during enableSiteFn: ', err);
    		return false;
    	});
    }
});
module.exports = nginx;