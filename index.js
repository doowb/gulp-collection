'use strict'

var Vinyl = require('vinyl');
var through = require('through2');
var groupBy = require('group-array');
var placeholders = require('placeholders');
var paginationator = require('paginationator');

module.exports = function(structure, options) {
  var files = [];
  var list = options.list;
  var item = options.item;
  var prop, single;

  var segs = structure.split('/');
  var len = segs.length, i = 0;
  while(len--) {
    var seg = segs[i++];
    if (typeof prop === 'undefined' && seg.indexOf(':') === 0) {
      prop = seg.slice(1);
      segs[i - 1] = prop;
      continue;
    }
    if (typeof single === 'undefined' && typeof prop === 'string' && seg.indexOf(':') === 0) {
      single = seg.slice(1).split('.')[0];
      break;
    }
  }
  structure = segs.join('/');
  var permalink = placeholders();

  return through.obj(function(file, enc, next) {
    files.push(file);
    next(null, file);
  }, function(cb) {
    var group = groupBy(files, `data.${prop}`);
    var keys = Object.keys(group);
    if (keys.length === 0) {
      return cb();
    }

    var index = new Vinyl({
      base: list.base,
      path: prop + list.extname,
      contents: list.contents
    });
    index.data = {};
    index.data[prop] = group;
    this.push(index);

    var stream = this;
    keys.forEach(function(key) {
      var items = group[key];
      var paged = paginationator(items);
      paged.pages.forEach(function(page) {
        page[single] = key;
        var view = new Vinyl({
          base: item.base,
          path: permalink(structure, page),
          contents: item.contents
        });
        view.data = page;
        stream.push(view);
      });

    });
    cb();
  });
}
