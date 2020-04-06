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
 * - `btn_select`: The HTML attribute of the tab button elements
 * - `btn_active`: The CSS class for active tab buttons
 * - `tab_class`: The CSS class for every tab content element
 * - `tab_active`: The CSS class for active tab content elements
 * - `tab_hidden`: The CSS class for hidden tab content elements
 * - `set_frags`: Manipulate URL fragments based on active tab(s)?
 * - `frag_sep`: The separator character used for multiple URL anchors
 */
function Tabs(o) {
	// Default options
	this.attr       = "data-tabs";
	this.name       = null;
	this.btn_select = null;
	this.btn_active = "active";
	this.tab_class  = "tab";
	this.tab_active = "active";
	this.tab_hidden = null;
	this.set_frags  = true;
	this.frag_sep   = ":";
	// Overwrite defaults with provided options, if any
	this.set_opts(o);
	// Declare the member variables that will hold our state
	this.tnav = null;
	this.tabs = {};
	this.curr = null;
}

/*
 * Goes through all properties of the provided object and checks if a
 * property of the same name exists in this class. If so, the property 
 * will be overriden with the value provided in the given object.
 */
Tabs.prototype.set_opts = function(o) {
	for (var key in o) {
		if (this.hasOwnProperty(key)) {
			this[key] = o[key];
		}
	}
};

/*
 * Tries to find a tab navigation that matches the `attr` and `name` 
 * options given (or using the defaults), then find the tab buttons 
 * within it, then populates the `this.tabs` object accordingly.
 * If all required elements could be found, it will hide all but one 
 * tab (either the one specified in the URL anchor, or the first one).
 */
Tabs.prototype.init = function() {
	// Find the tab navigation based on `attr` and `name`
	if (!this.tnav) {
		this.tnav = this.find_tnav(this.attr, this.name);
	}
	if (!this.tnav) { return; }
	// Get the tab navigation buttons
	var btns = this.find_btns(this.tnav, this.btn_attr);
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
		// Find the tab content element corresponding to this button
		var tab = document.getElementById(frag);
		if (!tab) { continue; }
		// Add the general tab class to the tab content element
		tab.classList.add(this.tab_class);
		// Bind our tab button click handler to the button
		var handler = this.click.bind(this);
		btns[i].addEventListener("click", handler, false);
		// Add this tab button and tab content to our state (this.tabs)
		this.tabs[frag] = { "btn": btns[i], "tab": tab, "evt": handler };
		// Mark this tab button as active (this.curr), if appropriate
		if (frags.indexOf(frag) !== -1 || this.curr === null) {
			this.curr = frag;
		}
	}
	// No relevant buttons identified, aborting
	if (!Object.keys(this.tabs).length) { return; }
	// Hide/deactive all tabs first
	this.hide_all();
	// Now show only the current tab
	this.show(this.curr);
	// Mark this set of tabs as successfully processed ('set')
	this.tnav.setAttribute(this.attr +"-set", "");
};

/*
 * Tries to find the DOM element that matches the given attribute `attr` 
 * and value `name`. If no name is given, goes through all elements with 
 * the given attribute and returns the first one that has not already 
 * been processed by another Tab instance. Returns null if no matching 
 * element was found or all found elements are already processed.
 */
Tabs.prototype.find_tnav = function(attr, name) {
	// Formulate the appropriate CSS selector
	var q = '['+ attr +'="'+ (name ? name : "") +'"]';
	// Find all elements that match our CSS selector
	var tnavs = document.querySelectorAll(q);
	// Iterate over all elements that match our query
	var len = tnavs.length;
	for (var i=0; i<len; ++i) {
		// We found a matching element that has not been processed yet 
		if (!tnavs[i].hasAttribute(this.attr +"-set")) {
			return tnavs[i];
		}		
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
	return this.btn_select ? 
		tnav.querySelectorAll(this.btn_select) : tnav.children;
};

/*
 * If the given element is an <A>, its href attribute will be returned.
 * Otherwise, searches all children of the given element for <A>s and 
 * returns the href attribute of the first <A> it could find.
 */
Tabs.prototype.href = function(el) {
	// If el is an <A> element itself, return it's href attribute
	if (el.nodeName.toLowerCase() === "a") {
		return el.getAttribute("href");
	}
	// Find the first <A> with el and returns its href attribute
	var a = el.querySelector("a");
	return a ? a.getAttribute("href") : null;
};

/*
 * Button handler that will switch from the active to the clicked tab,
 * given that there is already a tab active (this.curr) and the clicked 
 * element has an anchor that corresponds with a tab in our tab set.
 */
Tabs.prototype.click = function(event) {
	// If no event is supplied, we can't do our job!
	if (!event) { return; }
	// Prevent browser from actually scrolling to the anchor
	event.preventDefault();
	// Get the button's href attribute, we can't continue without
	var href = this.href(event.target, this.btn_attr);
	// If the button's href is set, let's open the according tab
	!href || this.open(this.frag(href));	
};

/*
 * Opens the given tag (specified by its id) by marking it active and 
 * un-marking the previously opened tab (using the set CSS classes) and 
 * then updates the URL fragments and the internal state accordingly.
 */
Tabs.prototype.open = function(frag) {
	// Abort if the given tab is already the active tab
	if (frag === this.curr) { return; }
	// Abort if the given tab is not known to this tabset
	if (!this.tabs[frag]) { return; }
	// Abort if there is no currently active tab (init() failed?)
	if (!this.tabs[this.curr]) { return; }
	// Hide the previously active tab
	this.hide(this.curr);
	// Show the tab that corresponds with the clicked tab button
	this.show(frag);
	// Update the URL fragments and our internal state accordingly
	this.update_frags(frag);
	// Update the internal state
	this.curr = frag;
};

/*
 * Updates the current (this.curr) tab ID with the one provided in next.
 * Removes the current ID from the URL anchor and replaces it with the 
 * new one, then updates the internal state (this.curr) as well.
 */
Tabs.prototype.update_frags = function(next) {
	if (this.set_frags === false) { return; }
	// Get an array with all URL anchors
	var frags = this.frags(this.frag());
	// See if the previously active tab is in the URL anchors
	var idx = frags.indexOf(this.curr);
	// Add tab ID to URL fragments if the previous tab's ID is not in 
	// there currently, otherwise replace the previous tab's ID
	frags[idx == -1 ? frags.length : idx] = next;
	// Build the updated URL anchor string
	var frag_str = "#" + frags.join(this.frag_sep);
	// Replace the URL anchor string with the updated one
	history.replaceState(undefined, undefined, frag_str);
};

/*
 * Show/activate the tab identified by the given fragment (id).
 */
Tabs.prototype.show = function(frag) {
	var t = this.tabs[frag];
	t.btn.classList.add(this.btn_active);
	t.tab.classList.add(this.tab_active);
	t.tab.classList.remove(this.tab_hidden);
};

/*
 * Hide/deactivate the tab identified by the given fragment (id).
 */
Tabs.prototype.hide = function(frag) {
	var t = this.tabs[frag];
	t.btn.classList.remove(this.btn_active);
	t.tab.classList.remove(this.tab_active);
	if (this.tab_hidden) {
		t.tab.classList.add(this.tab_hidden);
	}
};

/*
 * Hides/deactivates all tabs of this tab set.
 */
Tabs.prototype.hide_all = function() {
	for (var frag in this.tabs) {
		if (this.tabs.hasOwnProperty(frag)) {
			this.hide(frag);
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
 * Removes all event handlers and forgets all references to the tabs.
 * It also removes the tab classes from all tab content elements and 
 * the "data-tabs-set" attribute form the tab nav element. The reference 
 * to that element, and the user options, will be kept, however. This 
 * allows for easy re-initialization via init().
 */
Tabs.prototype.kill = function() {
	for (var frag in this.tabs) {
		if (this.tabs.hasOwnProperty(frag)) {
			var t = this.tabs[frag];
			// Remove all tab classes we might have set
			t.tab.classList.remove(this.tab_class);
			t.tab.classList.remove(this.tab_active);
			t.tab.classList.remove(this.tab_hidden);
			// Remove active button classes we might have set
			t.btn.classList.remove(this.btn_active);
			// Remove the button event listerner
			t.btn.removeEventListener("click", t.evt, false);
		}
	}
	// Forget all about the tabs and current tab
	this.tabs = {};
	this.curr = null;
	// Remove the "set" marker from the tab nav element
	this.tnav.removeAttribute(this.attr +"-set");
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
