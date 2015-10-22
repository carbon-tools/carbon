'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');

/**
 * GiphyComponent main.
 * @param {Object} optParams Optional params to initialize the GiphyComponent object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 */
var GiphyComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // Generate a UID as a reference for this GiphyComponent.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this GiphyComponent.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this GiphyComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;

  /**
   * Placeholder text to show if the GiphyComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(GiphyComponent.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  this.dom.addEventListener('click', this.handleClick.bind(this));

  this.captionDom = document.createElement(GiphyComponent.CAPTION_TAG_NAME);
  this.captionDom.setAttribute('contenteditable', true);

  this.imgDom = document.createElement(GiphyComponent.IMAGE_TAG_NAME);

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
GiphyComponent.prototype = new Component();
module.exports = GiphyComponent;


/**
 * GiphyComponent component container element tag name.
 * @type {string}
 */
GiphyComponent.CONTAINER_TAG_NAME = 'figure';


/**
 * Image element tag name.
 * @type {string}
 */
GiphyComponent.IMAGE_TAG_NAME = 'img';


/**
 * Caption element tag name.
 * @type {string}
 */
GiphyComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Regex strings list that for matching Giphy search terms.
 * @type {Array.<string>}
 */
GiphyComponent.GIPHY_SEARCH_REGEXS = [
    '/giphy\\s(.+[a-zA-Z])'
];


/**
 * Giphy endpoint for random search.
 * Ref: https://github.com/Giphy/GiphyAPI
 * @type {String.<string>}
 */
GiphyComponent.GIPHY_RANDOM_ENDPOINT = 'http://api.giphy.com/v1/gifs/random?' +
      'api_key=dc6zaTOxFJmzC&' +
      'tag=';


/**
 * Registers regular experessions to create giphy component from if matched.
 * @param  {ComponentFactory} componentFactory The component factory to register
 * the regex with.
 */
GiphyComponent.registerRegexes = function(componentFactory) {
  for (var i = 0; i < GiphyComponent.GIPHY_SEARCH_REGEXS.length; i++) {
    componentFactory.registerRegex(
        GiphyComponent.GIPHY_SEARCH_REGEXS[i],
        GiphyComponent.handleMatchedRegex);
  }
};


/**
 * Creates a figure component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
GiphyComponent.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var giphyQuery = matchedComponent.text.split(/\s/).slice(1).join("+");

  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];

  // Call Giphy Random Endpoint.
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var src;
      /* jshint ignore:start */
      // Get the image url from the random search response.
      src = JSON.parse(xhttp.responseText)['data']['image_original_url'];
      /* jshint ignore:end */
      // If result is found for the query, create a component.
      if  (src) {
        var figure = new GiphyComponent({src: src});
        figure.section = matchedComponent.section;

        // Delete current matched component with its text.
        Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

        // Add the new component created from the text.
        Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

        opsCallback(ops);
      }
    }
  };
  xhttp.open("GET", GiphyComponent.GIPHY_RANDOM_ENDPOINT + giphyQuery, true);
  xhttp.send();
};

/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this GiphyComponent.
 */
GiphyComponent.prototype.getJSONModel = function() {
  var image = {
    name: this.name,
    src: this.src,
    caption: this.caption
  };

  return image;
};


/**
 * Handles clicking on the GiphyComponent component to update the selection.
 */
GiphyComponent.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });
};


/**
 * Returns the operations to execute a deletion of the giphy component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
GiphyComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'GiphyComponent',
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
 * Returns the operations to execute inserting a GiphyComponent.
 * @param {number} index Index to insert the GiphyComponent at.
 * @return {Array.<Object>} Operations for inserting the GiphyComponent.
 */
GiphyComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'GiphyComponent',
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
 * Returns the length of the GiphyComponent content.
 * @return {number} Length of the GiphyComponent content.
 */
GiphyComponent.prototype.getLength = function () {
  return 1;
};
