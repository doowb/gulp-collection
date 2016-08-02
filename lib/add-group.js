'use strict';

var through = require('through2');
var src = require('src-stream');
var utils = require('./utils');

module.exports = function(group, structure, options) {
  var stream = through.obj();
  function done(err) {
    if (err) {
      stream.emit('error', err);
    }
    stream.end();
  }

  setImmediate(function() {
    try {
      var files = exports.createFiles(group, structure, options);
      files.forEach(function(file) {
        stream.write(file);
      });
      done();
    } catch (err) {
      done(err);
    }
  });

  return src(stream);
};

module.exports.createFiles = function(group, structure, options) {
  if (typeof structure === 'object') {
    options = structure;
    structure = null;
  }
  options = options || {};
  structure = structure || options.structure;

  var list = utils.normalizeFile(options.list);
  var item = utils.normalizeFile(options.item);
  var prop = utils.getProp(structure);
  var single = utils.single(prop);
  var File = options.File;

  var files = [];

  // if there aren't any groups, just return
  var keys = Object.keys(group);
  if (keys.length === 0) {
    return files;
  }

  // create the main index file containing all the `groups`
  if (list) {
    var data = {};
    data[prop] = prop;
    var index = utils.createFile(list, list.structure || `:${prop}:extname`, data, File);
    index.data = {};
    index.data[prop] = group;
    files.push(index);
  }

  // for each key (group), create a page (or pages when paginating)
  if (item) {
    for(var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var items = group[key];
      var opts = {structure: structure, prop: single};
      opts[prop] = prop;
      opts[single] = key;

      if (options.paginate) {
        opts.paginate = options.paginate;
        utils.paginate(item, items, opts, files.push.bind(files), File);
      } else {
        var file = utils.createFile(item, structure, opts, File);
        file.data = {items: items};
        file.data[single] = key;
        files.push(file);
      }
    }
  }
  return files;
};
