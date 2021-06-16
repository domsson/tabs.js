/*
 * Helps turn regular anchor links and their referenced elements into 
 * tabs. This is achieved by adding appropriate click handlers to the 
 * tab buttons and by setting/removing appropriate CSS classes to the 
 * tab buttons and tab content elements. To achieve the typical tab 
 * look and feel, you will have to apply some corresponding CSS.
 * 
 * Takes an optional object with the following possible options:
 * - `attr`: The HTML attribute used to tag the tab navigation element
 * - `name`: The value of the `attr` attribute to look for
 * - `nav_class`: CSS class to set on the tab navigation
 * - `btn_select`: CSS selector for tab button elements
 * - `btn_class`: CSS class to set on all tab buttons
 * - `btn_active`: CSS class to set on active tab buttons
 * - `tab_class`:  CSS class to set on all tab content elements
 * - `tab_active`: CSS class to set on active tab content elements
 * - `tab_hidden`: CSS class to set on hidden tab content elements
 * - `set_frags`: Manipulate URL fragments based on active tab(s)?
 * - `frag_sep`:  The separator character used for multiple URL anchors
 */
class Tabs
{
	constructor(o)
	{
		// Get options (or set to sensible defaults)
		this.attr       = this.get_opt(o, "attr",       "data-tabs");
		this.name       = this.get_opt(o, "name",       null);
		this.nav_class  = this.get_opt(o, "nav_class",  "tab-nav");
		this.btn_select = this.get_opt(o, "btn_select", null);
		this.btn_class  = this.get_opt(o, "btn_class",  "tab-button");
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
	 * Return the property `p` of object `o`, if present, otherwise `d`.
	 */
	get_opt(o, p, d)
	{
		return o && o.hasOwnProperty(p) ? o[p] : d;
	}
	
	/*
	 * Add the given CSS class to the given element. If the given class is falsy 
	 * (for example `null` or an empty string), this function does nothing.
	 */
	add_class(e, c)
	{
		e && c && e.classList.add(c);
	}
	
	/*
	 * Remove the given CSS class to the given element. If the given class is falsy
	 * (for example `null` or an empty string), this function does nothing.
	 */
	rem_class(e, c)
	{
		e && c && e.classList.remove(c);
	}
	
	/*
	 * Tries to find a tab navigation that matches the `attr` and `name` 
	 * options given (or using the defaults), then find the tab buttons 
	 * within it, then populates the `this.tabs` object accordingly.
	 * If all required elements could be found, it will hide all but one 
	 * tab (either the one specified in the URL anchor, or the first one).
	 * Returns `true` on success`, `false` if initialization failed.
	 */
	init()
	{
		this.tnav = this.find_tnav(); // find tab nav based on `attr` and `name`
		if (!this.tnav) return false;
		
		let btns = this.find_btns(); // get the tab nav buttons
		let frags = this.frags(this.frag()); // get current URL anchors as array
		
		for (let btn of btns)
		{
			let href = this.find_href(btn); // get button's 'href' attribute
			if (!href) continue;

			let frag = this.frag(href); // extract anchor string (remove '#')
			if (!frag) continue;

			let tab = document.getElementById(frag); // find corresponding tab
			if (!tab) continue;

			this.add_class(btn, this.btn_class); // add general button class
			this.add_class(tab, this.tab_class); // add general tab class

			let handler = this.click.bind(this);
			btn.addEventListener("click", handler, false);

			// Add this tab button and tab content to our state (this.tabs)
			this.tabs[frag] = { "btn": btn, "tab": tab, "evt": handler };

			// Mark this tab button as active (this.curr), if appropriate
			if (frags.indexOf(frag) !== -1 || this.curr === null)
			{
				this.curr = frag;
			}
		}
		
		if (!Object.keys(this.tabs).length) return false;

		this.hide_all(); // hide/deactivate all tabs first
		this.show(this.curr); // show only the current tab
		this.add_class(this.tnav, this.nav_class); // add tab nav class
		this.tnav.setAttribute(`${this.attr}-set`, ""); // mark this set as processed
		return true;
	}
	
	/*
	 * Tries to find an element that matches out `this.attr` attribute, possibily 
	 * with the given attribute value `this.name`, if set, which has not yet been 
	 * processed (as indicated by the presence of the "<this.attr>-set" attribute. 
	 * Returns the first matching element that has not already been processed or
	 * null if no matching element was found or all of them were already processed.
	 * If `this.tnav` is already set (has any truthy value), this function does 
	 * nothing and simply returns `this.tnav`.
	 */
	find_tnav()
	{
		if (this.tnav) return this.tnav; // nav already set, do nothing

		let q = `[${this.attr}="${this.name ? this.name : ''}"]`;
		let tnavs = document.querySelectorAll(q);

		for (let tnav of tnavs)
		{
			// We found a matching element that has not been processed yet 
			if (!tnav.hasAttribute(`${this.attr}-set`))
			{
				return tnav;
			}
		}
		return null;
	}
	
	/*
	 * Returns all child nodes of the `this.tnav` element that match the selector 
	 * `this.btn_select` or all child nodes if `this.btn_select` isn't set.
	 * Make sure to only call this function once `this.tnav` has been fetched, 
	 * otherwise it will throw an error.
	 */
	find_btns()
	{
		return this.btn_select ? 
			this.tnav.querySelectorAll(this.btn_select) :
			this.tnav.children;
	}
	
	/*
	 * If the given element is an <A>, its href attribute will be returned.
	 * Otherwise, searches all children of the given element for <A>s and 
	 * returns the href attribute of the first <A> it could find.
	 */
	find_href(e)
	{
		// If e is an <A> element itself, return it's href attribute
		if (e.nodeName.toLowerCase() === "a")
		{
			return e.getAttribute("href");
		}
		// Find the first <A> within e and returns its href attribute
		let a = e.querySelector("a");
		return a ? a.getAttribute("href") : null;
	}
	
	/*
	 * Button handler that will switch from the active to the clicked tab,
	 * given that there is already a tab active (this.curr) and the clicked 
	 * element has an anchor that corresponds with a tab in our tab set.
	 */
	click(evt)
	{
		if (!evt) return;
		evt.preventDefault(); // prevent browser from scrolling to anchor
		let href = this.find_href(evt.currentTarget);
		!href || this.open(this.frag(href)); // if `href` given, open the tab
	}
	
	/*
	 * Opens the given tag (specified by its id) by marking it active and 
	 * un-marking the previously opened tab (using the set CSS classes) and 
	 * then updates the URL fragments and the internal state accordingly.
	 */
	open(frag)
	{
		if (frag === this.curr) return; // tab already active
		if (!this.tabs[frag]) return; // tab doens't belong to this tabset
		if (!this.tabs[this.curr]) return; // currently no active tab (!?)
		this.hide(this.curr); // hide the previously active tab
		this.show(frag); // show the tab corresponding to the clicked button
		this.update_frags(frag); // update URL fragments
	}
	
	/*
	 * Updates the current (this.curr) tab ID with the one provided in next.
	 * Removes the current ID from the URL anchor and replaces it with the 
	 * new one, then updates the internal state (this.curr) as well.
	 */
	update_frags(next)
	{
		if (this.set_frags === false) return;
		let frags = this.frags(this.frag()); // get all anchors as array
		let idx = frags.indexOf(this.curr); // check if active tab is in anchors

		// Add tab ID to URL fragments if the previous tab's ID is not in 
		// there currently, otherwise replace the previous tab's ID
		frags[idx == -1 ? frags.length : idx] = next;
		let frag_str = "#" + frags.join(this.frag_sep); // build updated anchor string
		history.replaceState(undefined, undefined, frag_str); // replace anchor string
		this.curr = next; // update state
	}
	
	/*
	 * Show/activate the tab identified by the given fragment (id).
	 */
	show(frag)
	{
		let t = this.tabs[frag];
		this.add_class(t.btn, this.btn_active);
		this.add_class(t.tab, this.tab_active);
		this.rem_class(t.tab, this.tab_hidden);
	}
	
	/*
	 * Hide/deactivate the tab identified by the given fragment (id).
	 */
	hide(frag)
	{
		let t = this.tabs[frag];
		this.rem_class(t.btn, this.btn_active);
		this.rem_class(t.tab, this.tab_active);
		this.add_class(t.tab, this.tab_hidden);
	}
	
	/*
	 * Hides/deactivates all tabs of this tab set.
	 */
	hide_all()
	{
		for (let frag in this.tabs)
		{
			if (this.tabs.hasOwnProperty(frag))
			{
				this.hide(frag);
			}
		}
	}
	
	/*
	 * Extract the fragment from the current URL or the given string.
	 * If the string doesn't contain a fragment, "" is returned.
	 * Example: "http://example.com#chapter-1" will return "chapter-1".
	 */
	frag(str)
	{
		let url = (str) ? str.split("#") : document.URL.split("#");
		return (url.length > 1) ? url[1] : "";
	}
	
	/*
	 * Separates the given fragment string on the fragment separator.
	 * If the input string is empty, an empty array is returned.
	 * Example: "#hello:world" will return ["hello", "world"].
	 */
	frags(frag)
	{
		return frag ? frag.split(this.frag_sep) : [];
	}
	
	/*
	 * Removes all event handlers and forgets all references to the tabs.
	 * It also removes the tab classes from all tab content elements and 
	 * the "data-tabs-set" attribute form the tab nav element. The reference 
	 * to that element, and the user options, will be kept, however. This 
	 * allows for easy re-initialization via init().
	 */
	kill()
	{
		for (let frag in this.tabs)
		{
			if (this.tabs.hasOwnProperty(frag))
			{
				let t = this.tabs[frag];
				// Remove all tab classes we might have set
				this.rem_class(t.tab, this.tab_class);
				this.rem_class(t.tab, this.tab_active);
				this.rem_class(t.tab, this.tab_hidden);
				// Remove button classes we might have set
				this.rem_class(t.btn, this.btn_class);
				this.rem_class(t.btn, this.btn_active);
				// Remove the button event listerner
				t.btn.removeEventListener("click", t.evt, false);
			}
		}
		// Forget all about the tabs and current tab
		this.tabs = {};
		this.curr = null;
		// Remove class from nav
		this.rem_class(this.tnav, this.nav_class);
		// Remove the "set" marker from the tab nav element
		this.tnav.removeAttribute(`${this.attr}-set`);
	}
}

