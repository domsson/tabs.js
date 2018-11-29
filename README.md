# tabs.js

Defines a `Tabs` class that helps to turn a regular set of anchor links 
and associated content elements into tabs and tabbed content, where only 
one content element will be displayed at a time, based on the currently 
selected tab button. `tabs.js` supports arbitrary number of tab sets.

![picture](example.png)

No actual visual changes will be performed, `tabs.js` just adds/removes 
CSS classes to the buttons and content elements. Making everything look 
like actual tabs is up to you.

`tabs.js` focuses on progressive enhancement, meaning that user's who 
have JavaScript deactivatet, should still be able to use the page fine.

Clicking a tab button will update the URL's anchor string accordingly. 
This also works for multiple tab sets on a single page, in which case 
the different anchors will be separated with `:` (colon). This enables 
users to retain the status of selected tabs when bookmarking or sharing 
the URL.

The source code is heavily commented. When using `tabs.js` in production, 
you should minify the code before sending it to the user's machines. The 
minified version currently weighs in at about 2.4 KB.

# How to use

Check `tabs.html` for an example, including some basic CSS. Basically, 
you need a HTML structure similiar to this:

	<ul data-tabs>
		<li><a href="#chapter1">Chapter 1</a></li>
		<li><a href="#chapter2">Chapter 2</a></li>
		<li><a href="#chapter3">Chapter 3</a></li>
	</ul>

Then, you need to create a `Tabs` instance once the DOM has loaded:

    <script>
		function setupTabs() {
			new Tabs();
		}
		window.onload = setupTabs;
	</script>
	
If you have several set of tabs on your page, create as many `Tabs` 
objects as you have tab sets. This can be done in a loop. `tabs.js` 
comes with an additional example method, `initTabs()`, that does this:

	initTabs("data-tabs"); // Replace 'data-tabs' with whatever you used
 
If you want to roll your own, here is the minimum it should be doing:

	function initTabs() {
		var tabnavs = document.querySelectorAll("data-tabs");
		var len = tabnavs.length;
		for (var i = 0; i < len; ++i) {
			new Tabs();
		}
	}
	
## Options

You can pass an object with some configuration options when you create 
a new `Tabs` instance:

 - `attr`: The HTML attribute to look for
 - `name`: The value of the HTML attribute to look for
 - `btn_active`: The CSS class for active tab buttons
 - `tab_active`: The CSS class for active tab content elements
 - `tab_hidden`: The CSS class for hidden tab content elements
 - `anchor_sep`: The separator character used for multiple URL anchors

## Things to add or change in the future

Once browser support is solid enough, we should...

- replace most occurences of `var` with `let`
- replace `for` loops with `for of` loops for array iteration
- replace `classList.remove`, `classList.add` with `classList.replace`
