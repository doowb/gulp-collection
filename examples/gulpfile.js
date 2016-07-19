'use strict';

var matter = require('gulp-gray-matter');
var path = require('path');
var gulp = require('gulp');
var File = require('vinyl');
var collection = require('..');

gulp.task('default', function() {
  var listFile = new File({path: 'list.hbs', contents: new Buffer('Contents to use for listing all the tags')});
  var itemFile = new File({path: 'item.hbs', contents: new Buffer('Contents to use for individual tags')});

  return gulp.src('*.hbs', {cwd: path.join(__dirname, 'src')})
    .pipe(matter())
    .pipe(collection(':tags/:tag.hbs', {
      list: listFile,
      item: itemFile
    }))
    .pipe(gulp.dest(path.join(__dirname, 'dist/simple')));
});
