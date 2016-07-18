var app = angular.module('resizeDemo', ['ngTableResize'])

app.controller('demoController', ['$scope', function($scope) {

    var i = 0;

    $scope.resizeMode = "FixedResizer"

    $scope.items = ["One", "Tow", "Three", "Four"];

    $scope.addItem = function() {
        $scope.items.push('Item ' + i++);
    }

    $scope.removeItem = function() {
        $scope.items.pop();
    }

    $scope.setMode = function(mode) {
        $scope.resizeMode = mode;
    }

    $scope.button = function(mode) {
        if ($scope.resizeMode === mode) {
            return 'disabled'
        }
    }

}]);
