# xEvent v1.0.0
Cross browsing JavaScript event handler

## Q. Supports?
A. Support major web browsers and IE6-11

## Q. License?
A. Free to use.


## How to use?

1. include "xevent.js" or "xevent.min.js"

2. use xEvent object.

```javascript
  xEvent.on(window, 'click', function() {
    alert('Window clicked!');
  });
```

## Use like native with extend method

```javascript
  var someElem = xEvent.extend( document.getElementById('someElem') );
  
  // use like native dom api
  someElem.innerText = 'Hello!';
  
  // but you can use xEvent handlers with 'event' property
  someElem.event.on('click', function() {
    this.innerText = 'World!';
  });
```


## Methods
* xEvent.on(element, type, fn): Add event listener
* xEvent.off(element, type, fn): Remove event listener
* xEvent.fire(element, type, eventArg): Fire event
* xEvent.trigger(element, type, eventArg): same as xEvent.fire (alias).

