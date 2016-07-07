var devapp = angular.module("DemoApp", ["ngTableResize"]);

devapp.controller('main-controller', ['$scope', '$timeout', function($scope, $timeout) {
    $scope.hello = "Hello world";

    $scope.tableMode = "FixedResizer";

    var i = 1;

    $timeout(function() {
        $scope.show = true;
    }, 200)

    $scope.items = ["One", "Tow", "Three", "Four"];

    $scope.addItem = function() {
        $scope.items.push('Item ' + i);
        i++;
    }

    $scope.removeItem = function() {
        $scope.items.pop();
    }
}]);
