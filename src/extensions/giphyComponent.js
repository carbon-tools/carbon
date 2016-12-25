'use strict';

var Utils = require('../utils');
var Component = require('../component');
var Loader = require('../loader');
var I18n = require('../i18n');


/**
 * @typedef {{
 *   src: string,
 *   caption: (?string|undefined),
 *   width: (?string|undefined),
 * }} */
var GiphyComponentParamsDef;


/**
 * @typedef {{
 *   data: {
 *     image_original_url: string,
 *   }
 * }}
 */
var GiphyJsonResponseDef;

/**
 * GiphyComponent main.
 * @param {GiphyComponentParamsDef=} opt_params Optional params to initialize the GiphyComponent object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 * @extends {../component}
 * @constructor
 */
var GiphyComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {GiphyComponentParamsDef} */ (Utils.extend({
    src: '',
    caption: null,
    width: '100%',
  }, opt_params));

  Component.call(this, params);

  /**
   * Internal model text in this GiphyComponent.
   * @type {string}
   */
  this.src = params.src;

  /** @type {string} */
  this.width = params.width || '';

  /**
   * Placeholder text to show if the GiphyComponent is empty.
   * @type {string}
   */
  this.caption = params.caption || '';

  /**
   * DOM element tied to this object.
   * @type {!Element}
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
 * @type {string}
 */
GiphyComponent.GIPHY_SEARCH_REGEX = '^\\+giphy\\s(.+[a-zA-Z])$';


/**
 * Giphy endpoint for random search.
 * Ref: https://github.com/Giphy/GiphyAPI
 * @type {string}
 */
GiphyComponent.GIPHY_RANDOM_ENDPOINT = 'https://api.giphy.com/v1/gifs/random?' +
      'api_key=dc6zaTOxFJmzC&' +
      'tag=';


/**
 * Create and initiate a giphy object from JSON.
 * @param  {GiphyComponentParamsDef} json JSON representation of the giphy.
 * @return {GiphyComponent} GiphyComponent object representing the JSON data.
 */
GiphyComponent.fromJSON = function(json) {
  return new GiphyComponent(json);
};


/**
 * Handles onInstall when the GiphyComponent module installed in an editor.
 * @param  {../editor} editor Instance of the editor that installed the module.
 */
GiphyComponent.onInstall = function(editor) {
  GiphyComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all giphy components instances.
};


/**
 * Registers regular experessions to create giphy component from if matched.
 * @param  {../editor} editor The editor to register regexes with.
 * @private
 */
GiphyComponent.registerRegexes_ = function(editor) {
  editor.registerRegex(
      I18n.get('regex.giphy') || GiphyComponent.GIPHY_SEARCH_REGEX,
      GiphyComponent.handleMatchedRegex);
};


/**
 * Creates a figure component from a link.
 * @param {../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
GiphyComponent.handleMatchedRegex = function(matchedComponent, opsCallback) {
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
      var json = /** @type {GiphyJsonResponseDef} */ (
          JSON.parse(xhttp.responseText));
      src = json['data']['image_original_url'];
      /* jshint ignore:end */
      // If result is found for the query, create a component.
      if (src) {
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
    caption: this.caption,
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
      this.dom.addEventListener('click', this.handleClick.bind(this), false);
      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener(
          'focus', this.handleClick.bind(this), false);
      this.dom.appendChild(this.selectionDom);
    }
  }
};


/**
 * Handle a click on the component.
 * @param  {Event} unusedEvent
 */
GiphyComponent.prototype.handleClick = function(unusedEvent) {
  this.select(0);
};


/**
 * Returns the operations to execute a deletion of the giphy component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {../defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<../defs.OperationDef>} List of operations needed to be executed.
 */
GiphyComponent.prototype.getDeleteOps = function(
    opt_indexOffset, opt_cursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'GiphyComponent',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width,
      },
    },
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
 * @param {../defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<../defs.OperationDef>} Operations for inserting the GiphyComponent.
 */
GiphyComponent.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
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
        caption: this.caption,
      },
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorBeforeOp,
    },
  }];
};


/**
 * Returns the length of the GiphyComponent content.
 * @return {number} Length of the GiphyComponent content.
 */
GiphyComponent.prototype.getLength = function() {
  return 1;
};
