'use strict';

var Utils = require('../utils');
var Component = require('../component');
var Loader = require('../loader');
var I18n = require('../i18n');


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
  }, optParams);

  Component.call(this, params);

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

};
GiphyComponent.prototype = Object.create(Component.prototype);
module.exports = GiphyComponent;


/**
 * String name for the component class.
 * @type {string}
 */
GiphyComponent.CLASS_NAME = 'GiphyComponent';
Loader.register(GiphyComponent.CLASS_NAME, GiphyComponent);


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
GiphyComponent.GIPHY_SEARCH_REGEX = '^\\+giphy\\s(.+[a-zA-Z])$';


/**
 * Giphy endpoint for random search.
 * Ref: https://github.com/Giphy/GiphyAPI
 * @type {String.<string>}
 */
GiphyComponent.GIPHY_RANDOM_ENDPOINT = 'https://api.giphy.com/v1/gifs/random?' +
      'api_key=dc6zaTOxFJmzC&' +
      'tag=';


/**
 * Create and initiate a giphy object from JSON.
 * @param  {Object} json JSON representation of the giphy.
 * @return {GiphyComponent} GiphyComponent object representing the JSON data.
 */
GiphyComponent.fromJSON = function (json) {
  return new GiphyComponent(json);
};


/**
 * Handles onInstall when the GiphyComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
GiphyComponent.onInstall = function(editor) {
  GiphyComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all giphy components instances.
};


/**
 * Registers regular experessions to create giphy component from if matched.
 * @param  {Editor} editor The editor to register regexes with.
 * @private
 */
GiphyComponent.registerRegexes_ = function(editor) {
  editor.registerRegex(
      I18n.get('regex.giphy') || GiphyComponent.GIPHY_SEARCH_REGEX,
      GiphyComponent.handleMatchedRegex);
};


/**
 * Creates a figure component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
GiphyComponent.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var giphyQuery = matchedComponent.text.split(/\s/).slice(1).join('+');

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
  xhttp.open('GET', GiphyComponent.GIPHY_RANDOM_ENDPOINT + giphyQuery, true);
  xhttp.send();
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
GiphyComponent.prototype.getComponentClassName = function() {
  return GiphyComponent.CLASS_NAME;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this GiphyComponent.
 */
GiphyComponent.prototype.getJSONModel = function() {
  var image = {
    component: GiphyComponent.CLASS_NAME,
    name: this.name,
    src: this.src,
    width: this.width,
    caption: this.caption
  };

  return image;
};


/**
 * @override
 */
GiphyComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    this.imgDom = document.createElement(GiphyComponent.IMAGE_TAG_NAME);

    if (this.src) {
      this.imgDom.setAttribute('src', this.src);
      if (this.width) {
        this.imgDom.setAttribute('width', this.width);
      }
      this.dom.appendChild(this.imgDom);
    }

    if (this.editMode) {
      this.dom.addEventListener('click', this.select.bind(this));
      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener('focus', this.select.bind(this));
      this.dom.appendChild(this.selectionDom);
    }
  }
};


/**
 * Returns the operations to execute a deletion of the giphy component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {Object} optCursorAfterOp Where to move cursor to after deletion.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
GiphyComponent.prototype.getDeleteOps = function (
    optIndexOffset, optCursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
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

  // If this is the only child of the layout delete the layout as well
  // only if there are other layouts.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a GiphyComponent.
 * @param {number} index Index to insert the GiphyComponent at.
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the GiphyComponent.
 */
GiphyComponent.prototype.getInsertOps = function (index, optCursorBeforeOp) {
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
      component: this.name,
      cursor: optCursorBeforeOp
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
