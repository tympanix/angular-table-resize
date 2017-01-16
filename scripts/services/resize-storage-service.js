angular.module("ngTableResize").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, model, profile) {
        var key = getStorageKey(table, model, profile);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object) || {};
    }

    this.saveTableSizes = function(table, model, profile, sizes) {
        var key = getStorageKey(table, model, profile);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    function getStorageKey(table, mode, profile) {
        var key = []
        if (!table) {
            console.error("Table has no id", table);
            return undefined;
        }
        key.push(prefix)
        key.push(table)
        if (profile) key.push(profile)
        return key.join('.')
    }

}]);
