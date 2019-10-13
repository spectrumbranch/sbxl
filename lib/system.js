const system = {};

const sbxl = require('./');
const util = sbxl.util;
const q = sbxl.q;
const qfs = sbxl.qfs;


system.setup = function() {
	// Create the necessary directory to do work in and store state
	return qfs.makeTree(util.getAppStorageDirectory()).then(() => {
		console.log('done');
	});
};

system.analysis = function() {
	system.setup();

	console.log('appStorageDirectory: ', util.getAppStorageDirectory());
};

module.exports = system;
