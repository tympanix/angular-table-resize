/*jshint esversion: 6 */
const gulp = require('gulp');
const browsersync = require('browser-sync').create();
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cleancss = require('gulp-clean-css');

const jsFiles = [
    "scripts/angular-table-resize.js",
    "scripts/directives/resizeable-directive.js",
    "scripts/services/resize-storage-service.js",
    "scripts/services/resizer-factory.js",
    "scripts/resizers/basic-resizer.js",
    "scripts/resizers/fixed-resizer.js",
    "scripts/resizers/overflow-resizer.js"
]

const cssFiles = [
    "css/table-resize.css"
]

const DIST = './dist/';

gulp.task('serve', function() {
    browsersync.init({
        port: 3001,
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('update', function() {
    browsersync.update();
});

gulp.task('watch', function() {
    gulp.watch(['index.html', 'css/**', 'scripts/**', 'views/**', 'demo/**'], browsersync.reload);
});

gulp.task('dev', function() {
    runSequence('serve', 'watch');
});

gulp.task('build:js', function() {
    return gulp.src(jsFiles)
        .pipe(concat('angular-table-resize.js'))
        .pipe(gulp.dest(DIST))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DIST))
})

gulp.task('build:css', function() {
    return gulp.src(cssFiles)
        .pipe(gulp.dest(DIST))
        .pipe(cleancss({ compatibility: 'ie8' }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(DIST))
})

gulp.task('build', ['build:js', 'build:css'])

gulp.task('default', ['dev']);