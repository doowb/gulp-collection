'use strict'

var utils = require('./lib/utils');
var addGroup = require('./lib/add-group');

module.exports = function(group, options) {
  if (arguments.length === 1) {
    options = group;
    group = null;
  }
  options = options || {};
  var collection = new utils.Collection(options);
  collection.use(addGroup(options));

  return utils.through.obj(function(file, enc, cb) {
    if (file.isVinylGroup) {
      group = group || file.group;
      cb();
    } else {
      cb(null, file);
    }
  }, function(cb) {
    var files = [];
    function onFile(file) {
      files.push(file);
    }

    collection.on('file', onFile);
    collection.addGroup(group, options);
    collection.off('file', onFile);

    files.forEach(function(file) {
      this.push(file);
    }, this);
    cb();
  });
};
