'use strict';

/**
 * From the `examples` directory run this example with the following command:
 *
 * ```sh
 * $ gulp --gulpfile gulp-group-array.js
 * ```
 */

var groupArray = require('gulp-group-array');
var matter = require('gulp-gray-matter');
var extend = require('extend-shallow');
var handlebars = require('handlebars');
var extname = require('gulp-extname');
var through = require('through2');
var File = require('vinyl');
var path = require('path');
var gulp = require('gulp');
var fs = require('fs');
var collection = require('..');
var dest = path.join(__dirname, 'dist/gulp-group-array');

gulp.task('default', function() {
  // load templates from the file system.
  var listFile = loadTemplate('list.hbs');
  var itemFile = loadTemplate('item.hbs');
  var sidebar = loadTemplate('side-bar.hbs');
  handlebars.registerPartial('side-bar', sidebar.contents.toString());
  var context = {};

  return gulp.src('*.hbs', {cwd: path.join(__dirname, 'src')})
    // parse front-matter to add it to the `.data` property on the files coming through the stream.
    .pipe(matter())
    .pipe(groupArray('data.tags', {
      groupFile: true,
      groupFn: function(group) {
        context.site = {tags: group};
      }
    }))
    // collection tags from the `.data` property
    // use pagination and build urls with indexes
    .pipe(collection({
      structure: ':tags/:tag/page/:pager.idx/index.hbs',
      list: listFile,
      item: itemFile,
      paginate: {limit: 3}
    }))
    // rename `.hbs` to `.html`
    .pipe(extname())
    // buffer files before rendering to ensure context has been created
    .pipe(buffer())
    // use Handlebars to render the file contents coming through using the `.data` property on each file as the template context
    .pipe(through.obj(function(file, enc, next) {
      var data = extend({}, context, file.data);
      var str = file.contents.toString();
      var tmpl = handlebars.compile(str);
      file.contents = new Buffer(tmpl(data));
      next(null, file);
    }))
    // write rendered files to the destination directory
    .pipe(gulp.dest(dest));
});

function loadTemplate(name) {
  return new File({
    path: name,
    contents: fs.readFileSync(path.join(__dirname, 'src/templates', name))
  });
}

function buffer(fn) {
  var files = [];
  return through.obj(function(file, enc, next) {
    if (typeof fn === 'function') {
      file = fn(file);
    }

    if (file) {
      files.push(file);
    }
    next(null);
  }, function(cb) {
    var stream = this;
    files.forEach(function(file) {
      stream.push(file);
    });
    cb();
  });
}
