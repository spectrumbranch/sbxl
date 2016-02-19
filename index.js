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

      .describe('f', 'Force action')
      .boolean('f')
      .alias('f', 'force')
      .default('f', false)

      .describe('v', 'Verbose output')
      .boolean('v')
      .alias('v', 'verbose')
      .default('v', false)

      .demand(['m', 's'])
      .argv
  ;


if (argv.m === 'analysis') {
    var options = {};
    options.force = argv.f;
    options.verbose = argv.v

    if (argv.s === 'system') {
        sbxl.system.analysis(options);
    } else if (argv.s === 'apache') {
        sbxl.apache.analysis(options);
    } else if (argv.s === 'nginx') {
        sbxl.nginx.analysis(options);
    }
} else if (argv.m === 'export') {
    if (argv.s === 'system') {
        //
    } else if (argv.s === 'apache') {
        sbxl.apache.export();
    } else if (argv.s === 'nginx') {
        sbxl.nginx.export();
    }
} else if (argv.m === 'import') {
    if (argv.s === 'system') {
        //
    } else if (argv.s === 'apache') {
        sbxl.apache.import();
    } else if (argv.s === 'nginx') {
        sbxl.nginx.import();
    }
}
