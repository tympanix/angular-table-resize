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
});
