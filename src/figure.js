'use strict';

var Utils = require('./utils');
var Selection = require('./selection');
var Component = require('./component');

/**
 * Figure main.
 * @param {Object} optParams Optional params to initialize the Figure object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 */
var Figure = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // Generate a UID as a reference for this Figure.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this Figure.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this Figure.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Figure.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  this.dom.addEventListener('click', this.handleClick.bind(this));

  this.captionDom = document.createElement(Figure.CAPTION_TAG_NAME);
  this.captionDom.setAttribute('contenteditable', true);

  this.imgDom = document.createElement(Figure.IMAGE_TAG_NAME);

  if (this.caption) {
    this.captionDom.innerText = this.caption;
    this.dom.appendChild(this.captionDom);
  }

  if (this.src) {
    this.imgDom.setAttribute('src', this.src);
    if (this.width) {
      this.imgDom.setAttribute('width', this.width);
    }
    this.dom.appendChild(this.imgDom);
  }
};
Figure.prototype = new Component();
module.exports = Figure;


/**
 * Figure component container element tag name.
 * @type {string}
 */
Figure.CONTAINER_TAG_NAME = 'figure';


/**
 * Image element tag name.
 * @type {string}
 */
Figure.IMAGE_TAG_NAME = 'img';


/**
 * Caption element tag name.
 * @type {string}
 */
Figure.CAPTION_TAG_NAME = 'figcaption';


/**
 * Regex strings list that for matching image URLs.
 * @type {Array.<string>}
 */
Figure.IMAGE_URL_REGEXS = [
    'https?://(.*)\.(jpg|png|gif|jpeg)$'
];


/**
 * Registers regular experessions to create image from if matched.
 * @param  {ComponentFactory} componentFactory The component factory to register
 * the regex with.
 */
Figure.registerRegexes = function(componentFactory) {
  for (var i = 0; i < Figure.IMAGE_URL_REGEXS.length; i++) {
    componentFactory.registerRegex(
        Figure.IMAGE_URL_REGEXS[i],
        Figure.handleMatchedRegex);
  }
};


/**
 * Creates a figure component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
Figure.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var src = matchedComponent.text;
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var figure = new Figure({src: src});
  figure.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

  opsCallback(ops);
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Figure.
 */
Figure.prototype.getJSONModel = function() {
  var image = {
    name: this.name,
    src: this.src,
    caption: this.caption
  };

  return image;
};


/**
 * Handles clicking on the figure component to update the selection.
 */
Figure.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });
};


/**
 * Returns the operations to execute a deletion of the image component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
Figure.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Figure',
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
 * Returns the operations to execute inserting a figure.
 * @param {number} index Index to insert the figure at.
 * @return {Array.<Object>} Operations for inserting the figure.
 */
Figure.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'Figure',
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
 * Returns the length of the figure content.
 * @return {number} Length of the figure content.
 */
Figure.prototype.getLength = function () {
  return 1;
};
