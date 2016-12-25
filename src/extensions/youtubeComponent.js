'use strict';

var Utils = require('../utils');
var IFrameComponent = require('./iframeComponent');
var Loader = require('../loader');

/**
 * YouTubeComponent main.
 * @param {Object=} opt_params Optional params to initialize the object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 * @extends {./iframeComponent}
 * @constructor
 */
var YouTubeComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '360px',
  }, opt_params);

  IFrameComponent.call(this, params);
};
YouTubeComponent.prototype = Object.create(IFrameComponent.prototype);
module.exports = YouTubeComponent;


/**
 * String name for the component class.
 * @type {string}
 */
YouTubeComponent.CLASS_NAME = 'YouTubeComponent';
Loader.register(YouTubeComponent.CLASS_NAME, YouTubeComponent);


/**
 * Regex strings list that for matching YouTube URLs.
 * @type {Array<string>}
 */
YouTubeComponent.YOUTUBE_URL_REGEXS = [
  '(?:https?://(?:www\.)?youtube\.com\/(?:[^\/]+/.+/|' +
    '(?:v|e(?:mbed)?)/|.*[?&]v=)|' +
    'youtu\.be/)([^"&?/ ]{11})',
];


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
YouTubeComponent.prototype.getComponentClassName = function() {
  return YouTubeComponent.CLASS_NAME;
};


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {YouTubeComponent} YouTubeComponent object representing JSON data.
 */
YouTubeComponent.fromJSON = function(json) {
  return new YouTubeComponent(json);
};


/**
 * Handles onInstall when the YouTubeComponent module installed in an editor.
 * @param  {../editor} editor Instance of the editor that installed the module.
 */
YouTubeComponent.onInstall = function(editor) {
  YouTubeComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all YouTube components instances.
};


/**
 * Registers regular experessions to create YouTube component from if matched.
 * @param  {../editor} editor The editor to register regexes with.
 * @private
 */
YouTubeComponent.registerRegexes_ = function(editor) {
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    editor.registerRegex(
        YouTubeComponent.YOUTUBE_URL_REGEXS[i],
        YouTubeComponent.handleMatchedRegex);
  }
};


/**
 * Creates a YouTube video component from a link.
 * @param  {string} link YouTube video URL.
 * @return {YouTubeComponent} YouTubeComponent component created from the link.
 */
YouTubeComponent.createYouTubeComponentFromLink = function(link, attrs) {
  var src = link;
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    var regex = new RegExp(YouTubeComponent.YOUTUBE_URL_REGEXS);
    var matches = regex.exec(src);
    if (matches) {
      src = YouTubeComponent.createEmbedSrcFromId(matches[1]);
      break;
    }
  }
  return new YouTubeComponent(Utils.extend({src: src}, attrs));
};


/**
 * Creates a YouTube video component from a link.
 * @param {../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
YouTubeComponent.handleMatchedRegex = function(matchedComponent, opsCallback) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var ytComponent = YouTubeComponent.createYouTubeComponentFromLink(
      matchedComponent.text, {});
  ytComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, ytComponent.getInsertOps(atIndex));

  opsCallback(ops);
};


/**
 * Returns the embed src URL for the id.
 * @param  {string} id YouTube video ID.
 * @return {string} Embed src URL.
 */
YouTubeComponent.createEmbedSrcFromId = function(id) {
  return 'https://www.youtube.com/embed/' + id +
    '?rel=0&amp;showinfo=0&amp;iv_load_policy=3';
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
YouTubeComponent.prototype.getLength = function() {
  return 1;
};
