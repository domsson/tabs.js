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
 * - `btn_attr`: The HTML attribute of the tab button elements
 * - `btn_active`: The CSS class for active tab buttons
 * - `tab_active`: The CSS class for active tab content elements
 * - `tab_hidden`: The CSS class for hidden tab content elements
 * - `set_hidden`: Shall the hidden attribute be set for hidden tabs?
 * - `frag_sep`: The separator character used for multiple URL anchors
 */
function Tabs(o) {
	// Set options from provided object or use defaults instead
	this.attr = (o && o.attr) ? o.attr : "data-tabs";
	this.name = (o && o.name) ? o.name : null;
	this.btn_attr = (o && o.btn_attr) ? o.btn_attr : null;
	this.btn_active = (o && o.btn_active) ? o.btn_active : "active";
	this.tab_active = (o && o.btn_active) ? o.tab_active : "active";
	this.tab_hidden = (o && o.tab_hidden) ? o.tab_hidden : "";
	this.set_hidden = (o && o.set_hidden) ? o.set_hidden : true;
	this.frag_sep = (o && o.frag_sep) ? o.frag_sep[0] : ":";
	// Declare the member variables that will hold our state
	this.tabs = {};
	this.curr = null;
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
	var btns = this.find_btns(tnav, this.btn_attr);
	// Get the current URL anchors as array
	var frags = this.frags(this.frag());
	// Loop over all tab buttons we've found
	var num_btns = btns.length;
	for (var i=0; i<num_btns; ++i) {
		// Get the button's 'href' attribute (required)
		var href = this.href(btns[i], this.btn_attr);
		if (!href) { continue; }
		// Extract the anchor string from the `href` (remove the #)
		var frag = this.frag(href);
		if (!frag) { continue; }
		// Bind our tab button click handler to the button
		var click_handler = this.goto.bind(this);
		btns[i].addEventListener("click", click_handler, false);
		// Find the tab content element corresponding to this button
		var tab = document.getElementById(frag);
		// Add this tab button and tab content to our state (this.tabs)
		this.tabs[frag] = { "btn": btns[i], "tab": tab };
		// Mark this tab button as active (this.curr), if appropriate
		if (frags.indexOf(frag) !== -1 || this.curr === null) {
			this.curr = frag;
		}
	}
	// No relevant buttons identified, aborting
	if (this.tabs.length == 0) { return; }
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
	// Iterate over all elements that match our query
	var len = tnavs.length;
	for (var i=0; i<len; ++i) {
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
 * If btn_attr is given, all children of tnav that have this attribute 
 * will be returned, otherwise _all_ children of tnav will be returned.
 */
Tabs.prototype.find_btns = function(tnav, btn_attr) {
	// Get all of tnav's children or those with the given btn_attr set
	return btn_attr ? 
		tnav.querySelectorAll("["+ btn_attr +"]") : tnav.children;
};

/*
 * If the given element is an <A>, its href attribute will be returned.
 * Otherwise, searches all children of the given element for <A>s and 
 * returns the href attribute of the first <A> it could find.
 */
Tabs.prototype.href = function(el) {
	// Check if el is an <A> element itself ...
	if (el.nodeName.toLowerCase() === "a") {
		// ... if so, return it's href attribute
		return el.getAttribute("href");
	}
	// Find the first <A> with el and returns its href attribute
	let a = el.querySelector("a");
	return a ? a.getAttribute("href") : null;
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
	// If the button doesn't have a href attribute, we can't continue
	var href = this.href(event.target, this.btn_attr);
	if (!href) { return; }
	// Extract the fragment from the button's href attribute (remove #)
	var frag = this.frag(href);
	// Abort if the given tab is already the active tab
	if (frag === this.curr) { return;	}
	// Abort if the given tab is not known to this tabset
	var tab_next = this.tabs[frag];
	if (!tab_next) { return; }
	// Abort if there is no currently active tab (init() failed?)
	var tab_curr = this.tabs[this.curr];
	if (!tab_curr) { return; }
	// Show the tab that corresponds with the clicked tab button
	this.show(tab_next);
	// Hide the previously active tab
	this.hide(tab_curr);
	// Update the URL fragments and our internal state accordingly
	this.update_frags(frag);
};

/*
 * Updates the current (this.curr) tab ID with the one provided in next.
 * Removes the current ID from the URL anchor and replaces it with the 
 * new one, then updates the internal state (this.curr) as well.
 */
Tabs.prototype.update_frags = function(next) {
	// Get an array with all URL anchors
	var frags = this.frags(this.frag());
	// See if the previously active tab is in the URL anchors
	var idx = frags.indexOf(this.curr);
	// Previous tab id is not in URL anchors yet...
	if (idx === -1) {
		// ...so we just add the new active tab's anchor/id
		frags.push(next);
	}
	// Previous tab id is in the URL anchors...
	else {
		// ...so we overwrite it with the new active tab's anchor/id
		frags[idx] = next;
	}
	// Build the updated URL anchor string
	var frag_str = "#" + frags.join(this.frag_sep);
	// Replace the URL anchor string with the updated one
	history.replaceState(undefined, undefined, frag_str);
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
	if (this.set_hidden) {
		tab.tab.removeAttribute("hidden");
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
	if (this.set_hidden) {
		tab.tab.setAttribute("hidden", "");
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
 * Extract the fragment from the current URL or the given string.
 * If the string doesn't contain a fragment, "" is returned.
 * Example: "http://example.com#chapter-1" will return "chapter-1".
 */
Tabs.prototype.frag = function(str) {
	var url = (str) ? str.split("#") : document.URL.split("#");
	return (url.length > 1) ? url[1] : "";
};

/*
 * Separates the given fragment string on the fragment separator.
 * If the input string is empty, an empty array is returned.
 * Example: "#hello:world" will return ["hello", "world"].
 */
Tabs.prototype.frags = function(frag) {
	return (frag) ? frag.split(this.frag_sep) : [];
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
		(new Tabs({
			"name":tabnavs[i].getAttribute(attr), 
			"attr": attr
		})).init();
	}
}
