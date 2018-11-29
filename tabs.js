/*
 * Helps turn regular anchor links and their referenced elements into 
 * tabs. This is achieved by adding appropriate click handlers to the 
 * tab buttons and by setting/removing appropriate CSS classes to the 
 * tab buttons and tab content elements. To achieve the typical tab 
 * look and feel, you will have to apply some corresponding CSS rules.
 * 
 * Takes an optional object with the following possible options:
 * - `attr`: The HTML attribute used to tag the tab navigation element
 * - `name`: The value of the `attr` attribute to look for
 * - `btn_active`: The CSS class for active tab buttons
 * - `tab_active`: The CSS class for active tab content elements
 * - `tab_hidden`: The CSS class for hidden tab content elements
 * - `anchor_sep`: The separator character used for multiple URL anchors
 */
function Tabs(o) {
	// Set options from provided object or use defaults instead
	this.attr = (o && o.attr) ? o.attr : "data-tabs";
	this.name = (o && o.name) ? o.name : null;
	this.btn_active = (o && o.btn_active) ? o.btn_active : "active";
	this.tab_active = (o && o.btn_active) ? o.tab_active : "active";
	this.tab_hidden = (o && o.tab_hidden) ? o.tab_hidden : "";
	this.anchor_sep = (o && o.anchor_sep) ? o.anchor_sep[0] : ":";
	// Declare the member variables that will hold our state
	this.tabs = {};
	this.curr = null;
	// Initialize our state
	this.init();
}

/*
 * Tries to find a tab navigation that matches the `attr` and `name` 
 * options given (or using the defaults), then find the tab buttons 
 * within it, then populates the `this.tabs` object accordingly.
 * If all required elements could be found, it will hide all but one 
 * tab (either the one specified in the URL anchor, or the first one).
 */
Tabs.prototype.init = function() {
	// Find the tab navigation based on `attr` and `name`
	var tnav = this.find_nav(this.attr, this.name);
	if (tnav === null) { return; }
	
	// Get the tab navigation buttons
	var btns = tnav.children;
	if (btns.length == 0) { return; }
	
	// Get the current URL anchors as array
	var anchors = this.anchors(this.anchor());
	
	// Loop over all tab buttons we've found
	var len = btns.length;
	for (var i = 0; i < len; ++i) {
		// Get the button's <a> Element (required)
		var a = btns[i].getElementsByTagName("a")[0];
		if (!a) { continue; }
		// Get the button's <a> Element's 'href' attribute (required)
		var href = a.getAttribute("href");
		if (!href) { continue; }
		// Extract the anchor string from the `href` (remove the #)
		var anchor = this.anchor(href);
		if (!anchor) { continue; }
		// Bind our tab button click handler to the button
		var clickHandler = this.goto.bind(this);
		btns[i].onclick = function(e) { clickHandler(e); };
		// Find the tab content element corresponding to this button
		var tab = document.getElementById(anchor);
		// Add this tab button and tab content to our state (this.tabs)
		this.tabs[anchor] = {"btn": btns[i], "tab": tab};
		// Mark this tab button as active (this.curr), if appropriate
		if (anchors.indexOf(anchor) !== -1 || this.curr === null) {
			this.curr = anchor;
		}
	}
	
	// Hide/deactive all tabs first
	this.hide_all();
	// Now show only the current tab
	this.show(this.tabs[this.curr], null);
	// Mark this set of tabs as successfully processed ('set')
	tnav.setAttribute(this.attr +"-set", "");
};

/*
 * Tries to find the DOM element that matches the given attribute `attr` 
 * and value `name`. If no name is given, goes through all elements with 
 * the given attribute and returns the first one that has not already 
 * been processed by another Tab instance. Returns null if no matching 
 * element was found or all found elements are already processed.
 */
Tabs.prototype.find_nav = function(attr, name) {
	// Formulate the appropriate CSS selector
	var query = name ? "["+ attr +"="+ name +"]" : "["+ attr +"='']";
	// Find all elements that match our CSS selector
	var tnavs = document.querySelectorAll(query);
	// If we couldn't find any matching elements, return null
	if (tnavs.length == 0) {return null; }
	// Iterate over all elements that match our query
	var len = tnavs.length;
	for (var i = 0; i < len; ++i) {
		// Skip this tab set if it is already processed, 
		if (tnavs[i].hasAttribute(this.attr +"-set")) {
			continue;
		}
		// We found a matching element that has not been processed yet
		return tnavs[i];
	}
	// Nothing found, return null
	return null;
};

/*
 * Button handler that will switch from the active to the clicked tab,
 * given that there is already a tab active (this.curr) and the clicked 
 * element has an anchor that corresponds with a tab in our tab set.
 */
Tabs.prototype.goto = function(event) {
	// If no event is supplied, we can't do our job!
	if (!event) { return; }
	// Prevent browser from actually scrolling to the anchor
	event.preventDefault();
	// If the button doesn't have a 'href' attribute', we can't continue
	if (!event.target.href) { return; }
	// Extract the anchor from the button's 'href' attribtue (remove #)
	var anchor = this.anchor(event.target.href);
	// Abort if the given tab is already the active tab
	if (anchor === this.curr) { return;	}
	// Abort if the given tab is not known to this tabset
	var tab_next = this.tabs[anchor];
	if (!tab_next) { return; }
	// Abort if there is no currently active tab (init() failed?)
	var tab_curr = this.tabs[this.curr];
	if (!tab_curr) { return; }
	// Show the tab that corresponds with the clicked tab button
	this.show(tab_next);
	// Hide the previously active tab
	this.hide(tab_curr);
	// Update the URL anchor and our internal state accordingly
	this.update_anchor(anchor);
};

/*
 * Updates the current (this.curr) tab ID with the one provided in next.
 * Removes the current ID from the URL anchor and replaces it with the 
 * new one, then updates the internal state (this.curr) as well.
 */
Tabs.prototype.update_anchor = function(next) {
	// Get an array with all URL anchors
	var anchors = this.anchors(this.anchor());
	// See if the previously active tab is in the URL anchors
	var idx = anchors.indexOf(this.curr);
	// Previous tab id is not in URL anchors yet...
	if (idx === -1) {
		// ...so we just add the new active tab's anchor/id
		anchors.push(next);
	}
	// Previous tab id is in the URL anchors...
	else {
		// ...so we overwrite it with the new active tab's anchor/id
		anchors[idx] = next;
	}
	// Build the updated URL anchor string
	var anchor_str = "#" + anchors.join(this.anchor_sep);
	// Replace the URL anchor string with the updated one
	history.replaceState(undefined, undefined, anchor_str);	
	// Update the internal state
	this.curr = next;
};

/*
 * Show/activate the given tab.
 * tab should be an object with two DOM elements, "tab" and "btn",
 * which hold the tab conent and tab button respectively.
 */
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

/*
 * Hide/deactivate the given tab.
 * tab should be an object with two DOM elements, "tab" and "btn",
 * which hold the tab conent and tab button respectively.
 */
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

/*
 * Hides/deactivates all tabs of this tab set.
 */
Tabs.prototype.hide_all = function() {
	for (var key in this.tabs) {
		if (this.tabs.hasOwnProperty(key)) {
			this.hide(this.tabs[key]);
		}
	}
};

/*
 * Extract the anchor from the current URL or, if set, the given string.
 * If the string doesn't contain an anchor, an empty string is returned.
 * Example: "http://example.com#chapter-1" will return "chapter-1".
 */
Tabs.prototype.anchor = function(str) {
	var url = (str) ? str.split("#") : document.URL.split("#");
	return (url.length > 1) ? url[1] : "";
};

/*
 * Separates the given anchor string on the anchor separator.
 * If the input string is empty, an empty array is returned.
 * Example: "#hello:world" will return ["hello", "world"].
 */
Tabs.prototype.anchors = function(anchor) {
	return (anchor) ? anchor.split(this.anchor_sep) : [];
};

/*
 * Convenience function for initializing all tab sets on a given page.
 * If you don't need this or its name conflicts with another function,
 * feel free to remove this. Note, however, that you might then have to 
 * implement some similar functionality yourself.
 */
function initTabs(attr) {
	attr = (attr === undefined) ? "data-tabs" : attr;
	var tabnavs = document.querySelectorAll("["+attr+"]");
	var len = tabnavs.length;
	for (var i = 0; i < len; ++i) {
		new Tabs({"name":tabnavs[i].getAttribute(attr), "attr": attr});
	}
}
