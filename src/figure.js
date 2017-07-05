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
 *   alt: (?string|undefined),
 *   captionPlaceholder: (?string|undefined),
 *   width: (?string|undefined),
 *   height: (?string|undefined),
 *   isAttachment: (?boolean|undefined),
 * }}
 */
var FigureComponentParamsDef;


/**
 * @typedef {{
 *   src: string,
 *   descriptor: string,
 * }}
 */
var ImgSrcSetDef;


/**
 * Figure placeholder when source has not persisted correctly.
 * e.g. Upload interrepted and failed to upload.
 */
// eslint-disable-next-line max-len
var FIGURE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg%20width%3D%221440%22%20height%3D%221024%22%20viewBox%3D%220%200%201440%201024%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20style%3D%22background%3A%23fff%22%3E%3Ctitle%3Eimage-placeholder%3C%2Ftitle%3E%3Cdefs%3E%3Cpath%20id%3D%22a%22%20d%3D%22M0%200h1440v1024H0z%22%2F%3E%3Cmask%20id%3D%22b%22%20x%3D%220%22%20y%3D%220%22%20width%3D%221440%22%20height%3D%221024%22%20fill%3D%22%23fff%22%3E%3Cuse%20xlink%3Ahref%3D%22%23a%22%2F%3E%3C%2Fmask%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cuse%20stroke%3D%22%23F2F2F2%22%20mask%3D%22url(%23b)%22%20stroke-width%3D%2210%22%20fill%3D%22%23FFF%22%20xlink%3Ahref%3D%22%23a%22%2F%3E%3Ccircle%20fill%3D%22%23F2F2F2%22%20cx%3D%221068.5%22%20cy%3D%22241.5%22%20r%3D%22162.5%22%2F%3E%3Cpath%20fill%3D%22%23F2F2F2%22%20d%3D%22M496.5%20303l664.5%20715-1156%201V832.02z%22%2F%3E%3Cpath%20fill%3D%22%23F2F2F2%22%20d%3D%22M998%20473l435.46%20407.243V1018H413z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';

/**
 * Placeholder width/height ratio.
 * @type {number}
 */
var PLACEHOLDER_RATIO = 1.40625;

/**
 * Figure main.
 * @param {FigureComponentParamsDef=} opt_params Optional params to initialize the Figure object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     alt: null,
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
    sizes: '100vw',
    srcset: [],
    caption: null,
    alt: null,
    captionPlaceholder: I18n.get('placeholder.figure'),
    width: '100%',
    height: null,
    isAttachment: false,
    placeholderImage: FIGURE_PLACEHOLDER,
  }, opt_params));

  Component.call(this, params);

  /**
   * @type {string}
   */
  this.src = params.src || params.placeholderImage;

  /**
   * Data to calculate srcset attribute for an image from it.
   * @type {!Array<ImgSrcSetDef>}
   */
  this.srcset = params.srcset;

  /**
   * Sizes attribute for the image.
   * @type {string}
   */
  this.sizes = params.sizes;

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
   * Alt text to show on the image for accessibility.
   * @type {string}
   */
  this.alt = params.alt || '';

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
  this.dom.setAttribute('draggable', true);

  /** @private */
  this.bindedImageLoad_ = this.onImageLoad_.bind(this);

  this.isDropTarget = true;
  this.updateIsAttachment(this.isAttachment);

  /** @export */
  this.responsive = true;
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
    alt: this.alt,
    isAttachment: this.isAttachment,
    srcset: this.srcset,
    sizes: this.sizes,
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

      this.imgContainerDom = document.createElement(
          Figure.IMAGE_CONTAINER_TAG_NAME);
      this.imgContainerDom.appendChild(this.imgDom);
      this.dom.appendChild(this.imgContainerDom);

      this.dom.style.flex = PLACEHOLDER_RATIO;
      if (this.src != FIGURE_PLACEHOLDER) {
        if (this.srcset && this.srcset.length) {
          this.updateSrcSet(this.srcset);
        }
        if (this.sizes) {
          this.updateSizes(this.sizes);
        }
        if (this.editMode && this.imgDom && (!this.width || !this.height)) {
          this.imgDom.addEventListener('load', this.bindedImageLoad_, false);
        }
        this.updateResponsiveDom_();
      }
      this.imgDom.setAttribute('src', this.src);
      this.imgDom.setAttribute('alt', this.alt);
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
    }
  }
};


/**
 * Handles image loading event and update size-related attributes for the model.
 * @param {Event} unusedEvent
 * @private
 */
Figure.prototype.onImageLoad_ = function(unusedEvent) {
  this.imgDom.removeEventListener('load', this.bindedImageLoad_);
  requestAnimationFrame(function() {
    this.calculateWidthHeight_();
    // Recalculate width/height after flex kicks in and update the responsive
    // sizes of the images.
    setTimeout(function() {
      this.calculateWidthHeight_();
      // Update the layout with the new information.
      this.section.onChildSizeUpdated(this, {
        width: this.width,
        height: this.height,
      });
    }.bind(this), 500);
  }.bind(this));
};


/**
 * Calculates width and height of the figure and updates them.
 * @private
 */
Figure.prototype.calculateWidthHeight_ = function() {
  var styles = window.getComputedStyle(this.imgDom);
  this.width = Utils.getSizeWithUnit(styles.width);
  this.height = Utils.getSizeWithUnit(styles.height);
  this.updateResponsiveDom_();
};


/**
 * Creates flex and padding-bottom to allow images to be responsive.
 * @private
 */
Figure.prototype.updateResponsiveDom_ = function() {
  if (this.width && this.height) {
    var flex = parseInt(this.width, 10) / parseInt(this.height, 10);
    if (this.sizes == '100vw') {
      flex = '1';
    }
    var paddingBottomPercentage = ((
        parseInt(this.height, 10) / parseInt(this.width, 10) * 100) + '%');
    this.imgContainerDom.className = Figure.IMAGE_CONTAINER_CLASS_NAME;
    this.imgContainerDom.style.paddingBottom = paddingBottomPercentage;
    this.dom.style.flex = flex;
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
        sizes: this.sizes,
        srcset: this.srcset,
        caption: this.captionParagraph.text,
        alt: this.alt,
        width: this.width,
        isAttachment: this.isAttachment,
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
        sizes: this.sizes,
        srcset: this.srcset,
        width: this.width,
        caption: this.captionParagraph.text,
        alt: this.alt,
        isAttachment: this.isAttachment,
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
 * @param {Object} attrs Attributes to update.
 */
Figure.prototype.updateAttributes = function(attrs) {
  if (attrs.src) {
    this.updateSource(attrs.src);
  }

  if (attrs.sizes) {
    this.updateSizes(attrs.sizes);
  }

  if (attrs.alt) {
    this.updateAlt(attrs.alt);
  }

  if (attrs.srcset) {
    this.updateSrcSet(attrs.srcset);
  }

  if (attrs.caption) {
    this.updateCaption(attrs.caption);
  }

  if (attrs.isAttachment !== undefined) {
    this.updateIsAttachment(attrs.isAttachment);
  }
};


/**
 * Updates the source attribute for the figure and its dom.
 * @param {string} src Image source.
 */
Figure.prototype.updateSource = function(src) {
  this.src = src;
  this.isDataUrl = !!this.src && this.src.indexOf('http') !== 0;
  if (this.src != FIGURE_PLACEHOLDER &&
      this.editMode && this.imgDom &&
      (!this.width || !this.height)) {
    this.imgDom.addEventListener('load', this.bindedImageLoad_, false);
  }
  this.imgDom.setAttribute('src', src);
};



/**
 * Update the alt attribute for the image.
 * @param {string} alt
 */
Figure.prototype.updateAlt = function(alt) {
  this.alt = alt;
  this.imgDom.setAttribute('alt', alt);
};


/**
 * Update the sizes attribute for the image.
 * @param {string} sizes
 */
Figure.prototype.updateSizes = function(sizes) {
  this.sizes = sizes;
  this.imgDom.setAttribute('sizes', sizes);
  this.updateResponsiveDom_();
};


/**
 * Updates img srcset.
 * @param {Array<ImgSrcSetDef>} srcset
 */
Figure.prototype.updateSrcSet = function(srcset) {
  this.srcset = srcset;
  this.imgDom.setAttribute('srcset', this.getSrcSetString_(srcset));
};


/**
 * Updates figure caption and its dom.
 * @param {string} caption Caption text to update to.
 */
Figure.prototype.updateCaption = function(caption) {
  this.caption = caption;
  this.captionParagraph.setText(caption);
};


/**
 * Updates figure isAttachment attribute.
 * @param {boolean} isAttachment.
 */
Figure.prototype.updateIsAttachment = function(isAttachment) {
  this.isAttachment = isAttachment;
  if (this.isAttachment) {
    this.dom.classList.add('carbon-attachment');
  } else {
    this.dom.classList.remove('carbon-attachment');
  }
};


/**
 * Calculates the actual value of the srcset attribute for img element.
 * @param {Array<ImgSrcSetDef>} srcset
 * @return {string}
 * @private
 */
Figure.prototype.getSrcSetString_ = function(srcset) {
  var srcsetArr = [];
  for (var i = 0; i < srcset.length; i++) {
    srcsetArr.push(srcset[i].src + ' ' + srcset[i].descriptor);
  }
  return srcsetArr.join(',');
};

/**
 * @override
 */
Figure.prototype.canBeLaidOut = function() {
  return !this.isDataUrl;
};
