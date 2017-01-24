angular.module("ngTableResize").directive('resize', [function() {


    // Return this directive as a object literal
    return {
        restrict: 'A',
        compile: compile,
        require: '^^resizable',
        scope: false
    };

    function compile() {
        return {
            pre: prelink,
            post: postlink
        }
    }

    function prelink(scope, element, attr, ctrl) {
        console.log("Linking column", scope.$index);
        scope.resize = scope.$eval(attr.resize)
        scope.element = element

        scope.deleteHandle = function() {
            if (scope.handle) {
                scope.handle.remove()
            }
        }

        scope.addHandle = function() {
            initHandle(scope, ctrl, element)
        }

        scope.initialise = function() {
            if (ctrl.resizer.handles(scope)) {
                initHandle(scope, ctrl, element)
            }

            //scope.setWidth(ctrl.getStoredWidth())
        }

        scope.setWidth = function(width) {
            element.css({ width: width })
        }

        scope.next = function() {
            return ctrl.nextColumn(scope)
        }

        scope.getWidth = function() {
            return scope.element.outerWidth()
        }

        scope.$on('$destroy', function() {
            ctrl.removeColumn(scope)
        });

        ctrl.addColumn(scope)
    }

    function postlink(scope, element, attr, ctrl) {
        if (scope.$last) {
            console.log("RENDER!");
            ctrl.render()
        }
    }

    function initHandle(scope, ctrl, column) {
        // Prepend a new handle div to the column
        scope.handle = $('<div>', {
            class: 'handle'
        });
        column.prepend(scope.handle);

        // Use the middleware to decide which columns this handle controls
        scope.controlledColumn = ctrl.resizer.handleMiddleware(scope, ctrl.collumns)

        // Bind mousedown, mousemove & mouseup events
        bindEventToHandle(scope, ctrl);
    }

    function bindEventToHandle(scope, ctrl) {

        // This event starts the dragging
        $(scope.handle).mousedown(function(event) {
            if (ctrl.isFirstDrag) {
                console.log('First drag');
                ctrl.resizer.onFirstDrag();
                ctrl.resizer.onTableReady()
                ctrl.isFirstDrag = false;
                ctrl.virgin = false
            }

            var optional = {}
            if (ctrl.resizer.intervene) {
                optional = ctrl.resizer.intervene.selector(scope.controlledColumn);
                optional.column = optional;
                optional.orgWidth = optional.element.outerWidth();
            }

            // Prevent text-selection, object dragging ect.
            event.preventDefault();

            // Change css styles for the handle
            $(scope.handle).addClass('active');

            // Show the resize cursor globally
            $('body').addClass('table-resize');

            // Get mouse and column origin measurements
            var orgX = event.clientX;
            var orgWidth = scope.getWidth();

            // On every mouse move, calculate the new width
            $(window).mousemove(calculateWidthEvent(scope, ctrl, orgX, orgWidth, optional))

            // Stop dragging as soon as the mouse is released
            $(window).one('mouseup', unbindEvent(scope, ctrl, scope.handle))

        })
    }

    function calculateWidthEvent(scope, ctrl, orgX, orgWidth, optional) {
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
                optional.setWidth(optWidth)
            }

            // Set size
            scope.controlledColumn.setWidth(newWidth);
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
