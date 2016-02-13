#!/usr/bin/env node
var sbxl = require('./lib')
  , argv = require('yargs')
      .usage('Usage: $0 -m [mode] -s [service]')

      .describe('s', 'Choose a service to work with')
      .choices('s', ['system', 'apache', 'nginx', 'mysql'])
      .alias('s', 'service')
      //.default('s', 'system')

      .describe('m', 'Mode of operation')
      .choices('m', ['analysis', 'import', 'export'])
      .alias('m', 'mode')
      .default('m', 'analysis')

      .demand(['m', 's'])
      .argv
  ;


if (argv.m === 'analysis') {
    if (argv.s === 'system') {
        sbxl.system.analysis();
    } else if (argv.s === 'apache') {
        sbxl.apache.analysis();
    } else if (argv.s === 'nginx') {
        sbxl.nginx.analysis();
    }
} else if (argv.m === 'export') {
    if (argv.s === 'system') {
        //
    } else if (argv.s === 'apache') {
        sbxl.apache.export();
    } else if (argv.s === 'nginx') {
        //sbxl.nginx.export();
    }
} else if (argv.m === 'import') {

}
