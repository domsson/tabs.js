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
 * - `btn_select`: CSS selector for tab button elements
 * - `btn_active`: CSS class to set on active tab buttons
 * - `tab_class`:  CSS class to set on tab content elements
 * - `tab_active`: CSS class to set on active tab content elements
 * - `tab_hidden`: CSS class to set on hidden tab content elements
 * - `set_frags`: Manipulate URL fragments based on active tab(s)?
 * - `frag_sep`:  The separator character used for multiple URL anchors
 */
function Tabs(o) {
	// Get options (or set to sensible defaults)
	this.attr       = this.get_opt(o, "attr",       "data-tabs");
	this.name       = this.get_opt(o, "name",       null);
	this.btn_select = this.get_opt(o, "btn_select", null);
	this.btn_active = this.get_opt(o, "btn_active", "active");
	this.tab_class  = this.get_opt(o, "tab_class",  "tab");
	this.tab_active = this.get_opt(o, "tab_active", "active");
	this.tab_hidden = this.get_opt(o, "tab_hidden", "hidden");
	this.set_frags  = this.get_opt(o, "set_frags",  true);
	this.frag_sep   = this.get_opt(o, "frag_sep",   ":");
	
	// State variables 
	this.tnav = null;
	this.tabs = {};
	this.curr = null;
}

/*
 * Goes through all properties of the provided object and checks if a
 * property of the same name exists in this class. If so, the property 
 * will be overriden with the value provided in the given object.
 */
Tabs.prototype.get_opt = function(obj, opt, def) {
	return obj.hasOwnProperty(opt) ? obj[opt] : def;
};

/*
 * Add the given CSS class to the given element. If the given class is falsy 
 * (for example `null` or an empty string), this function does nothing.
 */
Tabs.prototype.add_class = function(ele, c) {
	c && ele.classList.add(c);
};

/*
 * Remove the given CSS class to the given element. If the given class is falsy
 * (for example `null` or an empty string), this function does nothing.
 */
Tabs.prototype.rem_class = function(ele, c) {
	c && ele.classList.remove(c);
};

/*
 * Tries to find a tab navigation that matches the `attr` and `name` 
 * options given (or using the defaults), then find the tab buttons 
 * within it, then populates the `this.tabs` object accordingly.
 * If all required elements could be found, it will hide all but one 
 * tab (either the one specified in the URL anchor, or the first one).
 * Returns `true` on success`, `false` if initialization failed.
 */
Tabs.prototype.init = function() {
	// Find the tab navigation based on `attr` and `name`
	this.tnav = this.find_tnav();
	// Abort if no suitable element could be found
	if (!this.tnav) { return false; }
	// Get the tab navigation buttons
	var btns = this.find_btns();
	// Get the current URL anchors as array
	var frags = this.frags(this.frag());
	// Loop over all tab buttons we've found
	var num_btns = btns.length;
	for (var i=0; i<num_btns; ++i) {
		// Get the button's 'href' attribute (required)
		var href = this.find_href(btns[i]);
		if (!href) { continue; }
		// Extract the anchor string from the `href` (remove the #)
		var frag = this.frag(href);
		if (!frag) { continue; }
		// Find the tab content element corresponding to this button
		var tab = document.getElementById(frag);
		if (!tab) { continue; }
		// Add the general tab class to the tab content element
		this.add_class(tab, this.tab_class);
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
	if (!Object.keys(this.tabs).length) { return false; }
	// Hide/deactive all tabs first
	this.hide_all();
	// Now show only the current tab
	this.show(this.curr);
	// Mark this set of tabs as successfully processed ('set')
	this.tnav.setAttribute(this.attr + "-set", "");
	return true;
};

/*
 * Tries to find an element that matches out `this.attr` attribute, possibily 
 * with the given attribute value `this.name`, if set, which has not yet been 
 * processed (as indicated by the presence of the "<this.attr>-set" attribute. 
 * Returns the first matching element that has not already been processed or
 * null if no matching element was found or all of them were already processed.
 * If `this.tnav` is already set (has any truthy value), this function does 
 * nothing and simply returns `this.tnav`.
 */
Tabs.prototype.find_tnav = function() {
	// If `tnav` is already set, we do nothing and return it
	if (this.tnav) { return this.tnav; }
	// Formulate the appropriate CSS selector
	var q = '['+ this.attr +'="'+ (this.name ? this.name : "") +'"]';
	// Find all elements that match our CSS selector
	var tnavs = document.querySelectorAll(q);
	// Iterate over all elements that match our query
	var len = tnavs.length;
	for (var i = 0; i < len; ++i) {
		// We found a matching element that has not been processed yet 
		if (!tnavs[i].hasAttribute(this.attr + "-set")) {
			return tnavs[i];
		}		
	}
	// Nothing found, return null
	return null;
};

/*
 * Returns all child nodes of the `this.tnav` element that match the selector 
 * `this.btn_select` or all child nodes if `this.btn_select` isn't set.
 * Make sure to only call this function once `this.tnav` has been fetched, 
 * otherwise it will throw an error.
 */
Tabs.prototype.find_btns = function() {
	return this.btn_select ? 
		this.tnav.querySelectorAll(this.btn_select) : this.tnav.children;
};

/*
 * If the given element is an <A>, its href attribute will be returned.
 * Otherwise, searches all children of the given element for <A>s and 
 * returns the href attribute of the first <A> it could find.
 */
Tabs.prototype.find_href = function(el) {
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
	var href = this.find_href(event.currentTarget);
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
	this.add_class(t.btn, this.btn_active);
	this.add_class(t.tab, this.tab_active);
	this.rem_class(t.tab, this.tab_hidden);
};

/*
 * Hide/deactivate the tab identified by the given fragment (id).
 */
Tabs.prototype.hide = function(frag) {
	var t = this.tabs[frag];
	this.rem_class(t.btn, this.btn_active);
	this.rem_class(t.tab, this.tab_active);
	this.add_class(t.tab, this.tab_hidden);
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
			this.rem_class(t.tab, this.tab_class);
			this.rem_class(t.tab, this.tab_active);
			this.rem_class(t.tab, this.tab_hidden);
			// Remove active button classes we might have set
			this.rem_class(t.btn, this.btn_active);
			// Remove the button event listerner
			t.btn.removeEventListener("click", t.evt, false);
		}
	}
	// Forget all about the tabs and current tab
	this.tabs = {};
	this.curr = null;
	// Remove the "set" marker from the tab nav element
	this.tnav.removeAttribute(this.attr + "-set");
};

/*
 * Convenience function for initializing all tab sets on a given page.
 * If you don't need this or its name conflicts with another function,
 * feel free to remove this. Note, however, that you might then have to 
 * implement some similar functionality yourself.
 */
function initTabs(attr) {
	if (!attr) { attr = "data-tabs"; }
	var tabnavs = document.querySelectorAll("[" + attr + "]");
	var len = tabnavs.length;
	for (var i = 0; i < len; ++i) {
		(new Tabs({
			"name": tabnavs[i].getAttribute(attr), 
			"attr": attr
		})).init();
	}
}
