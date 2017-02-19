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

        scope.isValid = function() {
            if (!scope.displacers || !scope.displacers.length) return false

            return scope.displacers.every(function(displacer) {
                return displacer.isValid()
            })
        }

        scope.initialise = function() {
            // Return if this column is not meant to be included
            if (!ctrl.resizer.handles(scope)) return

            // Get displacers for this column
            scope.displacers = this.getDisplacers()

            // Return if the model is invalid (nothing to displace)
            if (!scope.isValid()) return

            console.log("Initialised!", scope)

            initHandle(scope, ctrl, element)
            //scope.setWidth(ctrl.getStoredWidth())
        }

        scope.getDisplacers = function() {
            var displacers = ctrl.resizer.displacers(scope.element, scope)
            if (Array.isArray(displacers)) {
                return displacers
            } else {
                return [displacers]
            }
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

        //ctrl.addColumn(scope)
    }

    function postlink(scope, element, attr, ctrl) {
        return
    }

    function initHandle(scope, ctrl, column) {
        // Prepend a new handle div to the column
        scope.handle = $('<div>', {
            class: 'handle'
        });
        column.prepend(scope.handle);

        // Bind mousedown, mousemove & mouseup events
        bindEventToHandle(scope, ctrl);
    }

    function bindEventToHandle(scope, ctrl) {

        // This event starts the dragging
        $(scope.handle).mousedown(function(event) {
            if (ctrl.isFirstDrag) {
                ctrl.resizer.onFirstDrag();
                ctrl.resizer.onTableReady()
                ctrl.isFirstDrag = false;
                ctrl.virgin = false
            }

            // Prevent text-selection, object dragging ect.
            event.preventDefault();

            // Change css styles for the handle
            $(scope.handle).addClass('active');

            // Show the resize cursor globally
            $('body').addClass('table-resize');

            // Get mouse and column origin measurements
            var orgX = event.clientX;

            // Freeze all columns
            scope.displacers.forEach(function(displacer) {
                displacer.freeze()
            })

            // On every mouse move, calculate the new width
            $(window).mousemove(calculateWidthEvent(scope, ctrl, orgX))

            // Stop dragging as soon as the mouse is released
            $(window).one('mouseup', unbindEvent(scope, ctrl, scope.handle))

        })
    }

    function calculateWidthEvent(scope, ctrl, orgX) {
        return function(event) {
            // Get current mouse position
            var newX = event.clientX;

            // Calculate the difference from origin of action
            var diffX = newX - orgX;

            scope.displacers.forEach(function(displacer) {
                displacer.prepare(diffX)
            })

            var valid = scope.displacers.every(function(displacer) {
                return displacer.allowed()
            })

            if (!valid) return

            scope.displacers.forEach(function(displacer) {
                displacer.commit()
            })
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
