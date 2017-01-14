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
        return column.next()
    }

    function interveneCalculator(orgWidth, diffX) {
        return orgWidth - diffX;
    }

    function interveneRestrict(newWidth){
        return newWidth < 25;
    }

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

    BasicResizer.prototype.handles = function() {
        // Mode fixed does not require handler on last column
        return $(this.columns).not(':last')
    };

    BasicResizer.prototype.onFirstDrag = function() {
        // Replace all column's width with absolute measurements
        this.ctrl.columns.forEach(function(column) {
            column.setWidth(column.getWidth());
        })
    };

    BasicResizer.prototype.onEndDrag = function () {
        console.log("Drag end!");
        // Calculates the percent width of each column
        console.log("Table", this.ctrl.table);
        var totWidth = $(this.ctrl.table).outerWidth();
        console.log("totwidth", totWidth);
        var totPercent = 0;

        console.log('Columns', this.ctrl.columns);

        this.ctrl.columns.forEach(function(column) {
            console.log('Column', $(column.element));
            var colWidth = $(column.element).outerWidth();
            console.log("Colwidth", colWidth);
            var percentWidth = colWidth / totWidth * 100 + '%';
            totPercent += (colWidth / totWidth * 100);
            console.log('Set column width', percentWidth);
            column.setWidth(percentWidth)
        })

    };

    BasicResizer.prototype.saveAttr = function (column) {
        return $(column)[0].style.width;
    };

    // Return constructor
    return BasicResizer;

}]);
