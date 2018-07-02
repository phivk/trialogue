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
	 An object that stores data that persists across a single user session.
	 Any other variables will not survive the user pressing back or forward.

	 @property state
	 @type Object
	**/

	this.state = {};

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

		$(window).on('popstate', function(event) {
			var state = event.originalEvent.state;

			if (state) {
				this.state = state.state;
				this.history = state.history;
				
				/**
				 Remove the previous passage from the visual history before reopening it.
				 Remove the current passage after/because it gets added to the visual history 
				   (but not the state history) during this.show().
				 If the user did a browser forward (determined by the history length being off)
				   back out using a helper class; this effectively disables the forward button.
				 **/

				if (this.history.length == $('div.phistory').length && !$('#phistory').hasClass('fakeBack')) {
					$('div.phistory:last').remove();
					this.show(this.history[this.history.length - 1], true);
					$('div.phistory:last').remove();
				} else {
					if ($('#phistory').hasClass('fakeBack')) {
						$('#phistory').removeClass('fakeBack');
					} else {
						$('#phistory').addClass('fakeBack');
						window.history.back();
					}
				}
			}
			else if (this.history.length > 1) {
				this.state = {};
				this.history = [];
				this.show(this.startPassage, true);
				$('div#phistory').html('');
			}
		}.bind(this));

		// set up passage link handler; don't handle historical links

		$('body').on('click', 'a[data-passage]', function (e) {
			if ($(e.target).closest('#phistory').length == 0) {
				
				this.clearUserResponses();

				this.show(_.unescape(
					$(e.target).closest('[data-passage]').addClass('visited').attr('data-passage')
				));
				
				this.showUserPassage($(e.target).text());
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

	show: function(idOrName, noHistory) {
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

		if (!noHistory) {
			this.history.push(passage.id);

			try {
				window.history.pushState(
					{
						state: this.state,
						history: this.history
					},
					'',
					''
				);
			}
			catch (e) {
				// this may fail due to security restrictions in the browser

				/**
				 Triggered whenever a passage fails to be saved to browser history.

				 @event checkpointfailed
				**/

				$.event.trigger('checkpointfailed', { error: e });
			}
		}

		/**
		 Save the old passage html to the passage history.  Checkpoint all passages.
		 **/

		$('#passage').hide();
		this.pcopy();
		
		window.passage = passage;

		$('#passage')
			.html(passage.render())
			.removeClass()
			.addClass(passage.tags.join(' '))
			.fadeIn('slow');
		
		this.showUserResponses();
		
		$('html, body').animate({scrollTop: $("#passage").offset().top}, 1000);
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
		passage.links = [];
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
		// render clicked link as UserPassage
		$('#phistory').append('<div class="phistory-wrapper speaker-user"><div class="phistory speaker-user" data-upassage="' + window.passage.id + '">' + text + '</div></div>');
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
		if (parseInt(window.passage.id,10))
			$('#phistory').append('<div class="phistory-wrapper"><div class="phistory ' + window.passage.tags.join(' ') + '" data-ppassage="' + window.passage.id + '">' + $('#passage').html() + '</div></div>');
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
