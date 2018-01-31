angular.module("rzTable").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, mode, profile) {
        var key = getStorageKey(table, mode, profile);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object);
    }

    this.saveTableSizes = function(table, mode, profile, sizes) {
        var key = getStorageKey(table, mode, profile);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    this.clearAll = function() {
        var keys = []
        for (var i = 0; i < $window.localStorage.length; ++i) {
            var key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
                keys.push(key)
            }
        }
        keys.map(function(k) { $window.localStorage.removeItem(k) })
    }

    this.clearCurrent = function(table, mode, profile) {
        var key = getStorageKey(table, mode, profile);
        if (key) {
            $window.localStorage.removeItem(key)
        }
    }

    function getStorageKey(table, mode, profile) {
        var id = table.attr('id');
        if (!id) {
            console.error("Table has no id", table);
            return undefined;
        }
        return prefix + '.' + table.attr('id') + '.' + mode + (profile ? '.' + profile : '');
    }

}]);
