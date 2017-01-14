var devapp = angular.module("DemoApp", ["ngTableResize"]);

devapp.controller('main-controller', ['$scope', '$timeout', function($scope, $timeout) {

    $scope.tableMode = "FixedResizer";

    var i = 1;

    $timeout(function() {
        $scope.show = true;
    }, 200)

    $scope.columns = ['Name', 'Status', 'Notes', 'More', 'Even More']

    $scope.items = ["One", "Tow", "Three", "Four"];

    $scope.addItem = function() {
        $scope.items.push('Item ' + i);
        i++;
    }

    $scope.removeItem = function() {
        $scope.items.pop();
    }
}]);
