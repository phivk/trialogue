'use strict';
var $ = window.$ = window.jQuery = require('jquery');
var _ = window._ = require('underscore');
var marked = window.marked = require('marked');
var Story = window.Story = require('./story');
var Passage = window.Passage = require('./passage');

$(function() {
	window.story = new Story();
	window.story.start();
});
