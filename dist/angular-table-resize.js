angular.module("ngTableResize", []);

angular.module("ngTableResize").directive('resizable', ['resizeStorage', '$injector', function(resizeStorage, $injector) {

    function controller() {
        this.columns = []
        this.isFirstDrag = true
        this.resizer = getResizer(this)
        var cache = {} //resizeStorage.loadTableSizes(this.id, this.mode, this.profile)

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
            if (!this.columns || this.columns.length === 0) return
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
            cache = {};
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

        // Set id of table
        ctrl.id = attr.id;

        // Load saved columns
        ctrl.loadSavedColumns()

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
            return $(element).find('th').length
        }, function(){
            ctrl.columns = analyzeColumns()
            ctrl.render()
        })
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
            hello: '@?',
            mode: '=?',
            profile: '=?',
            columnsCollection: '=?columns',
            bind: '=?'
        }
    };

}]);

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

angular.module("ngTableResize").service('resizeStorage', ['$window', function($window) {

    var prefix = "ngColumnResize";

    this.loadTableSizes = function(table, model, profile) {
        var key = getStorageKey(table, model, profile);
        var object = $window.localStorage.getItem(key);
        return JSON.parse(object) || {};
    }

    this.saveTableSizes = function(table, model, profile, sizes) {
        var key = getStorageKey(table, model, profile);
        if (!key) return;
        var string = JSON.stringify(sizes);
        $window.localStorage.setItem(key, string)
    }

    function getStorageKey(table, mode, profile) {
        var key = []
        if (!table) {
            console.error("Table has no id", table);
            return undefined;
        }
        key.push(prefix)
        key.push(table)
        key.push(mode)
        if (profile) key.push(profile)
        return key.join('.')
    }

}]);

angular.module("ngTableResize").factory("ResizerModel", ["Displacer", function(Displacer) {

    function ResizerModel(rzctrl){
        this.strictSaving = true
        this.minWidth = 50;
        this.ctrl = rzctrl
    }

    ResizerModel.prototype.setup = function() {
        // Hide overflow by default
        $(this.ctrl.container).css({
            overflowX: 'hidden'
        })
    }

    ResizerModel.prototype.tearDown = function() {
        return
    }

    ResizerModel.prototype.defaultWidth = function(column) {
        return 'auto'
    }

    ResizerModel.prototype.newColumnWidth = function(column) {
        return false
    }

    ResizerModel.prototype.onTableReady = function () {
        // Table is by default 100% width
        $(this.ctrl.table).outerWidth('100%');
    };

    ResizerModel.prototype.handles = function () {
        // By default all columns should be assigned a handle
        return true
    };

    ResizerModel.prototype.onFirstDrag = function () {
        // By default, set all columns to absolute widths
        this.ctrl.columns.forEach(function(column) {
            column.setWidth(column.getWidth());
        })
    };

    ResizerModel.prototype.displacers = function(element, scope) {
        return new Displacer({
            column: element
        })
    }

    ResizerModel.prototype.onEndDrag = function () {
        // By default, do nothing when dragging a column ends
        return;
    };

    ResizerModel.prototype.saveAttr = function (column) {
        return column.getWidth()
    };

    return ResizerModel;
}]);

angular.module("ngTableResize").factory("Displacer", [function() {

    function Displacer(config){
        this.column = config.column
        this.scope = angular.element(this.column).scope()
        this.orgWidth = null
        this.resizer = config.resizer
        this.calculate = config.calculate || Displacer.DISPLACE_ADD
        this.restrictFunc = config.restrict || Displacer.RESTRICT
    }

    Displacer.RESTRICT = function(newWidth) {
        return newWidth < 50
    }

    Displacer.DISPLACE_ADD = function(orgWidth, diffX) {
        return orgWidth + diffX
    }

    Displacer.DISPLACE_SUB = function(orgWidth, diffX) {
        return orgWidth - diffX
    }

    Displacer.prototype.restrict = function(newWidth) {
        if (this.resizer) {
            return this.restrictFunc.call(this.resizer, newWidth)
        } else {
            return this.restrictFunc(newWidth)
        }
    }

    Displacer.prototype.isValid = function() {
        return !!this.column && !!this.scope
    };

    Displacer.prototype.freeze = function() {
        this.orgWidth = this.scope.getWidth()
    }

    Displacer.prototype.prepare = function(diffX) {
        this.newWidth = this.calculate(this.orgWidth, diffX)
    }

    Displacer.prototype.allowed = function() {
        return !this.restrict(this.newWidth)
    }

    Displacer.prototype.commit = function() {
        this.scope.setWidth(this.newWidth)
    }

    Displacer.prototype.displace = function(diffX) {
        // Calculate new width of column
        var newWidth = this.calculate(this.orgWidth, diffX);

        // Use restric function to obey potential restriction
        if (this.restrict(newWidth)) return;

        // Set the new size of the column
        this.scope.setWidth(newWidth);
    }

    return Displacer;
}]);

angular.module("ngTableResize").factory("BasicResizer", ["ResizerModel", "Displacer", function(ResizerModel, Displacer) {

    function BasicResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)
    }

    // Inherit by prototypal inheritance
    BasicResizer.prototype = Object.create(ResizerModel.prototype);


    BasicResizer.prototype.setup = function(container, columns) {
        // Hide overflow in mode fixed
        this.ctrl.container.css({
            overflowX: 'hidden'
        })

        // First column is auto to compensate for 100% table width
        this.ctrl.columns[0].setWidth('auto')
        // $(columns).first().css({
        //     width: 'auto'
        // });
    };

    BasicResizer.prototype.handles = function(column) {
        // Mode fixed does not require handler on last column
        return column.$last !== true
    };

    BasicResizer.prototype.onFirstDrag = function() {
        // Replace all column's width with absolute measurements
        this.ctrl.columns.forEach(function(column) {
            column.setWidth(column.getWidth());
        })
    };

    BasicResizer.prototype.displacers = function(element, scope) {
        return [
            new Displacer({
                column: element,
                calculate: Displacer.DISPLACE_ADD
            }), 
            new Displacer({
                column: $(element).next(),
                calculate: Displacer.DISPLACE_SUB
            })
        ]
    }

    BasicResizer.prototype.onEndDrag = function () {
        // Calculates the percent width of each column
        var totWidth = $(this.ctrl.table).outerWidth();
        var totPercent = 0;

        this.ctrl.columns.forEach(function(column) {
            var colWidth = column.getWidth();
            var percentWidth = colWidth / totWidth * 100 + '%';
            totPercent += (colWidth / totWidth * 100);
            column.setWidth(percentWidth)
        })

    };

    BasicResizer.prototype.saveAttr = function (column) {
        return $(column.element)[0].style.width;
    };

    // Return constructor
    return BasicResizer;

}]);

angular.module("ngTableResize").factory("FixedResizer", ["ResizerModel", "Displacer", function(ResizerModel, Displacer) {

    function FixedResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)

        this.fixedColumn = $(this.ctrl.table).find('th').first();
        this.bound = false;
    }

    // Inherit by prototypal inheritance
    FixedResizer.prototype = Object.create(ResizerModel.prototype);

    FixedResizer.prototype.setup = function() {
        // Hide overflow in mode fixed
        $(this.ctrl.container).css({
            overflowX: 'hidden'
        })

        // First column is auto to compensate for 100% table width
        this.ctrl.columns[0].setWidth('auto')
    };

    FixedResizer.prototype.handles = function() {
        // Mode fixed does not require handler on last column
        return this.ctrl.columns.slice(0,-1)
    };

    FixedResizer.prototype.onFirstDrag = function() {
        // Replace all column's width with absolute measurements
        this.ctrl.columns.slice(1).forEach(function(column) {
            column.setWidth(column.getWidth());
        })
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

    FixedResizer.prototype.displacers = function(element, scope) {
        return new Displacer({
            column: $(element).next(),
            calculate: Displacer.DISPLACE_SUB,
            resizer: this,
            restrict: this.restrict
        })
    }

    FixedResizer.prototype.saveAttr = function(column) {
        if (column === this.ctrl.columns[0]) {
            return 'auto'
        } else {
            return column.getWidth()
        }
    };

    // Return constructor
    return FixedResizer;

}]);

angular.module("ngTableResize").factory("OverflowResizer", ["ResizerModel", function(ResizerModel) {

    function OverflowResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)
        this.strictSaving = false
    }

    // Inherit by prototypal inheritance
    OverflowResizer.prototype = Object.create(ResizerModel.prototype);

    OverflowResizer.prototype.newColumnWidth = function(column) {
        return 150
    }

    OverflowResizer.prototype.setup = function() {
        // Allow overflow in this mode
        $(this.ctrl.container).css({
            overflow: 'auto'
        });
    };

    OverflowResizer.prototype.tearDown = function() {
        $(this.ctrl.table).width('');
    }

    OverflowResizer.prototype.onTableReady = function() {
        // For mode overflow, make table as small as possible
        $(this.ctrl.table).width(1);
    };

    // Return constructor
    return OverflowResizer;

}]);
