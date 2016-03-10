var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', function() {
    gulp.src('src/xevent.js')
    .pipe(gulp.dest('product'));
    
    gulp.src('src/xevent.js')
    .pipe(uglify())
    .pipe(rename('xevent.min.js'))
    .pipe(gulp.dest('product'));
});
