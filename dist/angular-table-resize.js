angular.module("ngTableResize", []);

angular.module("ngTableResize").directive('resizeable', ['resizeStorage', '$injector', function(resizeStorage, $injector) {

    var mode;

    var columns = null;
    var ctrlColumns = null;
    var handleColumns = null;
    var table = null;
    var container = null;
    var resizer = null;
    var isFirstDrag = true;

    var cache = null;

    function link(scope, element, attr) {
        // Set global reference to table
        table = element;

        // Set global reference to container
        container = scope.container ? $(scope.container) : $(table).parent();

        // Add css styling/properties to table
        $(table).addClass('resize');

        // Initialise handlers, bindings and modes
        initialiseAll(table, attr, scope);

        // Bind utility functions to scope object
        bindUtilityFunctions(table, attr, scope)

        // Watch for mode changes and update all
        watchModeChange(table, attr, scope);
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

    function watchModeChange(table, attr, scope) {
        scope.$watch(function() {
            return scope.mode;
        }, function(/*newMode*/) {
            cleanUpAll(table);
            initialiseAll(table, attr, scope);
        });
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
        $(table).find('th').find('.handle').remove();
    }

    function initialiseAll(table, attr, scope) {
        // Get all column headers
        columns = $(table).find('th');

        mode = scope.mode;

        // Get the resizer object for the current mode
        var ResizeModel = getResizer(scope);
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
            var Resizer = $injector.get(scope.mode)
            return Resizer;
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

    // Return this directive as a object literal
    return {
        restrict: 'A',
        link: link,
        scope: {
            mode: '=',
            bind: '=',
            container: '@'
        }
    };

}]);

angular.module("ngTableResize").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, model) {
        var key = getStorageKey(table, model);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object);
    }

    this.saveTableSizes = function(table, model, sizes) {
        var key = getStorageKey(table, model);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    function getStorageKey(table, mode) {
        var id = table.attr('id');
        if (!id) {
            console.error("Table has no id", table);
            return undefined;
        }
        return prefix + '.' + table.attr('id') + '.' + mode;
    }

}]);

angular.module("ngTableResize").factory("ResizerModel", [function() {

    function ResizerModel(table, columns, container){
        this.minWidth = 25;

        this.table = table;
        this.columns = columns;
        this.container = container;

        this.handleColumns = this.handles();
        this.ctrlColumns = this.ctrlColumns();
    }

    ResizerModel.prototype.setup = function() {
        // Hide overflow by default
        $(this.container).css({
            overflowX: 'hidden'
        })
    }

    ResizerModel.prototype.onTableReady = function () {
        // Table is by default 100% width
        $(this.table).outerWidth('100%');
    };

    ResizerModel.prototype.handles = function () {
        // By default all columns should be assigned a handle
        return this.columns;
    };

    ResizerModel.prototype.ctrlColumns = function () {
        // By default all columns assigned a handle are resized
        return this.handleColumns;
    };

    ResizerModel.prototype.onFirstDrag = function () {
        // By default, set all columns to absolute widths
        $(this.ctrlColumns).each(function(index, column) {
            $(column).width($(column).width());
        })
    };

    ResizerModel.prototype.handleMiddleware = function (handle, column) {
        // By default, every handle controls the column it is placed in
        return column;
    };

    ResizerModel.prototype.restrict = function (newWidth) {
        // By default, the new width must not be smaller that min width
        return newWidth < this.minWidth;
    };

    ResizerModel.prototype.calculate = function (orgWidth, diffX) {
        // By default, simply add the width difference to the original
        return orgWidth + diffX;
    };

    ResizerModel.prototype.onEndDrag = function () {
        // By default, do nothing when dragging a column ends
        return;
    };

    ResizerModel.prototype.saveAttr = function (column) {
        return $(column).outerWidth();
    };

    return ResizerModel;
}]);

angular.module("ngTableResize").factory("BasicResizer", ["ResizerModel", function(ResizerModel) {

    function BasicResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)

        // All columns are controlled in basic mode
        this.ctrlColumns = this.columns;

        this.intervene = {
            selector: interveneSelector,
            calculator: interveneCalculator,
            restrict: interveneRestrict
        }
    }

    // Inherit by prototypal inheritance
    BasicResizer.prototype = Object.create(ResizerModel.prototype);

    function interveneSelector(column) {
        return $(column).next()
    }

    function interveneCalculator(orgWidth, diffX) {
        return orgWidth - diffX;
    }

    function interveneRestrict(newWidth){
        return newWidth < 25;
    }

    BasicResizer.prototype.setup = function() {
        // Hide overflow in mode fixed
        $(this.container).css({
            overflowX: 'hidden'
        })

        // First column is auto to compensate for 100% table width
        $(this.columns).first().css({
            width: 'auto'
        });
    };

    BasicResizer.prototype.handles = function() {
        // Mode fixed does not require handler on last column
        return $(this.columns).not(':last')
    };

    BasicResizer.prototype.onFirstDrag = function() {
        // Replace all column's width with absolute measurements
        $(this.columns).each(function(index, column) {
            $(column).width($(column).width());
        })
    };

    BasicResizer.prototype.onEndDrag = function () {
        // Calculates the percent width of each column
        var totWidth = $(this.table).outerWidth();

        var totPercent = 0;

        $(this.columns).each(function(index, column) {
            var colWidth = $(column).outerWidth();
            var percentWidth = colWidth / totWidth * 100 + '%';
            totPercent += (colWidth / totWidth * 100);
            $(column).css({ width: percentWidth });
        })

    };

    BasicResizer.prototype.saveAttr = function (column) {
        return $(column)[0].style.width;
    };

    // Return constructor
    return BasicResizer;

}]);

angular.module("ngTableResize").factory("FixedResizer", ["ResizerModel", function(ResizerModel) {

    function FixedResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)

        this.fixedColumn = $(table).find('th').first();
        this.bound = false;
    }

    // Inherit by prototypal inheritance
    FixedResizer.prototype = Object.create(ResizerModel.prototype);

    FixedResizer.prototype.setup = function() {
        // Hide overflow in mode fixed
        $(this.container).css({
            overflowX: 'hidden'
        })

        // First column is auto to compensate for 100% table width
        $(this.columns).first().css({
            width: 'auto'
        });
    };

    FixedResizer.prototype.handles = function() {
        // Mode fixed does not require handler on last column
        return $(this.columns).not(':last')
    };

    FixedResizer.prototype.ctrlColumns = function() {
        // In mode fixed, all but the first column should be resized
        return $(this.columns).not(':first');
    };

    FixedResizer.prototype.onFirstDrag = function() {
        // Replace each column's width with absolute measurements
        $(this.ctrlColumns).each(function(index, column) {
            $(column).width($(column).width());
        })
    };

    FixedResizer.prototype.handleMiddleware = function (handle, column) {
        // Fixed mode handles always controll next neightbour column
        return $(column).next();
    };

    FixedResizer.prototype.restrict = function (newWidth) {
        if (this.bound) {
            if (newWidth < this.bound) {
                $(this.fixedColumn).width('auto');
                this.bound = false;
                return false;
            } else {
                return true;
            }
        } else if (newWidth < this.minWidth) {
            return true;
        } else if ($(this.fixedColumn).width() <= this.minWidth) {
            this.bound = newWidth;
            $(this.fixedColumn).width(this.minWidth);
            return true;
        }
    };

    FixedResizer.prototype.calculate = function (orgWidth, diffX) {
        // Subtract difference - neightbour grows
        return orgWidth - diffX;
    };

    // Return constructor
    return FixedResizer;

}]);

angular.module("ngTableResize").factory("OverflowResizer", ["ResizerModel", function(ResizerModel) {

    function OverflowResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)
    }

    // Inherit by prototypal inheritance
    OverflowResizer.prototype = Object.create(ResizerModel.prototype);


    OverflowResizer.prototype.setup = function() {
        // Allow overflow in this mode
        $(this.container).css({
            overflow: 'auto'
        });
    };

    OverflowResizer.prototype.onTableReady = function() {
        // For mode overflow, make table as small as possible
        $(this.table).width(1);
    };

    // Return constructor
    return OverflowResizer;

}]);
