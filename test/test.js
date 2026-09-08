describe('rzTable', function() {
    beforeEach(module('rzTable'));

    function compileTable(mode, $rootScope, $compile, options) {
        var scope = $rootScope.$new();
        scope.mode = mode;
        scope.options = options;

        var element = angular.element(
            '<table rz-table rz-mode="mode" rz-options="options" id="myTable">' +
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

        it('uses an equal percentage for columns missing from the cache', inject(function($rootScope, $compile) {
            localStorage.setItem('ngColumnResize.myTable.BasicResizer', JSON.stringify({
                'col-1': '50%',
                'col-3': '25%'
            }));

            var table = compileTable('BasicResizer', $rootScope, $compile);
            var columns = table.find('th');

            expect(columns[0].style.width).to.equal('50%');
            expect(columns[1].style.width).to.equal('33.333333333333336%');
            expect(columns[2].style.width).to.equal('25%');

            localStorage.clear();
        }));
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

        it('uses 100 pixels for columns missing from the cache', inject(function($rootScope, $compile) {
            localStorage.setItem('ngColumnResize.myTable.FixedResizer', JSON.stringify({
                'col-3': 75
            }));

            var table = compileTable('FixedResizer', $rootScope, $compile);
            var columns = table.find('th');

            expect(columns.eq(1).css('width')).to.equal('100px');
            expect(columns.eq(2).css('width')).to.equal('75px');

            localStorage.clear();
        }));
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

        it('uses 100 pixels for columns missing from the cache', inject(function($rootScope, $compile) {
            var element = compileTable('OverflowResizer', $rootScope, $compile);
            var columns = element.find('th');

            expect(columns.eq(0).css('width')).to.equal('100px');
            expect(columns.eq(1).css('width')).to.equal('100px');
            expect(columns.eq(2).css('width')).to.equal('75px');
        }));

        it('allows the default and minimum widths to be overridden', inject(function($rootScope, $compile) {
            var element = compileTable('OverflowResizer', $rootScope, $compile, {
                defaultWidth: 140,
                minWidth: 40
            });
            var columns = element.find('th');
            var controller = element.controller('rzTable');

            expect(columns.eq(1).css('width')).to.equal('140px');
            expect(controller.resizer.getMinWidth(columns[1])).to.equal(40);
        }));
    });
});

describe('rzTable without Angular debug information', function() {
    beforeEach(module('rzTable', function($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
    }));

    afterEach(function() {
        localStorage.clear();
    });

    it('restores rz-col widths when a table is destroyed and recreated', inject(function($rootScope, $compile) {
        var scope = $rootScope.$new();
        scope.open = true;
        scope.mode = 'OverflowResizer';
        scope.columns = [
            { id: 'name', label: 'Name' },
            { id: 'size', label: 'Size' }
        ];

        var host = angular.element(
            '<div>' +
                '<table ng-if="open" rz-table rz-mode="mode" id="detailsTable">' +
                    '<thead><tr>' +
                        '<th ng-repeat="column in columns track by column.id" rz-col="column.id">{{ column.label }}</th>' +
                    '</tr></thead>' +
                '</table>' +
            '</div>'
        );

        $compile(host)(scope);
        scope.$digest();

        var table = host.find('table');
        var columns = table.find('th');
        columns.eq(0).css({ width: 180 });
        columns.eq(1).css({ width: 120 });
        table.controller('rzTable').saveColumnSizes();

        scope.open = false;
        scope.$digest();
        scope.open = true;
        scope.$digest();

        columns = host.find('table').find('th');
        expect(columns.eq(0).css('width')).to.equal('180px');
        expect(columns.eq(1).css('width')).to.equal('120px');
    }));
});
