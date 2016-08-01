'use strict';
var utils = require('./utils');

module.exports = function(config) {
  return function(app) {
    if (!utils.isValid(app, 'gulp-collection-create-files', ['collection', 'views'])) {
      return;
    }

    this.define('addGroup', function(group, options) {
      var opts = utils.extend({File: utils.File}, config, options);
      var structure = opts.structure;

      var list = utils.normalizeFile(opts.list);
      var item = utils.normalizeFile(opts.item);
      var prop = utils.getProp(structure);
      var single = utils.single(prop);
      var File = opts.File;

      // if there aren't any groups, just return
      var keys = Object.keys(group);
      if (keys.length === 0) {
        return this;
      }

      // create the main index file containing all the `groups`
      if (list) {
        var data = {};
        data[prop] = prop;
        var index = utils.createFile(list, list.structure || `:${prop}:extname`, data, File);
        index.data = {};
        index.data[prop] = group;
        this.addFile(index);
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
            utils.paginate(item, items, opts, this.addFile.bind(this), File);
          } else {
            var file = utils.createFile(item, structure, opts, File);
            file.data = {items: items};
            file.data[single] = key;
            this.addFile(file);
          }
        }
      }
      return this;
    });
  };
};
