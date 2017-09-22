
var HTMLLink;
var isNetFront = (navigator.userAgent.indexOf('NetFront') !== -1)

function init() {

	var divs = document.getElementsByTagName('div');
	var testHTMLText = document.createTextNode('This is the test HTML:');
	for (var i=0;i<divs.length;i++) {
		if (divs[i].className != 'testHTML') continue;
		divs[i].parentNode.insertBefore(testHTMLText,divs[i]);
		break;
	}
	
	var pres = document.getElementsByTagName('pre');
	for (var i=0;i<pres.length;i++) {
		if (pres[i].className != 'testScript') continue;
		pres[i].title = 'Click to execute';
		if (isNetFront) {
			var tmp = document.createElement('a');
			tmp.href = '#';
			tmp.innerHTML = pres[i].innerHTML;
			pres[i].innerHTML = '';
			pres[i].appendChild(tmp);
			tmp.onclick = executeTestScript;
		} else {
			pres[i].onclick = executeTestScript;
		}
	}
	
	createTestScriptTabs();
	if (self.initPage) {
		initPage();
	}
	if (location.hash) {
		openTab(location.hash);
	}
}

function executeTestScript() {
	try {
		eval(this.firstChild.nodeValue);
	}
	catch (e) {
		alert('Not supported by this browser');
	}
	return false;
}

function createTestScriptTabs() {
	var testStart = document.getElementById('testStart');
	if (!testStart) return;
	var currentNode = testStart.nextSibling;
	var x = [];
	while(currentNode.id != 'footer') {
		if (currentNode.nodeType == 1) 
			x.push(currentNode);
		currentNode = currentNode.nextSibling;
	}
	var currentDiv;
	var headerDiv = document.createElement('div');
	headerDiv.className = 'testHeaders';
	for (var i=0;i<x.length;i++) {
		if (x[i].nodeType == 3) continue;
		if (x[i].nodeName.toUpperCase() == 'H4') { // upperCase for Konqueror
			if (isNetFront) {
				var tmp = document.createElement('a');
				tmp.href = '#';
				tmp.innerHTML = x[i].innerHTML;
				x[i].innerHTML = '';
				x[i].appendChild(tmp);
				tmp.onclick = showTab;
			} else {
				x[i].onclick = showTab;
			}
			currentDiv = document.createElement('div');
			currentDiv.className = 'testDiv';
			currentDiv.style.display = 'none';
			document.body.insertBefore(currentDiv,document.getElementById('footer'));
			x[i].relatedElement = currentDiv;
			if (tmp) {
				tmp.relatedElement = currentDiv;
			}
			headerDiv.appendChild(x[i]);
		}
		else if (currentDiv) {
			currentDiv.appendChild(x[i]);
		}
	}
	var x = document.getElementById('testStart');
	x.parentNode.insertBefore(headerDiv,x.nextSibling);
}

var currentTab;

function showTab() {
	if (currentTab) {
		currentTab.id = '';
		currentTab.relatedElement.style.display = 'none';
	}
	this.relatedElement.style.display = 'block';
	this.id = 'active';
	currentTab = this;
	this.parentNode.appendChild(this);
	return false;
}

function openTab(hash) {
	if (navigator.vendor && navigator.vendor.indexOf('Apple') != -1) return;
	var hashText = strip(hash.substring(1));
	var headers = document.getElementsByTagName('h4');
	for (var i=0;i<headers.length;i++) {
		var headerText = strip(headers[i].firstChild.nodeValue);
		if (headerText == hashText) {
			headers[i].onclick();
			break;
		}
	}
}

function strip(string) {
	string = string.replace(/\(\)/g,'');
	string = string.replace(/\[\]/g,'');
	string = string.replace(/%23/g,'');
	string = string.replace(/ /g,'');
	return string;
}

if (window.widget) {
	window.alert = function (msg) {
		widget.showNotification(msg);
	}
}
