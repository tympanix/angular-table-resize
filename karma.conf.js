// Karma configuration
// Generated on Sun Aug 07 2016 17:59:17 GMT+0200 (Romance Daylight Time)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'dist/angular-table-resize.js',
      'dist/angular-table-resize.css',
      'test/*.js'
    ],
    exclude: [],
    preprocessors: {},
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['jsdom'],
    singleRun: true,
    concurrency: Infinity
  });
};
