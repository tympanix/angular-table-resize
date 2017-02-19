angular.module("ngTableResize").factory("Displacer", [function() {

    function Displacer(config){
        this.column = config.column
        this.scope = angular.element(this.column).scope()
        this.orgWidth = null
        this.resizer = config.resizer
        this.calculate = config.calculate || Displacer.DISPLACE_ADD
        this.restrictFunc = config.restrict || Displacer.RESTRICT
    }

    Displacer.RESTRICT = function(newWidth) {
        return newWidth < 50
    }

    Displacer.DISPLACE_ADD = function(orgWidth, diffX) {
        return orgWidth + diffX
    }

    Displacer.DISPLACE_SUB = function(orgWidth, diffX) {
        return orgWidth - diffX
    }

    Displacer.prototype.restrict = function(newWidth) {
        if (this.resizer) {
            return this.restrictFunc.call(this.resizer, newWidth)
        } else {
            return this.restrictFunc(newWidth)
        }
    }

    Displacer.prototype.isValid = function() {
        return !!this.column && !!this.scope
    };

    Displacer.prototype.freeze = function() {
        this.orgWidth = this.scope.getWidth()
    }

    Displacer.prototype.prepare = function(diffX) {
        this.newWidth = this.calculate(this.orgWidth, diffX)
    }

    Displacer.prototype.allowed = function() {
        return !this.restrict(this.newWidth)
    }

    Displacer.prototype.commit = function() {
        this.scope.setWidth(this.newWidth)
    }

    Displacer.prototype.displace = function(diffX) {
        // Calculate new width of column
        var newWidth = this.calculate(this.orgWidth, diffX);

        // Use restric function to obey potential restriction
        if (this.restrict(newWidth)) return;

        // Set the new size of the column
        this.scope.setWidth(newWidth);
    }

    return Displacer;
}]);
