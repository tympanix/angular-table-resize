# angular-table-resize
An AngularJS module for resizing table columns!

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
The resize mode kan be set to any of theese modes. Chose the one that works best for you.

| Resize Mode       | Description          |
| :---------------- |:--------------|
| BasicResizer      | Only the two adjecent cell are resized when dragging a handler. Cell widths are always in percentage          |
| FixedResizer      | First columns is width auto. Subsequent column sizes are never changed after resizing                         |
| OverflowResizer   | Table may expand out of its container, adding scrollbars. Columns are always the same size after resizing     |

N.B. You can implement your own resizer model to use with the module. Instructions comming soon.


