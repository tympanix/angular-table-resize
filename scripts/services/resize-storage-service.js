angular.module("ngTableResize").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, model) {
        var key = getStorageKey(table, model);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object);
    }

    this.saveTableSizes = function(table, model, sizes) {
        var key = getStorageKey(table, model);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    function getStorageKey(table, mode) {
        var id = table.attr('id');
        if (!id) {
            console.error("Table has no id", table);
            return undefined;
        }
        return prefix + '.' + table.attr('id') + '.' + mode;
    }

}]);
