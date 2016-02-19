var sbxl = require('./');

var nginx = new sbxl.VirtualHostService({
    service: 'Nginx',
    sitesAvailableDir: '/etc/nginx/sites-available/',
    sitesEnabledDir: '/etc/nginx/sites-enabled/',
    storageFilename: 'nginx.json',
    memoryFilename: 'nginx.memory.json'
});
module.exports = nginx;