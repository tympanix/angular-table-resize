angular.module("ngTableResize").directive('resizable', ['resizeStorage', '$injector', function(resizeStorage, $injector) {

    function controller() {
        this.columns = []
        this.isFirstDrag = true
        this.resizer = getResizer(this)
        console.log("Resizer", this.resizer);
        var cache = resizeStorage.loadTableSizes(this.id, this.mode)

        this.addColumn = function(column) {
            this.columns.push(column)
        }

        this.loadSavedColumns = function() {
            cache = resizeStorage.loadTableSizes(this.id, this.mode)
        }

        this.injectResizer = function() {
            var resizer = getResizer(this)
            if (resizer !== null) {
                this.resizer = resizer
            }
            this.loadSavedColumns()
        }

        this.finish = function() {
            console.log("Finish!");
            console.log("Container", this.container);
            console.log("Columns", this.getColumns());
            this.resizer.setup()
            this.resizer.onTableReady();
        }

        this.getColumns = function() {
            return this.columns.map(function(column) {
                return column.element
            })
        }

        this.removeColumn = function(column) {
            var index = this.columns.indexOf(column)
            if (index > -1) {
                this.columns.splice(index, 1);
            }
        }

        this.getStoredWidth = function(column) {
            return cache[column.resize] || this.resizer.defaultWidth(column);
        }

        this.deleteHandles = function() {
            this.columns.forEach(function(column) {
                column.deleteHandle()
            })
        }

        this.resetAll = function() {
            this.isFirstDrag = true
            this.deleteHandles()
        }

        this.initialiseAll = function() {
            this.columns.forEach(function(column) {
                column.initialise()
            })
        }

        this.saveColumnSizes = function() {
            var self = this
            if (!cache) cache = {};
            this.columns.forEach(function(column) {
                cache[column.resize] = self.resizer.saveAttr(column.element);
            })

            resizeStorage.saveTableSizes(this.id, this.mode, cache);
        }

        this.nextColumn = function(column) {
            var index = this.columns.indexOf(column)
            if (index === -1 || index >= this.columns.length) {
                return undefined
            } else {
                return this.columns[index + 1]
            }
        }

    }

    function compile(element, attr) {
        element.addClass('resize')
        return link
    }

    function link(scope, element, attr, ctrl) {
        // // Set global reference to table
        ctrl.table = $(element)
        //
        // Set global reference to container
        ctrl.container = ctrl.container ? $(ctrl.container) : element.parent();
        //
        // // Add css styling/properties to table
        // $(table).addClass('resize');
        //
        // // Initialise handlers, bindings and modes
        // initialiseAll(table, attr, scope);
        //
        // // Bind utility functions to scope object
        // bindUtilityFunctions(table, attr, scope)
        //
        // // Watch for mode changes and update all
        watchModeChange(scope, ctrl);
    }

    function bindUtilityFunctions(table, attr, scope) {
        if (scope.bind === undefined) return;
        scope.bind = {
            update: function() {
                cleanUpAll(table);
                initialiseAll(table, attr, scope);
            }
        }
    }

    function watchModeChange(scope, ctrl) {
        scope.$watch(function() {
            return ctrl.mode;
        }, function(newMode) {
            if (newMode) {
                ctrl.injectResizer();
                ctrl.resetAll();
                ctrl.initialiseAll();
                ctrl.finish();
            }
        });
    }

    function resetTable(table) {
        $(table).outerWidth('100%');
        $(table).find('th').width('auto');
    }

    function deleteHandles(table) {
        $(table).find('th').find('.handle').remove();
    }

    function initialiseAll(table, attr, scope) {
        // Get all column headers
        columns = $(table).find('th');

        mode = scope.mode;

        // Get the resizer object for the current mode
        var ResizeModel = getResizer(scope, attr);
        if (!ResizeModel) return;
        resizer = new ResizeModel(table, columns, container);

        // Load column sized from saved storage
        cache = resizeStorage.loadTableSizes(table, scope.mode)

        // Decide which columns should have a handler attached
        handleColumns = resizer.handles(columns);

        // Decide which columns are controlled and resized
        ctrlColumns = resizer.ctrlColumns;

        // Execute setup function for the given resizer mode
        resizer.setup();

        // Set column sizes from cache
        setColumnSizes(cache);

        // Initialise all handlers for every column
        handleColumns.each(function(index, column) {
            initHandle(table, column);
        })

    }

    function setColumnSizes(cache) {
        if (!cache) {
            resetTable(table);
            return;
        }

        $(table).width('auto');

        ctrlColumns.each(function(index, column){
            var id = $(column).attr('id');
            var cacheWidth = cache[id];
            $(column).css({ width: cacheWidth });
        })

        resizer.onTableReady();
    }

    function initHandle(table, column) {
        // Prepend a new handle div to the column
        var handle = $('<div>', {
            class: 'handle'
        });
        $(column).prepend(handle);

        // Make handle as tall as the table
        //$(handle).height($(table).height())

        // Use the middleware to decide which columns this handle controls
        var controlledColumn = resizer.handleMiddleware(handle, column)

        // Bind mousedown, mousemove & mouseup events
        bindEventToHandle(table, handle, controlledColumn);
    }

    function bindEventToHandle(table, handle, column) {

        // This event starts the dragging
        $(handle).mousedown(function(event) {
            if (isFirstDrag) {
                resizer.onFirstDrag(column, handle);
                resizer.onTableReady();
                isFirstDrag = false;
            }

            var optional = {}
            if (resizer.intervene) {
                optional = resizer.intervene.selector(column);
                optional.column = optional;
                optional.orgWidth = $(optional).width();
            }

            // Prevent text-selection, object dragging ect.
            event.preventDefault();

            // Change css styles for the handle
            $(handle).addClass('active');

            // Show the resize cursor globally
            $('body').addClass('table-resize');

            // Get mouse and column origin measurements
            var orgX = event.clientX;
            var orgWidth = $(column).width();

            // On every mouse move, calculate the new width
            $(window).mousemove(calculateWidthEvent(column, orgX, orgWidth, optional))

            // Stop dragging as soon as the mouse is released
            $(window).one('mouseup', unbindEvent(handle))

        })
    }

    function calculateWidthEvent(column, orgX, orgWidth, optional) {
        return function(event) {
            // Get current mouse position
            var newX = event.clientX;

            // Use calculator function to calculate new width
            var diffX = newX - orgX;
            var newWidth = resizer.calculate(orgWidth, diffX);

            // Use restric function to abort potential restriction
            if (resizer.restrict(newWidth)) return;

            // Extra optional column
            if (resizer.intervene){
                var optWidth = resizer.intervene.calculator(optional.orgWidth, diffX);
                if (resizer.intervene.restrict(optWidth)) return;
                $(optional).width(optWidth)
            }

            // Set size
            $(column).width(newWidth);
        }
    }

    function getResizer(scope) {
        try {
            var mode = scope.mode ? scope.mode : 'BasicResizer';
            var Resizer = $injector.get(mode)
            if (!Resizer) return;
            console.log("Settings resizer to", mode);
            return new Resizer(scope);
        } catch (e) {
            console.error("The resizer "+ scope.mode +" was not found");
            return null;
        }
    }


    function unbindEvent(handle) {
        // Event called at end of drag
        return function( /*event*/ ) {
            $(handle).removeClass('active');
            $(window).unbind('mousemove');
            $('body').removeClass('table-resize');

            resizer.onEndDrag();

            saveColumnSizes();
        }
    }

    function saveColumnSizes() {
        if (!cache) cache = {};
        $(columns).each(function(index, column) {
            var id = $(column).attr('id');
            if (!id) return;
            cache[id] = resizer.saveAttr(column);
        })

        resizeStorage.saveTableSizes(table, mode, cache);
    }

    // Return this directive as an object literal
    return {
        restrict: 'A',
        priority: 0,
        compile: compile,
        controller: controller,
        controllerAs: 'rzctrl',
        bindToController: true,
        scope: {
            id: '@',
            mode: '=?',
            bind: '=?',
            container: '@?'
        }
    };

}]);
