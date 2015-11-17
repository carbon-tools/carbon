'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');

/**
 * YouTubeComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 */
var YouTubeComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '360px',
  }, optParams);

  Component.call(this, params);

  /**
   * Internal model text in this YouTubeComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;
  this.height = params.height;

  /**
   * Placeholder text to show if the YouTubeComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(YouTubeComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  this.containerDom = document.createElement(
      YouTubeComponent.CONTAINER_TAG_NAME);
  this.containerDom.className = YouTubeComponent.CONTAINER_CLASS_NAME;

  this.overlayDom = document.createElement(
      YouTubeComponent.VIDEO_OVERLAY_TAG_NAME);
  this.overlayDom.className = YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME;
  this.containerDom.appendChild(this.overlayDom);
  this.overlayDom.addEventListener('click', this.select.bind(this));

  this.videoDom = document.createElement(YouTubeComponent.VIDEO_TAG_NAME);
  this.containerDom.appendChild(this.videoDom);

  this.selectionDom = document.createElement('div');
  this.selectionDom.innerHTML = '&nbsp;';
  this.selectionDom.className = 'selection-pointer';
  this.selectionDom.setAttribute('contenteditable', true);
  this.selectionDom.addEventListener('focus', this.select.bind(this));

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: 'Type caption for video',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  if (this.src) {
    this.videoDom.setAttribute('src', this.src);
    this.videoDom.setAttribute('frameborder', 0);
    this.videoDom.setAttribute('allowfullscreen', true);
    if (this.width) {
      this.videoDom.setAttribute('width', this.width);
    }
    if (this.height) {
      this.videoDom.setAttribute('height', this.height);
    }
    this.containerDom.appendChild(this.videoDom);
    this.containerDom.appendChild(this.selectionDom);
  }

  this.captionDom = this.captionParagraph.dom;
  this.captionDom.setAttribute('contenteditable', true);
  this.dom.appendChild(this.containerDom);
  this.dom.appendChild(this.captionDom);
};
YouTubeComponent.prototype = Object.create(Component.prototype);
module.exports = YouTubeComponent;

/**
 * String name for the component class.
 * @type {string}
 */
YouTubeComponent.CLASS_NAME = 'YouTubeComponent';
Loader.register(YouTubeComponent.CLASS_NAME, YouTubeComponent);


/**
 * YouTubeComponent component element tag name.
 * @type {string}
 */
YouTubeComponent.TAG_NAME = 'figure';


/**
 * YouTubeComponent component inner container element tag name.
 * @type {string}
 */
YouTubeComponent.CONTAINER_TAG_NAME = 'div';


/**
 * YouTubeComponent component inner container element class name.
 * @type {string}
 */
YouTubeComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_TAG_NAME = 'iframe';


/**
 * Caption element tag name.
 * @type {string}
 */
YouTubeComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME = 'video-overlay';


/**
 * Regex strings list that for matching YouTube URLs.
 * @type {Array.<string>}
 */
YouTubeComponent.YOUTUBE_URL_REGEXS = [
    '(?:https?://(?:www\.)?youtube\.com\/(?:[^\/]+/.+/|' +
    '(?:v|e(?:mbed)?)/|.*[?&]v=)|' +
    'youtu\.be/)([^"&?/ ]{11})'
];


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {YouTubeComponent} YouTubeComponent object representing JSON data.
 */
YouTubeComponent.fromJSON = function (json) {
  return new YouTubeComponent(json);
};


/**
 * Handles onInstall when the YouTubeComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
YouTubeComponent.onInstall = function(editor) {
  YouTubeComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all YouTube components instances.
};


/**
 * Registers regular experessions to create YouTube component from if matched.
 * @param  {Editor} editor The editor to register regexes with.
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
YouTubeComponent.createYouTubeComponentFromLink = function (link, attrs) {
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
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
YouTubeComponent.handleMatchedRegex = function (matchedComponent, opsCallback) {
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
YouTubeComponent.createEmbedSrcFromId = function (id) {
  return 'https://www.youtube.com/embed/' + id +
    '?rel=0&amp;showinfo=0&amp;iv_load_policy=3';
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this YouTubeComponent.
 */
YouTubeComponent.prototype.getJSONModel = function() {
  var video = {
    component: YouTubeComponent.CLASS_NAME,
    name: this.name,
    src: this.src,
    height: this.height,
    width: this.width,
    caption: this.captionParagraph.text
  };

  return video;
};


/**
 * Handles clicking on the youtube component to update the selection.
 */
YouTubeComponent.prototype.select = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });

  // TODO(mkhatib): Unselect the component when the video plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Returns the operations to execute a deletion of the YouTube component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
YouTubeComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a youtube component.
 * @param {number} index Index to insert the youtube component at.
 * @return {Array.<Object>} Operations for inserting the youtube component.
 */
YouTubeComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        src: this.src,
        width: this.width,
        caption: this.caption
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
YouTubeComponent.prototype.getLength = function () {
  return 1;
};
