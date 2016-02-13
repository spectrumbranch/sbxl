#!/usr/bin/env node
var sbxl = require('./lib')
  , util = sbxl.util
  , handlebars = require('handlebars')
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
}
