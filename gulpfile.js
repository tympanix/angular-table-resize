/*jshint esversion: 6 */
const gulp = require('gulp');
const browsersync = require('browser-sync').create();
const runSequence = require('run-sequence');

gulp.task('serve', function() {
    browsersync.init({
        port: 3001,
        server: {
            baseDir: "./",
        }
    });
});

gulp.task('update', function(){
  browsersync.update();
});

gulp.task('watch', function () {
    gulp.watch(['index.html', 'css/**', 'scripts/**', 'views/**'], browsersync.reload);
});

gulp.task('dev', function () {
    runSequence('serve', 'watch');
});

gulp.task('default', ['dev']);
