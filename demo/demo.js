var devapp = angular.module("DemoApp", ["ngTableResize"]);

devapp.controller('main-controller', ['$scope', '$timeout', function($scope, $timeout) {

    $scope.profile = "profile1"

    $scope.tableMode = "BasicResizer";

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

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    $scope.shuffleColumns = function() {
        console.log('Shuffle');
        $scope.columns = $scope.columns.sort(function() {
            var r = getRandomInt(-1,1)
            console.log(r);
            return r
        })
    }

    var j = 1;

    $scope.addColumn = function() {
        $scope.columns.unshift('Col'+(j++))
    }

    $scope.removeColumn = function() {
        $scope.columns.pop()
    }

    $scope.removeItem = function() {
        $scope.items.pop();
    }
}]);
