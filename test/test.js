'use strict';

require('mocha');
var File = require('vinyl');
var assert = require('assert');
var through = require('through2');
var collection = require('../');
var groupBy = require('gulp-group-array');
var Custom = require('./support/custom-file');

describe('gulp-collection', function() {
  it('should export a function', function() {
    assert.equal(typeof collection, 'function');
  });

  it('should not create new files when `list` and `item` are undefined', function(cb) {
    var stream = through.obj();
    var files = [];
    stream.pipe(collection())
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 1);
        assert.equal(files[0].path, 'one.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      stream.write(file);
      stream.end();
    });
  });

  it('should not create new files when source files are not in the collection', function(cb) {
    var stream = through.obj();
    var files = [];
    stream.pipe(collection({list: 'list', item: 'item', structure: ':tags/:tag'}))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 1);
        assert.equal(files[0].path, 'one.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      stream.write(file);
      stream.end();
    });
  });

  it('should create new files when source files are the collection', function(cb) {
    var stream = through.obj();
    var files = [];
    stream
      .pipe(groupBy('data.tags', {groupFile: true}))
      .pipe(collection({
        structure: ':tags/:tag.hbs',
        list: new File({path: 'list.hbs', contents: new Buffer('list')}),
        item: new File({path: 'item.hbs', contents: new Buffer('item')})
      }))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 3);
        assert.equal(files[0].path, 'one.hbs');
        assert.equal(files[1].path, 'tags.hbs');
        assert.equal(files[2].path, 'tags/foo.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      file.data = {tags: ['foo']};
      stream.write(file);
      stream.end();
    });
  });

  it('should only create a new list file when only `list` is defined', function(cb) {
    var stream = through.obj();
    var files = [];
    stream
      .pipe(groupBy('data.tags', {groupFile: true}))
      .pipe(collection({
        structure: ':tags/:tag.hbs',
        list: new File({path: 'list.hbs', contents: new Buffer('list')})
      }))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 2);
        assert.equal(files[0].path, 'one.hbs');
        assert.equal(files[1].path, 'tags.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      file.data = {tags: ['foo']};
      stream.write(file);
      stream.end();
    });
  });

  it('should only create a new item file when only `item` is defined', function(cb) {
    var stream = through.obj();
    var files = [];
    stream
      .pipe(groupBy('data.tags', {groupFile: true}))
      .pipe(collection({
        structure: ':tags/:tag.hbs',
        item: new File({path: 'item.hbs', contents: new Buffer('item')})
      }))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 2);
        assert.equal(files[0].path, 'one.hbs');
        assert.equal(files[1].path, 'tags/foo.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      file.data = {tags: ['foo']};
      stream.write(file);
      stream.end();
    });
  });

  it('should pass `group` to `groupFn` function', function(cb) {
    var stream = through.obj();
    var files = [];
    stream
      .pipe(groupBy('data.tags', {
        groupFile: true,
        groupFn: function(group) {
          assert(typeof group === 'object');
          assert.deepEqual(Object.keys(group), ['foo']);
          assert.equal(group.foo[0].path, 'one.hbs');
        }
      }))
      .pipe(collection({structure: ':tags/:tag.hbs'}))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 1);
        assert.equal(files[0].path, 'one.hbs');
        cb();
      });

    process.nextTick(function() {
      var file = new File({path: 'one.hbs', contents: new Buffer('')});
      file.data = {tags: ['foo']};
      stream.write(file);
      stream.end();
    });
  });

  it('should create new files with the correct source files', function(cb) {
    var stream = through.obj();
    var fixtures = {
      'tags.hbs': {
        tags: {
          foo: ['one.hbs', 'three.hbs'],
          bar: ['one.hbs', 'two.hbs'],
          baz: ['two.hbs', 'three.hbs']
        }
      },
      'tags/foo.hbs': {
        tag: 'foo',
        items: ['one.hbs', 'three.hbs']
      },
      'tags/bar.hbs': {
        tag: 'bar',
        items: ['one.hbs', 'two.hbs']
      },
      'tags/baz.hbs': {
        tag: 'baz',
        items: ['two.hbs', 'three.hbs']
      }
    };

    var files = [];
    stream
      .pipe(groupBy('data.tags', {groupFile: true}))
      .pipe(collection({
        structure: ':tags/:tag.hbs',
        list: new File({path: 'list.hbs', contents: new Buffer('list')}),
        item: new File({path: 'item.hbs', contents: new Buffer('item')})
      }))
      .on('data', function(file) {
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 7);
        assert.equal(files[0].path, 'one.hbs');
        assert.equal(files[1].path, 'two.hbs');
        assert.equal(files[2].path, 'three.hbs');

        files.forEach(function(file) {
          var expected = fixtures[file.path];
          if (!expected) return;
          if (expected.tags) {
            var tags = Object.keys(file.data.tags);
            var actual = tags.reduce(function(acc, key) {
              acc[key] = file.data.tags[key].map(function(item) { return item.path; });
              return acc;
            }, {});
            assert.deepEqual(actual, expected.tags);
          } else {
            var actual = file.data.items.map(function(item) { return item.path; });
            assert.equal(file.data.tag, expected.tag);
            assert.deepEqual(actual, expected.items);
          }
        })
        cb();
      });

    process.nextTick(function() {
      var one = new File({path: 'one.hbs', contents: new Buffer('one')});
      var two = new File({path: 'two.hbs', contents: new Buffer('two')});
      var three = new File({path: 'three.hbs', contents: new Buffer('three')});

      one.data = {tags: ['foo', 'bar']};
      two.data = {tags: ['bar', 'baz']};
      three.data = {tags: ['foo', 'baz']};

      stream.write(one);
      stream.write(two);
      stream.write(three);
      stream.end();
    });
  });

  it('should create new custom files with the correct source files', function(cb) {
    var stream = through.obj();
    var fixtures = {
      'tags.hbs': {
        tags: {
          foo: ['one.hbs', 'three.hbs'],
          bar: ['one.hbs', 'two.hbs'],
          baz: ['two.hbs', 'three.hbs']
        }
      },
      'tags/foo.hbs': {
        tag: 'foo',
        items: ['one.hbs', 'three.hbs']
      },
      'tags/bar.hbs': {
        tag: 'bar',
        items: ['one.hbs', 'two.hbs']
      },
      'tags/baz.hbs': {
        tag: 'baz',
        items: ['two.hbs', 'three.hbs']
      }
    };

    var files = [];
    stream
      .pipe(groupBy('data.tags', {groupFile: true}))
      .pipe(collection({
        File: Custom,
        structure: ':tags/:tag.hbs',
        list: new Custom({path: 'list.hbs', contents: new Buffer('list')}),
        item: new Custom({path: 'item.hbs', contents: new Buffer('item')})
      }))
      .on('data', function(file) {
        assert(file.isCustom, 'expected a Custom file');
        files.push(file);
      })
      .once('error', cb)
      .on('end', function() {
        assert.equal(files.length, 7);
        assert.equal(files[0].path, 'one.hbs');
        assert.equal(files[1].path, 'two.hbs');
        assert.equal(files[2].path, 'three.hbs');

        files.forEach(function(file) {
          assert(file.isCustom, 'expected a Custom file');
          var expected = fixtures[file.path];
          if (!expected) return;
          if (expected.tags) {
            var tags = Object.keys(file.data.tags);
            var actual = tags.reduce(function(acc, key) {
              acc[key] = file.data.tags[key].map(function(item) { return item.path; });
              return acc;
            }, {});
            assert.deepEqual(actual, expected.tags);
          } else {
            var actual = file.data.items.map(function(item) { return item.path; });
            assert.equal(file.data.tag, expected.tag);
            assert.deepEqual(actual, expected.items);
          }
        })
        cb();
      });

    process.nextTick(function() {
      var one = new Custom({path: 'one.hbs', contents: new Buffer('one')});
      var two = new Custom({path: 'two.hbs', contents: new Buffer('two')});
      var three = new Custom({path: 'three.hbs', contents: new Buffer('three')});

      one.data = {tags: ['foo', 'bar']};
      two.data = {tags: ['bar', 'baz']};
      three.data = {tags: ['foo', 'baz']};

      stream.write(one);
      stream.write(two);
      stream.write(three);
      stream.end();
    });
  });
});
