var devapp = angular.module("DemoApp", ["rzTable"]);

devapp.controller('main-controller', ['$scope', '$timeout', function($scope, $timeout) {
    $scope.hello = "Hello world";

    $scope.tableMode = "FixedResizer";

    $scope.table = undefined

    $scope.notes = true;

    $scope.text = "hej"

    $scope.profile = 'one'

    $scope.options = {
      onResizeStarted: function() {
        console.log("Started")
      },
      onResizeEnded: function() {
        console.log("Ended")
      },
      onResizeInProgress: function() {
        console.log("In progress")
      }
    }

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
