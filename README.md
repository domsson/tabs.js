# tabs.js

Turn a regular set of anchor links and the associated content elements 
into tabs.

![picture](example.png)

No actual visual changes will be performed, `tabs.js` just adds/removes 
CSS classes to the buttons and content elements. Making your tabs look 
like tabs is up to you. But don't worry, it ain't hard and you can use 
the included `tabs.html` as a starting point.

## Features

- No dependencies, all vanilla JavaScript
- Works for mutliple tab sets per page
- Updates the URL fragments based on the currently active tabs
- Your page will still work fine for users without JavaScript
- Very minimal markup requirements (literally just one attribute)
- Does not set, impose or require any CSS rules
- Performs only very little markup changes
- Easy to use, flexible in how to use
- Can be configured somewhat
- Extensively commented source

## Markup requirements

- Set the `data-tabs` attribute on your tab button container
- Either have the buttons be direct children of the container, or set 
  an attribute of your choice for every button, then hand that in via 
  the `btn_attr` option
- Every button needs to be (or contain) an anchor element with a href
  that targets a fragment (`#`)
  
**Example**

	<ul data-tabs>
		<li><a href="#chapter1">Chapter 1</a></li>
		<li><a href="#chapter2">Chapter 2</a></li>
		<li><a href="#chapter3">Chapter 3</a></li>
	</ul>


## Usage

**Note**: Please remember to minify `tabs.js` in production as there are 
many KB of comments in there.

Create a `Tabs` instance once the DOM has loaded. For example:

    <script>
		function setupTabs() {
			new Tabs();
		}
		window.onload = setupTabs;
	</script>
	
If you have several tab sets on your page, create one `Tabs` instance 
for each of them. This can be done in a loop. `tabs.js` comes with such 
a function, `initTabs(attr)`. You could use it like this:

    <script>
		function setupTabs() {
			initTabs("data-tabs");
		}
		window.onload = setupTabs;
	</script>
	
If you don't need that function (or its name collides with another one) 
you can always rename or remove it. Find it at the end of `tabs.js`.
 
## Options

You can pass an object with some configuration options when you create 
a new `Tabs` instance. The defaults are as follows:

	var options = {
		// Attribute of the tab navigation element
		"attr": "data-tabs", 
		// Attribute value of the tab navigation element, this is useful
		// if you need to init different tab sets with differen options
		"name": null, 
		// Attribute of the tab button elements;
		// you only need this if your button elements are not direct 
		// children of the tab navigation element (or if there are other
		// child elements that should not be treated as tab buttons)
		"btn_attr": null,
		// The CSS class to set for active tab button elements
		"btn_active": "active",
		// The CSS class to set for active tab content elements
		"tab_active": "active",
		// The CSS class to set for hidden tab content elements
		"tab_hidden": "",
		// Set hidden attribute on hidden tab content elements?
		"set_hidden": true,
		// The separator used to split multiple URL fragments
		"frag_sep": ":"
	};


## Things to add or change in the future

Once browser support is solid enough, we should...

- Replace most occurences of `var` with `let`
- Replace `for` loops with `for of` loops for array iteration
- Replace `classList.remove`, `classList.add` with `classList.replace`
- Use `Object.assign` to set (default) options
- Maybe make it so that the browser back button works after a change
  of the fragmen part of the URL - not sure about this one yet
