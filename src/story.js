/**
 An object representing the entire story. After the document has completed
 loading, an instance of this class will be available at `window.story`.

 @class Story
 @constructor
**/

'use strict';
var $ = require('jquery');
var _ = require('underscore');
var LZString = require('lz-string');

var Story = function() {
	//Find the story and infer the Twine version.

	var el, twVersion, selectorAuthor, selectorCSS, selectorScript, selectorSubtitle;

	if ($('tw-storydata').length > 0) {
		el = $('tw-storydata');
		twVersion = 2;
		selectorAuthor = 'tw-passagedata[name=StoryAuthor]';
		selectorCSS = '*[type="text/twine-css"]';
		selectorScript = '*[type="text/twine-javascript"]';
		selectorSubtitle = 'tw-passagedata[name=StorySubtitle]';
	} else {
		el = $('#storeArea');
		twVersion = 1;
		selectorAuthor = 'div[tiddler=StoryAuthor]';
		selectorCSS = '*[tags*="stylesheet"]';
		selectorScript = '*[tags*="script"]';
		selectorSubtitle = 'div[tiddler=StorySubtitle]';
	}

	// set up basic properties

	this.el = el;

	/**
	 The name of the story.
	 @property name
	 @type String
	 @readonly
	**/

	this.name = twVersion == 2 ? el.attr('name') : el.find("div[tiddler=StoryTitle]").text();

	/**
	 The subtitle of the story.
	 @property subtitle
	 @type String
	 @readonly
	**/

	this.subtitle = el.find(selectorSubtitle).html();

	/**
	 The name of the author.
	 @property author
	 @type String
	 @readonly
	**/

	this.author = el.find(selectorAuthor).text();

	/**
	 The ID of the first passage to be displayed.
	 @property startPassage
	 @type Number
	 @readonly
	**/

	this.startPassage = twVersion == 2 ? parseInt(el.attr('startnode')) : $('[tiddler=Start]').index();

	/**
	 The program that created this story.

	 @property creator
	 @type String
	 @readonly
	**/

	this.creator = el.attr('creator');

	/**
	 The version of the program used to create this story.

	 @property creatorVersion
	 @type String
	 @readOnly
	**/

	this.creatorVersion = el.attr('creator-version');
	
	// initialize history and state

	/**
	 An array of passage IDs, one for each passage viewed during the current
	 session.

	 @property history
	 @type Array
	 @readOnly
	**/

	this.history = [];

	/**
	 An array of passages as jq objects, one for each passage viewed 
	 during the current
	 session.

	 @property history_dom
	 @type Array
	 @readOnly
	**/

	this.history_dom = [];

	/**
	 An array of passages (jQ objects), one for each passage viewed 
	 since the last response.

	 @property recent_dom
	 @type Array
	**/

	this.recent_dom = [];

	/**
         An array of passage IDs, one for each passage viewed since 
	 the last response.

         @property recent
         @type Array
        **/

        this.recent = [];

	/**
	 An object that stores data that persists across a single user session.
	 Any other variables will not survive the user pressing back or forward.

	 @property state
	 @type Object
	**/

	this.state = {};

	/**
	 An array of {history, history_dom, state} pairs for use in the
	 undo history.

	 @property undoHistory
	 @type Array
	**/

	this.undoHistory = [];

	/**
	 If set to true, then any JavaScript errors are ignored -- normally, play
	 would end with a message shown to the user. 

	 @property ignoreErrors
	 @type Boolean
	**/

	this.ignoreErrors = false;

	/**
	 The message shown to users when there is an error and ignoreErrors is not
	 true. Any %s in the message will be interpolated as the actual error
	 messsage.

	 @property errorMessage
	 @type String
	**/

	this.errorMessage = '\u26a0 %s';

	// create passage objects

	/**
	 An array of all passages, indexed by ID.

	 @property passages
	 @type Array
	**/

	this.passages = [];

	/**
	 A number representing the ID of the setTimeout() timer for a
	 typing event.

	 @property delayedTypingEvent
	 @type Number
	**/

	this.delayedTypingEvent = null;

	/**
	 A number representing the ID of the setTimeout() timer for
	 a passage display event.

	 @property delayedPassageEvent
	 @type Number
	**/

	this.delayedPassageEvent = null;

	var p = this.passages;

	if (twVersion == 2) {
		el.children('tw-passagedata').each(function(el) {
			var $t = $(this);
			var id = parseInt($t.attr('pid'));
			var tags = $t.attr('tags');
			
			p[id] = new Passage(
				id,
				$t.attr('name'),
				(tags !== '' && tags !== undefined) ? tags.split(' ') : [],
				$t.html()
			);
		});
	} else {
		el.children('*[tiddler]').each(function (index,el) {
			var $t = $(el);
			var id = index;
			var tags = $.trim($t.attr('tags'));

			p[id] = new Passage(
				id,
				$t.attr('tiddler'),
				(tags !== '' && tags !== undefined) ? tags.split(' ') : [],
				$t.html().replace(/\\n/g, '\n')
			);

		});

		$('title').html(this.name);
		$('#ptitle').html(this.name);

	}

	/**
	 An array of user-specific scripts to run when the story is begun.

	 @property userScripts
	 @type Array
	**/

	this.userScripts = _.map(
		el.children(selectorScript),
		function(el) {
			return $(el).html();
		}
	);

	/**
	 An array of user-specific style declarations to add when the story is begun.

	 @property userStyles
	 @type Array
	**/

	this.userStyles = _.map(
		el.children(selectorCSS),
		function(el) {
			return $(el).html();
		}
	);
};

_.extend(Story.prototype, {
	/**
	 Begins playing this story.

	 @method start
	**/

	start: function() {
		// Initialize special passages.
		$('#psubtitle').html(this.subtitle);
		if (this.author)
			$('#pauthor').html(' by ' + this.author);

		// set up history event handler

		$('#nav-link-undo').on('click', function(event) {
			var undoState = this.undoHistory.pop();

			if (undoState) {
				this.state = undoState.state;
				this.history_dom = undoState.history_dom;
				this.history = undoState.history;

				/* undoHistory is only pushed to after a 
				 * user response. To undo the visual history,
				 * we need to remove elements not in
				 * history_dom, then remove the previous 
				 * element and show it again, to update the 
				 * internal state and display user responses.
				 */

				this.clearUserResponses();
				if (this.delayedTypingEvent !== null) {
					clearTimeout(this.delayedTypingEvent);
					this.delayedTypingEvent = null;
				}
				this.hideTyping();
				if (this.delayedPassageEvent !== null) {
					clearTimeout(this.delayedPassageEvent);
					this.delayedPassageEvent = null;
				}
				$('#phistory').children()
					.not(this.history_dom)
					.remove();
				$('#passage').children()
					.not(this.history_dom)
					.remove();
				$('#phistory').children().last().remove();
				this.show(this.history[this.history.length-1]);

				if (this.undoHistory.length == 0) {
					$('#nav-link-undo').css({'visibility': 'hidden'});
				}
			}
		}.bind(this));

		// set up passage link handler; don't handle historical links

		$('body').on('click', 'a[data-passage]', function (e) {
			if ($(e.target).closest('#phistory').length == 0) {

				this.movePassageToHistory();
				this.clearUserResponses();
				this.showUserPassage($(e.target).text());

				// show new passage, without moving the current passage into history, as that has been done already
				var targetName = $(e.target).closest('[data-passage]').attr('data-passage');
				var passageDelay = this.getPassageDelay(targetName);
				this.showDelayed(targetName, false, true);
			}
		}.bind(this));

		// set up hash change handler for save/restore

		$(window).on('hashchange', function() {
			this.restore(window.location.hash.replace('#', ''));	
		}.bind(this));

		// set up error handler

		window.onerror = function(message, url, line) {
			if (! this.errorMessage || typeof(this.errorMessage) != 'string') {
				this.errorMessage = Story.prototype.errorMessage;
			}

			if (!this.ignoreErrors) {
				if (url) {
					message += ' (' + url;

					if (line) {
						message += ': ' + line;
					}

					message += ')';
				}

				$('#passage').html(this.errorMessage.replace('%s', message));
			}
		}.bind(this);

		// activate user styles

		_.each(this.userStyles, function(style) {
			$('body').append('<style>' + style + '</style>');
		});

		// run user scripts

		_.each(this.userScripts, function(script) {
			eval(script);
		});

		/**
		 Triggered when the story is finished loading, and right before
		 the first passage is displayed. The story property of this event
		 contains the story.

		 @event startstory
		**/

		$.event.trigger('startstory', { story: this });

		// try to restore based on the window hash if possible	

		if (window.location.hash === '' ||
			!this.restore(window.location.hash.replace('#', ''))) {

			this.show(this.startPassage);
		}
	},

	/**
	 Returns the Passage object corresponding to either an ID or name.
	 If none exists, then it returns null.

	 @method passage
	 @param idOrName {String or Number} ID or name of the passage
	 @return Passage object or null
	**/

	passage: function(idOrName) {
		if (_.isNumber(idOrName)) {
			return this.passages[idOrName];
		}
		else if (_.isString(idOrName)) {
			return _.findWhere(this.passages, { name: idOrName });
		}
	},

	/**
	 Displays a passage on the page, replacing the current one. If
	 there is no passage by the name or ID passed, an exception is raised.

	 Calling this immediately inside a passage (i.e. in its source code) will
	 *not* display the other passage. Use Story.render() instead.

	 @method show
	 @param idOrName {String or Number} ID or name of the passage
	 @param noHistory {Boolean} if true, then this will not be recorded in the story history
	**/

	show: function(idOrName, noHistory, noMove) {
		var passage = this.passage(idOrName);

		if (!passage) {
			throw new Error(
				'There is no passage with the ID or name "' + idOrName + '"'
			);
		}

		/**
		 Triggered whenever a passage is about to be replaced onscreen with another.
		 The passage being hidden is stored in the passage property of the event.

		 @event hidepassage
		**/

		$.event.trigger('hidepassage', { passage: window.passage });

		/**
		 Triggered whenever a passage is about to be shown onscreen.
		 The passage being displayed is stored in the passage property of the event.

		 @event showpassage
		**/

		$.event.trigger('showpassage', { passage: passage });

		/**
		 Save the old passage html to the passage history.
		 **/

		if (!noMove) {
			this.movePassageToHistory();
		}

		/**
     Create passage element
		 **/

		window.passage = passage;

  	var speaker = this.getPassageSpeaker(passage);

    var passageElem;
		if (speaker == 'undefined') {
			passageElem = $('<div class="meta-passage">' + passage.render() + '</div>');
		} else {
		  passageElem = $(
				'<div data-speaker="' + speaker + '" class="chat-passage-wrapper ' + passage.tags.join(' ') + '">' + 
		  			'<div data-speaker="' + speaker + '" class="chat-passage">' + 
						passage.render() + 
					'</div>' +
				'</div>'
			);  
		}
    
		if (!noHistory) {
			this.recent.push(passage.id);
			this.recent_dom.push(passageElem[0]);
    }

    /**
		 Add passage element to passage container element
     **/

		$('#passage')
      .append(passageElem)
			.fadeIn('slow');
		
		this.showUserResponses();
		
		this.scrollChatIntoView();

		this.pcolophon();

		/**
		 Triggered after a passage has been shown onscreen, and is now
		 displayed in the div with id passage. The passage being displayed is
		 stored in the passage property of the event.

		 @event showpassage:after
		 **/

		$.event.trigger('showpassage:after', { passage: passage });
	},

	/**
	 move current passage to history
	 **/
	movePassageToHistory: function () {
		// $('#passage').hide();
		
		this.emptyPassageLinks();

		this.pcopy();
	},
	
	/**
	 render passage links as UserResponses in UserResponsePanel
	 **/
	showUserResponses: function () {
		_.each(passage.links, function (link) {
			$('#user-response-panel').append(
				'<a ' + 
					'href="javascript:void(0)"' +
					'class="user-response"' +
					'data-passage="' + _.escape(link.target) + '"' +
				'>' + 
					link.display + 
				'</a>'
			).fadeIn('slow')
		});
	},

	/**
	 remove UserResponses from UserResponsePanel
	 **/

	clearUserResponses: function () {
		// remove UserResponse links
		$('#user-response-panel').empty();
	},

	/**
	 render chosen UserResponse as passage in pHistory
	 **/

	showUserPassage: function (text) {
		this.history = this.history.concat(this.recent);
		this.history_dom = this.history_dom.concat(this.recent_dom);
		this.recent = [];
		this.recent_dom = [];

		this.undoHistory.push(
			{
				state: this.state,
				history_dom: this.history_dom,
				history: this.history
			}
		);
		$('#nav-link-undo').css({'visibility': 'visible'});

		// render clicked link as UserPassage
		var user_passage = $('<div class="chat-passage-wrapper" data-speaker="you"><div class="chat-passage phistory" data-speaker="you" data-upassage="' + window.passage.id + '">' + text + '</div></div>');
		$('#phistory').append(user_passage);
		this.recent_dom.push(user_passage[0]);
		this.scrollChatIntoView();
	},

	/**
	 scroll bottom of chat-panel into view to ensure recently 
	 added passages can be read
	 **/

	scrollChatIntoView: function () {
		var d = document.documentElement;
		var offset = d.scrollTop + window.innerHeight;
		var height = d.offsetHeight;

		if (offset !== height) {
			$('html, body').animate({scrollTop:$('.chat-panel').height()}, 1000);
		}
	},

	/**
	 Copies the colophon into an end passage.

	 @method pcolophon
	**/
	
	pcolophon: function() {
		if ($.inArray('End', window.passage.tags) > -1 && this.passage('StoryColophon') != null) {
			$(this.passage('StoryColophon').render()).hide().appendTo("#passage").fadeIn('slow');
		}
	},
	
	/**
	 Copies the current passage text into the passage history div.

	 @method pcopy
	**/
	
	pcopy: function() {
		if (parseInt(window.passage.id,10)){
      // (I used .remove() here to remove any event handlers, which shouldn't persist.)
      var removed = $('#passage').children().remove();
			$('#phistory').append(removed);
		}
	},
	
	/**
	 Empties the current passage object links attribute,
	 making space for the next passage's data

	 @method emptyPassageLinks
	**/
	
	emptyPassageLinks: function() {
		passage.links = [];
	},


	/**
	 Retrieves the speaker from the passage tags

	 @method getPassageSpeaker
	 @param passage {Passage} current window.passage object
	 @return {String} Speaker name of passage
	**/
	
	getPassageSpeaker: function(passage) {
		if (!String.prototype.startsWith) {
			String.prototype.startsWith = function(search, pos) {
				return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
			};
		}
		var speakerTag = _.find(passage.tags, function(tag){ return tag.startsWith('speaker-'); });
		if (typeof speakerTag === 'undefined') {
			return 'undefined';
		}
		return speakerTag.substring(8);
	},
	
	/**
	 Returns the HTML source for a passage. This is most often used when
	 embedding one passage inside another. In this instance, make sure to
	 use <%= %> instead of <%- %> to avoid incorrectly encoding HTML entities.

	 @method render
	 @param idOrName {String or Number} ID or name of the passage
	 @return {String} HTML source code
	**/

	render: function(idOrName) {
		var passage = this.passage(idOrName);

		if (!passage) {
			throw new Error('There is no passage with the ID or name ' + idOrName);
		}

		return passage.render();
	},

	/**
	 Jump from one passage to another, 
	 delayed based on the length of the target passage

	 @method showDelayed
	 @param idOrName {String or Number} ID or name of the passage
	**/

	showDelayed: function (idOrName, noHistory, noMove) {
		var typingDelayRatio = 0.3;
		var delayMS = this.getPassageDelay(idOrName);

		var speaker = this.getPassageSpeaker(this.passage(idOrName));

		// show animation
		if (speaker != 'undefined') {
      this.delayedTypingEvent = _.delay(
        function(){
          story.showTyping(idOrName);
        },
        delayMS * typingDelayRatio
      );
		} else {
			delayMS = 0;
		}
    
		this.delayedPassageEvent = _.delay(
			function(){
				story.hideTyping();
				story.show(idOrName, noHistory, noMove);
			},
			delayMS
		);

	},

	/**
	 get number of milliseconds to wait based on target passage text length

	 @method getPassageDelay
	 @param idOrName {String or Number} ID or name of the passage
	**/

	getPassageDelay: function (idOrName) {
		var target = this.passage(idOrName);
		var targetSourceTextLength = $('<div></div>').html(target.source).text().length;
		var targetUserResponseLength = _.reduce(
			target.links, 
			function(memo, link){ 
				return memo + link.display.length + 4; // + 4 for '[['+']]'
			}, 
			0
		);
		var targetTextLength = targetSourceTextLength - targetUserResponseLength;
		var msPerChar = 20;
		var delayMS = targetTextLength * msPerChar;

		return delayMS;
	},

	/**
	 turn typing animation on

	 @method toggleTyping
	 @param idOrName {String or Number} ID or name of the passage
	**/

	showTyping: function (idOrName) {
		var speaker = this.getPassageSpeaker(this.passage(idOrName));
		$('#animation-container .chat-passage-wrapper').attr('data-speaker', speaker);
		$('#animation-container .chat-passage-wrapper .chat-passage').attr('data-speaker', speaker);
		$('#animation-container').fadeIn('slow');
		this.scrollChatIntoView();
	},

	/**
	 turn typing animation off

	 @method toggleTyping
	 @param idOrName {String or Number} ID or name of the passage
	**/

	hideTyping: function (idOrName) {
		$('#animation-container').hide();
	},

	/**
	 Returns a hash value representing the current state of the story.

	 @method saveHash
	 @return String hash
	**/

	saveHash: function()
	{	
		return LZString.compressToBase64(JSON.stringify({ state: this.state, history: this.history }));
	},

	/**
	 Sets the URL's hash property to the hash value created by saveHash().

	 @method save
	 @return String hash
	**/

	save: function()
	{
		/**
		 Triggered whenever story progress is saved.

		 @event save
		**/

		$.event.trigger('save');
		window.location.hash = this.saveHash();
	},

	/**
	 Tries to restore the story state from a hash value generated by saveHash().

	 @method restore
	 @param hash {String} 
	 @return {Boolean} whether the restore succeeded
	**/

	restore: function (hash)
	{
		/**
		 Triggered before trying to restore from a hash.

		 @event restore
		**/

		$.event.trigger('restore');

		try
		{
			var save = JSON.parse(LZString.decompressFromBase64(hash));
			this.state = save.state;
			this.history = save.history;
			this.show(this.history[this.history.length - 1], true);
		}
		catch (e)
		{
			// swallow the error

			/**
			 Triggered if there was an error with restoring from a hash.

			 @event restorefailed
			**/

			$.event.trigger('restorefailed', { error: e });
			return false;
		};

		/**
		 Triggered after completing a restore from a hash.

		 @event restore:after
		**/

		$.event.trigger('restore:after');
		return true;
	}
});

module.exports = Story;
