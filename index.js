'use strict'

var utils = require('./lib/utils');

module.exports = function(structure, options) {
  if (typeof structure === 'object') {
    options = structure;
    structure = '';
  }
  if (typeof structure !== 'string') {
    throw new TypeError('expected "structure" to be a "string"');
  }
  options = options || {};

  var files = [];
  var list = utils.normalizeView(options.list);
  var item = utils.normalizeView(options.item);
  var onGroup = options.onGroup || utils.noop;
  var prop, single;

  /**
   * TODO: move this logic someplace else and make it better.
   */

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

  return utils.through.obj(function(file, enc, next) {
    files.push(file);
    next(null, file);
  }, function(cb) {

    // group cached files based on provided `prop` from the `structure`.
    var group = utils.groupArray(files, `data.${prop}`);
    //  {
    //    A: [<File foo.hbs>, <File bar.hbs>, <File baz.hbs>],
    //    B: [<File foo.hbs>, <File bar.hbs>, <File baz.hbs>],
    //    C: [<File foo.hbs>, <File bar.hbs>, <File baz.hbs>]
    //  }
    onGroup(group);

    // if there aren't any groups, just returned
    var keys = Object.keys(group);
    if (keys.length === 0) {
      return cb();
    }

    // create the main index file containing all the `groups`
    if (list) {
      var data = {};
      data[prop] = prop;
      var index = utils.createFile(list, list.structure || `:${prop}:extname`, data);
      index.data = {};
      index.data[prop] = group;
      this.push(index);
    }

    // for each key (group), create a page (or pages when paginating)
    if (item) {
      for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var items = group[key];
        var opts = {structure: structure, prop: single};
        opts[single] = key;

        if (options.paginate) {
          opts.paginate = options.paginate;
          utils.paginate(item, items, opts, this.push.bind(this));
        } else {
          var view = utils.createFile(item, structure, opts);
          view.data = {items: items};
          view.data[single] = key;
          this.push(view);
        }
      }
    }
    cb();
  });
};
