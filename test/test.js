describe('rzTable', function() {
    beforeEach(module('rzTable'));

    function compileTable(mode, $rootScope, $compile) {
        var scope = $rootScope.$new();
        scope.mode = mode;

        var element = angular.element(
            '<table rz-table rz-mode="mode" id="myTable">' +
                '<thead>' +
                    '<tr>' +
                        '<th id="col-1">One</th>' +
                        '<th id="col-2">Two</th>' +
                        '<th id="col-3">Three</th>' +
                    '</tr>' +
                '</thead>' +
            '</table>'
        );

        $compile(element)(scope);
        scope.$digest();

        return element;
    }

    describe('BasicResizer', function() {
        var element;

        beforeEach(inject(function($rootScope, $compile) {
            element = compileTable('BasicResizer', $rootScope, $compile);
        }));

        it('adds handles to all but the last column', function() {
            var columns = element.find('th');
            var last = columns[columns.length - 1];

            columns.each(function(index, column) {
                var handle = $(column).find('div');

                if (column !== last) {
                    expect(handle.length).to.equal(1);
                    expect(handle.attr('class')).to.equal('rz-handle');
                } else {
                    expect(handle.length).to.equal(0);
                }
            });
        });
    });

    describe('FixedResizer', function() {
        var element;

        beforeEach(inject(function($rootScope, $compile) {
            element = compileTable('FixedResizer', $rootScope, $compile);
        }));

        it('adds handles to all but the last column', function() {
            var columns = element.find('th');
            var last = columns[columns.length - 1];

            columns.each(function(index, column) {
                var handle = $(column).find('div');

                if (column !== last) {
                    expect(handle.length).to.equal(1);
                    expect(handle.attr('class')).to.equal('rz-handle');
                } else {
                    expect(handle.length).to.equal(0);
                }
            });
        });
    });

    describe('OverflowResizer', function() {
        beforeEach(function() {
            localStorage.setItem('ngColumnResize.myTable.OverflowResizer', JSON.stringify({
                'col-1': 100,
                'col-3': 75
            }));
        });

        afterEach(function() {
            localStorage.clear();
        });

        it('uses the minimum width for columns missing from the cache', inject(function($rootScope, $compile) {
            var element = compileTable('OverflowResizer', $rootScope, $compile);
            var columns = element.find('th');

            expect(columns.eq(0).css('width')).to.equal('100px');
            expect(columns.eq(1).css('width')).to.equal('25px');
            expect(columns.eq(2).css('width')).to.equal('75px');
        }));
    });
});
