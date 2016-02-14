var sbxl = {};
module.exports = sbxl;
sbxl.q = require('q');
sbxl.qfs = require('q-io/fs');
sbxl.handlebars = require('handlebars');

sbxl.VirtualHostService = require('./abstract/virtual-host-service');
sbxl.util = require('./util');
sbxl.system = require('./system');
sbxl.apache = require('./apache');
sbxl.nginx = require('./nginx');