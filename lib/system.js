var system = {};
module.exports = system;

var sbxl = require('./');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;


system.setup = function() {
	return qfs.makeTree(util.getAppStorageDirectory()).then(function() {
		console.log('done');
	});
	
}

system.analysis = function() {
	system.setup();

	console.log('appStorageDirectory: ', util.getAppStorageDirectory());
}