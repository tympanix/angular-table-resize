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
