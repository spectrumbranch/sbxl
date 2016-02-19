var sbxl = require('../');

//Constructor
var virtualHostService = function(init) {
    //Check required fields
    if (    init.service 
            && init.sitesAvailableDir 
            && init.sitesEnabledDir 
            && init.storageFilename 
            && init.memoryFilename
        ) {
        this.service = init.service;
        this.sitesAvailableDir = init.sitesAvailableDir;
        this.sitesEnabledDir = init.sitesEnabledDir;
        this.storageFilename = init.storageFilename;
        this.memoryFilename = init.memoryFilename;
    } else {
        throw new Error('Must be initialized properly.');
    }
};
module.exports = virtualHostService;

//TODO refactor apache.js core into here for sharing with nginx