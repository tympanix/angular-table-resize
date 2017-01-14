angular.module("ngTableResize").directive('resize', [function() {


    // Return this directive as a object literal
    return {
        restrict: 'A',
        compile: compile,
        require: '^^resizable',
        scope: {
            resize: '=',
        }
    };

    function compile() {
        return {
            pre: prelink,
            post: postlink
        }
    }

    function prelink(scope, element, attr, ctrl) {
        scope.isFirstDrag = true
        ctrl.addColumn(scope)

        scope.$on('$destroy', function() {
            ctrl.removeColumn(scope)
        });

        scope.$watch('width', function(newVal, oldVal) {
            console.log("Setting width to", newVal);
            scope.setWidth(newVal)
        })
    }

    function postlink(scope, element, attr, ctrl) {
        initHandle(scope, ctrl, element)

        scope.width = ctrl.getStoredWidth(scope)

        scope.setWidth = function(width) {
            element.css({ width: width })
        }
    }

    function initHandle(scope, ctrl, column) {
        // Prepend a new handle div to the column
        scope.handle = $('<div>', {
            class: 'handle'
        });
        column.prepend(scope.handle);

        // Use the middleware to decide which columns this handle controls
        var controlledColumn = ctrl.resizer.handleMiddleware(scope.handle, column)

        // Bind mousedown, mousemove & mouseup events
        bindEventToHandle(scope, ctrl, controlledColumn);
    }

    function bindEventToHandle(scope, ctrl, column) {

        // This event starts the dragging
        $(scope.handle).mousedown(function(event) {
            if (scope.isFirstDrag) {
                ctrl.resizer.onFirstDrag(column, scope.handle);
                ctrl.resizer.onTableReady();
                scope.isFirstDrag = false;
            }

            var optional = {}
            if (ctrl.resizer.intervene) {
                optional = ctrl.resizer.intervene.selector(column);
                optional.column = optional;
                optional.orgWidth = $(optional).width();
            }

            // Prevent text-selection, object dragging ect.
            event.preventDefault();

            // Change css styles for the handle
            $(scope.handle).addClass('active');

            // Show the resize cursor globally
            $('body').addClass('table-resize');

            // Get mouse and column origin measurements
            var orgX = event.clientX;
            var orgWidth = $(column).width();

            // On every mouse move, calculate the new width
            $(window).mousemove(calculateWidthEvent(scope, ctrl, column, orgX, orgWidth, optional))

            // Stop dragging as soon as the mouse is released
            $(window).one('mouseup', unbindEvent(scope.handle))

        })
    }

    function calculateWidthEvent(scope, ctrl, column, orgX, orgWidth, optional) {
        return function(event) {
            // Get current mouse position
            var newX = event.clientX;

            // Use calculator function to calculate new width
            var diffX = newX - orgX;
            var newWidth = ctrl.resizer.calculate(orgWidth, diffX);

            // Use restric function to abort potential restriction
            if (ctrl.resizer.restrict(newWidth)) return;

            // Extra optional column
            if (ctrl.resizer.intervene){
                var optWidth = ctrl.resizer.intervene.calculator(optional.orgWidth, diffX);
                if (ctrl.resizer.intervene.restrict(optWidth)) return;
                $(optional).width(optWidth)
            }

            // Set size
            $(column).width(newWidth);
        }
    }

    function unbindEvent(scope, ctrl, handle) {
        // Event called at end of drag
        return function( /*event*/ ) {
            $(handle).removeClass('active');
            $(window).unbind('mousemove');
            $('body').removeClass('table-resize');

            ctrl.resizer.onEndDrag();
            ctrl.saveColumnSizes();
        }
    }

}]);
