(function() {
	
	// Cache data API
	var cache =  {
		//properties
		data: {},
		uidCounter: 0,
		identifier: "cache_" + new Date().getTime(),
		//methods
		get: function(elem) {
			var uid = elem[this.identifier];
		
			if(!uid) {
				uid = elem[this.identifier] = this.uidCounter++;
				this.data[uid] = {};
			}
			
			return this.data[uid];
		},
		remove: function(elem) {
			var uid = elem[this.identifier];
		
			if(!uid) return;
			
			delete this.data[uid];
			
			try {
				delete elem[this.identifier];
			}
			catch(e) {
				if(elem.removeAttribute) {
					elem.removeAttribute(this.identifier);
				}
			};
		},
	};
	
	// _isEmpty: check object is empty
	function _isEmpty(object) {
		for(var prop in object) {
			return false;
		}
		
		return true;
	}
	
	// _clearEvent: clear all event listeners
	function _clearEvent(elem, type) {
		var data = cache.get(elem);
	
		if(data.handlers[type].length === 0) {
			delete data.handlers[type];
			
			if(document.removeEventListener) {
				elem.removeEventListener(type, data.dispatcher, false);
			}
			else if(document.detachEvent) {
				elem.detachEvent("on" + type, data.dispatcher);
			}
		}
		
		if(_isEmpty(data.handlers)) {
			delete data.handlers;
			delete data.dispatcher;
		}
		if(_isEmpty(data)) {
			cache.remove(elem);
		}
	}
	
	// _fixEvent: fix the event to make working on every browsers
	function _fixEvent (event) {
		function returnTrue() { return true; }
		function returnFalse() { return false; }
		
		if(!event || !event.stopPropagation) {
			var old = event || window.event;
			
			//copy the original
			event = {};
			
			for(var prop in old) {
				event[prop] = old[prop];
			}
			
			//set the target
			if(!event.target) {
				event.target = event.srcElement || document;
			}
			
			//set related target
			event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
			
			//prevent default
			event.preventDefault = function() {
				event.returnValue = false;
				event.isDefaultPrevented = returnTrue;
			};
			
			event.isDefaultPrevented = returnFalse;
			
			//stop bubbling
			event.stopPropagation = function() {
				event.cancelBubble = true;
				event.isPropagationStopped = returnTrue;
			};
			
			//stop bubbling and other event handlers
			event.stopImmediatePropagation = function() {
				this.isImmediatePropagationStopped = returnTrue;
				this.stopPropagation();
			};
			
			event.isImmediatePropagationStopped = returnFalse;
			
			
			//process mounse positions
			if(event.clientX != null) {
			
				var doc = document.documentElement;
				var body = document.body;
				
				event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
											(doc && doc.clientLeft || body && body.clientLeft || 0);
				
				event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) -
											(doc && doc.clientTop || body && body.clientTop || 0);
			
			}
			
			//key inputs
			event.which = event.charCode || event.keyCode;
			
			//update mouse click information
			//0: left, 1: middle, 2: right
			if(event.button != null) {
				event.button = (event.button & 1 ? 0 :
							(event.button & 4 ? 1 :
							(event.button & 2 ? 2 : 0)));
			}
		}
		
		return event;
	}
	
	
	
	window.xEvent = {
		on: null,
		off: null,
		fire: function(elem, event) {
			var elemData = cache.get(elem);
			var parent = elem.parentNode || elem.ownerDocument;	//bubbling support, get reference for parent node.
			
			//if event name is string, create new event object
			if(typeof event === 'string') {
				event = {
					type: event,
					target: elem,
				};
			}
			
			event = _fixEvent(event);	//fix the event
			
			if(elemData.dispatcher) {	//if passed element is dispatcher, execute it.
				elemData.dispatcher.call(elem, event);
			}
			
			//recursive call
			if(parent && !event.stopPropagation()) {
				this.fire(parent, event);
			}
			//top level of dom, but default action is not prevented
			else if(!parent && !event.isDefaultPrevented()) {
				var targetData = cache.get(event.target);
				
				if(event.target[event.type]) {
					
					targetData.disabled = true;	//dispatcher already executed, so disable temporarily
					event.target[event.type]();
					
					targetData.disabled = true;	//enable back
				}
			}
		},
		extend: function(elem) {
			function addXEvent(elem) {
				elem.event = {
					on: function(name, fn) {
						xEvent.on(elem, name, fn);
					},
					off: function(name, fn) {
						xEvent.off(elem, name, fn);
					},
					fire: function(name, e) {
						xEvent.fire(elem, name, e);
					},
					trigger: function(name, e) {
						xEvent.trigger(elem, name, e);
					}
				};	
			}
			
			// is node list?
			if(elem.length) {
				for(var i = 0, len = elem.length; i < len; i++) {
					addXEvent(elem[i]);
				}
			}
			else {
				addXEvent(elem);
			}
			
			return elem;
		},
	};
	
	// set alias
	xEvent.trigger = xEvent.fire;
	
	xEvent.on = function(elem, type, fn) {
		var data = cache.get(elem);
			
		if(!data.handlers)
			data.handlers = {};
		
		if(!data.handlers[type])
			data.handlers[type] = [];
			
		data.handlers[type].push(fn);
		
		if(!data.dispatcher) {
			data.disabled = false;
			data.dispatcher = function(event) {
				if(data.disabled) return;
				
				event = _fixEvent(event);
				
				var handlers = data.handlers[event.type];
				
				if(handlers) {
					for(var i = 0, len = handlers.length; i < len; i++) {
						handlers[i].call(elem, event);
					}
				}
			};
		}
		
		if(data.handlers[type].length === 1) {
			
			//W3C DOM Event API
			if(document.addEventListener) {
				elem.addEventListener(type, data.dispatcher, false);
			}
			//Old IE Event API
			else {
				elem.attachEvent("on" + type, data.dispatcher);
			}
		}
		
		return this;
	};

	xEvent.off = function(elem, type, fn) {
		var data = cache.get(elem);
		
		if(!data.handlers) return;
		
		var _removeType = function(t) {
			data.handlers[t] = [];
			_clearEvent(elem, t);
		};
		
		//if type is specified, remove all specified event listeners and finish.
		if(!type) {
			for(var t in data.handlers) _removeType(t);
			return;
		}
		
		//if type is not specified, remove all handlers
		var handlers = data.handlers[type];
		if(!handlers) return;
		
		if(!fn) {
			_removeType(type);
			return;
		}
		
		if(fn.guid) {
			for(var i = 0, len = handlers.length; i < len; i++) {
				if(handlers[i].guid === fn.guid) {
					handlers.splice(i--, 1);
				}
			}
		}
		
		_clearEvent(elem, type);
		return this;
	};
	
})();