'use strict';

var util = require('util');
var File = require('vinyl');

function Custom(opts) {
  if (!(this instanceof Custom)) {
    return new Custom(opts);
  }
  File.call(this, opts);
  this.isCustom = true;
}
util.inherits(Custom, File);

module.exports = Custom;
