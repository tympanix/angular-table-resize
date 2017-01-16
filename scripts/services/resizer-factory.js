angular.module("ngTableResize").factory("ResizerModel", [function() {

    function ResizerModel(rzctrl){
        this.minWidth = 50;
        this.ctrl = rzctrl
    }

    ResizerModel.prototype.strictSaving = true

    ResizerModel.prototype.setup = function() {
        // Hide overflow by default
        $(this.ctrl.container).css({
            overflowX: 'hidden'
        })
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

    ResizerModel.prototype.ctrlColumns = function () {
        // By default all columns assigned a handle are resized
        return true
    };

    ResizerModel.prototype.onFirstDrag = function () {
        console.log("First drag", this.ctrl.columns);
        // By default, set all columns to absolute widths
        this.ctrl.columns.forEach(function(column) {
            column.setWidth(column.getWidth());
        })
    };

    ResizerModel.prototype.handleMiddleware = function (column, columns) {
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
        return column.getWidth()
    };

    return ResizerModel;
}]);
