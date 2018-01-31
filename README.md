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

## Quick Setup
#### Link style sheets
```html
<link rel="stylesheet" href="angular-table-resize.css">
```

#### Import dependencies
```html
<script src="jquery.js"></script>
<script src="angular.js"></script>
```

#### Import the module
```html
<script src="angular-table-resize.js"></script>
```

#### Install the module
Add the module to your application
```javascript
angular.module('myApplication', ['rzTable']);
```

On a HTML table tag put the `rz-table` directive
```html
<table rz-table>...</table>
```

That wasn't so hard was it now?

## Attributes
* #### `rz-mode`
  Changes the resizing mode of the module (see [resizing modes](#resizing-modes)). Two-way-binding to a string, that is the name of the resizer you want to use.
  
* #### `rz-save`
  Two-way-binding to boolean variable. Whether or not to save the column sizes in local storage (see [local storage](#local-storage)). Default is `true`.
  
* #### `rz-options`
  Two-way-binding to an object literal with optional/additional options (see [options](#options))
  
* #### `rz-model`
  Two-way-binding to a variable on the controller scope. The variable will be overwritten with an object literal, where you can access utility functions (see [utilities](#utilities)).
  
* #### `rz-profile`
  Two-way-binding to a string which is a unique identifier for the currently active profile. Default is the default profile (the empty string).
  
* #### `rz-container`
  A string which is the query selector for the container of the table. Default is the parent element of the table.
  
## Local Storage
The module automatically saves the current column widths to *localStorage*. This however requires that you supply your `<table/>` an *id* and all of your table headers (`<th/>`) with an *id* as well. Otherwise you should disable `rz-save`. If your are generating your columns dynamically (e.g. using `ng-repeat`) you should instead of using *id* for your table headers (`<th/>`) use the `rz-col` directive.

## Resizing Modes
The resize mode can be set to any of the following modes. You may also chose to allow the enduser to chose from the below by binding [`rz-mode`](#rz-mode) to a scope variable. Choose the one that works best for you in practice.

| Resize Mode       | Description          |
| :---------------- |:--------------|
| BasicResizer      | Only the two adjecent cell are resized when dragging a handler. Cell widths are always in percentage          |
| FixedResizer      | First columns is width auto. Subsequent column sizes are never changed after resizing                         |
| OverflowResizer   | Table may expand out of its container, adding scrollbars. Columns are always the same size after resizing     |

## Utilities  
* #### `reset()`
  Resets the currently active resizing profile and deletes it from local storage. Column sizes will be reset to default.
  
* #### `clearStorage()`
  Clears all profiles saved in local storage - but does not change/reset the current column widths. You may optionally call `reset()` afterwards if you wish to do so.
  
* #### `clearStorageActive()`
  Clears the currently active profile from local storage - but does not change/reset the current column widths. Use `reset()` instead if you want to do so.

* #### `update()`
  Re-initializes the module. Be aware that the module will update itself automatically when you change any of the [attributes](#attributes) of the module. You should have a good reason to use this function.

## Options
You may supply optional/additional options to the module for your personalization:

* #### `onResizeStarted`: *`function(column)`*
  Callbacks functio. Called when a column has been started resizing
  
* #### `onResizeEnded`: *`function(column)`*
  Callback function. Called when resizing a column has ended
  
* #### `onResizeInProgress`: *`function(column, newWidth, diffX)`*
  Callback function. Called for every tick in the resizing process.
  
* #### `tableClass`: *`string`*
  The class appended to the table for styling purposes. Default is `rz-table`.
  
* #### `handleClass`: *`string`*
  The class appended to handles for styling purposes. Default is `rz-handle`

* #### `handleClassActive`: *`string`*
  The class appended to the handle, when a column is being resized. Default is `rz-handle-active`.
