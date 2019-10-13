const util = {};
module.exports = util;

const sbxl = require('./');
const q = sbxl.q;
const qfs = sbxl.qfs;

const exec = require('child_process').exec;


util.exec = function(cmd) {
    return q.promise(function(resolve, reject, notify) {
        /*const*/ var child = exec(cmd, 
        function (error, stdout, stderr) {
            console.log('stdout: ', stdout);
            console.log('stderr: ', stderr);
            if (error !== null) {
                console.log('exec error: ', error);
                reject(error);
            } else {
                if (stderr) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            }
        });
    });
};

util.unsortedCompareArray = function(array1, array2) {
    return array1.sort().join(',') === array2.sort().join(',');
};

util.getAppStorageDirectory = function() {
    const env = process.env;
    const home = env.HOME;
    const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;
    const sudoUser = env.SUDO_USER;
    let actualHome;

    if (sudoUser === undefined) {
      //TODO make usingRootAsSudo configurable
      const usingRootAsSudo = false;
      
      if (usingRootAsSudo) {
        actualHome = home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
      } else {
        actualHome = home || (user ? '/home/' + user : null);
      }
    } else {
        actualHome = (sudoUser ? '/home/' + sudoUser : null);
    }


    //console.log('actualHome: ', actualHome); 

    util.appStorageDirectory = actualHome + '/.sbxl/';

    return util.appStorageDirectory;
};