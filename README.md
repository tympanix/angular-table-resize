# angular-table-resize
An AngularJS module for resizing table columns!

## Demo
You can try out a demo by [clicking here](https://tympanix.github.io/angular-table-resize/). You can also use the demo as an example for implementing the module on your own page. The source can be found in the [gh-pages branch](https://github.com/Tympanix/angular-table-resize/tree/gh-pages)

## Installation
#### Bower
```
bower install angular-table-resize
```
#### NPM
```
npm install angular-table-resize
```

## Setup
#### Link style sheets
```html
<link rel="stylesheet" href="/angular-table-resize.min.css">
```

#### Import dependencies
```html
<script src="/jquery/dist/jquery.min.js"></script>
<script src="/angular/angular.js"></script>
```

#### Import the Angular module
```html
<script src="/angular-table-resize.min.js"></script>
```

## Use
Make sure your app imports the module
```javascript
angular.module('myApplication', ['ngTableResize']);
```

On a HTML table tag put the **resizeable** directive
```html
<table resizeable mode="resizeMode" id="myTable">
    ...
</table>
```
The attribute **mode** references a variable on the controller, specifying the current resizing mode.
In the example above this variable could be
```javascript
$scope.resizeMode = "BasicResizer"
```

#### Saving column sizes
The module automatically saves the current column width to *localStorage*. This however requires that you supply your **\<table\>** with an *id* and all of your table headers **\<th\>** with and *id* as well.

#### Resizing Modes
The resize mode can be set to any of these modes. Choose the one that works best for you.

| Resize Mode       | Description          |
| :---------------- |:--------------|
| BasicResizer      | Only the two adjecent cell are resized when dragging a handler. Cell widths are always in percentage          |
| FixedResizer      | First columns is width auto. Subsequent column sizes are never changed after resizing                         |
| OverflowResizer   | Table may expand out of its container, adding scrollbars. Columns are always the same size after resizing     |

N.B. You can implement your own resizer model to use with the module. Instructions coming soon.


