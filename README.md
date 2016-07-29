# gulp-collection [![NPM version](https://img.shields.io/npm/v/gulp-collection.svg?style=flat)](https://www.npmjs.com/package/gulp-collection) [![NPM downloads](https://img.shields.io/npm/dm/gulp-collection.svg?style=flat)](https://npmjs.org/package/gulp-collection) [![Build Status](https://img.shields.io/travis/doowb/gulp-collection.svg?style=flat)](https://travis-ci.org/doowb/gulp-collection)

Gulp plugin to group vinyl files into a collection and create new vinyl files using pagination and permalinks.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save gulp-collection
```

## Usage

This gulp plugin will group together a collection of files based on a property specified in the given permalinks pattern.

```js
var gulp = require('gulp');
var File = require('vinyl');
var collection = require('gulp-collection');

gulp.task('default', function() {
  var listFile = new File({path: 'list.hbs', contents: new Buffer('Contents to use for listing all the tags')});
  var itemFile = new File({path: 'item.hbs', contents: new Buffer('Contents to use for individual tags')});

  return gulp.src('*.hbs')
    // uses `tags` or the property
    .pipe(collection(':tags/:tag.hbs', {list: list, item: item}))
    .pipe(gulp.dest('dist/'));
});
```

Files coming through the stream are expected to have a `.data` property. This is used when grouping to determine how the collection files are created. If your source files have front-matter, you can use [gulp-gray-matter](https://github.com/simbo/gulp-gray-matter) to parse the front-matter and add the `.data` property:

```js
var gulp = require('gulp');
var matter = require('gulp-gray-matter');
var collection = require('gulp-collection');

gulp.task('default', function() {
  var listFile = new File({path: 'list.hbs', contents: new Buffer('Contents to use for listing all the tags')});
  var itemFile = new File({path: 'item.hbs', contents: new Buffer('Contents to use for individual tags')});

  return gulp.src('*.hbs')
    .pipe(matter())
    .pipe(collection(':tags/:tag.hbs', {list: list, item: item}))
    .pipe(gulp.dest('dist/'));
});
```

## Options

The following options will affect how files are grouped and how new vinyl files are created from the grouped collections.

### Group callback function

A `groupFn` may be passed on `options` that will be called after the files have been grouped into a collection:

```js
var gulp = require('gulp');
var matter = require('gulp-gray-matter');
var collection = require('gulp-collection');

gulp.task('default', function() {
  return gulp.src('*.hbs')
    .pipe(matter())
    .pipe(collection(':tags/:tag.hbs', {
      groupFn: function(group) {
        console.log(group);
      }
    }))
    .pipe(gulp.dest('dist/'));
});
```

### Template list and item files.

Once the files have been grouped, new files will be created for the groups based on the `list` and `item` options passed to `collection()`.

An initial `list` file will be created with a data object containing a property matching the first `:prop` property in the permalink pattern. This property will contain the entire group object:

```js
// <File tags.hbs>
{
  data: {
    tags: {
      foo: [<File one.hbs>, <File two.hbs>],
      bar: [<File one.hbs>, <File three.hbs>],
      baz: [<File two.hbs>, <File three.hbs>]
    }
  }
}
```

For each item on the group object, an `item` file will be created with a data object containing a property matching the second `:prop` property in the permalink pattern and an `items` property with array of files that are in that group:

```js
// <File tags/foo.hbs>
{
  data: {
    tag: 'foo',
    items: [<File one.hbs>, <File two.hbs>]
  }
}
// <File tags/bar.hbs>
{
  data: {
    tag: 'bar',
    items: [<File one.hbs>, <File three.hbs>]
  }
}
// <File tags/baz.hbs>
{
  data: {
    tag: 'baz',
    items: [<File two.hbs>, <File three.hbs>]
  }
}
```

### Pagination

Item files may be paginated using [paginationator](https://github.com/doowb/paginationator) by specifying a `paginate` property on the options:

```js
var gulp = require('gulp');
var matter = require('gulp-gray-matter');
var collection = require('gulp-collection');

gulp.task('default', function() {
  return gulp.src('*.hbs')
    .pipe(matter())
    .pipe(collection(':tags/:tag/page/:pager.idx/index.html', {
      paginate: {limit: 3}
    }))
    .pipe(gulp.dest('dist/'));
});
```

When the `paginate` option is specified, an `item` file will be created for each page of items contained in that item group. Also, `pager` property will be available for use in the permalink structure. The example above shows using `pager.idx` to make permalinks that will look something like:

```js
// "foo" tag pages
<File tags/foo/page/0/index.html>
<File tags/foo/page/1/index.html>
<File tags/foo/page/2/index.html>

// "bar" tag pages
<File tags/bar/page/0/index.html>
<File tags/bar/page/1/index.html>
<File tags/bar/page/2/index.html>

// "baz" tag pages
<File tags/baz/page/0/index.html>
<File tags/baz/page/1/index.html>
<File tags/baz/page/2/index.html>
```

The `data` property on each page will contain information about that page and the items on that page.

```js
// <File tags/foo/page/1/index.html>
{
  data: {
    tag: 'foo',
    idx: 1, // actual array index of page
    total: 3, // total pages for tag "foo"
    current: 2, // current page number (idx + 1)
    items: [<File three.hbs>, <File four.hbs>] // items on this page
    first: 1, // first page number
    last: 3, // last page number
    prev: 1, // previous page number (current - 1)
    next: 3 // next page number (current + 1)
  }
}
```

### Custom vinyl file constructor

A custom vinyl file constructor may be passed on the `File` option. This will be used when creating the new vinyl files from the `list` and `item` options.

The following example will use a [view-item][] constructor, which extends [vinyl](http://github.com/gulpjs/vinyl) with additional functionality.

_(**Note**)_ `list` and `item` do not need to be a vinyl file. They just need to have path and contents properties.

```js
var gulp = require('gulp');
var matter = require('gulp-gray-matter');
var collection = require('gulp-collection');
var ViewItem = require('view-item');

gulp.task('default', function() {
  var listFile = new ViewItem({path: 'list.hbs', contents: new Buffer('Contents to use for listing all the tags')});
  var itemFile = new ViewItem({path: 'item.hbs', contents: new Buffer('Contents to use for individual tags')});

  return gulp.src('*.hbs')
    .pipe(matter())
    .pipe(collection(':tags/:tag.hbs', {
      File: ViewItem,
      list: listFile,
      item: itemFile
    }))
    .pipe(gulp.dest('dist/'));
});
```

## Examples

_**gulpfile.js**_

The [gulpfile.js example](./examples/gulpfile.js) shows a simple use case using [gulp-gray-matter](https://github.com/simbo/gulp-gray-matter).

Run the gulpfile example with the following commands:

```sh
$ cd examples
$ gulp
```

_**advanced.js**_

The [advanced example](./examples/advanced.js) shows using gulp to read in files, [gulp-gray-matter](https://github.com/simbo/gulp-gray-matter) to parse the front-matter and [Handlebars](http://www.handlebarsjs.com/) to render the templates into html files. This example also shows the use of pagination to create multiple pages from a long list of items.

Run the advanced example with the following commands:

```sh
$ cd examples
$ gulp --gulpfile advanced.js
```

_**example.js**_

The [example.js example file](./examples/example.js) creates a lot of [Vinyl](http://github.com/gulpjs/vinyl) files dynamically and randomly gives them categories and tags. The example streams the dynamically created files through the collection plugin to show how pagination works with a lot of files. This example does not do any file I/O and is run with node directly.

Run the `example.js` file with the following commands:

```sh
$ cd examples
$ node example.js
```

## About

### Related projects

* [group-array](https://www.npmjs.com/package/group-array): Group array of objects into lists. | [homepage](https://github.com/doowb/group-array "Group array of objects into lists.")
* [paginationator](https://www.npmjs.com/package/paginationator): Paginate an array into pages of items. | [homepage](https://github.com/doowb/paginationator "Paginate an array into pages of items.")
* [permalinks](https://www.npmjs.com/package/permalinks): Adds permalink or URL routing/URL rewriting logic to any node.js project. Can be used in… [more](https://github.com/jonschlinkert/permalinks) | [homepage](https://github.com/jonschlinkert/permalinks "Adds permalink or URL routing/URL rewriting logic to any node.js project. Can be used in static site generators, build systems, web applications or anywhere you need to do path transformation or prop-string replacements.")
* [placeholders](https://www.npmjs.com/package/placeholders): Replace placeholder values in a file path. | [homepage](https://github.com/jonschlinkert/placeholders "Replace placeholder values in a file path.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

### Building docs

_(This document was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme) (a [verb](https://github.com/verbose/verb) generator), please don't edit the readme directly. Any changes to the readme must be made in [.verb.md](.verb.md).)_

To generate the readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install -g verb verb-generate-readme && verb
```

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Brian Woodward**

* [github/github.com](https://github.com/github.com)
* [twitter/github.com](http://twitter.com/github.com)

### License

Copyright © 2016, [Brian Woodward](https://github.com).
Released under the [MIT license](https://github.com/doowb/gulp-collection/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on July 29, 2016._