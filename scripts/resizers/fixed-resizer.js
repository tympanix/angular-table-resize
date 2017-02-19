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
