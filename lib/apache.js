var apache = {};
module.exports = apache;

var sbxl = require('./');
var util = sbxl.util;
var q = sbxl.q;
var qfs = sbxl.qfs;

apache.analysis = function() {
	q.all([
        qfs.list('/etc/apache2/sites-available/'),
        qfs.list('/etc/apache2/sites-enabled/'),
    ]).then(function(results) {
        console.log('Apache2 sites-available: ', results[0]);
        console.log('Apache2 sites-enabled: ', results[1]);
        console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    });
}