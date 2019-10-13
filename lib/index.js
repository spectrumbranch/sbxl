var sbxl = {};
module.exports = sbxl;
sbxl.q = require('q');
sbxl.qfs = require('q-io/fs');

sbxl.util = require('./util');
sbxl.VirtualHostService = require('./virtual-host/abstract/virtual-host-service');
sbxl.system = require('./system');
sbxl.apache = require('./virtual-host/apache');
sbxl.nginx = require('./virtual-host/nginx');
