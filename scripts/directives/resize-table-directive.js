angular.module("rzTable").directive('rzTable', ['resizeStorage', '$injector', '$parse', function(resizeStorage, $injector, $parse) {

    var mode;
    var saveTableSizes;
    var profile;

    var columns = null;
    var ctrlColumns = null;
    var handleColumns = null;
    var listener = null;
    var handles = []
    var table = null;
    var container = null;
    var resizer = null;
    var isFirstDrag = true;

    var cache = null;

    RzController.$inject = ['$scope', '$attrs', '$element'];

    function RzController($scope) {

    }

    function link(scope, element, attr) {
        // Set global reference to table
        table = element;

        // Set global reference to container
        container = scope.container ? $(scope.container) : $(table).parent();

        // Set options to an empty object if undefined
        scope.options = attr.rzOptions ? scope.options || {} : {}

        // Add css styling/properties to table
        $(table).addClass(scope.options.tableClass || 'resize');

        // Initialise handlers, bindings and modes
        initialiseAll(table, attr, scope);

        // Bind utility functions to scope object
        bindUtilityFunctions(table, attr, scope)

        // Watch for changes in columns
        watchTableChanges(table, attr, scope)

        // Watch for scope bindings
        setUpWatchers(table, attr, scope)
    }

    function renderWatch(table, attr, scope) {
      return function(oldVal, newVal) {
        if (newVal !== oldVal) {
          cleanUpAll(table);
          initialiseAll(table, attr, scope);
        }
      }
    }

    function setUpWatchers(table, attr, scope) {
        scope.$watch('profile', renderWatch(table, attr, scope))
        scope.$watch('mode', renderWatch(table, attr, scope))
    }

    function watchTableChanges(table, attr, scope) {
        scope.$watch(function () {
          return $(table).find('th').length;
        }, renderWatch(table, attr, scope));
    }

    function bindUtilityFunctions(table, attr, scope) {
        if (!attr.rzModel) return;
        var model = $parse(attr.rzModel)
        model.assign(scope.$parent, {
            update: function() {
                cleanUpAll(table)
                initialiseAll(table, attr, scope)
            },
            reset: function() {
                resetTable(table)
                this.clearStorageActive()
                this.update()
            },
            clearStorage: function() {
                resizeStorage.clearAll()
            },
            clearStorageActive: function() {
                resizeStorage.clearCurrent(table, mode, profile)
            }
        })
    }

    function cleanUpAll(table) {
        isFirstDrag = true;
        deleteHandles(table);
    }

    function resetTable(table) {
        $(table).outerWidth('100%');
        $(table).find('th').width('auto');
    }

    function deleteHandles(table) {
        handles.map(function(h) { h.remove() })
        handles = []
    }

    function initialiseAll(table, attr, scope) {
        // Get all column headers
        columns = $(table).find('th');

        mode = scope.mode;
        saveTableSizes = angular.isDefined(scope.saveTableSizes) ? scope.saveTableSizes : true;
        profile = scope.profile

        // Get the resizer object for the current mode
        var ResizeModel = getResizer(scope, attr);
        if (!ResizeModel) return;
        resizer = new ResizeModel(table, columns, container);

        if (saveTableSizes) {
            // Load column sizes from saved storage
            cache = resizeStorage.loadTableSizes(table, scope.mode, scope.profile)
        }

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
            initHandle(scope, table, column);
        })

    }

    function initHandle(scope, table, column) {
        // Prepend a new handle div to the column
        var handle = $('<div>', {
            class: scope.options.handleClass || 'handle'
        });
        $(column).prepend(handle);

        // Add handles to handles for later removal
        handles.push(handle)

        // Use the middleware to decide which columns this handle controls
        var controlledColumn = resizer.handleMiddleware(handle, column)

        // Bind mousedown, mousemove & mouseup events
        bindEventToHandle(scope, table, handle, controlledColumn);
    }

    function bindEventToHandle(scope, table, handle, column) {

        // This event starts the dragging
        $(handle).mousedown(function(event) {
            if (isFirstDrag) {
                resizer.onFirstDrag(column, handle);
                resizer.onTableReady();
                isFirstDrag = false;
            }

            scope.options.onResizeStarted && scope.options.onResizeStarted(column)

            var optional = {}
            if (resizer.intervene) {
                optional = resizer.intervene.selector(column);
                optional.column = optional;
                optional.orgWidth = $(optional).width();
            }

            // Prevent text-selection, object dragging ect.
            event.preventDefault();

            // Change css styles for the handle
            $(handle).addClass(scope.options.handleClassActive || 'active');

            // Get mouse and column origin measurements
            var orgX = event.clientX;
            var orgWidth = $(column).width();

            // On every mouse move, calculate the new width
            listener = calculateWidthEvent(scope, column, orgX, orgWidth, optional)
            $(window).mousemove(listener)

            // Stop dragging as soon as the mouse is released
            $(window).one('mouseup', unbindEvent(scope, column, handle))
        })
    }

    function calculateWidthEvent(scope, column, orgX, orgWidth, optional) {
        return function(event) {
            // Get current mouse position
            var newX = event.clientX;

            // Use calculator function to calculate new width
            var diffX = newX - orgX;
            var newWidth = resizer.calculate(orgWidth, diffX);

            if (newWidth < getMinWidth(column)) return;
            if (resizer.restrict(newWidth, diffX)) return;

            // Extra optional column
            if (resizer.intervene){
                var optWidth = resizer.intervene.calculator(optional.orgWidth, diffX);
                if (optWidth < getMinWidth(optional.column)) return;
                if (resizer.intervene.restrict(optWidth, diffX)) return;
                $(optional.column).width(optWidth)
            }

            scope.options.onResizeInProgress && scope.options.onResizeInProgress(column, newWidth, diffX)

            // Set size
            $(column).width(newWidth);
        }
    }

    function getMinWidth(column) {
        // "25px" -> 25
        return parseInt($(column).css('min-width')) || 0;
    }

    function getResizer(scope, attr) {
        try {
            var mode = attr.rzMode ? scope.mode : 'BasicResizer';
            var Resizer = $injector.get(mode)
            return Resizer;
        } catch (e) {
            console.error("The resizer "+ scope.mode +" was not found");
            return null;
        }
    }


    function unbindEvent(scope, column, handle) {
        // Event called at end of drag
        return function( /*event*/ ) {
            $(handle).removeClass(scope.options.handleClassActive || 'active');

            if (listener) {
                $(window).unbind('mousemove', listener);
            }

            scope.options.onResizeEnded && scope.options.onResizeEnded(column)

            resizer.onEndDrag();

            saveColumnSizes();
        }
    }

    function saveColumnSizes() {
        if (!saveTableSizes) return;

        if (!cache) cache = {};
        $(columns).each(function(index, column) {
            var colScope = angular.element(column).scope()
            var id = colScope.rzCol || $(column).attr('id')
            if (!id) return;
            cache[id] = resizer.saveAttr(column);
        })

        resizeStorage.saveTableSizes(table, mode, profile, cache);
    }

    function setColumnSizes(cache) {
        if (!cache) {
            return;
        }

        $(table).width('auto');

        ctrlColumns.each(function(index, column){
            var colScope = angular.element(column).scope()
            var id = colScope.rzCol || $(column).attr('id')
            var cacheWidth = cache[id];
            $(column).css({ width: cacheWidth });
        })

        resizer.onTableReady();
    }

    // Return this directive as a object literal
    return {
        restrict: 'A',
        link: link,
        controller: RzController,
        scope: {
            mode: '=rzMode',
            profile: '=?rzProfile',
            // whether to save table sizes; default true
            saveTableSizes: '=?rzSave',
            options: '=?rzOptions',
            model: '=rzModel',
            container: '@rzContainer'
        }
    };

}]);
