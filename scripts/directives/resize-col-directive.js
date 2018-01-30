angular.module("ngTableResize").directive('resizeCol', [function() {
  // Return this directive as a object literal
  return {
    restrict: 'A',
    link: link,
    require: '^^resizeable',
    scope: true
  };

  function link(scope, element, attr) {
    scope.colName = scope.$eval(attr.resizeCol)
  }
}])