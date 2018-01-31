angular.module("rzTable").directive('rzCol', [function() {
  // Return this directive as a object literal
  return {
    restrict: 'A',
    link: link,
    require: '^^rzTable',
    scope: true
  };

  function link(scope, element, attr) {
    scope.rzCol = scope.$eval(attr.rzCol)
  }
}])