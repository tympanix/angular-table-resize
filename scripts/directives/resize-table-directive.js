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
