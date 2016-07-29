'use strict';
var File = require('vinyl-item');

function Custom(opts) {
  if (!(this instanceof Custom)) {
    return new Custom(opts);
  }
  File.call(this, opts);
  this.isCustom = true;
}

File.extend(Custom);

module.exports = Custom;
