'use strict';

var through = require('through2');
var groupBy = require('group-array');

module.exports = function() {
  var files = [];
  var options = {};
  var args = [].slice.call(arguments);
  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  return through.obj(function(file, enc, cb) {
    files.push(file);
    cb(null, file);
  }, function(cb) {
    args = [files].concat(args);
    var group = groupBy.apply(args);
    if (typeof options.groupFn === 'function') {
      groupFn(group);
    }
    cb();
  });
};

module.exports.groupBy = groupBy;
