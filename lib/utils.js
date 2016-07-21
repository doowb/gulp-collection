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
require('paginationator');
require('placeholders');
require('through2', 'through');
require('vinyl', 'File');
require = fn;

/**
 * Additional utils
 */

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
  if (Buffer.isBuffer(file)) {
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

utils.createFile = function(file, structure, data) {
  if (typeof structure === 'object') {
    data = structure;
    structure = null;
  }
  structure = file.structure || structure || ':basename:extname';
  var contents = file.content || file.contents;
  var context = utils.extend({}, utils.copyPaths(file), data);
  return new utils.File({
    base: file.base,
    path: utils.placeholders()(structure, context),
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

utils.createFiles = function(file, pages, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  options = options || {};
  var structure = options.structure;
  var prop = options.prop;

  pages.forEach(function(page) {
    page[prop] = options[prop];
    var item = utils.createFile(file, structure, page);
    item.data = page;
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

utils.paginate = function(file, items, options, fn) {
  var paged = utils.paginationator(items, options.paginate || {});
  utils.createFiles(file, paged.pages, options, fn);
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

/**
 * Function that performs no operations.
 */

utils.noop = function() {};

/**
 * Expose `utils` modules
 */

module.exports = utils;
