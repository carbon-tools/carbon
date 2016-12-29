'use strict';

var Utils = require('../utils');
var IFrameComponent = require('./iframeComponent');
var Loader = require('../loader');

/**
 * VineComponent main.
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
var VineComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '350px',
    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '350px',
  }, opt_params);

  IFrameComponent.call(this, params);
};
VineComponent.prototype = Object.create(IFrameComponent.prototype);
module.exports = VineComponent;

/**
 * String name for the component class.
 * @type {string}
 */
VineComponent.CLASS_NAME = 'VineComponent';
Loader.register(VineComponent.CLASS_NAME, VineComponent);


/**
 * Regex strings list that for matching Vine URLs.
 * @type {Array<string>}
 */
VineComponent.VINE_URL_REGEXS = [
  '^http(?:s?):\/\/(?:www\.)?vine\.co\/v\/([a-zA-Z0-9]{1,13})',
];


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
VineComponent.prototype.getComponentClassName = function() {
  return VineComponent.CLASS_NAME;
};


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {VineComponent} VineComponent object representing JSON data.
 */
VineComponent.fromJSON = function(json) {
  return new VineComponent(json);
};


/**
 * Handles onInstall when the VineComponent module installed in an editor.
 * @param  {../editor} editor Instance of the editor that installed the module.
 */
VineComponent.onInstall = function(editor) {
  VineComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all Vine components instances.
};


/**
 * Registers regular experessions to create Vine component from if matched.
 * @param  {../editor} editor The editor to register regexes with.
 * @private
 */
VineComponent.registerRegexes_ = function(editor) {
  for (var i = 0; i < VineComponent.VINE_URL_REGEXS.length; i++) {
    editor.registerRegex(
        VineComponent.VINE_URL_REGEXS[i],
        VineComponent.handleMatchedRegex);
  }
};


/**
 * Creates a Vine video component from a link.
 * @param  {string} link Vine video URL.
 * @return {VineComponent} VineComponent component created from the link.
 */
VineComponent.createVineComponentFromLink = function(link, attrs) {
  var src = link;
  for (var i = 0; i < VineComponent.VINE_URL_REGEXS.length; i++) {
    var regex = new RegExp(VineComponent.VINE_URL_REGEXS);
    var matches = regex.exec(src);
    if (matches) {
      src = VineComponent.createEmbedSrcFromId(matches[1]);
      break;
    }
  }
  return new VineComponent(Utils.extend({src: src}, attrs));
};


/**
 * Creates a Vine video component from a link.
 * @param {../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
VineComponent.handleMatchedRegex = function(matchedComponent, opsCallback) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var ytComponent = VineComponent.createVineComponentFromLink(
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
 * @param  {string} id Vine video ID.
 * @return {string} Embed src URL.
 */
VineComponent.createEmbedSrcFromId = function(id) {
  return 'https://vine.co/v/' + id + '/embed/simple';
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
VineComponent.prototype.getLength = function() {
  return 1;
};
