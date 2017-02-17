/**
 * Module that registers the notification box and handles messages
 */
var Notifications = {
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		// Create the notifications box
		elem = $('<div>').attr({
			id: 'notifications',
			className: 'notifications'
		});
		// Create the transparency gradient
		$('<div>').attr('id', 'notifyGradient').appendTo(elem);
		
		elem.appendTo('div#wrapper');
	},
	
	options: {}, // Nothing for now
	
	elem: null,
	
	notifyQueue: {},

	q: [],

	_baseTimer: null,

	enablePrint: function(t){
		//window.clearTimeout(Notifications._baseTimer);
		Notifications.printMessage(t);
		if(Notifications.q.length > 0){
			window.clearTimeout(Notifications._baseTimer);
			var wait = 0;
			t = Notifications.q.shift();
			if(t.length > 30) wait = 2*1000;
			else { wait = 1*1000; }
			if(t.includes('The night is long')) wait = 3*1000;
			Notifications._baseTimer = Engine.setTimeout(Notifications.enablePrint.bind(null,t),wait);
		} else {
			Notifications._baseTimer = null;
		}
	},
	
	// Allow notification to the player
	notify: function(module, text, noQueue) {
		if(typeof text == 'undefined') return;
		if(text.slice(-1) != ".") text += ".";
		if(module != null && Engine.activeModule != module) {
			if(!noQueue) {
				if(typeof this.notifyQueue[module] == 'undefined') {
					this.notifyQueue[module] = [];
				}
				this.notifyQueue[module].push(text);
			}
		} else {
			var wait = 0;
			if(text.length > 30) wait = 2*1000;
			else { wait = 1*1000; }
			if(text.includes('The night is long')) wait = 3*1000;
			if(Notifications._baseTimer == null) Notifications._baseTimer = Engine.setTimeout(Notifications.enablePrint.bind(null,text),wait);
			else{
				Notifications.q.push(text);
			}
		}
		Engine.saveGame();
	},
	
	clearHidden: function() {
	
		// To fix some memory usage issues, we clear notifications that have been hidden.
		
		// We use position().top here, because we know that the parent will be the same, so the position will be the same.
		var bottom = $('#notifyGradient').position().top + $('#notifyGradient').outerHeight(true);
		
		$('.notification').each(function() {
		
			if($(this).position().top > bottom){
				$(this).remove();
			}
		
		});
		
	},
	
	printMessage: function(t) {
		var text = $('<div>').addClass('notification').css('opacity', '0').text(t).prependTo('div#notifications');
		text.animate({opacity: 1}, 500, 'linear', function() {
			// Do this every time we add a new message, this way we never have a large backlog to iterate through. Keeps things faster.
			Notifications.clearHidden();
		});
	},
	
	printQueue: function(module) {
		if(typeof this.notifyQueue[module] != 'undefined') {
			while(this.notifyQueue[module].length > 0) {
				Notifications.printMessage(this.notifyQueue[module].shift());
			}
		}
	}
};
