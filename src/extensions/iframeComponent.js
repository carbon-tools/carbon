'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');
var I18n = require('../i18n');

/**
 * IFrameComponent main.
 * @param {Object=} opt_params Optional params to initialize the object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 * @extends {../component}
 * @constructor
 */
var IFrameComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '360px',
  }, opt_params);

  Component.call(this, params);

  /**
   * Internal model text in this IFrameComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;
  this.height = params.height;

  /**
   * Placeholder text to show if the IFrameComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(IFrameComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {../paragraph}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: I18n.get('placeholder.embed') || '',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true,
  });

};
IFrameComponent.prototype = Object.create(Component.prototype);
module.exports = IFrameComponent;

/**
 * String name for the component class.
 * @type {string}
 */
IFrameComponent.CLASS_NAME = 'IFrameComponent';
Loader.register(IFrameComponent.CLASS_NAME, IFrameComponent);


/**
 * IFrameComponent component element tag name.
 * @type {string}
 */
IFrameComponent.TAG_NAME = 'figure';


/**
 * IFrameComponent component inner container element tag name.
 * @type {string}
 */
IFrameComponent.CONTAINER_TAG_NAME = 'div';


/**
 * IFrameComponent component inner container element class name.
 * @type {string}
 */
IFrameComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
IFrameComponent.IFRAME_OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
IFrameComponent.IFRAME_TAG_NAME = 'iframe';


/**
 * Caption element tag name.
 * @type {string}
 */
IFrameComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
IFrameComponent.IFRAME_OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
IFrameComponent.prototype.getComponentClassName = function() {
  return IFrameComponent.CLASS_NAME;
};


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {IFrameComponent} IFrameComponent object representing JSON data.
 */
IFrameComponent.fromJSON = function(json) {
  return new IFrameComponent(json);
};


/**
 * Handles onInstall when the IFrameComponent module installed in an editor.
 * @param  {../editor} unusedEditor Instance of the editor that installed the module.
 */
IFrameComponent.onInstall = function(unusedEditor) {
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this IFrameComponent.
 */
IFrameComponent.prototype.getJSONModel = function() {
  var video = {
    component: this.getComponentClassName(),
    name: this.name,
    src: this.src,
    height: this.height,
    width: this.width,
    caption: this.captionParagraph.text,
  };

  return video;
};


/** @override */
IFrameComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);

    if (this.src) {
      this.containerDom = document.createElement(
          IFrameComponent.CONTAINER_TAG_NAME);
      this.containerDom.className = IFrameComponent.CONTAINER_CLASS_NAME;
      this.iframeDom = document.createElement(IFrameComponent.IFRAME_TAG_NAME);
      this.containerDom.appendChild(this.iframeDom);

      this.iframeDom.setAttribute('src', this.src);
      this.iframeDom.setAttribute('frameborder', 0);
      this.iframeDom.setAttribute('allowfullscreen', true);
      if (this.width) {
        this.iframeDom.setAttribute('width', this.width);
      }
      if (this.height) {
        this.iframeDom.setAttribute('height', this.height);
      }
      this.containerDom.appendChild(this.iframeDom);
      this.dom.appendChild(this.containerDom);

      this.captionParagraph.render(this.dom);
      this.captionParagraph.dom.setAttribute('contenteditable', true);


      if (this.editMode) {
        this.overlayDom = document.createElement(
            IFrameComponent.IFRAME_OVERLAY_TAG_NAME);
        this.overlayDom.className = IFrameComponent.IFRAME_OVERLAY_CLASS_NAME;
        this.containerDom.appendChild(this.overlayDom);
        this.overlayDom.addEventListener('click', this.handleClick.bind(this));

        this.selectionDom = document.createElement('div');
        this.selectionDom.innerHTML = '&nbsp;';
        this.selectionDom.className = 'selection-pointer';
        this.selectionDom.setAttribute('contenteditable', true);
        this.selectionDom.addEventListener(
            'focus', this.handleClick.bind(this));
        this.containerDom.appendChild(this.selectionDom);
      }
    }
  }
};


/**
 * Handles clicking on the youtube component to update the selection.
 * @param {Event} unusedEvent
 */
IFrameComponent.prototype.handleClick = function(unusedEvent) {
  this.select();
  // TODO(mkhatib): Unselect the component when the video plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Handles clicking on the youtube component to update the selection.
 */
IFrameComponent.prototype.select = function() {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0,
  });
};



/**
 * Returns the operations to execute a deletion of the YouTube component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array<../defs.OperationDef>} List of operations needed to be executed.
 */
IFrameComponent.prototype.getDeleteOps = function(optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name,
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width,
      },
    },
  }];
};


/**
 * Returns the operations to execute inserting a youtube component.
 * @param {number} index Index to insert the youtube component at.
 * @return {Array<../defs.OperationDef>} Operations for inserting the youtube component.
 */
IFrameComponent.prototype.getInsertOps = function(index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
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
    },
  }];
};

/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
IFrameComponent.prototype.getLength = function() {
  return 1;
};
