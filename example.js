'use strict';

var Vinyl = require('vinyl');
var through = require('through2');
var plugin = require('./');

var list = new Vinyl({
  path: 'list.hbs',
  content: 'this is a list'
});
var item = new Vinyl({
  path: 'item.hbs',
  content: 'this is an item'
});

var stream = through.obj();

stream
  .pipe(through.obj(function(file, enc, next) {
    // console.log(file.path);
    // console.log(file.data);
    next(null, file);
  }))
  .pipe(plugin(':tags/:tag/page/:idx/index.html', {
    list: list,
    item: item
  }))
  .pipe(plugin(':categories/:category/page/:idx/index.html', {
    list: list,
    item: item
  }))
  .on('data', function(file) {
    console.log(file.path);
    console.log(file.data);
    console.log();
  })
  .on('error', console.error)
  .on('end', function() {
    console.log('done');
    process.exit();
  });

var tags = ['foo', 'bar', 'baz', 'bang', 'beep', 'boop', 'bop'];
var categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
var maxPages = 100;
var maxTags = 5;
var maxCategories = 5;

function pickTag() {
  return tags[Math.floor(Math.random() * (tags.length))];
}

function pickTags() {
  var picked = [];
  var max = Math.floor(Math.random() * maxTags);
  while(picked.length < max) {
    var tag = pickTag();
    if (picked.indexOf(tag) === -1) {
      picked.push(tag);
    }
  }
  return picked;
}

function pickCategory() {
  return categories[Math.floor(Math.random() * (categories.length))];
}

function pickCategories() {
  var picked = [];
  var max = Math.floor(Math.random() * maxCategories);
  while(picked.length < max) {
    var category = pickCategory();
    if (picked.indexOf(category) === -1) {
      picked.push(category);
    }
  }
  return picked;
}

function makeFile(idx) {
  var file = new Vinyl({
    path: `source-file-${idx}.hbs`,
    contents: new Buffer(`this is source-file-${idx}`)
  });
  file.data = {
    categories: pickCategories(),
    tags: pickTags()
  };
  return file;
}

process.nextTick(function() {
  for(var i = 0; i < maxPages; i++) {
    stream.write(makeFile(i));
  }
  stream.end();
});
