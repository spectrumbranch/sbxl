var system = {};
module.exports = system;

var sbxl = require('./');
var util = sbxl.util;

system.analysis = function() {
	console.log('appStorageDirectory: ', util.getAppStorageDirectory());
}