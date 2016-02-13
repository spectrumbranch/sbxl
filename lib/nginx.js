var nginx = {};
module.exports = nginx;

var sbxl = require('./');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

nginx.analysis = function() {
	q.all([
        qfs.list('/etc/nginx/sites-available/'),
        qfs.list('/etc/nginx/sites-enabled/')
    ]).then(function(results) {
        console.log('Nginx sites-available: ', results[0]);
        console.log('Nginx sites-enabled: ', results[1]);
        console.log('Nginx sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    });
}