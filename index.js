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
  var list = utils.normalizeFile(options.list);
  var item = utils.normalizeFile(options.item);
  var groupFn = options.groupFn || utils.noop;
  var prop = utils.getProp(structure);
  var single = utils.single(prop);

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
    groupFn(group);

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
        opts[prop] = prop;
        opts[single] = key;

        if (options.paginate) {
          opts.paginate = options.paginate;
          utils.paginate(item, items, opts, this.push.bind(this));
        } else {
          var file = utils.createFile(item, structure, opts);
          file.data = {items: items};
          file.data[single] = key;
          this.push(file);
        }
      }
    }
    cb();
  });
};
