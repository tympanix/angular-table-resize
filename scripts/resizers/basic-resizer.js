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
