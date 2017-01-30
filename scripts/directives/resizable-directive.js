angular.module("ngTableResize").directive('resizable', ['resizeStorage', '$injector', function(resizeStorage, $injector) {

    function controller() {
        this.columns = []
        this.isFirstDrag = true
        this.resizer = getResizer(this)
        var cache = resizeStorage.loadTableSizes(this.id, this.mode, this.profile)

        this.addColumn = function(column) {
            if (Number.isInteger(column.$index)){
                this.columns.splice(column.$index, 0, column);
            } else {
                this.columns.push(column)
            }
        }

        this.loadSavedColumns = function() {
            cache = resizeStorage.loadTableSizes(this.id, this.mode, this.profile)
        }

        this.injectResizer = function() {
            if (this.resizer) {
                this.resizer.tearDown();
            }
            var resizer = getResizer(this)
            if (resizer !== null) {
                this.resizer = resizer
            }
            this.loadSavedColumns()
        }

        this.getStoredWidth = function(column) {
            return cache[column.resize];
        }

        this.initialiseColumns = function() {
            if (this.canRestoreColumns()) {
                this.initSavedColumns()
            } else {
                this.initDefaultColumns()
            }
        }

        this.canRestoreColumns = function() {
            var self = this
            var strict = true
            if (this.resizer.strictSaving === true) {
                strict = Object.keys(cache).length === self.columns.length
            }
            var restore = this.columns.every(function(column) {
                return self.getStoredWidth(column) || self.resizer.newColumnWidth(column);
            })
            return strict && restore
        }

        this.render = function() {
            if (!this.columns || this.columns.length === 0) return
            this.resetAll();
            this.initialiseAll();
            this.resizer.setup()
            this.initialiseColumns()
        }

        this.initSavedColumns = function() {
            var self = this
            this.columns.forEach(function(column) {
                column.setWidth(self.getStoredWidth(column) || self.resizer.newColumnWidth(column))
            })
            this.resizer.onTableReady()
            this.virgin = false
        }

        this.initDefaultColumns = function() {
            var self = this
            cache = {}
            this.columns.forEach(function(column) {
                column.setWidth(self.resizer.defaultWidth(column))
            })
            this.virgin = true
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
            this.resetAll();
            this.initialiseAll();
            this.initialiseColumns();
        }

        this.deleteHandles = function() {
            this.columns.forEach(function(column) {
                column.deleteHandle()
            })
        }

        this.resetAll = function() {
            this.isFirstDrag = true
            this.virgin = true
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
                cache[column.resize] = self.resizer.saveAttr(column);
            })

            resizeStorage.saveTableSizes(this.id, this.mode, this.profile, cache);
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
        // Set global reference to table
        ctrl.table = $(element)

        // Set global reference to container
        ctrl.container = attr.container ? $(attr.container) : element.parent();

        // Watch for changes
        watchModeChange(scope, element, ctrl);
    }

    function watchModeChange(scope, element, ctrl) {
        scope.$watch(function() {
            return ctrl.mode;
        }, function(newMode) {
            if (newMode) {
                ctrl.injectResizer();
                ctrl.render();
            }
        });

        scope.$watch(function() {
            return ctrl.profile;
        }, function(newProfile) {
            if (newProfile) {
                ctrl.loadSavedColumns()
                ctrl.initialiseColumns()
            }
        })

        function analyzeColumns() {
            var columns = []
            $(element).find('th').each(function(index, header) {
                columns.push(angular.element(header).scope())
            })
            return columns
        }

        scope.$watch(function(){
            return ctrl.columnsCollection
        }, function(){
            ctrl.columns = analyzeColumns()
            ctrl.render()
        }, true)
    }

    function resetTable(table) {
        $(table).outerWidth('100%');
        $(table).find('th').width('auto');
    }

    function getResizer(scope) {
        try {
            var mode = scope.mode ? scope.mode : 'BasicResizer';
            var Resizer = $injector.get(mode)
            if (!Resizer) return;
            return new Resizer(scope);
        } catch (e) {
            console.error("The resizer "+ scope.mode +" was not found");
            return null;
        }
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
            profile: '=?',
            columnsCollection: '=?columns',
            bind: '=?'
        }
    };

}]);
