#!/usr/bin/env node
var util = require('./lib/util')
  , handlebars = require('handlebars')
  , q = require('q')
  , qfs = require('q-io/fs')
  , argv = require('yargs')
      .usage('Usage: $0 -m [mode]')
      .describe('m', 'Mode of operation')
      .choices('m', ['apache', 'nginx', 'analysis'])
      .demand(['m'])
      .alias('m', 'mode')
      .argv
  ;

if (argv.m === 'analysis') {
    console.log('dir grabbing');
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

    

    console.log('home: ', home);
    console.log('user: ', user);

    console.log('actualHome: ', actualHome); 

    console.log('sudoUser: ', sudoUser);
}
  
if (argv.m === 'apache') {
    q.all([
        qfs.list('/etc/apache2/sites-available/'),
        qfs.list('/etc/apache2/sites-enabled/'),
    ]).then(function(results) {
        console.log('Apache2 sites-available: ', results[0]);
        console.log('Apache2 sites-enabled: ', results[1]);
        console.log('Apache2 sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    });
    
}

if (argv.m === 'nginx') {
    q.all([
        qfs.list('/etc/nginx/sites-available/'),
        qfs.list('/etc/nginx/sites-enabled/'),
    ]).then(function(results) {
        console.log('Nginx sites-available: ', results[0]);
        console.log('Nginx sites-enabled: ', results[1]);
        console.log('Nginx sites list are the same: ', util.unsortedCompareArray(results[0], results[1]));
    });
    
}