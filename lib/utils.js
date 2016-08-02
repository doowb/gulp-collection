'use strict';

var path = require('path');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('extend-shallow', 'extend');
require('group-array');
require('inflection', 'inflect');
require('is-buffer');
require('paginationator');
require('placeholders');
require('plugin-error', 'PluginError');
require('through2', 'through');
require('vinyl', 'File');
require = fn;

/**
 * Additional utils
 */

utils.addGroup = function(group, structure, options) {
  if (typeof structure === 'object') {
    options = structure;
    structure = null;
  }
  options = options || {};
  structure = structure || options.structure || '';

  var list = utils.normalizeFile(options.list);
  var item = utils.normalizeFile(options.item);
  var prop = utils.getProp(structure);
  var single = utils.single(prop || '');
  var File = options.File;

  var files = [];

  // if there aren't any groups, just return
  var keys = Object.keys(group || {});
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
    for (var i = 0; i < keys.length; i++) {
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

/**
 * Normalize a string or Buffer into an object to be used with Vinyl files.
 *
 * @param  {Object|String|Buffer} `file` Value to normalize
 * @return {Object} Object with a `content` or `contents` property
 */

utils.normalizeFile = function(file) {
  if (typeof file === 'undefined') {
    return null;
  }
  if (typeof file === 'string') {
    file = {path: '', content: file};
  }
  if (utils.isBuffer(file)) {
    file = {path: '', contents: file};
  }
  return file;
};

/**
 * Create an individual file using the given `structure` and `data` to create
 * a the `file.path` using [placeholders][].
 *
 * @param  {Object} `file` Vinyl file used for creating the file.
 * @param  {String} `structure` pattern used when creating the `file.path`.
 * @param  {Object} `data` Data used when creating the `file.path`.
 * @return {Object} new Vinyl file.
 */

utils.createFile = function(file, structure, data, File) {
  if (typeof structure === 'object') {
    data = structure;
    structure = null;
  }
  structure = file.structure || structure || ':stem:extname';
  var contents = file.content || file.contents;
  var context = utils.extend({}, utils.copyPaths(file), data);
  var filepath = path.resolve(file.base || process.cwd(), utils.placeholders()(structure, context));

  return new (File || utils.File)({
    cwd: file.cwd,
    base: file.base,
    path: filepath,
    contents: (typeof contents === 'string' ? new Buffer(contents) : contents)
  });
};

/**
 * Create new files from an array of paginated pages using the given `file` and `options`.
 *
 * @param  {Object} `file` Vinyl file used when creating the new files.
 * @param  {Array} `pages` Array of [paginationator][] pages containing paging information.
 * @param  {Object} `options` Additional options to pass along to `.createFile`.
 * @param  {Function} `fn` Function that takes a new `file`
 */

utils.createFiles = function(file, pages, options, fn, File) {
  if (!Array.isArray(pages)) {
    throw new utils.PluginError('gulp-collection', 'expected "pages" to be an array');
  }

  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (typeof fn !== 'function') {
    throw new utils.PluginError('gulp-collection', 'expected "fn" to be a function');
  }

  options = options || {};
  var structure = options.structure;
  var prop = options.prop;

  pages.forEach(function(page) {
    var ctx = utils.extend({pager: page}, options);
    var item = utils.createFile(file, structure, ctx, File);
    item.data = page;
    if (prop) {
      item.data[prop] = options[prop];
    }
    fn(item);
  });
};

/**
 * Paginate the given items array and create a new file for each page.
 * Passes the `file` and `options` along to `createFiles`.
 *
 * @param  {Object} `file` Vinyl file used as the basis when creating the new files.
 * @param  {Array} `items` Array of items to paginate.
 * @param  {Object} `options` Additional options to pass to `.createFiles`
 * @param  {Object} `options.paginate` Additional options to pass to [paginationator][]
 * @param  {Function} `fn` Function that takes a new file as an argument.
 */

utils.paginate = function(file, items, options, fn, File) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = options || {};

  var paged = utils.paginationator(items, options.paginate || {});
  utils.createFiles(file, paged.pages, options, fn, File);
};

/**
 * Copy path properties from the `file` to a plain object.
 * This is from [assemble-permalinks][]
 *
 * @param  {Object} `file` Object (Vinyl) containing path properties.
 * @return {Object} Plain object with copied path properties
 */

utils.copyPaths = function(file) {
  var paths = {};
  paths.cwd = file.cwd;
  paths.base = file.base;
  paths.path = file.path;
  paths.absolute = path.resolve(file.path);
  paths.dirname = file.dirname;
  paths.relative = file.relative;
  paths.basename = file.basename;
  paths.extname = file.extname;
  paths.ext = file.extname;

  paths.filename = file.stem;
  paths.name = file.stem;
  paths.stem = file.stem;
  return paths;
};

utils.getProp = function(str) {
  // property was passed in directly
  if (str && !utils.isPermalink(str)) {
    return str;
  }

  // extract the property from the permalink
  var prop;
  var segs = str.split('/');
  var len = segs.length, i = 0;
  while (len--) {
    var seg = segs[i++];
    if (typeof prop === 'undefined' && seg.indexOf(':') === 0) {
      prop = seg.slice(1);
      break;
    }
  }
  return prop;
};

/**
 * Determines if a string has `\`, `/`, or `:` characters.
 *
 * ```js
 * console.log(utils.isPermalink('foo'));
 * //=> false
 * console.log(utils.isPermalink(':tags/:tag'));
 * //=> true
 * ```
 * @param  {String} `str` String to check.
 * @return {Boolean}
 */

utils.isPermalink = function(str) {
  if (typeof str !== 'string') return false;
  return /[\\\/:]/.test(str);
};

/**
 * Singularize the given `prop`
 */

utils.single = function(prop) {
  return utils.inflect.singularize(prop);
};

/**
 * Pluralize the given `prop`
 */

utils.plural = function(prop) {
  return utils.inflect.pluralize(prop);
};

/**
 * Function that performs no operations.
 */

utils.noop = function() {};

/**
 * Expose `utils` modules
 */

module.exports = utils;
