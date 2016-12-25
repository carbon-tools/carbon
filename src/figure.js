'use strict';

var Utils = require('./utils');
var Component = require('./component');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');
var I18n = require('./i18n');


/**
 * @typedef {{
 *   src: string,
 *   caption: (?string|undefined),
 *   captionPlaceholder: (?string|undefined),
 *   width: (?string|undefined),
 *   height: (?string|undefined),
 * }} */
var FigureComponentParamsDef;


/**
 * Figure main.
 * @param {FigureComponentParamsDef=} opt_params Optional params to initialize the Figure object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 * @extends {./component}
 * @constructor
 */
var Figure = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {FigureComponentParamsDef} */ (Utils.extend({
    src: '',
    caption: null,
    captionPlaceholder: I18n.get('placeholder.figure'),
    width: '100%',
    height: null,
  }, opt_params));

  Component.call(this, params);

  /**
   * Internal model text in this Figure.
   * @type {string}
   */
  this.src = params.src;

  /**
   * Wether this figure is initialized with Data URL.
   * @type {boolean}
   */
  this.isDataUrl = !!params.src && params.src.indexOf('data:image') === 0;

  /**
   * Width of the figure.
   * @type {string}
   */
  this.width = params.width || '100%';

  /**
   * Height of the figure.
   * @type {string|null|undefined}
   */
  this.height = params.height;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.caption = params.caption || '';

  /**
   * Text to place as placeholder for caption.
   * @type {string}
   */
  this.captionPlaceholder = params.captionPlaceholder || '';

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {./paragraph}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: params.captionPlaceholder || '',
    name: this.name + '-caption',
    text: params.caption || '',
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: /** @type {./component} */ (this),
    inline: true,
  });

  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(Figure.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
};
Figure.prototype = Object.create(Component.prototype);
module.exports = Figure;


/**
 * String name for the component class.
 * @type {string}
 */
Figure.CLASS_NAME = 'Figure';
Loader.register(Figure.CLASS_NAME, Figure);


/**
 * Figure component container element tag name.
 * @type {string}
 */
Figure.CONTAINER_TAG_NAME = 'figure';


/**
 * Container element tag name to allow responsive images.
 * @type {string}
 */
Figure.IMAGE_CONTAINER_TAG_NAME = 'div';


/**
 * Container element class name to allow responsive images.
 * @type {string}
 */
Figure.IMAGE_CONTAINER_CLASS_NAME = 'image-container';


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
 * @type {Array<string>}
 */
Figure.IMAGE_URL_REGEXS = [
  'https?://(.*)\.(jpg|png|gif|jpeg)$',
];


/**
 * Create and initiate a figure object from JSON.
 * @param  {FigureComponentParamsDef} json JSON representation of the figure.
 * @return {Figure} Figure object representing the JSON data.
 */
Figure.fromJSON = function(json) {
  return new Figure(json);
};


/**
 * Handles onInstall when Paragrarph module is installed in an editor.
 * @param  {./editor} editor Instance of the editor that installed the module.
 */
Figure.onInstall = function(editor) {
  Figure.registerRegexes_(editor);
};


/**
 * Registers regular experessions to create image from if matched.
 * @param  {./editor} editor The editor to register the regex with.
 */
Figure.registerRegexes_ = function(editor) {
  for (var i = 0; i < Figure.IMAGE_URL_REGEXS.length; i++) {
    editor.registerRegex(
        Figure.IMAGE_URL_REGEXS[i],
        Figure.handleMatchedRegex);
  }
};


/**
 * Creates a figure component from a link.
 * @param {./paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<./defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
Figure.handleMatchedRegex = function(matchedComponent, opsCallback) {
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
 * Returns the class name of this component.
 * @return {string}
 */
Figure.prototype.getComponentClassName = function() {
  return Figure.CLASS_NAME;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Figure.
 */
Figure.prototype.getJSONModel = function() {
  var image = {
    component: Figure.CLASS_NAME,
    name: this.name,
    width: this.width,
    height: this.height,
    caption: this.captionParagraph.text,
  };

  if (!this.isDataUrl) {
    image.src = this.src;
  }

  return image;
};


/**
 * Renders a component in an element.
 * @param  {!Element} element Element to render component in.
 * @param  {Object=} opt_options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 * @override
 */
Figure.prototype.render = function(element, opt_options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, opt_options);

    if (this.src) {
      this.imgDom = document.createElement(Figure.IMAGE_TAG_NAME);
      this.imgDom.setAttribute('src', this.src);

      this.imgContainerDom = document.createElement(
          Figure.IMAGE_CONTAINER_TAG_NAME);
      if (this.width && this.height) {
        this.imgContainerDom.className = Figure.IMAGE_CONTAINER_CLASS_NAME;
        this.imgContainerDom.style.paddingBottom = (
            (parseInt(this.height, 10) / parseInt(this.width, 10) * 100) + '%');
      }
      this.imgContainerDom.appendChild(this.imgDom);
      this.dom.appendChild(this.imgContainerDom);
    }

    this.captionParagraph.render(this.dom, {editMode: this.editMode});

    if (this.editMode) {
      if (this.src) {
        this.imgDom.addEventListener(
            'click', this.handleClick.bind(this), false);
        this.selectionDom = document.createElement('div');
        this.selectionDom.innerHTML = '&nbsp;';
        this.selectionDom.className = 'selection-pointer';
        this.selectionDom.setAttribute('contenteditable', true);
        this.selectionDom.addEventListener(
            'focus', this.handleClick.bind(this), false);
        this.dom.appendChild(this.selectionDom);
      }

      this.captionParagraph.dom.setAttribute('contenteditable', true);

      if (this.imgDom && (!this.width || !this.height)) {
        this.imgDom.addEventListener('load', function() {
          if (this.editMode) {
            var styles = window.getComputedStyle(this.imgDom);
            this.width = Utils.getSizeWithUnit(styles.width);
            this.height = Utils.getSizeWithUnit(styles.height);
          }
        }.bind(this), false);
      }
    }
  }
};


/**
 * Handles clicking on the embedded component to update the selection.
 */
Figure.prototype.handleClick = function() {
  this.select();
};


/**
 * Returns the operations to execute a deletion of the image component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<./defs.OperationDef>} List of operations needed to be executed.
 */
Figure.prototype.getDeleteOps = function(opt_indexOffset, opt_cursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Figure',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.captionParagraph.text,
        width: this.width,
      },
    },
  }];

  // If this is the only child of the layout delete the layout as well.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a figure.
 * @param {number} index Index to insert the figure at.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<./defs.OperationDef>} Operations for inserting the figure.
 */
Figure.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
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
        caption: this.captionParagraph.text,
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
 * Returns the length of the figure content.
 * @return {number} Length of the figure content.
 */
Figure.prototype.getLength = function() {
  return 1;
};


/**
 * Updates figure attributes.
 * @param  {Object} attrs Attributes to update.
 */
Figure.prototype.updateAttributes = function(attrs) {
  if (attrs.src) {
    this.updateSource(attrs.src);
  }

  if (attrs.caption) {
    this.updateCaption(attrs.caption);
  }
};


/**
 * Updates the source attribute for the figure and its dom.
 * @param  {string} src Image source.
 */
Figure.prototype.updateSource = function(src) {
  this.src = src;
  this.isDataUrl = !!this.src && this.src.indexOf('http') !== 0;
  this.imgDom.setAttribute('src', src);
};


/**
 * Updates figure caption and its dom.
 * @param  {string} caption Caption text to update to.
 */
Figure.prototype.updateCaption = function(caption) {
  this.caption = caption;
  this.captionParagraph.setText(caption);
};
