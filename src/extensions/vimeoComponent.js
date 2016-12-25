'use strict';

var Utils = require('../utils');
var IFrameComponent = require('./iframeComponent');
var Loader = require('../loader');

/**
 * VimeoComponent main.
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
var VimeoComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '380px',
  }, opt_params);

  IFrameComponent.call(this, params);
};
VimeoComponent.prototype = Object.create(IFrameComponent.prototype);
module.exports = VimeoComponent;

/**
 * String name for the component class.
 * @type {string}
 */
VimeoComponent.CLASS_NAME = 'VimeoComponent';
Loader.register(VimeoComponent.CLASS_NAME, VimeoComponent);


/**
 * Regex strings list that for matching Vimeo URLs.
 * @type {Array<string>}
 */
VimeoComponent.VIMEO_URL_REGEXS = [
  '^http(?:s?):\/\/(?:www\.)?vimeo\.com\/([0-9]+)',
];


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
VimeoComponent.prototype.getComponentClassName = function() {
  return VimeoComponent.CLASS_NAME;
};


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {VimeoComponent} VimeoComponent object representing JSON data.
 */
VimeoComponent.fromJSON = function(json) {
  return new VimeoComponent(json);
};


/**
 * Handles onInstall when the VimeoComponent module installed in an editor.
 * @param  {../editor} editor Instance of the editor that installed the module.
 */
VimeoComponent.onInstall = function(editor) {
  VimeoComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all Vimeo components instances.
};


/**
 * Registers regular experessions to create Vimeo component from if matched.
 * @param  {../editor} editor The editor to register regexes with.
 * @private
 */
VimeoComponent.registerRegexes_ = function(editor) {
  for (var i = 0; i < VimeoComponent.VIMEO_URL_REGEXS.length; i++) {
    editor.registerRegex(
        VimeoComponent.VIMEO_URL_REGEXS[i],
        VimeoComponent.handleMatchedRegex);
  }
};


/**
 * Creates a Vimeo video component from a link.
 * @param  {string} link Vimeo video URL.
 * @return {VimeoComponent} VimeoComponent component created from the link.
 */
VimeoComponent.createVimeoComponentFromLink = function(link, attrs) {
  var src = link;
  for (var i = 0; i < VimeoComponent.VIMEO_URL_REGEXS.length; i++) {
    var regex = new RegExp(VimeoComponent.VIMEO_URL_REGEXS);
    var matches = regex.exec(src);
    if (matches) {
      src = VimeoComponent.createEmbedSrcFromId(matches[1]);
      break;
    }
  }
  return new VimeoComponent(Utils.extend({src: src}, attrs));
};


/**
 * Creates a Vimeo video component from a link.
 * @param {../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
VimeoComponent.handleMatchedRegex = function(matchedComponent, opsCallback) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var ytComponent = VimeoComponent.createVimeoComponentFromLink(
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
 * @param  {string} id Vimeo video ID.
 * @return {string} Embed src URL.
 */
VimeoComponent.createEmbedSrcFromId = function(id) {
  return 'https://player.vimeo.com/video/' + id + '?title=0&byline=0&portrait=0';
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
VimeoComponent.prototype.getLength = function() {
  return 1;
};
