angular.module("ngTableResize").factory("OverflowResizer", ["ResizerModel", function(ResizerModel) {

    function OverflowResizer(table, columns, container) {
        // Call super constructor
        ResizerModel.call(this, table, columns, container)
    }

    ResizerModel.prototype.strictSaving = false

    // Inherit by prototypal inheritance
    OverflowResizer.prototype = Object.create(ResizerModel.prototype);

    ResizerModel.prototype.newColumnWidth = function(column) {
        return 150
    }

    OverflowResizer.prototype.setup = function() {
        console.log("Overflow setup");
        // Allow overflow in this mode
        $(this.ctrl.container).css({
            overflow: 'auto'
        });
    };

    OverflowResizer.prototype.onTableReady = function() {
        console.log("Overflow table ready");
        // For mode overflow, make table as small as possible
        $(this.ctrl.table).width(1);
    };

    // Return constructor
    return OverflowResizer;

}]);
