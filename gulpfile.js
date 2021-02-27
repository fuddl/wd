const gulp = require('gulp');
const rename = require('gulp-rename');
const webpack = require('webpack-stream');

// since imports do [not work in content script](https://bugzilla.mozilla.org/show_bug.cgi?id=1536094)
// we need to bundle them for firefox
gulp.task('dev', function() {
  return gulp.src('./content.js')
    .pipe(webpack({mode: 'none'}))
    .pipe(rename(function (path) {
      path.basename = "content";
      path.extname = ".dist.js";
    }))
    .pipe(gulp.dest('./'));
});