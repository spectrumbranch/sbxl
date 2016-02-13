var util = {};
module.exports = util;


util.unsortedCompareArray = function(array1, array2) {
    return array1.sort().join(',') === array2.sort().join(',');
};

util.getAppStorageDirectory = function() {
	  var env = process.env;
    var home = env.HOME;
    var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;
    var sudoUser = env.SUDO_USER;
    var actualHome;

    if (sudoUser === undefined) {
      //TODO make usingRootAsSudo configurable
      var usingRootAsSudo = false;
      
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
}