'use strict';

require('mocha');
var path = require('path');
var File = require('vinyl');
var assert = require('assert');
var utils = require('../lib/utils');
var Custom = require('./support/custom-file');

describe('utils', function() {
  describe('normalizeFile', function() {
    it('should return null when file is undefined', function() {
      assert(utils.normalizeFile() === null);
    });

    it('should return an object with a content property when passed a string', function() {
      assert.deepEqual(utils.normalizeFile('foo'), {path: '', content: 'foo'});
    });

    it('should return an object with a contents property when passed a Buffer', function() {
      var contents = new Buffer('foo');
      assert.deepEqual(utils.normalizeFile(contents), {path: '', contents: contents});
    });

    it('should return the existing object when file is an object', function() {
      var file = new File({
        path: '',
        contents: new Buffer('foo')
      });
      assert.deepEqual(utils.normalizeFile(file), file);
    });
  });

  describe('createFile', function() {
    it('should create a new instance of File from a list file', function() {
      var listFile = new File({
        path: 'list.txt',
        contents: new Buffer('this is a list file')
      });

      var expected = new File({
        path: 'list.txt',
        contents: new Buffer('this is a list file')
      });

      var actual = utils.createFile(listFile);
      assert.deepEqual(actual, expected);
    });

    it('should create a new instance of File from a list file with a specified permalink', function() {
      var listFile = new File({
        path: 'list.txt',
        contents: new Buffer('this is a list file')
      });

      var expected = new File({
        path: 'foo/index.html',
        contents: new Buffer('this is a list file')
      });

      var actual = utils.createFile(listFile, 'foo/index.html');
      assert.deepEqual(actual, expected);
    });

    it('should create a new instance of File from a list file with a specified permalink and data object', function() {
      var listFile = new File({
        path: 'list.txt',
        contents: new Buffer('this is a list file')
      });

      var expected = new File({
        path: 'foo/index.html',
        contents: new Buffer('this is a list file')
      });

      var actual = utils.createFile(listFile, ':tag/index:extname', {tag: 'foo', extname: '.html'});
      assert.deepEqual(actual, expected);
    });

    it('should create a new instance of File from a list file with a specified permalink, data object, and custom File', function() {
      var listFile = new File({
        path: 'list.txt',
        contents: new Buffer('this is a list file')
      });

      var expected = new Custom({
        path: 'foo/index.html',
        contents: new Buffer('this is a list file')
      });

      var actual = utils.createFile(listFile, ':tag/index:extname', {tag: 'foo', extname: '.html'}, Custom);
      assert.deepEqual(actual, expected);
      assert(actual.isCustom);
    });
  });

  describe('createFiles', function() {
    it('should throw an error when "pages" is not an array', function(cb) {
      try {
        utils.createFiles({});
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'expected "pages" to be an array');
        cb();
      }
    });

    it('should throw an error when "fn" is not a function', function(cb) {
      try {
        utils.createFiles({}, []);
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'expected "fn" to be a function');
        cb();
      }
    });

    it('should create files for each page in the pages array', function() {
      var itemFile = new File({
        path: 'item.txt',
        contents: new Buffer('this is an item file')
      });
      var items = [
        {path: 'one.hbs'},
        {path: 'two.hbs'},
        {path: 'three.hbs'},
        {path: 'four.hbs'},
        {path: 'five.hbs'}
      ];
      var paged = utils.paginationator(items, {limit: 2});
      var structure = 'tags/:tag/page/:pager.idx/index.html';
      var files = [];
      utils.createFiles(itemFile, paged.pages, {structure: structure, prop: 'tag', tag: 'foo'}, files.push.bind(files));
      assert.equal(files.length, 3);
      files.forEach(function(file, i) {
        assert.equal(file.path, `tags/foo/page/${i}/index.html`);
        assert.equal(file.data.idx, i);

        switch(i) {
          case 0:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(0, 2));
            break;
          case 1:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(2, 4));
            break;
          case 2:
            assert.equal(file.data.items.length, 1);
            assert.deepEqual(file.data.items, items.slice(4));
            break;
        }
      });
    });

    it('should create files for each page in the pages array using a Custom File', function() {
      var itemFile = new File({
        path: 'item.txt',
        contents: new Buffer('this is an item file')
      });
      var items = [
        {path: 'one.hbs'},
        {path: 'two.hbs'},
        {path: 'three.hbs'},
        {path: 'four.hbs'},
        {path: 'five.hbs'}
      ];
      var paged = utils.paginationator(items, {limit: 2});
      var structure = 'tags/:tag/page/:pager.idx/index.html';
      var files = [];
      utils.createFiles(itemFile, paged.pages, {structure: structure, prop: 'tag', tag: 'foo'}, files.push.bind(files), Custom);
      assert.equal(files.length, 3);
      files.forEach(function(file, i) {
        assert.equal(file.path, `tags/foo/page/${i}/index.html`);
        assert.equal(file.data.idx, i);
        assert(file.isCustom);

        switch(i) {
          case 0:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(0, 2));
            break;
          case 1:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(2, 4));
            break;
          case 2:
            assert.equal(file.data.items.length, 1);
            assert.deepEqual(file.data.items, items.slice(4));
            break;
        }
      });
    });
  });

  describe('paginate', function() {
    it('should throw an error when "fn" is not a function', function(cb) {
      try {
        utils.paginate({}, []);
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'expected "fn" to be a function');
        cb();
      }
    });

    it('should create paginate items and create files for each page', function() {
      var itemFile = new File({
        path: 'item.txt',
        contents: new Buffer('this is an item file')
      });
      var items = [
        {path: 'one.hbs'},
        {path: 'two.hbs'},
        {path: 'three.hbs'},
        {path: 'four.hbs'},
        {path: 'five.hbs'}
      ];
      var structure = 'tags/:tag/page/:pager.idx/index.html';
      var files = [];
      var opts = {
        structure: structure,
        prop: 'tag',
        tag: 'foo',
        paginate: {limit: 2}
      };

      utils.paginate(itemFile, items, opts, files.push.bind(files));
      assert.equal(files.length, 3);
      files.forEach(function(file, i) {
        assert.equal(file.path, `tags/foo/page/${i}/index.html`);
        assert.equal(file.data.idx, i);

        switch(i) {
          case 0:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(0, 2));
            break;
          case 1:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(2, 4));
            break;
          case 2:
            assert.equal(file.data.items.length, 1);
            assert.deepEqual(file.data.items, items.slice(4));
            break;
        }
      });
    });

    it('should create paginate items and create custom files for each page', function() {
      var itemFile = new File({
        path: 'item.txt',
        contents: new Buffer('this is an item file')
      });
      var items = [
        {path: 'one.hbs'},
        {path: 'two.hbs'},
        {path: 'three.hbs'},
        {path: 'four.hbs'},
        {path: 'five.hbs'}
      ];
      var structure = 'tags/:tag/page/:pager.idx/index.html';
      var files = [];
      var opts = {
        structure: structure,
        prop: 'tag',
        tag: 'foo',
        paginate: {limit: 2}
      };

      utils.paginate(itemFile, items, opts, files.push.bind(files), Custom);
      assert.equal(files.length, 3);
      files.forEach(function(file, i) {
        assert.equal(file.path, `tags/foo/page/${i}/index.html`);
        assert.equal(file.data.idx, i);
        assert(file.isCustom);

        switch(i) {
          case 0:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(0, 2));
            break;
          case 1:
            assert.equal(file.data.items.length, 2);
            assert.deepEqual(file.data.items, items.slice(2, 4));
            break;
          case 2:
            assert.equal(file.data.items.length, 1);
            assert.deepEqual(file.data.items, items.slice(4));
            break;
        }
      });
    });
  });

  describe('copyPaths', function() {
    it('should create an object containing path properties from a vinyl file', function() {
      var file = new File({
        base: __dirname,
        path: path.join(__dirname, 'test.txt')
      });

      var expected = {
        cwd: file.cwd,
        base: file.base,
        path: file.path,
        absolute: path.resolve(file.path),
        dirname: file.dirname,
        relative: file.relative,
        basename: file.basename,
        extname: file.extname,
        ext: file.extname,
        filename: file.stem,
        name: file.stem,
        stem: file.stem
      };

      var actual = utils.copyPaths(file);
      assert.deepEqual(actual, expected);
    });
  });

  describe('getProp', function() {
    it('should return the property from a permalink string', function() {
      assert.equal(utils.getProp(':tags/:tag'), 'tags');
    });

    it('should return the property from a non-permalink string', function() {
      assert.equal(utils.getProp('tags'), 'tags');
    });
  });

  describe('isPermalink', function() {
    it('should should return false for an empty string', function() {
      assert.equal(utils.isPermalink(''), false);
    });

    it('should should return false for a non-string value', function() {
      assert.equal(utils.isPermalink({}), false);
      assert.equal(utils.isPermalink(function(){}), false);
      assert.equal(utils.isPermalink(true), false);
      assert.equal(utils.isPermalink(42), false);
      assert.equal(utils.isPermalink(), false);
      assert.equal(utils.isPermalink(null), false);
    });

    it('should should return false for a string without `:`, `\\`, or `/` characters', function() {
      assert.equal(utils.isPermalink('tags'), false);
    });

    it('should should return true for a string with `:`, `\\`, or `/` characters', function() {
      assert.equal(utils.isPermalink(':tags'), true);
      assert.equal(utils.isPermalink('tags/tag'), true);
      assert.equal(utils.isPermalink('tags\\tag'), true);
    });
  });

  describe('single', function() {
    it('should singularize a plural string', function() {
      assert.equal(utils.single('tags'), 'tag');
    });

    it('should singularize a singular string', function() {
      assert.equal(utils.single('tag'), 'tag');
    });
  });

  describe('plural', function() {
    it('should pluralize a singular string', function() {
      assert.equal(utils.plural('tag'), 'tags');
    });

    it('should pluralize a plural string', function() {
      assert.equal(utils.plural('tags'), 'tags');
    });
  });
});
