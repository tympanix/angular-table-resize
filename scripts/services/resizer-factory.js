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
