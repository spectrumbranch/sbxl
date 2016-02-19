var sbxl = require('./');

var apache = new sbxl.VirtualHostService({
    service: 'Apache2',
    sitesAvailableDir: '/etc/apache2/sites-available/',
    sitesEnabledDir: '/etc/apache2/sites-enabled/',
    storageFilename: 'apache.json',
    memoryFilename: 'apache.memory.json'
});
module.exports = apache;