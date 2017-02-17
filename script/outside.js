/**
 * Module that registers the outdoors functionality
 */
var Outside = {
	name: _("Outside"),
	
	_STORES_OFFSET: 0,
	_GATHER_DELAY: 10,
	_TRAPS_DELAY: 90,
	_POP_DELAY: [0.5, 3],
	_HUT_ROOM: 4,
	_QUICK: 3,
	
	_INCOME: {
		'gatherer': {
			name: _('gatherer'),
			delay: 10,
			stores: {
				'wood': 1
			}
		},
		'hunter': {
			name: _('hunter'),
			delay: 10,
			stores: {
				'fur': 0.5,
				'meat': 0.5
			}
		},
		'trapper': {
			name: _('trapper'),
			delay: 10,
			stores: {
				'meat': -1,
				'bait': 1
			}
		},
		'tanner': {
			name: _('tanner'),
			delay: 10,
			stores: {
				'fur': -5,
				'leather': 1
			}
		},
		'charcutier': {
			name: _('charcutier'),
			delay: 10,
			stores: {
				'meat': -5,
				'wood': -5,
				'cured meat': 1
			}
		},
		'iron miner': {
			name: _('iron miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'iron': 1
			}
		},
		'coal miner': {
			name: _('coal miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'coal': 1
			}
		},
		'sulphur miner': {
			name: _('sulphur miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'sulphur': 1
			}
		},
		'steelworker': {
			name: _('steelworker'),
			delay: 10,
			stores: {
				'iron': -1,
				'coal': -1,
				'steel': 1
			}
		},
		'armourer': {
			name: _('armourer'),
			delay: 10,
			stores: {
				'steel': -1,
				'sulphur': -1,
				'bullets': 1
			}
		}
	},
	
	TrapDrops: [
		{
			rollUnder: 0.5,
			name: 'fur',
			message: _('scraps of fur')
		},
		{
			rollUnder: 0.75,
			name: 'meat',
			message: _('bits of meat')
		},
		{
			rollUnder: 0.85,
			name: 'scales',
			message: _('strange scales')
		},
		{
			rollUnder: 0.93,
			name: 'teeth',
			message: _('scattered teeth')
		},
		{
			rollUnder: 0.995,
			name: 'cloth',
			message: _('tattered cloth')
		},
		{
			rollUnder: 1.0,
			name: 'charm',
			message: _('a crudely made charm')
		}
	],
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		if(Engine._debug) {
			this._GATHER_DELAY = 0;
			this._TRAPS_DELAY = 0;
		}
		
		// Create the outside tab
		this.tab = Header.addLocation(_("A Deserted Land"), "outside", Outside);
		
		// Create the Outside panel
		this.panel = $('<div>').attr('id', "outsidePanel")
			.addClass('location')
			.appendTo('div#locationSlider');
		
		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Outside.handleStateUpdates);
		
		if(typeof $SM.get('features.location.outside') == 'undefined') {
			$SM.set('features.location.outside', true);
			if(!$SM.get('game.buildings')) $SM.set('game.buildings', {});
			if(!$SM.get('game.population')) $SM.set('game.population', 0);
			if(!$SM.get('game.workers')) $SM.set('game.workers', {});
		}
		
		/*this.updateVillage();
		Outside.updateWorkersView();
		Outside.updateVillageIncome();*/
		this.setTitle();
		Engine.updateSlider();
		
		// Create the gather button
		/*new Button.Button({
			id: 'gatherButton',
			text: _("gather wood"),
			click: Outside.gatherWood,
			cooldown: Outside._GATHER_DELAY,
			width: '80px'
		}).appendTo('div#outsidePanel');*/
		var arriveTownTimer = null;
		var _baseTimer = null;

		new Button.Button({
			id: 'walkCabinButton',
			text: _("walk around outside the cabin"),
			click: Outside.walkCabin,
			width: '80px'
		}).appendTo('div#outsidePanel');

		new Button.Button({
			id: 'exploreButton',
			text: _("go an exploration"),
			click: Outside.explore,
			width: '80px'
		}).appendTo('div#outsidePanel');

		new Button.Button({
			id: 'prepareButton',
			text: _("prepare for trip"),
			click: Outside.prepare,
			cooldown: Outside._GATHER_DELAY,
			width: '80px'
		}).appendTo('div#outsidePanel');


		new Button.Button({
			id: 'planButton',
			text: _("plan the trip"),
			click: Outside.plan,
			cooldown: 3,
			width: '80px'
		}).appendTo('div#outsidePanel');

		new Button.Button({
			id: 'collectButton',
			text: _("collect stuff"),
			click: Outside.collect,
			cooldown: 3,
			width: '80px'
		}).appendTo('div#outsidePanel');

		new Button.Button({
			id: 'walkTowardButton',
			text: _("walk towards town"),
			click: Outside.walk,
			width: '80px',
			cooldown: Outside._GATHER_DELAY,
		}).appendTo('div#outsidePanel');

		Outside.updateButtons();
		//Outside.updateTrapButton();

	},

	updateButtons: function(){
		var walkCabin = $('#walkCabinButton.button');
		var ex = $('#exploreButton.button');
		var plan = $('#planButton.button');
		var collect = $('#collectButton.button');
		var prep = $('#prepareButton.button');
		var walkTo = $('#walkTowardButton.button');
		
		walkCabin.hide();
		ex.hide();
		prep.hide();
		plan.hide();
		collect.hide();
		walkTo.hide();
	},

	enableButton: function(id){
		var butt = $(_('#{0}.button',id));
		butt.show();
		window.clearTimeout(Outside._baseTimer);
	},

	walkCabin: function(){
		Notifications.notify(Outside,_('There seems to be a small town at the horizon on the east.'));
		var wc = $('#walkCabinButton.button');
		var explore = $('#exploreButton.button');
		explore.show();
		wc.hide();
	},

 	explore: function(){
 		switch(Engine.res[2]){
 			case "E":
 				Notifications.notify(Outside,_('{0} has a strong and assertive personality.',Engine.x_name));
				Notifications.notify(Outside,_('{0} decides to go on an exploration trip.',Engine.x_name));
 				break;
 			case "*E":
 				Notifications.notify(Outside,_('{0} does not have a strong assertive personality.',Engine.x_name));
				Notifications.notify(Outside,_('{0} holds back own ideas, and always waits to be influenced by the others.', Engine.x_name));
				Notifications.notify(Outside,_('After sometime of hesitating, {0} finally decides to go on an exploration trip.',Engine.x_name));
 				break;
 			case "=E":
 				Notifications.notify(Outside,_('{0} sometimes is assertive and sometimes is not.',Engine.x_name));
				Notifications.notify(Outside,_('{0} decides to go on an exploration trip.',Engine.x_name));
 				break;
 			default:
 				break;
 		}
 		var ex = $('#exploreButton.button');
 		var prep = $('#prepareButton.button');
		prep.show();
		ex.hide();
 	},

	prepare: function(){
		var plan =  $('#planButton.button');
		var collect = $('#collectButton.button');
		var prepare = $('#prepareButton.button');
		plan.show();
		collect.show();
		prepare.hide();
	},

 	plan: function(){
		switch(Engine.res[1]){
			case "C":
				Notifications.notify(Outside,_('{0} plans every detail of the trip.',Engine.x_name));
				Notifications.notify(Outside,_('{0} decides to leave at 10 AM.',Engine.x_name));
				break;
			case "*C":
				Notifications.notify(Outside,_('{0} doesn’t like to make plans.',Engine.x_name));
				Notifications.notify(Outside,_('{0} prefers to be more flexible, so {0} decides to leave approximately some time between 10 AM to 11 AM.',Engine.x_name));
				break;
			case "=C":
				Notifications.notify(Outside,_('{0} sometimes follows a schedule, but sometimes not.',Engine.x_name));
				Notifications.notify(Outside,_('{0} made a rough schedule, and decides to leave approximately at 10 AM.',Engine.x_name));
				break;
			default:
				break;
		}

	},

	collect: function(){
		switch(Engine.res[1]){
			case "C":
				Notifications.notify(Outside,_('{0} makes a list of things that need to be brought.',Engine.x_name));
				Notifications.notify(Outside,_('{0} picks up a compass, some matches, and a travelling bag, and efficiently packs the bag a long time before the trip.',Engine.x_name));
				break;
			case "*C":
				Notifications.notify(Outside,_('{0} cannot find the compass.',Engine.x_name));
				Notifications.notify(Outside,_('{0} remembers use it sometimes and forgets to put it back in its proper place.',Engine.x_name));
				Notifications.notify(Outside,_('{0} pours the whole bag out, and finds the compass among a bunch of things.',Engine.x_name));
				Notifications.notify(Outside,_('{0} didn’t get ready until the very last minute.',Engine.x_name));
				Notifications.notify(Outside,_('{0} grabs all the stuff right before starting the trip.',Engine.x_name));
				break;
			case "=C":
				Notifications.notify(Outside,_('{0} sometimes can keep the stuff organized, but sometime can be very messy.',Engine.x_name)); 
				Notifications.notify(Outside,_('{0} packs the bag ok this time.',Engine.x_name));
				Notifications.notify(Outside,_('{0 loosely packs all the things, not in a super organized way, but still keeping everything together.',Engine.x_name));
				break;
			default:
				break;
		}
		var collect = $('#collectButton.button');
		var plan = $('#planButton.button');
		collect.hide();
		plan.hide();
		Outside._baseTimer = Engine.setTimeout(Outside.enableButton.bind(null,'walkTowardButton'),3*1000);
	},

	walk: function(){
		switch(Engine.res[1]){
			case "C":
				Notifications.notify(Outside,_('{0} has been hiking for about an hour.',Engine.x_name));
				Notifications.notify(Outside,_('{0} carries out the plan strictly.',Engine.x_name));
				Notifications.notify(Outside,_('It’s 11 AM. {0} rests for 10 minutes according to the plan.',Engine.x_name));
				break;
			case "*C":
				Notifications.notify(Outside,_('{0} wastes some time on the way.',Engine.x_name));
				Notifications.notify(Outside,_('{0} is distracted by an interesting plant.',Engine.x_name));
				Notifications.notify(Outside,_('{0} rests whenever {0} wishes to.',Engine.x_name));
				Notifications.notify(Outside,_('{0} suddenly finds that the backup torch is lost somewhere along the trip.',Engine.x_name));
				Notifications.notify(Outside,_('{0} is always leaving belongings around.',Engine.x_name));
				break;
			case "=C":
				Notifications.notify(Outside,_('{0} sometimes can carry out the plan, but sometimes can’t get down to work.',Engine.x_name));
				Notifications.notify(Outside,_('{0} is roughly on schedule, a little bit behind, but not by much.',Engine.x_name));
				break;
			default:
				break;	
		}
		Outside.arriveTownTimer = Engine.setTimeout(Outside.displayTown,6*1000);
		var walkTo = $('#walkTowardButton.button');
		Button.setDisabled(walkTo,true);
	},

	displayTown: function(){
		Path.init();
		Notifications.notify(Outside,_('After hiking for two hours, a small town lays ahead.',Engine.x_name));
		switch(Engine.res[0]){
			case "O":
				Notifications.notify(Outside,_('{0} is so excited about entering the town.',Engine.x_name));
				break;
			case "*O":
				Notifications.notify(Outside,_('{0} does not feel excited about entering the town.',Engine.x_name));
				Notifications.notify(Outside,_('{0} does not like new adventure in general.',Engine.x_name));
				break;
			case "=O":
				Notifications.notify(Outside,_('{0} feels okay about entering the town.',Engine.x_name));
				Notifications.notify(Outside,_('But {0} still wants to enter the small town.',Engine.x_name));
				break;
			default:
				break;
		}
		switch(Engine.res[2]){
			case "E":
				Notifications.notify(Outside,_('{0} is so excited about finally getting a chance to meet some other people.',Engine.x_name));
				break;
			case "*E":
				Notifications.notify(Outside,_('{0} wishes to explore the town without encountering any other people.',Engine.x_name));
				break;
			case "=E":
				Notifications.notify(Outside,_('{0} is fine regardless of whether {0} encounters some people or not.',Engine.x_name));
				break;
			default:
				break;
		}

	},

	getMaxPopulation: function() {
		return $SM.get('game.buildings["hut"]', true) * Outside._HUT_ROOM;
	},
	
	increasePopulation: function() {
		var space = Outside.getMaxPopulation() - $SM.get('game.population');
		if(space > 0) {
			var num = Math.floor(Math.random()*(space/2) + space/2);
			if(num === 0) num = 1;
			if(num == 1) {
				Notifications.notify(null, _('a stranger arrives in the night'));
			} else if(num < 5) {
				Notifications.notify(null, _('a weathered family takes up in one of the huts.'));
			} else if(num < 10) {
				Notifications.notify(null, _('a small group arrives, all dust and bones.'));
			} else if(num < 30) {
				Notifications.notify(null, _('a convoy lurches in, equal parts worry and hope.'));
			} else {
				Notifications.notify(null, _("the town's booming. word does get around."));
			}
			Engine.log('population increased by ' + num);
			$SM.add('game.population', num);
		}
		Outside.schedulePopIncrease();
	},
	
	killVillagers: function(num) {
		$SM.add('game.population', num * -1);
		if($SM.get('game.population') < 0) {
			$SM.set('game.population', 0);
		}
		var remaining = Outside.getNumGatherers();
		if(remaining < 0) {
			var gap = -remaining;
			for(var k in $SM.get('game.workers')) {
				var numWorkers = $SM.get('game.workers["'+k+'"]');
				if(numWorkers < gap) {
					gap -= numWorkers;
					$SM.set('game.workers["'+k+'"]', 0);
				} else {
					$SM.add('game.workers["'+k+'"]', gap * -1);
					break;
				}
			}
		}
	},
	
	destroyHuts: function(num, allowEmpty) {
		var dead = 0;
		for(var i = 0; i < num; i++){
			var population = $SM.get('game.population', true);
			var rate = population / Outside._HUT_ROOM;
			var full = Math.floor(rate);
			// by default this is used to destroy full or half-full huts
			// pass allowEmpty to include empty huts in the armageddon
			var huts = (allowEmpty) ? $SM.get('game.buildings["hut"]', true) : Math.ceil(rate);
			if(!huts) {
				break;
			}
			// random can be 0 but not 1; however, 0 as a target is useless
			var target = Math.floor(Math.random() * huts) + 1;
			var inhabitants = 0;
			if(target <= full){
				inhabitants = Outside._HUT_ROOM;
			} else if(target == full + 1){
				inhabitants = population % Outside._HUT_ROOM;
			}
			$SM.set('game.buildings["hut"]', ($SM.get('game.buildings["hut"]') - 1));
			if(inhabitants){
				Outside.killVillagers(inhabitants);
				dead += inhabitants;
			}
		}
		// this method returns the total number of victims, for further actions
		return dead;
	},
	
	schedulePopIncrease: function() {
		var nextIncrease = Math.floor(Math.random()*(Outside._POP_DELAY[1] - Outside._POP_DELAY[0])) + Outside._POP_DELAY[0];
		Engine.log('next population increase scheduled in ' + nextIncrease + ' minutes');
		Outside._popTimeout = Engine.setTimeout(Outside.increasePopulation, nextIncrease * 60 * 1000);
	},
	
	updateWorkersView: function() {
		var workers = $('div#workers');

		// If our population is 0 and we don't already have a workers view,
		// there's nothing to do here.
		if(!workers.length && $SM.get('game.population') === 0) return;

		var needsAppend = false;
		if(workers.length === 0) {
			needsAppend = true;
			workers = $('<div>').attr('id', 'workers').css('opacity', 0);
		}
		
		var numGatherers = $SM.get('game.population');
		var gatherer = $('div#workers_row_gatherer', workers);
		
		for(var k in $SM.get('game.workers')) {
			var lk = _(k);
			var workerCount = $SM.get('game.workers["'+k+'"]');
			var row = $('div#workers_row_' + k.replace(' ', '-'), workers);
			if(row.length === 0) {
				row = Outside.makeWorkerRow(k, workerCount);
				
				var curPrev = null;
				workers.children().each(function(i) {
					var child = $(this);
					var cName = child.children('.row_key').text();
					if(cName != 'gatherer') {
						if(cName < lk) {
							curPrev = child.attr('id');
						}
					}
				});
				if(curPrev == null && gatherer.length === 0) {
					row.prependTo(workers);
				} else if(curPrev == null) {
					row.insertAfter(gatherer);
				} else {
					row.insertAfter(workers.find('#'+ curPrev));
				}
				
			} else {
				$('div#' + row.attr('id') + ' > div.row_val > span', workers).text(workerCount);
			}
			numGatherers -= workerCount;
			if(workerCount === 0) {
				$('.dnBtn', row).addClass('disabled');
				$('.dnManyBtn', row).addClass('disabled');
			} else {
				$('.dnBtn', row).removeClass('disabled');
				$('.dnManyBtn', row).removeClass('disabled');
			}
		}
		
		if(gatherer.length === 0) {
			gatherer = Outside.makeWorkerRow('gatherer', numGatherers);
			gatherer.prependTo(workers);
		} else {
			$('div#workers_row_gatherer > div.row_val > span', workers).text(numGatherers);
		}
		
		if(numGatherers === 0) {
			$('.upBtn', '#workers').addClass('disabled');
			$('.upManyBtn', '#workers').addClass('disabled');
		} else {
			$('.upBtn', '#workers').removeClass('disabled');
			$('.upManyBtn', '#workers').removeClass('disabled');
		}
		
		
		if(needsAppend && workers.children().length > 0) {
			workers.appendTo('#outsidePanel').animate({opacity:1}, 300, 'linear');
		}
	},
	
	getNumGatherers: function() {
		var num = $SM.get('game.population'); 
		for(var k in $SM.get('game.workers')) {
			num -= $SM.get('game.workers["'+k+'"]');
		}
		return num;
	},
	
	makeWorkerRow: function(key, num) {
		name = Outside._INCOME[key].name;
		if(!name) name = key;
		var row = $('<div>')
			.attr('key', key)
			.attr('id', 'workers_row_' + key.replace(' ','-'))
			.addClass('workerRow');
		$('<div>').addClass('row_key').text(name).appendTo(row);
		var val = $('<div>').addClass('row_val').appendTo(row);
		
		$('<span>').text(num).appendTo(val);
		
		if(key != 'gatherer') {
			$('<div>').addClass('upBtn').appendTo(val).click([1], Outside.increaseWorker);
			$('<div>').addClass('dnBtn').appendTo(val).click([1], Outside.decreaseWorker);
			$('<div>').addClass('upManyBtn').appendTo(val).click([10], Outside.increaseWorker);
			$('<div>').addClass('dnManyBtn').appendTo(val).click([10], Outside.decreaseWorker);
		}
		
		$('<div>').addClass('clear').appendTo(row);
		
		var tooltip = $('<div>').addClass('tooltip bottom right').appendTo(row);
		var income = Outside._INCOME[key];
		for(var s in income.stores) {
			var r = $('<div>').addClass('storeRow');
			$('<div>').addClass('row_key').text(_(s)).appendTo(r);
			$('<div>').addClass('row_val').text(Engine.getIncomeMsg(income.stores[s], income.delay)).appendTo(r);
			r.appendTo(tooltip);
		}
		
		return row;
	},
	
	increaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if(Outside.getNumGatherers() > 0) {
			var increaseAmt = Math.min(Outside.getNumGatherers(), btn.data);
			Engine.log('increasing ' + worker + ' by ' + increaseAmt);
			$SM.add('game.workers["'+worker+'"]', increaseAmt);
		}
	},
	
	decreaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if($SM.get('game.workers["'+worker+'"]') > 0) {
			var decreaseAmt = Math.min($SM.get('game.workers["'+worker+'"]') || 0, btn.data);
			Engine.log('decreasing ' + worker + ' by ' + decreaseAmt);
			$SM.add('game.workers["'+worker+'"]', decreaseAmt * -1);
		}
	},
	
	updateVillageRow: function(name, num, village) {
		var id = 'building_row_' + name.replace(' ', '-');
		var lname = _(name);
		var row = $('div#' + id, village);
		if(row.length === 0 && num > 0) {
			row = $('<div>').attr('id', id).addClass('storeRow');
			$('<div>').addClass('row_key').text(lname).appendTo(row);
			$('<div>').addClass('row_val').text(num).appendTo(row);
			$('<div>').addClass('clear').appendTo(row);
			var curPrev = null;
			village.children().each(function(i) {
				var child = $(this);
				if(child.attr('id') != 'population') {
					var cName = child.children('.row_key').text();
					if(cName < lname) {
						curPrev = child.attr('id');
					}
				}
			});
			if(curPrev == null) {
				row.prependTo(village);
			} else {
				row.insertAfter('#' + curPrev);
			}
		} else if(num > 0) {
			$('div#' + row.attr('id') + ' > div.row_val', village).text(num);
		} else if(num === 0) {
			row.remove();
		}
	},
	
	updateVillage: function(ignoreStores) {
		var village = $('div#village');
		var population = $('div#population');
		var needsAppend = false;
		if(village.length === 0) {
			needsAppend = true;
			village = $('<div>').attr('id', 'village').css('opacity', 0);
			population = $('<div>').attr('id', 'population').appendTo(village);
		}
		
		for(var k in $SM.get('game.buildings')) {
			if(k == 'trap') {
				var numTraps = $SM.get('game.buildings["'+k+'"]');
				var numBait = $SM.get('stores.bait', true);
				var traps = numTraps - numBait;
				traps = traps < 0 ? 0 : traps;
				Outside.updateVillageRow(k, traps, village);
				Outside.updateVillageRow('baited trap', numBait > numTraps ? numTraps : numBait, village);
			} else {
				if(Outside.checkWorker(k)) {
					Outside.updateWorkersView();
				}
				Outside.updateVillageRow(k, $SM.get('game.buildings["'+k+'"]'), village);
			}
		}
		/// TRANSLATORS : pop is short for population.
		population.text(_('pop ') + $SM.get('game.population') + '/' + this.getMaxPopulation());
		
		var hasPeeps;
		if($SM.get('game.buildings["hut"]', true) === 0) {
			hasPeeps = false;
			village.attr('data-legend', _('forest'));
		} else {
			hasPeeps = true;
			village.attr('data-legend', _('village'));
		}
		
		if(needsAppend && village.children().length > 1) {
			village.prependTo('#outsidePanel');
			village.animate({opacity:1}, 300, 'linear');
		}
		
		if(hasPeeps && typeof Outside._popTimeout == 'undefined') {
			Outside.schedulePopIncrease();
		}
		
		this.setTitle();

		if(!ignoreStores && Engine.activeModule === Outside && village.children().length > 1) {
			$('#storesContainer').css({top: village.height() + 26 + Outside._STORES_OFFSET + 'px'});
		}
	},
	
	checkWorker: function(name) {
		var jobMap = {
			'lodge': ['hunter', 'trapper'],
			'tannery': ['tanner'],
			'smokehouse': ['charcutier'],
			'iron mine': ['iron miner'],
			'coal mine': ['coal miner'],
			'sulphur mine': ['sulphur miner'],
			'steelworks': ['steelworker'],
			'armoury' : ['armourer']
		};
		
		var jobs = jobMap[name];
		var added = false;
		if(typeof jobs == 'object') {
			for(var i = 0, len = jobs.length; i < len; i++) {
				var job = jobs[i];
				if(typeof $SM.get('game.buildings["'+name+'"]') == 'number' && 
						typeof $SM.get('game.workers["'+job+'"]') != 'number') {
					Engine.log('adding ' + job + ' to the workers list');
					$SM.set('game.workers["'+job+'"]', 0);
					added = true;
				}
			}
		}
		return added;
	},
	
	updateVillageIncome: function() {		
		for(var worker in Outside._INCOME) {
			var income = Outside._INCOME[worker];
			var num = worker == 'gatherer' ? Outside.getNumGatherers() : $SM.get('game.workers["'+worker+'"]');
			if(typeof num == 'number') {
				var stores = {};
				if(num < 0) num = 0;
				var tooltip = $('.tooltip', 'div#workers_row_' + worker.replace(' ', '-'));
				tooltip.empty();
				var needsUpdate = false;
				var curIncome = $SM.getIncome(worker);
				for(var store in income.stores) {
					stores[store] = income.stores[store] * num;
					if(curIncome[store] != stores[store]) needsUpdate = true;
					var row = $('<div>').addClass('storeRow');
					$('<div>').addClass('row_key').text(_(store)).appendTo(row);
					$('<div>').addClass('row_val').text(Engine.getIncomeMsg(stores[store], income.delay)).appendTo(row);
					row.appendTo(tooltip);
				}
				if(needsUpdate) {
					$SM.setIncome(worker, {
						delay: income.delay,
						stores: stores
					});
				}
			}
		}
		Room.updateIncomeView();
	},
	
	updateTrapButton: function() {
		var btn = $('div#trapsButton');
		if($SM.get('game.buildings["trap"]', true) > 0) {
			if(btn.length === 0) {
				new Button.Button({
					id: 'trapsButton',
					text: _("check traps"),
					click: Outside.checkTraps,
					cooldown: Outside._TRAPS_DELAY,
					width: '80px'
				}).appendTo('div#outsidePanel');
			} else {
				Button.setDisabled(btn, false);
			}
		} else {
			if(btn.length > 0) {
				Button.setDisabled(btn, true);
			}
		}
	},
	
	setTitle: function() {
		var numHuts = $SM.get('game.buildings["hut"]', true);
		var title;
		if(numHuts === 0) {
			title = _("A Deserted Land");
		} else if(numHuts == 1) {
			title = _("A Lonely Hut");
		} else if(numHuts <= 4) {
			title = _("A Tiny Village");
		} else if(numHuts <= 8) {
			title = _("A Modest Village");
		} else if(numHuts <= 14) {
			title = _("A Large Village");
		} else {
			title = _("A Raucous Village");
		}
		
		if(Engine.activeModule == this) {
			document.title = title;
		}
		$('#location_outside').text(title);
	},
	
	onArrival: function(transition_diff) {
		Outside.setTitle();
		if(!$SM.get('game.outside.seenForest')) {
			//Notifications.notify(Outside, _("the sky is grey and the wind blows relentlessly"));
			$SM.set('game.outside.seenForest', true);
		}
		Outside.updateTrapButton();
		Outside.updateVillage(true);

		Engine.moveStoresView($('#village'), transition_diff);
	},
	
	gatherWood: function() {
		Notifications.notify(Outside, _("dry brush and dead branches litter the forest floor"));
		var gatherAmt = $SM.get('game.buildings["cart"]', true) > 0 ? 50 : 10;
		$SM.add('stores.wood', gatherAmt);
	},

	checkTraps: function() {
		var drops = {};
		var msg = [];
		var numTraps = $SM.get('game.buildings["trap"]', true);
		var numBait = $SM.get('stores.bait', true);
		var numDrops = numTraps + (numBait < numTraps ? numBait : numTraps);
		for(var i = 0; i < numDrops; i++) {
			var roll = Math.random();
			for(var j in Outside.TrapDrops) {
				var drop = Outside.TrapDrops[j];
				if(roll < drop.rollUnder) {
					var num = drops[drop.name];
					if(typeof num == 'undefined') {
						num = 0;
						msg.push(drop.message);
					}
					drops[drop.name] = num + 1;
					break;
				}
			}
		}
		/// TRANSLATORS : Mind the whitespace at the end.
		var s = _('the traps contain ');
		for(var i = 0, len = msg.length; i < len; i++) {
			if(len > 1 && i > 0 && i < len - 1) {
				s += ", ";
			} else if(len > 1 && i == len - 1) {
				/// TRANSLATORS : Mind the whitespaces at the beginning and end.
				s += _(" and ");
			}
			s += msg[i];
		}
		
		var baitUsed = numBait < numTraps ? numBait : numTraps;
		drops['bait'] = -baitUsed;
		
		Notifications.notify(Outside, s);
		$SM.addM('stores', drops);
	},
	
	handleStateUpdates: function(e){
		if(e.category == 'stores'){
			Outside.updateVillage();
		} else if(e.stateName.indexOf('game.workers') === 0 || e.stateName.indexOf('game.population') === 0){
			Outside.updateVillage();
			Outside.updateWorkersView();
			Outside.updateVillageIncome();
		};
	},

	scrollSidebar: function(direction, reset) {

		if( typeof reset != "undefined" ){
			$('#village').css('top', '0px');
			$('#storesContainer').css('top', '224px');
			Outside._STORES_OFFSET = 0;
			return false;
		}

		var momentum = 10;
		
		// If they hit up, we scroll everything down
		if( direction == 'up' )
			momentum = momentum * -1;

		/* Let's stop scrolling if the top or bottom bound is in the viewport, based on direction */
		if( direction == 'down' && inView( direction, $('#village') ) ){

			return false;

		}else if( direction == 'up' && inView( direction, $('#storesContainer') ) ){

			return false;

		}
		
		scrollByX( $('#village'), momentum );
		scrollByX( $('#storesContainer'), momentum );
		Outside._STORES_OFFSET += momentum;

	}
};
