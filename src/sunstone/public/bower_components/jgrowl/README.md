# jGrowl 
jGrowl is a jQuery plugin that raises unobtrusive messages within the browser, similar to the way that OS X's Growl Framework works. The idea is simple, deliver notifications to the end user in a noticeable way that doesn't obstruct the work flow and yet keeps the user informed.

## Installation
jGrowl can be added to your project using package managers like bower and npm or directly into your html using cdnjs, as well as the good old fashioned copy-paste into your project directory.

Use cdnjs:

```html
<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.4.1/jquery.jgrowl.min.css" />
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.4.1/jquery.jgrowl.min.js"></script>
```

Install with bower

```
bower install jgrowl
```

Install with npm

```
npm install jgrowl
```

```js
// Sample 1
$.jGrowl("Hello world!");
// Sample 2
$.jGrowl("Stick this!", { sticky: true });
// Sample 3
$.jGrowl("A message with a header", { header: 'Important' });
// Sample 4
$.jGrowl("A message that will live a little longer.", { life: 10000 });
// Sample 5
$.jGrowl("A message with a beforeOpen callback and a different opening animation.", {
	beforeClose: function(e,m) {
		alert('About to close this notification!');
	},
	animateOpen: {
		height: 'show'
	}
});
```

## Configuration Options
| Option           |  Default                             |  Description                                               |
|------------------|--------------------------------------|------------------------------------------------------------|
| pool             | 0                                    | Limit the number of messages appearing at a given time to the number in the pool. |
| header           | empty                                | Optional header to prefix the message, this is often helpful for associating messages to each other. |
| group            | empty                                | A css class to be applied to notifications when they are created, useful for 'grouping' notifications by a css selector. |
| sticky           | false                                | When set to true a message will stick to the screen until it is intentionally closed by the user. |
| position         | top-right                            | Designates a class which is applied to the jGrowl container and controls its position on the screen. By Default there are five options available, top-left, top-right, bottom-left, bottom-right, center. This must be changed in the defaults before the startup method is called. |
| appendTo         | body 	                              | The element where our jGrowl messages are appended to. The default is `body` but feel free to define another one. |
| glue             | after                                | Designates whether a jGrowl notification should be appended to the container after all notifications, or whether it should be prepended to the container before all notifications. Options are after or before. |
| theme            | default                              | A CSS class designating custom styling for this particular message, intended for use with jQuery UI. |
| themeState       | highlight                            | A CSS class designating custom styling for this particular message and its state, intended for use with jQuery UI. |
| corners          | 10px                                 | If the corners jQuery plugin is include this option specifies the curvature radius to be used for the notifications as they are created. |
| check            | 250                                  | The frequency that jGrowl should check for messages to be scrubbed from the screen.This must be changed in the defaults before the startup method is called. |
| life             | 3000                                 | The lifespan of a non-sticky message on the screen. |
| closeDuration    | normal                               | The animation speed used to close a notification. |
| openDuration     | normal                               | The animation speed used to open a notification. |
| easing           | swing                                | The easing method to be used with the animation for opening and closing a notification. |
| closer           | true                                 | Whether or not the close-all button should be used when more then one notification appears on the screen. Optionally this property can be set to a function which will be used as a callback when the close all button is clicked. This must be changed in the defaults before the startup method is called. |
| closeTemplate    | &times;                              | This content is used for the individual notification close links that are added to the corner of a notification. This must be changed in the defaults before the startup method is called. |
| closerTemplate   | &lt;div&gt;[ close all ]&lt;/div&gt; | This content is used for the close-all link that is added to the bottom of a jGrowl container when it contains more than one notification. This must be changed in the defaults before the startup method is called. |
| log              | function(e,m,o) {}                   | Callback to be used before anything is done with the notification. This is intended to be used if the user would like to have some type of logging mechanism for all notifications passed to jGrowl. This callback receives the notification's DOM context, the notifications message and its option object. |
| beforeOpen       | function(e,m,o) {}                   | Callback to be used before a new notification is opened. This callback receives the notification's DOM context, the notifications message and its option object. |
| afterOpen        | function(e,m,o) {}                   | Callback to be used after a new notification is opened. This callback receives the notification's DOM context, the notifications message and its option object. |
| open             | function(e,m,o) {}                   | Callback to be used when a new notification is opened. This callback receives the notification's DOM context, the notifications message and its option object. |
| beforeClose      | function(e,m,o) {}                   | Callback to be used before a new notification is closed. This callback receives the notification's DOM context, the notifications message and its option object. |
| close            | function(e,m,o) {}                   | Callback to be used when a new notification is closed. This callback receives the notification's DOM context, the notifications message and its option object. |
| animateOpen      | { opacity: 'show' }                  | The animation properties to use when opening a new notification (default to fadeOut). |
| animateClose     | { opacity: 'hide' }                  | The animation properties to use when closing a new notification (defaults to fadeIn). |
