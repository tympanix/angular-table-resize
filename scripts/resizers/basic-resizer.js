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
