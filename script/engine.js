(function() {
	var Engine = window.Engine = {

		SITE_URL: encodeURIComponent("http://adarkroom.doublespeakgames.com"),
		VERSION: 1.3,
		MAX_STORE: 99999999999999,
		SAVE_DISPLAY: 30 * 1000,
		GAME_OVER: false,

		//object event types
		topics: {},

		Perks: {
			'boxer': {
				name: _('boxer'),
				desc: _('punches do more damage'),
				/// TRANSLATORS : means with more force.
				notify: _('learned to throw punches with purpose')
			},
			'martial artist': {
				name: _('martial artist'),
				desc: _('punches do even more damage.'),
				notify: _('learned to fight quite effectively without weapons')
			},
			'unarmed master': {
				/// TRANSLATORS : master of unarmed combat
				name: _('unarmed master'),
				desc: _('punch twice as fast, and with even more force'),
				notify: _('learned to strike faster without weapons')
			},
			'barbarian': {
				name: _('barbarian'),
				desc: _('melee weapons deal more damage'),
				notify: _('learned to swing weapons with force')
			},
			'slow metabolism': {
				name: _('slow metabolism'),
				desc: _('go twice as far without eating'),
				notify: _('learned how to ignore the hunger')
			},
			'desert rat': {
				name: _('desert rat'),
				desc: _('go twice as far without drinking'),
				notify: _('learned to love the dry air')
			},
			'evasive': {
				name: _('evasive'),
				desc: _('dodge attacks more effectively'),
				notify: _("learned to be where they're not")
			},
			'precise': {
				name: _('precise'),
				desc: _('land blows more often'),
				notify: _('learned to predict their movement')
			},
			'scout': {
				name: _('scout'),
				desc: _('see farther'),
				notify: _('learned to look ahead')
			},
			'stealthy': {
				name: _('stealthy'),
				desc: _('better avoid conflict in the wild'),
				notify: _('learned how not to be seen')
			},
			'gastronome': {
				name: _('gastronome'),
				desc: _('restore more health when eating'),
				notify: _('learned to make the most of food')
			}
		},

		options: {
			state: null,
			debug: false,
			log: false,
			dropbox: false,
			doubleTime: false
		},

		init: function(options) {
			this.options = $.extend(
				this.options,
				options
			);
			this._debug = this.options.debug;
			this._log = this.options.log;

			// Check for HTML5 support
			if(!Engine.browserValid()) {
				window.location = 'browserWarning.html';
			}

			// Check for mobile
			if(Engine.isMobile()) {
				window.location = 'mobileWarning.html';
			}

			Engine.disableSelection();
			
			//lets put quiz here (need to make personality a global somewhere)
			var x_name='';
			var flipped=false;
			var res = [];
			var cond = "";
			Engine.loadCondition();
			
		},

		completeInit: function(ocean){
			if(this.options.state != null) {
					window.State = this.options.state;
			} else {
					Engine.loadGame();
			}

			$('<div>').attr('id', 'locationSlider').appendTo('#main');

			var menu = $('<div>')
				.addClass('menu')
				.appendTo('body');

			if(typeof langs != 'undefined'){
				var customSelect = $('<span>')
					.addClass('customSelect')
					.addClass('menuBtn')
					.appendTo(menu);
				var selectOptions = $('<span>')
					.addClass('customSelectOptions')
					.appendTo(customSelect);
				var optionsList = $('<ul>')
					.appendTo(selectOptions);
				$('<li>')
					.text("language.")
					.appendTo(optionsList);

				$.each(langs, function(name,display){
					$('<li>')
						.text(display)
						.attr('data-language', name)
						.on("click", function() { Engine.switchLanguage(this); })
						.appendTo(optionsList);
				});
			}

			$('<span>')
				.addClass('appStore menuBtn')
				.text(_('get the app.'))
				.click(Engine.getApp)
				.appendTo(menu);

			$('<span>')
				.addClass('lightsOff menuBtn')
				.text(_('lights off.'))
				.click(Engine.turnLightsOff)
				.appendTo(menu);

			$('<span>')
				.addClass('hyper menuBtn')
				.text(_('hyper.'))
				.click(Engine.confirmHyperMode)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('restart.'))
				.click(Engine.confirmDelete)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('share.'))
				.click(Engine.share)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('save.'))
				.click(Engine.exportImport)
				.appendTo(menu);

			if(this.options.dropbox && Engine.Dropbox) {
				this.dropbox = Engine.Dropbox.init();

				$('<span>')
					.addClass('menuBtn')
					.text(_('dropbox.'))
					.click(Engine.Dropbox.startDropbox)
					.appendTo(menu);
			}

			$('<span>')
				.addClass('menuBtn')
				.text(_('github.'))
				.click(function() { window.open('https://github.com/doublespeakgames/adarkroom'); })
				.appendTo(menu);

			// Register keypress handlers
			$('body').off('keydown').keydown(Engine.keyDown);
			$('body').off('keyup').keyup(Engine.keyUp);

			// Register swipe handlers
			swipeElement = $('#outerSlider');
			swipeElement.on('swipeleft', Engine.swipeLeft);
			swipeElement.on('swiperight', Engine.swipeRight);
			swipeElement.on('swipeup', Engine.swipeUp);
			swipeElement.on('swipedown', Engine.swipeDown);

			// subscribe to stateUpdates
			$.Dispatch('stateUpdate').subscribe(Engine.handleStateUpdates);

			$SM.init();
			$SM.setTraitsAndMatch(ocean);
			Notifications.init();
			Events.init();
			Room.init();

			if(typeof $SM.get('stores.wood') != 'undefined') {
				Outside.init();
			}
			if($SM.get('stores.compass', true) > 0) {
				Path.init();
			}
			if($SM.get('features.location.spaceShip')) {
				Ship.init();
			}

			if($SM.get('config.lightsOff', true)){
					Engine.turnLightsOff();
			}

			if($SM.get('config.hyperMode', true)){
					Engine.triggerHyperMode();
			}

			Engine.saveLanguage();
			Engine.travelTo(Room);
		},

		browserValid: function() {
			return ( location.search.indexOf( 'ignorebrowser=true' ) >= 0 || ( typeof Storage != 'undefined' && !oldIE ) );
		},

		isMobile: function() {
			return ( location.search.indexOf( 'ignorebrowser=true' ) < 0 && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test( navigator.userAgent ) );
		},

		saveGame: function() {
			if(typeof Storage != 'undefined' && localStorage) {
				if(Engine._saveTimer != null) {
					clearTimeout(Engine._saveTimer);
				}
				if(typeof Engine._lastNotify == 'undefined' || Date.now() - Engine._lastNotify > Engine.SAVE_DISPLAY){
					$('#saveNotify').css('opacity', 1).animate({opacity: 0}, 1000, 'linear');
					Engine._lastNotify = Date.now();
				}
				localStorage.gameState = JSON.stringify(State);
			}
		},

		loadGame: function() {
			try {
				var savedState = JSON.parse(localStorage.gameState);
				if(savedState) {
					State = savedState;
					$SM.updateOldState();
					Engine.log("loaded save!");
				}
			} catch(e) {
				State = {};
				$SM.set('version', Engine.VERSION);
				Engine.event('progress', 'new game');
			}
		},

		exportImport: function() {
			Events.startEvent({
				title: _('Export / Import'),
				scenes: {
					start: {
						text: [
							_('export or import save data, for backing up'),
							_('or migrating computers')
						],
						buttons: {
							'export': {
								text: _('export'),
								nextScene: {1: 'inputExport'}
							},
							'import': {
								text: _('import'),
								nextScene: {1: 'confirm'}
							},
							'cancel': {
								text: _('cancel'),
								nextScene: 'end'
							}
						}
					},
					'inputExport': {
						text: [_('save this.')],
						textarea: Engine.export64(),
						onLoad: function() { Engine.event('progress', 'export'); },
						readonly: true,
						buttons: {
							'done': {
								text: _('got it'),
								nextScene: 'end',
								onChoose: Engine.disableSelection
							}
						}
					},
					'confirm': {
						text: [
							_('are you sure?'),
							_('if the code is invalid, all data will be lost.'),
							_('this is irreversible.')
						],
						buttons: {
							'yes': {
								text: _('yes'),
								nextScene: {1: 'inputImport'},
								onChoose: Engine.enableSelection
							},
							'no': {
								text: _('no'),
								nextScene: {1: 'start'}
							}
						}
					},
					'inputImport': {
						text: [_('put the save code here.')],
						textarea: '',
						buttons: {
							'okay': {
								text: _('import'),
								nextScene: 'end',
								onChoose: Engine.import64
							},
							'cancel': {
								text: _('cancel'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},

		generateExport64: function(){
			var string64 = Base64.encode(localStorage.gameState);
			string64 = string64.replace(/\s/g, '');
			string64 = string64.replace(/\./g, '');
			string64 = string64.replace(/\n/g, '');

			return string64;
		},

		export64: function() {
			Engine.saveGame();
			Engine.enableSelection();
			return Engine.generateExport64();
		},

		import64: function(string64) {
			Engine.event('progress', 'import');
			Engine.disableSelection();
			string64 = string64.replace(/\s/g, '');
			string64 = string64.replace(/\./g, '');
			string64 = string64.replace(/\n/g, '');
			var decodedSave = Base64.decode(string64);
			localStorage.gameState = decodedSave;
			location.reload();
		},

		event: function(cat, act) {
			if(typeof ga === 'function') {
				ga('send', 'event', cat, act);
			}
		},

		confirmDelete: function() {
			Events.startEvent({
				title: _('Restart?'),
				scenes: {
					start: {
						text: [_('restart the game?')],
						buttons: {
							'yes': {
								text: _('yes'),
								nextScene: 'end',
								onChoose: Engine.deleteSave
							},
							'no': {
								text: _('no'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},

		deleteSave: function(noReload) {
			if(typeof Storage != 'undefined' && localStorage) {
				var prestige = Prestige.get();
				window.State = {};
				localStorage.clear();
				Prestige.set(prestige);
			}
			if(!noReload) {
				location.reload();
			}
		},

		getApp: function() {
			Events.startEvent({
				title: _('Get the App'),
				scenes: {
					start: {
						text: [_('bring the room with you.')],
						buttons: {
							'ios': {
								text: _('ios'),
								nextScene: 'end',
								onChoose: function () {
									window.open('https://itunes.apple.com/app/apple-store/id736683061?pt=2073437&ct=adrproper&mt=8');
								}
							},
							'android': {
								text: _('android'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom');
								}
							}
						}
					}
				}
			})
		},

		share: function() {
			Events.startEvent({
				title: _('Share'),
				scenes: {
					start: {
						text: [_('bring your friends.')],
						buttons: {
							'facebook': {
								text: _('facebook'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://www.facebook.com/sharer/sharer.php?u=' + Engine.SITE_URL, 'sharer', 'width=626,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'google': {
								text:_('google+'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://plus.google.com/share?url=' + Engine.SITE_URL, 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'twitter': {
								text: _('twitter'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://twitter.com/intent/tweet?text=A%20Dark%20Room&url=' + Engine.SITE_URL, 'sharer', 'width=660,height=260,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'reddit': {
								text: _('reddit'),
								nextScene: 'end',
								onChoose: function() {
									window.open('http://www.reddit.com/submit?url=' + Engine.SITE_URL, 'sharer', 'width=960,height=700,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'close': {
								text: _('close'),
								nextScene: 'end'
							}
						}
					}
				}
			},
			{
				width: '400px'
			});
		},

		findStylesheet: function(title) {
			for(var i=0; i<document.styleSheets.length; i++) {
				var sheet = document.styleSheets[i];
				if(sheet.title == title) {
					return sheet;
				}
			}
			return null;
		},

		isLightsOff: function() {
			var darkCss = Engine.findStylesheet('darkenLights');
			if ( darkCss != null && !darkCss.disabled ) {
				return true;
			}
			return false;
		},

		turnLightsOff: function() {
			var darkCss = Engine.findStylesheet('darkenLights');
			if (darkCss == null) {
				$('head').append('<link rel="stylesheet" href="css/dark.css" type="text/css" title="darkenLights" />');
				$('.lightsOff').text(_('lights on.'));
				$SM.set('config.lightsOff', true, true);
			} else if (darkCss.disabled) {
				darkCss.disabled = false;
				$('.lightsOff').text(_('lights on.'));
				$SM.set('config.lightsOff', true,true);
			} else {
				$("#darkenLights").attr("disabled", "disabled");
				darkCss.disabled = true;
				$('.lightsOff').text(_('lights off.'));
				$SM.set('config.lightsOff', false, true);
			}
		},

		confirmHyperMode: function(){
			if (!Engine.options.doubleTime) {
				Events.startEvent({
					title: _('Go Hyper?'),
					scenes: {
						start: {
							text: [_('turning hyper mode speeds up the game to x2 speed. do you want to do that?')],
							buttons: {
								'yes': {
									text: _('yes'),
									nextScene: 'end',
									onChoose: Engine.triggerHyperMode
								},
								'no': {
									text: _('no'),
									nextScene: 'end'
								}
							}
						}
					}
				});
			} else {
				Engine.triggerHyperMode();
			}
		},

		triggerHyperMode: function() {
			Engine.options.doubleTime = !Engine.options.doubleTime;
			if(Engine.options.doubleTime)
				$('.hyper').text(_('classic.'));
			else
				$('.hyper').text(_('hyper.'));

			$SM.set('config.hyperMode', Engine.options.doubleTime, false);
		},

		// Gets a guid
		getGuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		},

		activeModule: null,

		travelTo: function(module) {
			if(Engine.activeModule != module) {
				var currentIndex = Engine.activeModule ? $('.location').index(Engine.activeModule.panel) : 1;
				$('div.headerButton').removeClass('selected');
				module.tab.addClass('selected');

				var slider = $('#locationSlider');
				var stores = $('#storesContainer');
				var panelIndex = $('.location').index(module.panel);
				var diff = Math.abs(panelIndex - currentIndex);
				slider.animate({left: -(panelIndex * 700) + 'px'}, 300 * diff);

				if($SM.get('stores.wood') !== undefined) {
				// FIXME Why does this work if there's an animation queue...?
					stores.animate({right: -(panelIndex * 700) + 'px'}, 300 * diff);
				}

				if(Engine.activeModule == Room || Engine.activeModule == Path) {
					// Don't fade out the weapons if we're switching to a module
					// where we're going to keep showing them anyway.
					if (module != Room && module != Path) {
						$('div#weapons').animate({opacity: 0}, 300);
					}
				}

				if(module == Room || module == Path) {
					$('div#weapons').animate({opacity: 1}, 300);
				}

				Engine.activeModule = module;
				module.onArrival(diff);
				Notifications.printQueue(module);

			}
		},

		/* Move the stores panel beneath top_container (or to top: 0px if top_container
		 * either hasn't been filled in or is null) using transition_diff to sync with
		 * the animation in Engine.travelTo().
		 */
		moveStoresView: function(top_container, transition_diff) {
			var stores = $('#storesContainer');

			// If we don't have a storesContainer yet, leave.
			if(typeof(stores) === 'undefined') return;

			if(typeof(transition_diff) === 'undefined') transition_diff = 1;

			if(top_container === null) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else if(!top_container.length) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else {
				stores.animate({
						top: top_container.height() + 26 + 'px'
					},
					{
						queue: false,
						duration: 300 * transition_diff
				});
			}
		},

		log: function(msg) {
			if(this._log) {
				console.log(msg);
			}
		},

		updateSlider: function() {
			var slider = $('#locationSlider');
			slider.width((slider.children().length * 700) + 'px');
		},

		updateOuterSlider: function() {
			var slider = $('#outerSlider');
			slider.width((slider.children().length * 700) + 'px');
		},

		getIncomeMsg: function(num, delay) {
			return _("{0} per {1}s", (num > 0 ? "+" : "") + num, delay);
			//return (num > 0 ? "+" : "") + num + " per " + delay + "s";
		},

		keyLock: false,
		tabNavigation: true,
		restoreNavigation: false,

		keyDown: function(e) {
			e = e || window.event;
			if(!Engine.keyPressed && !Engine.keyLock) {
				Engine.pressed = true;
				if(Engine.activeModule.keyDown) {
					Engine.activeModule.keyDown(e);
				}
			}
			return jQuery.inArray(e.keycode, [37,38,39,40]) < 0;
		},

		keyUp: function(e) {
			Engine.pressed = false;
			if(Engine.activeModule.keyUp) {
				Engine.activeModule.keyUp(e);
			} else {
				switch(e.which) {
					case 38: // Up
					case 87:
						if(Engine.activeModule == Outside || Engine.activeModule == Path) {
							Engine.activeModule.scrollSidebar('up');
						}
						Engine.log('up');
						break;
					case 40: // Down
					case 83:
						if (Engine.activeModule == Outside || Engine.activeModule == Path) {
							Engine.activeModule.scrollSidebar('down');
						}
						Engine.log('down');
						break;
					case 37: // Left
					case 65:
						if(Engine.tabNavigation){
							if(Engine.activeModule == Ship && Path.tab)
								Engine.travelTo(Path);
							else if(Engine.activeModule == Path && Outside.tab){
								Engine.activeModule.scrollSidebar('left', true);
								Engine.travelTo(Outside);
							}else if(Engine.activeModule == Outside && Room.tab){
								Engine.activeModule.scrollSidebar('left', true);
								Engine.travelTo(Room);
							}
						}
						Engine.log('left');
						break;
					case 39: // Right
					case 68:
						if(Engine.tabNavigation){
							if(Engine.activeModule == Room && Outside.tab)
								Engine.travelTo(Outside);
							else if(Engine.activeModule == Outside && Path.tab){
								Engine.activeModule.scrollSidebar('right', true);
								Engine.travelTo(Path);
							}else if(Engine.activeModule == Path && Ship.tab){
								Engine.activeModule.scrollSidebar('right', true);
								Engine.travelTo(Ship);
							}
						}
						Engine.log('right');
						break;
				}
			}
			if(Engine.restoreNavigation){
				Engine.tabNavigation = true;
				Engine.restoreNavigation = false;
			}
			return false;
		},

		swipeLeft: function(e) {
			if(Engine.activeModule.swipeLeft) {
				Engine.activeModule.swipeLeft(e);
			}
		},

		swipeRight: function(e) {
			if(Engine.activeModule.swipeRight) {
				Engine.activeModule.swipeRight(e);
			}
		},

		swipeUp: function(e) {
			if(Engine.activeModule.swipeUp) {
				Engine.activeModule.swipeUp(e);
			}
		},

		swipeDown: function(e) {
			if(Engine.activeModule.swipeDown) {
				Engine.activeModule.swipeDown(e);
			}
		},

		disableSelection: function() {
			document.onselectstart = eventNullifier; // this is for IE
			document.onmousedown = eventNullifier; // this is for the rest
		},

		enableSelection: function() {
			document.onselectstart = eventPassthrough;
			document.onmousedown = eventPassthrough;
		},

		autoSelect: function(selector) {
			$(selector).focus().select();
		},

		handleStateUpdates: function(e){

		},

		switchLanguage: function(dom){
			var lang = $(dom).data("language");
			if(document.location.href.search(/[\?\&]lang=[a-z_]+/) != -1){
				document.location.href = document.location.href.replace( /([\?\&]lang=)([a-z_]+)/gi , "$1"+lang );
			}else{
				document.location.href = document.location.href + ( (document.location.href.search(/\?/) != -1 )?"&":"?") + "lang="+lang;
			}
		},

		saveLanguage: function(){
			var lang = decodeURIComponent((new RegExp('[?|&]lang=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
			if(lang && typeof Storage != 'undefined' && localStorage) {
				localStorage.lang = lang;
			}
		},

		setInterval: function(callback, interval, skipDouble){
			if( Engine.options.doubleTime && !skipDouble ){
				Engine.log('Double time, cutting interval in half');
				interval /= 2;
			}

			return setInterval(callback, interval);

		},

		setTimeout: function(callback, timeout, skipDouble){

			if( Engine.options.doubleTime && !skipDouble ){
				Engine.log('Double time, cutting timeout in half');
				timeout /= 2;
			}

			return setTimeout(callback, timeout);

		},

		loadCondition: function(){
			var newpart = $('<p>')
				.text("Please click the number and letters on the note you got.")
				.attr('id','newpart')
				.prependTo('#wrapper');
			$('<div>')
				.attr('id','blah')
				.appendTo(newpart);
			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condOne()')
				.attr('value','One')
				.attr('id', 'butOne')
				.appendTo('#blah');
			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condTwo()')
				.attr('value','Two')
				.attr('id', 'butTwo')
				.appendTo('#blah');
		},

		loadQuiz: function(){

			

			var oq = ['OI see myself as someone who is inventive.', 
					'OI see myself as someone who is original, comes up with new ideas.', 
					'OI see myself as someone who values artistic, aesthetic experiences.',
					'OI see myself as someone who is curious about many different things.', 
					'OI see myself as someone who is ingenious, a deep thinker.',  
					'OI see myself as someone who likes to reflect, play with ideas.', 
					'OI see myself as someone who has an active imagination.',  
					'OI see myself as someone who is sophisticated in art, music, or literature.', 
					'*OI see myself as someone who prefers work that is routine.', 
					'*OI see myself as someone who has few artistic interests.'];
			var cq = ['CI see myself as someone who does a thorough job.', 
					'CI see myself as someone who perseveres until the task is finished.', 
					'CI see myself as someone who does things efficiently.', 
					'CI see myself as someone who is a reliable worker.', 
					'CI see myself as someone who makes plans and follows through with them.', 
					'*CI see myself as someone who tends to be disorganized.', 
					'*CI see myself as someone who is easily distracted.', 
					'*CI see myself as someone who tends to be lazy.', 
					'*CI see myself as someone who can be somewhat careless.'];
			var eq = ['EI see myself as someone who is talkative.',
					'EI see myself as someone who has an assertive personality.',
					'EI see myself as someone who is full of energy.',
					'EI see myself as someone who is outgoing, sociable.',
					'EI see myself as someone who generates a lot of enthusiasm.',
					'*EI see myself as someone who tends to be quiet.', 
					'*EI see myself as someone who is reserved.',
					'*EI see myself as someone who is sometimes shy, inhibited.'];
			var aq = ['AI see myself as someone who is helpful and unselfish with others.', 
					'AI see myself as someone who is considerate and kind to almost everyone.', 
					'AI see myself as someone who has a forgiving nature.', 
					'AI see myself as someone who likes to cooperate with others.', 
					'AI see myself as someone who is generally trusting.', 
					'*AI see myself as someone who tends to find fault with others.', 
					'*AI see myself as someone who can be cold and aloof.', 
					'*AI see myself as someone who starts quarrels with others.', 
					'*AI see myself as someone who is sometimes rude to others.'];
			var nq = ['NI see myself as someone who is depressed, blue.', 
					'NI see myself as someone who can be moody.', 
					'NI see myself as someone who can be tense.', 
					'NI see myself as someone who gets nervous easily.', 
					'NI see myself as someone who worries a lot.', 
					'*NI see myself as someone who is relaxed, handles stress well.', 
					'*NI see myself as someone who remains calm in tense situations.', 
					'*NI see myself as someone who is emotionally stable, not easily upset.'];
			var xq = ['XI would prefer complex to simple problems.',
					'XI like to have the responsibility of handling a situation that requires a lot of thinking.',
					'XThinking is not my idea of fun.',
					'XI would rather do something that requires little thought than something that is sure to challenge my thinking abilities.',
					'XI try to anticipate and avoid situations where there is likely a chance I will have to think in depth about something.',
					'XI find satisfaction in deliberating hard and for long hours.',
					'XI only think as hard as I have to.',
					'XI prefer to think about small, daily projects to long-term ones.',
					'XI like tasks that require little thought once I’ve learned them.',
					'XThe idea of relying on thought to make my way to the top appeals to me.',
					'XI really enjoy a task that involves coming up with new solutions to problems.',
					'XLearning new ways to think doesn’t excite me very much.',
					'XI prefer my life to be filled with puzzles that I must solve.',
					'XThe notion of thinking abstractly is appealing to me.',
					'XI would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.',
					'XI feel relief rather than satisfaction after completing a task that required a lot of mental effort.',
					'XIt’s enough for me that something gets the job done; I don’t care how or why it works.',
					'XI usually end up deliberating about issues even when they do not affect me personally.',
					'XI can always manage to solve difficult problems if I try hard enough.',
					'XIf someone opposes me, I can find the means and ways to get what I want.',
					'XIt is easy for me to stick to my aims and accomplish my goals.',
					'XI am confident that I could deal efficiently with unexpected events.',
					'XThanks to my resourcefulness, I know how to handle unforeseen situations.',
					'XI can solve most problems if I invest the necessary effort.',
					'XI can remain calm when facing difficulties because I can rely on my coping abilities.',
					'XWhen I am confronted with a problem, I can usually find several solutions.',
					'XIf I am in trouble, I can usually think of a solution.',
					'XI can usually handle whatever comes my way.',
					'XIn uncertain times, I usually expect the best.',
					'XI always look on the bright side of things.',
					'XI’m always optimistic about my future.',
					'XWhen I undertake something new, I expect to succeed.',
					'XWhere there’s a will, there’s a way.',
					'XIn general, things turn out alright in the end.', 
					'XIt is best not to get your hopes too high since you will probably be disappointed.',
					'XRarely do I expect good things to happen.',
					'XIf something can go wrong for me, it will.',
					'XI hardly ever expect things to go my way.',
					'XThings never work out the way I want them to.',
					'XIf I make a decision on my own, I can pretty much count on the fact that it will turn out to be a poor one.',
					'XI rarely count on good things happening to me.',
					'XBetter to expect defeat then it doesn’t hit so hard when it comes.']
			var reg = oq.concat(cq.concat(eq.concat(aq.concat(nq.concat(xq)))));

			var form = $('<form>')
				.attr('id','fm')
				.prependTo('#wrapper');
			$('<p>')
				.text("Welcome to Student Personality Data Project.")
				.appendTo('#fm');
			$('<p>')
				.text("Department of Advertising and Department of Psychology has initiated a longitude personality data collection in order to establish a panel database for further research projects. All the data will be kept anonymous, and will not be counted as your course performance.")
				.appendTo('#fm');
			/*$('<p>')
				.text("I see myself as someone who:")
				.appendTo('#fm');*/
			var ol = $('<ol>')
				.attr('id','quiz')
				.appendTo(form);

			var count = 0;

			while(reg.length){
				var pos = Math.floor((Math.random()*reg.length));
				count+=1;
				//2d array for q order, response
				var rev = reg[pos][0] === '*'; //legal?
				if(rev) reg[pos] = reg[pos].slice(1,reg[pos].length);
				var type = reg[pos][0];
				reg[pos] = reg[pos].slice(1,reg[pos].length);
				var id = 'q'+count.toString()

				var sdVal = '';
				var dVal = '';
				var naVal = type+'3';
				var aVal = '';
				var saVal = '';
				
				if(rev && type != 'X'){
					sdVal = type+'5';
					dVal = type+'4';
					aVal = type+'2';
					saVal = type+'1';
				} else if(!rev && type != 'X') {
					sdVal = type+'1';
					dVal = type+'2';
					aVal = type+'4';
					saVal = type+'5';
				} else {
					sdVal = type+'0';
					dVal = type+'0';
					naVal = type+'0';
					aVal = type+'0';
					saVal = type+'0';
				}
				
				$('<li>')
					.addClass('question')
					.addClass(type)
					.attr('id',id)
					.text(reg[pos])
					.appendTo(ol);
				var scale = $('<div>')
					.addClass('scale')
					.appendTo('#'+id);
				var sdWrap = $('<div>')
					.addClass('wrap')
					.appendTo(scale);
				$('<label>')
					.attr('for','sd'+id)
					.text('Strongly Disagree')
					.appendTo(sdWrap);
				$('<input>')
					.attr('type','radio')
					.attr('name',id)
					.attr('id','sd'+id)
					.attr('value',sdVal)
					.appendTo(sdWrap);
				var dWrap = $('<div>')
					.addClass('wrap')
					.appendTo(scale);
				$('<label>')
					.attr('for','d'+id)
					.text('Disagree')
					.appendTo(dWrap);
				$('<input>')
					.attr('type','radio')
					.attr('name',id)
					.attr('id','d'+id)
					.attr('value',dVal)
					.appendTo(dWrap);
				var naWrap = $('<div>')
					.addClass('wrap')
					.appendTo(scale);
				$('<label>')
					.attr('for','na'+id)
					.text('Neither Agree nor Disagree')
					.appendTo(naWrap);
				$('<input>')
					.attr('type','radio')
					.attr('name',id)
					.attr('id','na'+id)
					.attr('value',naVal)
					.appendTo(naWrap);
				var aWrap = $('<div>')
					.addClass('wrap')
					.appendTo(scale);
				$('<label>')
					.attr('for','a'+id)
					.text('Agree')
					.appendTo(aWrap);
				$('<input>')
					.attr('type','radio')
					.attr('name',id)
					.attr('id','a'+id)
					.attr('value',aVal)
					.appendTo(aWrap);
				var saWrap = $('<div>')
					.addClass('wrap')
					.appendTo(scale);
				$('<label>')
					.attr('for','sa'+id)
					.text('Strongly Agree')
					.appendTo(saWrap);
				$('<input>')
					.attr('type','radio')
					.attr('name',id)
					.attr('id','sa'+id)
					.attr('value',saVal)
					.appendTo(saWrap);

				
				reg.splice(pos,1);
				
			}
			$('<p>')
				.text('Thank you for helping us collecting data!')
				.appendTo(form);
			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.score()')
				.attr('value','Submit')
				.appendTo(form);

		},
	
		pause: async function(ocean) {

				function sleep(ms){
					return new Promise(resolve => setTimeout(resolve,ms));
				}

				var people = 'Oakley, Azariah, Landry, Skyler, Armani, Taylor, Briar, Lennon, Alex, Casey, Emory, Milan, Eden, Bodhi, Frankie, Dakota, Finley, Drew, Hayden'.split(",");
				Engine.x_name = people[Math.floor(Math.random() * people.length)];

				$('<p>')
					.attr('id','title')
					.addClass('persText')
					.text('Welcome to A Dark Room')
					.prependTo('#wrapper');
				if(Engine.cond[1] == 'A'){
					switch(Engine.cond[0]){
						case '1':
							$('<p>')
								.text('Based on the personality test, we have generated a virtual representation whose personality differs from yours.')
								.appendTo('#title');
							break;
						case '2':
							$('<p>')
								.text('Based on the personality test, we have generated a virtual representation whose personality is similar to yours.')
								.appendTo('#title');
						default:
							break;
					}
				} else {
					$('<p>')
						.text(_('This is a story about {0}\'s strange experiences in a new world.',Engine.x_name))
						.appendTo('#title');
				}


				await sleep(5000);
				$('#title').remove();
				Engine.completeInit(Engine.res);
				
		},

		ready: function(){
				$('#title').remove();
				Engine.completeInit(Engine.res);
				
		},
			
		score: function(){
			//clear is pure, * is anti, half chance of flipping their received config. 
			//pure is assigned on whether they score > mean on a trait
			//star is assigned on whether they score < mean on a trait
			function attribute(scores, letter){
				//console.log(_("scores {0}, letter {1}", scores, letter));
				//console.log(scores[0]+scores[1]);
				switch(letter){
					case "O":
						if(scores.reduce(sum) > 30) return letter;
						else if ( scores.reduce(sum) < 30) return '*'+letter;
						return '='+letter;
						break;
					case "E":
						if(scores.reduce(sum) > 24) return letter;
						else if ( scores.reduce(sum) < 24) return '*'+letter;
						return '='+letter;
						break;
					case "X":
						break;
					default:
						if(scores.reduce(sum) > 27) return letter;
						else if ( scores.reduce(sum) < 27) return '*'+letter;
						return '='+letter;
						break;
				}
			}

			function sum(total,num){
				return total + num;
			}

			var O = [];
			var C = [];
			var E = [];
			var A = [];
			var N = [];
			var x = [];
			for(var i=1; i<86; i++){
				var data = $('input[name=q'+i.toString()+']:checked').val();
				//update double array
				//console.log(data);
				switch(data[0]){
					case 'O':
						O.push(Number(data[1]));
						break;
					case 'C':
						C.push(Number(data[1]));
						break;
					case 'E':
						E.push(Number(data[1]));
						break;
					case 'A':
						A.push(Number(data[1]));
						break;
					case 'N':
						N.push(Number(data[1]));
						break;
					default:
						//console.log(_('x! {0}',data));
						x.push(data);
						break;
				}
			}
			var ocean = [];
			ocean.push(attribute(O,'O'));
			ocean.push(attribute(C,'C'));
			ocean.push(attribute(E,'E'));
			ocean.push(attribute(A,'A'));
			ocean.push(attribute(N,'N'));

			Engine.res = ocean;
			console.log(Engine.res);
			if(Engine.flipped == true) {
					for(var i=0; i<Engine.res.length; i++){
						if(Engine.res[i][0] === '*') Engine.res[i] = Engine.res[i][1];
						else if(Engine.res[i][0] === '='){
							if(Math.random() < 0.5) Engine.res[i] = '*'+Engine.res[i][1];
							else { Engine.res[i] = Engine.res[i][1];}
						}
						else{ Engine.res[i] = '*'+Engine.res[i]; }
					}
				}
			console.log(Engine.res);
			Engine.pause(ocean);
			$('#fm')
				.remove();

			
		},
		condOne: function(){
			Engine.cond ='1';
			console.log(Boolean(Engine.flipped));
			document.getElementById('butOne').style.visibility = 'hidden';
			document.getElementById('butTwo').style.visibility = 'hidden';

			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condA()')
				.attr('value','A')
				.attr('id','butA')
				.appendTo('#blah');
			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condB()')
				.attr('value','B')
				.attr('id','butB')
				.appendTo('#blah');
		},

		condTwo: function(){
			Engine.cond ='2';
			Engine.flipped = true;
			console.log(Boolean(Engine.flipped));
			document.getElementById('butOne').style.visibility = 'hidden';
			document.getElementById('butTwo').style.visibility = 'hidden';

			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condA()')
				.attr('value','A')
				.attr('id','butA')
				.appendTo('#blah');
			$('<input>')
				.attr('type','button')
				.attr('onclick','Engine.condB()')
				.attr('value','B')
				.attr('id','butB')
				.appendTo('#blah');
		},
		condA: function(){
			Engine.cond +='A';
			$('#newpart').remove();
			Engine.loadQuiz();
		},

		condB: function(){
			Engine.cond += 'B';
			$('#newpart').remove();
			Engine.loadQuiz();
		},

		decidePersonality: function(ocean){
			var desc = "";
			var people = 'Oakley, Azariah, Landry, Skyler, Armani, Taylor, Briar, Lennon, Alex, Casey, Emory, Milan, Eden, Bodhi, Frankie, Dakota, Finley, Drew, Hayden'.split(",");
			Engine.x_name = people[Math.floor(Math.random() * people.length)];
			
			switch(ocean[0]){
				case 'O':
					desc+=_("{0} always comes up with new ideas and is curious about many different things.",Engine.x_name);
					break;
				case '*O':
					desc+=_("{0} does not really have many artistic interests, and prefers work that is routine.",Engine.x_name);
					break;
				case '=O':
					desc+=_("{0} does not really have many artistic interests, and prefers work that is routine.",Engine.x_name);
					break;
				default:
					break;
			}
			switch(ocean[1]){
				case 'C':
					desc+=_("{0} is a reliable worker. {0} makes plans and follows through with them.",Engine.x_name);
					break;
				case '*C':
					desc+=_("{0} tends to be disorganized, and is easily distracted.",Engine.x_name);
					break;
				case '=C':
					desc+=_("{0} is a moderated reliable worker, but may also be disorganized.",Engine.x_name);
					break;
				default:
					break;

			}
			switch(ocean[2]){
				case 'E':
					desc+=_("{0} is talkative and full of energy.",Engine.x_name);
					break;
				case '*E':
					desc+=_("{0} tends to be quiet, and sometimes shy.",Engine.x_name);
					break;
				case '=E':
					desc+=_("{0} is sometimes talkative, but can also be quiet and shy.",Engine.x_name);
					break;
				default:
					break;

			}
			switch(ocean[3]){
				case 'A':
					desc+=_("{0} is considerate and kind to almost everyone, and is helpful and unselfish with others.",Engine.x_name);
					break;
				case '*A':
					desc+=_("{0} can be cold and aloof, and is sometimes rude to others.",Engine.x_name);
					break;
				case '=A':
					desc+=_("{0} can be kind to others, but can be cold and aloof sometimes as well.",Engine.x_name);
					break;
				default:
					break;

			}
			switch(ocean[4]){
				case 'N':
					desc+=_("{0} can be depressed, blue, and moody, and gets nervous easily.",Engine.x_name);
					break;
				case '*N':
					desc+=_("{0} is emotionally stable and remains calm in tense situations.",Engine.x_name);
					break;
				case '=N':
					desc+=_("{0} can be emotionally stable, but can get nervous easily as well.",Engine.x_name);
					break;
				default:
					break;

			}
			return desc;
		},

		cleanUp: function(){
			$('#content').remove();
			$('#notifications').remove();
			$('<p>')
				.attr('id','survey')
				.text("Thank you for participating in this experiment! Please finish this survey before leaving.")
				.appendTo('#wrapper');
			if(!Engine.flipped){
				$('<a>')
				.attr('href','https://mediaillinois.co1.qualtrics.com/SE/?SID=SV_1AoQcPD6sLX70Vv')
				.text("Click here!")
				.appendTo('#survey');
			} else {
				$('<a>')
				.attr('href','https://mediaillinois.co1.qualtrics.com/SE/?SID=SV_cZsy69CM4vS34gJ')
				.text("Click here!")
				.appendTo('#survey');
			}
		},

	};

	function eventNullifier(e) {
		return $(e.target).hasClass('menuBtn');
	}

	function eventPassthrough(e) {
		return true;
	}

})();

function inView(dir, elem){

		var scTop = $('#main').offset().top;
		var scBot = scTop + $('#main').height();

		var elTop = elem.offset().top;
		var elBot = elTop + elem.height();

		if( dir == 'up' ){
				// STOP MOVING IF BOTTOM OF ELEMENT IS VISIBLE IN SCREEN
				return ( elBot < scBot );
		}else if( dir == 'down' ){
				return ( elTop > scTop );
		}else{
				return ( ( elBot <= scBot ) && ( elTop >= scTop ) );
		}

}

function scrollByX(elem, x){

		var elTop = parseInt( elem.css('top'), 10 );
		elem.css( 'top', ( elTop + x ) + "px" );

}


//create jQuery Callbacks() to handle object events
$.Dispatch = function( id ) {
	var callbacks, topic = id && Engine.topics[ id ];
	if ( !topic ) {
		callbacks = jQuery.Callbacks();
		topic = {
				publish: callbacks.fire,
				subscribe: callbacks.add,
				unsubscribe: callbacks.remove
		};
		if ( id ) {
			Engine.topics[ id ] = topic;
		}
	}
	return topic;
};

$(function() {
	Engine.init();
});
