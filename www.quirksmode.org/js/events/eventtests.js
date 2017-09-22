
function init() {
	createLog();
	initControls();
	initElements();
	register.registerEvents();
	if (self.initPage)
		self.initPage();
	forbiddenElements = [$('controlForm'),$('logContainer')];

	function createLog() {
		var logContainer = document.createElement('div');
		var head = document.createElement('h4');
		head.innerHTML = 'Test results';
		logContainer.id = 'logContainer';
		var logEl = document.createElement('ol');
		logEl.id = 'log';
		var clearButton = document.createElement('button');
		clearButton.innerHTML = 'Clear log';
		clearButton.id = 'clear';
		clearButton.onclick = log.clear;
		logContainer.appendChild(head);
		logContainer.appendChild(logEl);
		logContainer.appendChild(clearButton);
		document.body.appendChild(logContainer);
		log.init();
	}

	function initControls() {
		if (!document.addEventListener) {
			remove($('addEventListenerCapture'));
			remove($('addEventListenerBubble'));
		}
		if (!document.attachEvent)
			remove($('attachEvent'));
		var opts = $('controlForm').elements['registration'];
		for (var i=0;i<opts.length;i++) {
			opts[i].onclick = register.registerEvents;	
		}
		$('showProperties').onclick = function () {
			var newValue = this.checked ? 'block' : 'none';
			$('propertyContainer').style.display = newValue;
		}
		$('preventDefault').onclick = function () {
			var newValue = this.checked ? 'enabled' : 'disabled';
			log.msg('Prevent default ' + newValue);
			log.end();
		}
		$('cancelBubble').onclick = function () {
			var newValue = this.checked ? 'enabled' : 'disabled';
			log.msg('Cancel bubble ' + newValue);
			log.end();
		}
		function remove(obj) {
			obj.parentNode.parentNode.removeChild(obj.parentNode);
		}
	}

	function initElements () {
		var activeElements = [window,document];
		var testEls = $('testElements').childNodes;
		for (var i=0;i<testEls.length;i++) {
			var el = testEls[i];
			if (el.nodeType != 1) continue;
			activeElements.push(el);
			if (el.nodeName == 'FORM') {
				var els = el.elements;
				for (var j=0;j<els.length;j++) {
					activeElements.push(els[j]);
				}
				var labels = el.getElementsByTagName('label');
				for (var j=0;j<labels.length;j++) {
					activeElements.push(labels[j]);
				}
			}
		}

		var wr = $('listTestElements');
		var counter = 0;
		for (var i=0;i<activeElements.length;i++) {
			var els = createCheckbox();
			els[0].element = activeElements[i];
			els[0].onclick = register.registerElement;
			els[1].innerHTML = getElementName(activeElements[i]);
		}
		wr = $('listTestEvents');
		for (var i=0;i<eventsToBeTested.length;i++) {
			var els = createCheckbox();
			els[0].onclick = register.registerEvent;
			els[0].data = els[1].innerHTML = eventsToBeTested[i];
		}

		function createCheckbox() {
			var box = document.createElement('input');
			box.type = 'checkbox';
			wr.appendChild(box);
			box.checked = 'true'; // append first! (IE7-)
			box.id = 'generated' + counter++;
			var label = document.createElement('label');
			label.setAttribute('for',box.id);
			label.setAttribute('htmlFor',box.id);
			wr.appendChild(label);
			wr.appendChild(document.createElement('br'));
			return [box,label];
		}
	}
}


var register = {
	elements: [],
	events: [],
	currentRegistrationMode: undefined,
	Traditional: function (flag) {
		var newValue = (flag) ? handleEvents : null;
		for (var i=0;i<this.elements.length;i++) {
			for (var j=0;j<this.events.length;j++) {
				this.elements[i]['on'+this.events[j]] = newValue;
			}
		}	
	},
	addEventListener: function (flag,bool) {
		var newMethod = (flag) ? 'addEventListener' : 'removeEventListener';	
		for (var i=0;i<this.elements.length;i++) {
			for (var j=0;j<this.events.length;j++) {
				this.elements[i][newMethod](this.events[j],handleEvents,bool);
			}
		}	
	},
	addEventListenerCapture: function (flag) {
		this.addEventListener(flag,true);
	},
	addEventListenerBubble: function (flag) {
		this.addEventListener(flag,false);
	},
	attachEvent: function (flag) {
		var newMethod = (flag) ? 'attachEvent' : 'detachEvent';	
		for (var i=0;i<this.elements.length;i++) {

			// complicated stuff to work around the this problem in IE

			if (!this.elements[i].handler) {
				var fnAsString = 'handleEvents(undefined,"' + getElementName(this.elements[i]) + '")';
				this.elements[i].handler = new Function(fnAsString);
			}
			
			for (var j=0;j<this.events.length;j++) {
				this.elements[i][newMethod]('on'+this.events[j],this.elements[i].handler);
			}
		}	
	},
	registerEvents: function() {		// may be called as event handler
		var opts = $('controlForm').elements['registration'];
		for (var i=0;i<opts.length;i++) {
			if (opts[i].checked) {
				register.registerAll(opts[i].id);
				break;
			}
		}
	},
	registerAll: function (newRegistration) {
		if (newRegistration == this.currentRegistrationMode) return;
		this.getAllElements();
		this.getAllEvents();
		if (this.currentRegistrationMode) {
			this[this.currentRegistrationMode](false);
			log.msg(this.currentRegistrationMode + ' off');
		}
		this[newRegistration](true);
		log.msg(newRegistration + ' on');
		log.end();
		this.clearData();
		this.currentRegistrationMode = newRegistration;
	},
	registerElement: function () { 		// called as event handler from 'Elements' checkboxes
		register.elements.push(this.element);
		register.getAllEvents();
		register[register.currentRegistrationMode](this.checked);
		var msg = 'Events on ' + getElementName(this.element);
		msg += (this.checked) ? ' added' : ' removed';
		log.msg(msg);
		log.end();
		register.clearData();
	},
	registerEvent: function () { 		// called as event handler from 'Events' checkboxes
		register.events.push(this.data);
		register.getAllElements();
		register[register.currentRegistrationMode](this.checked);
		var msg = (this.checked) ? 'added' : 'removed';
		log.msg(this.data + ' event ' + msg);
		log.end();
		register.clearData();
	},
	deregister: function () {
		this.getAllElements();
		this.getAllEvents();
		if (this.currentRegistrationMode)
			this[this.currentRegistrationMode](false);
		this.clearData();
		this.currentRegistrationMode = undefined;
	},
	getAllElements: function () {
		var els = $('listTestElements').getElementsByTagName('input');
		for (var i=0;i<els.length;i++) {
			if (els[i].checked)
				this.elements.push(els[i].element);
		}
	},
	getAllEvents: function () {
		var evts = $('listTestEvents').getElementsByTagName('input');
		for (var i=0;i<evts.length;i++) {
			if (evts[i].checked)
				this.events.push(evts[i].data);
		}	
	},
	clearData: function () {
		this.elements.length = this.events.length = 0;
	}
};

var wait;
var forbiddenElements; // set in init

function handleEvents(e,elName) {
	var evt = e || window.event;
	var tgt = evt.target || evt.srcElement;
	for (var i=0;i<forbiddenElements.length;i++) {
		if (forbiddenElements[i].contains(tgt)) {
			return;
		}
	}
	if (wait)
		clearTimeout(wait);
	handleEvents.properties = {};
	for (var i in evt) {
		handleEvents.properties[i] = evt[i];
	}
	var writestring = evt.type + ' on ';
	writestring += elName || getElementName(this);
	log.msg(writestring);
	wait = setTimeout(log.end,200);
	if ($('cancelBubble').checked) {
		if (evt.stopPropagation) {
			evt.stopPropagation()	// cause of capturing stop
		}
		evt.cancelBubble = true; 	// not supported in FF2
	}
	if ($('preventDefault').checked) {
		if (evt.preventDefault)		// necessary for addEventListener, works with traditional
			evt.preventDefault();
		evt.returnValue = false; 	// necessary for attachEvent, works with traditional
		return false; 			// works with traditional, not with attachEvent or addEventListener
	}
}

function getElementName(el) {
	var elName = el.type || el.nodeName || 'window';
	return elName.toLowerCase();
}

var log = {
	logEl: undefined,
	currentLI: undefined,
	init: function () {
		this.logEl = $('log');
	},
	msg: function (message) {
		if (!this.currentLI) {
			this.currentLI = document.createElement('li');
			this.logEl.appendChild(this.currentLI);
			if (this.logEl.getElementsByTagName('li').length % 2 == 0)
				this.currentLI.className = 'odd';
		}
		this.currentLI.innerHTML += message + '<br>';
	},
	end: function () {
		if (log.currentLI)
			log.currentLI.removeChild(log.currentLI.lastChild);
		log.currentLI = undefined;
		log.logEl.scrollTop = log.logEl.scrollHeight;
		if ($('showProperties').checked)
			showProperties();
	},
	clear: function clearLog() {
		while (log.logEl.firstChild)
			log.logEl.removeChild(log.logEl.firstChild);
	}
};



function showProperties() {
	var wr = $('properties');
	wr.innerHTML = '';
	var alphabetic = [];
	for (var i in handleEvents.properties) {
		if ($('hideConstants').checked && i == i.toUpperCase()) continue;
		if ($('hideValueless').checked && !handleEvents.properties[i]) continue;
		if ($('hideNative').checked && typeof handleEvents.properties[i] == 'function') continue
		alphabetic.push(i);	
	}
	
	alphabetic.sort();
	
	for (var j=0;j<alphabetic.length;j++) {	
		var i = alphabetic[j];
		var x = document.createElement('li');
		wr.appendChild(x);
		if (wr.getElementsByTagName('li').length % 2 == 0)
			x.className = 'odd';
		var printValue = handleEvents.properties[i];
		if (printValue && printValue.nodeName)
			printValue = getElementName(printValue);
		x.innerHTML = i + ': ' + printValue;
	}
}

// necessary for IE5.5
if (!document.nodeName)
	document.nodeName = '#document';

// necessary for Firefox	
if (window.Node && Node.prototype && !Node.prototype.contains) {
	Node.prototype.contains = function (arg) {
		return !!(this.compareDocumentPosition(arg) & 16)
	}
}
