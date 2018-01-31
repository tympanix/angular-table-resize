var app = angular.module('resizeDemo', ['rzTable'])

app.controller('demoController', ['$scope', function($scope) {

    $scope.resizeMode = "FixedResizer"

    $scope.table = undefined

    $scope.items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']

}]);
