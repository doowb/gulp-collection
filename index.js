'use strict'

var utils = require('./lib/utils');
var vgroup = require('./lib/vinyl-group');
var vcollection = require('./lib/vinyl-collection');

module.exports = function(structure, options) {
  if (typeof structure === 'object') {
    options = structure;
    structure = '';
  }
  options = options || {};

  if (typeof structure !== 'string') {
    throw new utils.PluginError('gulp-collection', 'expected "structure" to be a "string"', options);
  }

  var files = [];
  var prop = utils.getProp(structure);
  return utils.through.obj(function(file, enc, cb) {
    files.push(file);
    cb(null, file);
  }, function(cb) {
    var group = vgroup.groupBy(files, `data.${prop}`);
    if (typeof options.groupFn === 'function') {
      options.groupFn(group);
    }

    files = vcollection.createFiles(group, structure, options);
    files.forEach(function(file) {
      this.push(file);
    }, this);
    cb();
  });
};
