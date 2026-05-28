angular.module("rzTable", []);

angular.module("rzTable").directive('rzTable', ['resizeStorage', '$injector', '$parse', function(resizeStorage, $injector, $parse) {

    RzController.$inject = ['$scope', '$attrs', '$element'];

    function RzController($scope, $attrs, $element) {
        this.scope = $scope;
        this.attr = $attrs;
        this.table = $element;
        this.mode = null;
        this.saveTableSizes = true;
        this.profile = null;
        this.columns = null;
        this.ctrlColumns = null;
        this.handleColumns = null;
        this.listener = null;
        this.handles = [];
        this.container = $scope.container ? $($scope.container) : $(this.table).parent();
        this.resizer = null;
        this.isFirstDrag = true;
        this.cache = null;
        this.registeredColumns = [];

        this.scope.options = $attrs.rzOptions ? $scope.options || {} : {}
        $(this.table).addClass(this.scope.options.tableClass || 'rz-table');

        this.renderWatchListener = this.renderWatch();
        this.initialiseAll();
        this.bindUtilityFunctions();
        this.watchTableChanges();
        this.setUpWatchers();

        this.scope.$on('$destroy', function() {
            this.cleanUpAll();
        }.bind(this))
    }

    RzController.prototype.registerColumn = function(element, scope) {
        var column = {
            element: element,
            scope: scope,
            id: scope.rzCol
        }
        this.registeredColumns.push(column)
        return column
    }

    RzController.prototype.updateRegisteredColumn = function(column, rzCol) {
        column.id = rzCol
    }

    RzController.prototype.unregisterColumn = function(column) {
        this.registeredColumns = this.registeredColumns.filter(function(entry) {
            return entry !== column
        })
    }

    RzController.prototype.renderWatch = function() {
        return function(newVal, oldVal) {
            if (this.scope.busy === true) return
            if (newVal === undefined) return
            if (newVal !== oldVal) {
                this.cleanUpAll();
                this.initialiseAll();
            }
        }.bind(this)
    }

    RzController.prototype.setUpWatchers = function() {
        this.scope.$watch('profile', this.renderWatchListener)
        this.scope.$watch('mode', this.renderWatchListener)
        this.scope.$watch('busy', this.renderWatchListener)
    }

    RzController.prototype.watchTableChanges = function() {
        this.scope.$watch(function () {
            return this.getRegisteredColumnSignature();
        }.bind(this), this.renderWatchListener);
    }

    RzController.prototype.getRegisteredColumnSignature = function() {
        return this.registeredColumns.map(function(column) {
            return angular.isDefined(column.id) ? String(column.id) : ''
        }).join('|')
    }

    RzController.prototype.bindUtilityFunctions = function() {
        var ctrl = this;
        if (!this.attr.rzModel) return;
        var model = $parse(this.attr.rzModel)
        model.assign(this.scope.$parent, {
            update: function() {
                ctrl.cleanUpAll()
                ctrl.initialiseAll()
            },
            reset: function() {
                ctrl.resetTable()
                this.clearStorageActive()
                this.update()
            },
            clearStorage: function() {
                resizeStorage.clearAll()
            },
            clearStorageActive: function() {
                resizeStorage.clearCurrent(ctrl.table, ctrl.mode, ctrl.profile)
            }
        })
    }

    RzController.prototype.cleanUpAll = function() {
        this.isFirstDrag = true;
        if (this.listener) {
            $(window).unbind('mousemove', this.listener);
            this.listener = null;
        }
        this.deleteHandles();
    }

    RzController.prototype.resetTable = function() {
        $(this.table).outerWidth('100%');
        $(this.table).find('th').width('auto');
    }

    RzController.prototype.deleteHandles = function() {
        this.handles.map(function(handle) { handle.remove() })
        this.handles = []
    }

    RzController.prototype.initialiseAll = function() {
        if (this.scope.busy) return

        this.columns = $(this.table).find('th');
        this.mode = this.scope.mode;
        this.saveTableSizes = angular.isDefined(this.scope.saveTableSizes) ? this.scope.saveTableSizes : true;
        this.profile = this.scope.profile

        var ResizeModel = this.getResizer();
        if (!ResizeModel) return;
        this.resizer = new ResizeModel(this.table, this.columns, this.container);

        if (this.saveTableSizes) {
            this.cache = resizeStorage.loadTableSizes(this.table, this.scope.mode, this.scope.profile)
        }

        this.handleColumns = this.resizer.handles(this.columns);
        this.ctrlColumns = this.resizer.ctrlColumns;
        this.resizer.setup();
        this.setColumnSizes(this.cache);

        this.handleColumns.each(function(index, column) {
            this.initHandle(column);
        }.bind(this))
    }

    RzController.prototype.initHandle = function(column) {
        var handle = $('<div>', {
            class: this.scope.options.handleClass || 'rz-handle'
        });
        $(column).prepend(handle);
        this.handles.push(handle)

        var controlledColumn = this.resizer.handleMiddleware(handle, column)
        this.bindEventToHandle(handle, controlledColumn);
    }

    RzController.prototype.bindEventToHandle = function(handle, column) {
        $(handle).mousedown(function(event) {
            if (this.isFirstDrag) {
                this.resizer.onFirstDrag(column, handle);
                this.resizer.onTableReady();
                this.isFirstDrag = false;
            }

            this.scope.options.onResizeStarted && this.scope.options.onResizeStarted(column)

            var optional = {}
            if (this.resizer.intervene) {
                optional = this.resizer.intervene.selector(column);
                optional.column = optional;
                optional.orgWidth = $(optional).width();
            }

            event.preventDefault();
            $(handle).addClass(this.scope.options.handleClassActive || 'rz-handle-active');

            var orgX = event.clientX;
            var orgWidth = $(column).width();

            this.listener = this.calculateWidthEvent(column, orgX, orgWidth, optional)
            $(window).mousemove(this.listener)
            $(window).one('mouseup', this.unbindEvent(column, handle))
        }.bind(this))
    }

    RzController.prototype.calculateWidthEvent = function(column, orgX, orgWidth, optional) {
        return function(event) {
            var newX = event.clientX;
            var diffX = newX - orgX;
            var newWidth = this.resizer.calculate(orgWidth, diffX);

            if (newWidth < getMinWidth(column)) return;
            if (this.resizer.restrict(newWidth, diffX)) return;

            if (this.resizer.intervene){
                var optWidth = this.resizer.intervene.calculator(optional.orgWidth, diffX);
                if (optWidth < getMinWidth(optional.column)) return;
                if (this.resizer.intervene.restrict(optWidth, diffX)) return;
                $(optional.column).width(optWidth)
            }

            this.scope.options.onResizeInProgress && this.scope.options.onResizeInProgress(column, newWidth, diffX)
            $(column).width(newWidth);
        }.bind(this)
    }

    function getMinWidth(column) {
        return parseInt($(column).css('min-width')) || 0;
    }

    RzController.prototype.getResizer = function() {
        try {
            var mode = this.attr.rzMode ? this.scope.mode : 'BasicResizer';
            var Resizer = $injector.get(mode)
            return Resizer;
        } catch (e) {
            console.error("The resizer "+ this.scope.mode +" was not found");
            return null;
        }
    }

    RzController.prototype.unbindEvent = function(column, handle) {
        return function( /*event*/ ) {
            $(handle).removeClass(this.scope.options.handleClassActive || 'rz-handle-active');

            if (this.listener) {
                $(window).unbind('mousemove', this.listener);
                this.listener = null;
            }

            this.scope.options.onResizeEnded && this.scope.options.onResizeEnded(column)
            this.resizer.onEndDrag();
            this.saveColumnSizes();
        }.bind(this)
    }

    RzController.prototype.saveColumnSizes = function() {
        if (!this.saveTableSizes) return;

        if (!this.cache) this.cache = {};
        $(this.columns).each(function(index, column) {
            var colScope = angular.element(column).scope()
            var id = colScope.rzCol || $(column).attr('id')
            if (!id) return;
            this.cache[id] = this.resizer.saveAttr(column);
        }.bind(this))

        resizeStorage.saveTableSizes(this.table, this.mode, this.profile, this.cache);
    }

    RzController.prototype.setColumnSizes = function(cache) {
        if (!cache) {
            return;
        }

        $(this.table).width('auto');

        this.ctrlColumns.each(function(index, column){
            var colScope = angular.element(column).scope()
            var id = colScope.rzCol || $(column).attr('id')
            var cacheWidth = cache[id];
            $(column).css({ width: cacheWidth });
        })

        this.resizer.onTableReady();
    }

    return {
        restrict: 'A',
        controller: RzController,
        scope: {
            mode: '=rzMode',
            profile: '=?rzProfile',
            busy: '=?rzBusy',
            saveTableSizes: '=?rzSave',
            options: '=?rzOptions',
            model: '=rzModel',
            container: '@rzContainer'
        }
    };

}]);

angular.module("rzTable").directive('rzCol', [function() {
  // Return this directive as a object literal
  return {
    restrict: 'A',
    priority: 650, /* before ng-if */
    link: link,
    require: '^^rzTable',
    scope: true
  };

  function link(scope, element, attr, controller) {
    var column = controller.registerColumn(element, scope)

    scope.$watch(function() {
      return scope.$eval(attr.rzCol)
    }, function(rzCol) {
      scope.rzCol = rzCol
      controller.updateRegisteredColumn(column, rzCol)
    })

    scope.$on('$destroy', function() {
      controller.unregisterColumn(column)
    })
  }
}])
angular.module("rzTable").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, mode, profile) {
        var key = getStorageKey(table, mode, profile);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object);
    }

    this.saveTableSizes = function(table, mode, profile, sizes) {
        var key = getStorageKey(table, mode, profile);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    this.clearAll = function() {
        var keys = []
        for (var i = 0; i < $window.localStorage.length; ++i) {
            var key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
                keys.push(key)
            }
        }
        keys.map(function(k) { $window.localStorage.removeItem(k) })
    }

    this.clearCurrent = function(table, mode, profile) {
        var key = getStorageKey(table, mode, profile);
        if (key) {
            $window.localStorage.removeItem(key)
        }
    }

    function getStorageKey(table, mode, profile) {
        var id = table.attr('id');
        if (!id) {
            console.error("Table has no id", table);
            return undefined;
        }
        return prefix + '.' + table.attr('id') + '.' + mode + (profile ? '.' + profile : '');
    }

}]);

angular.module("rzTable").factory("ResizerModel", [function() {

    function ResizerModel(table, columns, container){
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

    ResizerModel.prototype.getMinWidth = function(column) {
        // "25px" -> 25
        return parseInt($(column).css('min-width')) || 0;
    }

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
        return false;
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

angular.module("rzTable").factory("BasicResizer", ["ResizerModel", function(ResizerModel) {

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

        $(this.table).css({
            width: '100%'
        })
    };

    BasicResizer.prototype.handles = function() {
        // Mode fixed does not require handler on last column
        return $(this.columns).not(':last')
    };

    BasicResizer.prototype.onFirstDrag = function() {
        // Replace all column's width with absolute measurements
        this.onEndDrag()
    };

    BasicResizer.prototype.onEndDrag = function () {
        // Calculates the percent width of each column
        var totWidth = $(this.table).outerWidth();

        var callbacks = []

        // Calculate the width of every column
        $(this.columns).each(function(index, column) {
            var colWidth = $(column).outerWidth();
            var percentWidth = colWidth / totWidth * 100 + '%';
            callbacks.push(function() {
              $(column).css({ width: percentWidth });
            })
        })

        // Apply the calculated width of every column
        callbacks.map(function(cb) { cb() })
    };

    BasicResizer.prototype.saveAttr = function (column) {
        return $(column)[0].style.width;
    };

    // Return constructor
    return BasicResizer;

}]);

angular.module("rzTable").factory("FixedResizer", ["ResizerModel", function(ResizerModel) {

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

        $(this.table).css({
            width: '100%'
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

    FixedResizer.prototype.restrict = function (newWidth, diffX) {
        if (this.bound && this.bound < diffX) {
          this.bound = false
          return false
        } if (this.bound && this.bound > diffX) {
          return true
        } else if (this.fixedColumn.width() <= this.getMinWidth(this.fixedColumn)) {
            this.bound = diffX
            $(this.fixedColumn).width(this.minWidth);
            return true;
        }
    };

    FixedResizer.prototype.onEndDrag = function () {
        this.bound = false
    };

    FixedResizer.prototype.calculate = function (orgWidth, diffX) {
        // Subtract difference - neightbour grows
        return orgWidth - diffX;
    };

    // Return constructor
    return FixedResizer;

}]);

angular.module("rzTable").factory("OverflowResizer", ["ResizerModel", function(ResizerModel) {

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
