'use strict';
var File = require('vinyl-item');

function Custom(opts) {
  if (!(this instanceof Custom)) {
    return new Custom(opts);
  }
  define(this, 'fns', []);
  File.call(this, opts);
  this.isCustom = true;
}

File.extend(Custom);

function define(obj, name, val) {
  Object.defineProperty(obj, name, {
    enumerable: false,
    configurable: true,
    value: val
  });
}

module.exports = Custom;
