describe('ngTableResize', function() {

    beforeEach(module('ngTableResize'));

    describe('basic resizer', function() {

        var element;
        var outerScope;
        var innerScope;

        beforeEach(inject(function($rootScope, $compile) {
            outerScope = $rootScope;

            element = angular.element(
                '<table resizeable mode="\'BasicResizer\'" id="myTable">' +
                '<thead>' +
                '<th></th>' +
                '<th></th>' +
                '<th></th>' +
                '</thead>' +
                '</table>');

            $compile(element)(outerScope);

            innerScope = element.isolateScope();

            $rootScope.$digest();
        }));

        it('should have handles in all but the last column', function() {
            var columns = element.find('th');
            var last = columns[columns.length - 1];

            columns.each(function(index, column) {
                var handle = $(column).find('div');
                if (column !== last) {
                    expect(handle.length).to.equal(1)
                    expect(handle.attr('class')).to.equal('handle');
                } else {
                    expect(handle.length).to.equal(0)
                }
            })

        })
    })

    describe('fixed resizer', function() {

        var element;
        var outerScope;
        var innerScope;

        beforeEach(inject(function($rootScope, $compile) {
            outerScope = $rootScope;

            element = angular.element(
                '<table resizeable mode="\'FixedResizer\'" id="myTable">' +
                '<thead>' +
                '<th></th>' +
                '<th></th>' +
                '<th></th>' +
                '</thead>' +
                '</table>');

            $compile(element)(outerScope);

            innerScope = element.isolateScope();

            $rootScope.$digest();
        }));

        it('should have handles in all but the first column', function() {
            var columns = element.find('th');
            var first = columns[0];
            console.log(columns);

            for (var i = 0; i < columns.length; i++){
                console.log(columns[i]);
            }

            columns.each(function(index, column) {
                var handle = $(column).find('div');
                if (column !== first) {
                    expect(handle.length).to.equal(1)
                    expect(handle.attr('class')).to.equal('handle');
                } else {
                    expect(handle.length).to.equal(0)
                }
            })
        });

    })

})