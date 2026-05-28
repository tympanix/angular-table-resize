/*jshint esversion: 6 */
const { dest, parallel, series, src, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cleancss = require('gulp-clean-css');

const jsFiles = [
    "scripts/angular-table-resize.js",
    "scripts/directives/resize-table-directive.js",
    "scripts/directives/resize-col-directive.js",
    "scripts/services/resize-storage-service.js",
    "scripts/services/resizer-factory.js",
    "scripts/resizers/basic-resizer.js",
    "scripts/resizers/fixed-resizer.js",
    "scripts/resizers/overflow-resizer.js"
]

const cssFiles = [
    "css/angular-table-resize.css"
]

const DIST = './dist/';

function serve(done) {
    browserSync.init({
        port: 3001,
        server: {
            baseDir: "./"
        }
    });
    done();
}

function update(done) {
    browserSync.reload();
    done();
}

function watchFiles() {
    watch(['index.html', 'css/**', 'scripts/**', 'views/**', 'demo/**'], series(build, update));
}

function buildJs() {
    return src(jsFiles)
        .pipe(concat('angular-table-resize.js'))
        .pipe(dest(DIST))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest(DIST));
}

function buildCss() {
    return src(cssFiles)
        .pipe(dest(DIST))
        .pipe(cleancss({ compatibility: 'ie8' }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(dest(DIST));
}

const build = parallel(buildJs, buildCss);
const dev = series(build, serve, watchFiles);

exports.serve = serve;
exports.update = update;
exports.watch = watchFiles;
exports.dev = dev;
exports['build:js'] = buildJs;
exports['build:css'] = buildCss;
exports.build = build;
exports.default = dev;