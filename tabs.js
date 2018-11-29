function Tabs(o) {
	// Options
	this.attr = (o && o.attr) ? o.attr : "data-tabs";
	this.name = (o && o.name) ? o.name : null;
	this.btn_active = (o && o.btn_active) ? o.btn_active : "active";
	this.tab_active = (o && o.btn_active) ? o.tab_active : "active";
	this.tab_hidden = (o && o.tab_hidden) ? o.tab_hidden : "";
	this.anchor_sep = (o && o.anchor_sep) ? o.anchor_sep : ":";
	// Elements
	this.tabs = {};
	this.curr = null;
	// Initialize
	this.init();
}

Tabs.prototype.init = function() {
	var tnav = this.find_nav(this.attr, this.name);
	if (tnav === null) { return; }
	
	var btns = tnav.children;
	if (btns.length == 0) { return; }
	
	var anchors = this.anchors(this.anchor());
	
	var len = btns.length;
	for (var i = 0; i < len; ++i) {
		var a = btns[i].getElementsByTagName("a")[0];
		if (!a) { continue; }
		
		var href = a.getAttribute("href");
		if (!href) { continue; }

		var anchor = this.anchor(href);
		if (!anchor) { continue; }
			
		var clickHandler = this.goto.bind(this);
		btns[i].onclick = function(e) { clickHandler(e); }
		
		var tab = document.getElementById(anchor);
		this.tabs[anchor] = {"btn": btns[i], "tab": tab};
		
		// If the URL anchor contains this tab, make it the current one;
		// otherwise, we select the first tab we're iterating over.
		if (anchors.indexOf(anchor) !== -1 || this.curr === null) {
			this.curr = anchor;
		}
	}
	
	this.hide_all();
	this.show(this.tabs[this.curr], null);
	tnav.setAttribute(this.attr + "-set", "");
};

Tabs.prototype.find_nav = function(attr, name) {
	var query = name ? "["+attr+"="+name+"]" : "["+attr+"='']";
	var tnavs = document.querySelectorAll(query);
	if (tnavs.length == 0) { return null; }
	
	var len = tnavs.length;
	for (var i = 0; i < len; ++i) {
		if (tnavs[i].hasAttribute(this.attr + "-set")) {
			continue;
		}
		return tnavs[i];
	}
};

Tabs.prototype.goto = function(event) {
	// If no event is supplied, we can't do our job!
	if (!event) { return; }
	
	// Prevent browser from actually scrolling to the anchor
	event.preventDefault();
	
	// Extract the anchor
	var anchor = this.anchor(event.target.href);
	
	// Abort if the given tab is already the active tab
	if (anchor === this.curr) { return;	}
	
	// Abort if the given tab is not known to this tabset
	var tab_next = this.tabs[anchor];
	if (!tab_next) { return; }
	
	// Abort if there is no currently active tab
	var tab_curr = this.tabs[this.curr];
	if (!tab_curr) { return; }
	
	this.show(tab_next);
	this.hide(tab_curr);
	this.update_anchor(anchor);
};

Tabs.prototype.update_anchor = function(next) {
	var anchors = this.anchors(this.anchor());
	var idx = anchors.indexOf(this.curr);
	
	// Current tab id is not in URL anchors yet
	if (idx === -1) {
		anchors.push(next);
	}
	// Overwrite current anchor in URL with new one
	else {
		anchors[idx] = next;
	}
	
	// Build the updated URL anchor string
	var anchor_str = "#" + anchors.join(this.anchor_sep);
	
	// Replace URL anchor string with the updated one
	history.replaceState(undefined, undefined, anchor_str);
	
	// Update internal state
	this.curr = next;
};

Tabs.prototype.show = function(tab) {
	if (this.btn_active) {
		tab.btn.classList.add(this.btn_active);
	}
	if (this.tab_active) {
		tab.tab.classList.add(this.tab_active);
	}
	if (this.tab_hidden) {
		tab.tab.classList.remove(this.tab_hidden);
	}
};

Tabs.prototype.hide = function(tab) {
	if (this.btn_active) {
		tab.btn.classList.remove(this.btn_active);
	}
	if (this.tab_active) {
		tab.tab.classList.remove(this.tab_active);
	}
	if (this.tab_hidden) {
		tab.tab.classList.add(this.tab_hidden);
	}
};

Tabs.prototype.hide_all = function() {
	for (var key in this.tabs) {
		if (this.tabs.hasOwnProperty(key)) {
			this.hide(this.tabs[key]);
		}
	}
}

Tabs.prototype.anchor = function(str) {
	var url = (str) ? str.split("#") : document.URL.split("#");
	return (url.length > 1) ? url[1] : "";
};

Tabs.prototype.anchors = function(anchor) {
	return (anchor) ? anchor.split(this.anchor_sep) : [];
};

function initTabs(attr) {
	attr = (attr === undefined) ? "data-tabs" : attr;
	var tabnavs = document.querySelectorAll("["+attr+"]");
	var len = tabnavs.length;
	for (var i = 0; i < len; ++i) {
		new Tabs({"name":tabnavs[i].getAttribute(attr), "attr": attr});
	}
}
