'use strict';

/**
 * From the `examples` directory run this example with the following command:
 *
 * ```sh
 * $ gulp --gulpfile advanced.js
 * ```
 */

var matter = require('gulp-gray-matter');
var handlebars = require('handlebars');
var extname = require('gulp-extname');
var through = require('through2');
var File = require('vinyl');
var path = require('path');
var gulp = require('gulp');
var fs = require('fs');
var collection = require('..');
var dest = path.join(__dirname, 'dist/advanced');

gulp.task('default', function() {
  // load templates from the file system.
  var listFile = loadTemplate('list.hbs');
  var itemFile = loadTemplate('item.hbs');

  return gulp.src('*.hbs', {cwd: path.join(__dirname, 'src')})
    // parse front-matter to add it to the `.data` property on the files coming through the stream.
    .pipe(matter())
    // collection tags from the `.data` property
    // use pagination and build urls with indexes
    .pipe(collection(':tags/:tag/page/:idx/index.hbs', {
      list: listFile,
      item: itemFile,
      paginate: {limit: 3}
    }))
    // use Handlebars to render the file contents coming through using the `.data` property on each file as the template context
    .pipe(through.obj(function(file, enc, next) {
      var str = file.contents.toString();
      var data = file.data || {};
      var tmpl = handlebars.compile(str);
      file.contents = new Buffer(tmpl(data));
      next(null, file);
    }))
    // rename `.hbs` to `.html`
    .pipe(extname())
    // write rendered files to the destination directory
    .pipe(gulp.dest(dest));
});

function loadTemplate(name) {
  return new File({
    path: name,
    contents: fs.readFileSync(path.join(__dirname, 'src/templates', name))
  });
}
