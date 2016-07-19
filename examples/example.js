'use strict';

var Vinyl = require('vinyl');
var through = require('through2');
var collection = require('../');

// files to use for creating list and item pages
// these can be Vinyl files
var list = {path: 'list.hbs', content: 'this is a list'};
var item = {path: 'item.hbs', content: 'this is an item'};
var stream = through.obj();

// options to pass to the collection plugin
var options = {
  list: list,
  item: item,
  paginate: {limit: 5}
};

// stream that source files will be piped into
stream
  // use the collection plugin to create files for that tags found in the source files
  .pipe(collection(':tags/:tag/page/:idx/index.html', options))
  // use the collection plugin to create files for the categories found in the source files
  .pipe(collection(':categories/:category/page/:idx/index.html', options))
  .on('data', function(file) {
    console.log(file.path);
  })
  .on('error', console.error)
  .on('end', function() {
    console.log('done');
    process.exit();
  });


/**
 * Below is code for creating a lot of random fake files.
 * Change `maxFiles` to change how many files are created.
 */

var maxFiles = 500;
var maxTags = 5;
var maxCategories = 5;
var tags = ['foo', 'bar', 'baz', 'bang', 'beep', 'boop', 'bop'];
var categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// make fake files and write the to the stream to begin piping
process.nextTick(function() {
  for(var i = 0; i < maxFiles; i++) {
    stream.write(makeFile(i));
  }
  stream.end();
});

// make a new file with randomly selected categories and tags
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

// pick a random tag from the possible tags in the tags array
function pickTag() {
  return tags[Math.floor(Math.random() * (tags.length))];
}

// pick random tags up to the `maxTags`
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

// pick a random category from the possible categories in the categories array
function pickCategory() {
  return categories[Math.floor(Math.random() * (categories.length))];
}

// pick random categories up to the `maxCategories`
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
