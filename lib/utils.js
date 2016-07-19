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
 * @param  {Object|String|Buffer} `view` Value to normalize
 * @return {Object} Object with a `content` or `contents` property
 */

utils.normalizeView = function(view) {
  if (typeof view === 'undefined') {
    throw new TypeError('expected "view" to be a string or an object');
  }
  if (typeof view === 'string') {
    view = {content: view};
  }
  if (Buffer.isBuffer(view)) {
    view = {contents: view};
  }
  return view;
};

/**
 * Create an individual file using the given `structure` and `data` to create
 * a the `file.path` using [placeholders][].
 *
 * @param  {Object} `view` Vinyl file used for creating the file.
 * @param  {String} `structure` pattern used when creating the `file.path`.
 * @param  {Object} `data` Data used when creating the `file.path`.
 * @return {Object} new Vinyl file.
 */

utils.createFile = function(view, structure, data) {
  if (typeof structure === 'object') {
    data = structure;
    structure = null;
  }
  structure = view.structure || structure || ':basename:extname';
  var contents = view.content || view.contents;
  var context = utils.extend({}, utils.copyPaths(view), data);
  return new utils.File({
    base: view.base,
    path: utils.placeholders()(structure, context),
    contents: (typeof contents === 'string' ? new Buffer(contents) : contents)
  });
};

/**
 * Create new files from an array of paginated pages using the given `view` and `options`.
 *
 * @param  {Object} `view` Vinyl file used when creating the new files.
 * @param  {Array} `pages` Array of [paginationator][] pages containing paging information.
 * @param  {Object} `options` Additional options to pass along to `.createFile`.
 * @param  {Function} `fn` Function that takes a new `file`
 */

utils.createFiles = function(view, pages, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  options = options || {};
  var structure = options.structure;
  var prop = options.prop;

  pages.forEach(function(page) {
    page[prop] = options[prop];
    var file = utils.createFile(view, structure, page);
    file.data = page;
    fn(file);
  });
};

/**
 * Paginate the given items array and create a new file for each page.
 * Passes the `view` and `options` along to `createFiles`.
 *
 * @param  {Object} `view` Vinyl view used as the basis when creating the new files.
 * @param  {Array} `items` Array of items to paginate.
 * @param  {Object} `options` Additional options to pass to `.createFiles`
 * @param  {Object} `options.paginate` Additional options to pass to [paginationator][]
 * @param  {Function} `fn` Function that takes a new file as an argument.
 */

utils.paginate = function(view, items, options, fn) {
  var paged = utils.paginationator(items, options.paginate || {});
  utils.createFiles(view, paged.pages, options, fn);
};

/**
 * Copy path properties from the `view` to a plain object.
 * This is from [assemble-permalinks][]
 *
 * @param  {Object} `view` Object (Vinyl) containing path properties.
 * @return {Object} Plain object with copied path properties
 */

utils.copyPaths = function(view) {
  var paths = {};
  paths.cwd = view.cwd;
  paths.base = view.base;
  paths.path = view.path;
  paths.absolute = path.resolve(view.path);
  paths.dirname = view.dirname;
  paths.relative = view.relative;
  paths.basename = view.basename;
  paths.extname = view.extname;
  paths.ext = view.extname;

  paths.filename = view.stem;
  paths.name = view.stem;
  paths.stem = view.stem;
  return paths;
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
