'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');

/**
 * EmbeddedComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 */
var EmbeddedComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    url: null,
    provider: null,
    caption: null,
    width: '100%',
    height: '360px',
  }, optParams);

  Component.call(this, params);

  /**
   * URL to embed.
   * @type {string}
   */
  this.url = params.url;

  /**
   * Embed provider name.
   * @type {string}
   */
  this.provider = params.provider;

  this.width = params.width;
  this.height = params.height;

  /**
   * Placeholder text to show if the EmbeddedComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(EmbeddedComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  this.containerDom = document.createElement(
      EmbeddedComponent.CONTAINER_TAG_NAME);
  this.containerDom.className = EmbeddedComponent.CONTAINER_CLASS_NAME;

  this.overlayDom = document.createElement(
      EmbeddedComponent.OVERLAY_TAG_NAME);
  this.overlayDom.className = EmbeddedComponent.OVERLAY_CLASS_NAME;
  this.containerDom.appendChild(this.overlayDom);
  this.overlayDom.addEventListener('click', this.select.bind(this));

  this.embedDom = document.createElement(EmbeddedComponent.EMBED_TAG_NAME);
  this.containerDom.appendChild(this.embedDom);

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
    placeholderText: 'Caption for embedded component',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  if (this.url) {
    if (this.width) {
      this.embedDom.setAttribute('width', this.width);
    }
    if (this.height) {
      this.embedDom.setAttribute('height', this.height);
    }
    this.containerDom.appendChild(this.embedDom);
    this.containerDom.appendChild(this.selectionDom);
  }

  this.captionDom = this.captionParagraph.dom;
  this.captionDom.setAttribute('contenteditable', true);
  this.dom.appendChild(this.containerDom);
  this.dom.appendChild(this.captionDom);
};
EmbeddedComponent.prototype = Object.create(Component.prototype);
module.exports = EmbeddedComponent;

/**
 * String name for the component class.
 * @type {string}
 */
EmbeddedComponent.CLASS_NAME = 'EmbeddedComponent';
Loader.register(EmbeddedComponent.CLASS_NAME, EmbeddedComponent);


/**
 * EmbeddedComponent component element tag name.
 * @type {string}
 */
EmbeddedComponent.TAG_NAME = 'figure';


/**
 * EmbeddedComponent component inner container element tag name.
 * @type {string}
 */
EmbeddedComponent.CONTAINER_TAG_NAME = 'div';


/**
 * EmbeddedComponent component inner container element class name.
 * @type {string}
 */
EmbeddedComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.EMBED_TAG_NAME = 'div';


/**
 * Caption element tag name.
 * @type {string}
 */
EmbeddedComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
EmbeddedComponent.prototype.getComponentClassName = function() {
  return EmbeddedComponent.CLASS_NAME;
};

/**
 * Create and initiate an embedded component from JSON.
 * @param  {Object} json JSON representation of the embedded component.
 * @return {EmbeddedComponent} EmbeddedComponent object representing JSON data.
 */
EmbeddedComponent.fromJSON = function (json) {
  return new EmbeddedComponent(json);
};


/**
 * Handles onInstall when the EmbeddedComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
EmbeddedComponent.onInstall = function() {
};


/**
 * Sets the loaded HTML data on the embedded component.
 * @param  {Object} oembedData Data returned from oEmbed API.
 */
EmbeddedComponent.prototype.oEmbedDataLoaded_ = function(oembedData) {
  if (!oembedData) {
    console.warn('Cound not find oembed for URL: ', this.url);
    return;
  }
  if (oembedData.html) {
    this.embedDom.innerHTML = oembedData.html;
    var scripts = this.embedDom.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      /* jshint evil: true */
      if (!scripts[i].getAttribute('src')) {
        eval(Utils.getTextFromElement(scripts[i]));
      } else {
        var script = document.createElement('script');
        script.src = scripts[i].getAttribute('src');
        if (scripts[i].parentNode) {
          scripts[i].parentNode.replaceChild(script, scripts[i]);
        } else {
          document.body.appendChild(script);
        }
      }
    }
  } else {
    // TODO(mkhatib): Figure out a way to embed (link, image, embed) types.
    console.error('Embedding non-rich component is not supported yet.');
  }
};


/**
 * Renders a component in an element.
 * @param  {HTMLElement} element Element to render component in.
 * @param  {Object} options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 * @override
 */
EmbeddedComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    this.loadEmbed_();
  }
};


/**
 * Loads the embed from the embed provider.
 * @private
 */
EmbeddedComponent.prototype.loadEmbed_ = function() {
  var embedProvider = Loader.load('embedProviders')[this.provider];
  embedProvider.getEmbedForUrl(
      this.url,
      this.oEmbedDataLoaded_.bind(this), {
        width: 600
      });
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this EmbeddedComponent.
 */
EmbeddedComponent.prototype.getJSONModel = function() {
  var embed = {
    component: this.getComponentClassName(),
    name: this.name,
    url: this.url,
    provider: this.provider,
    height: this.height,
    width: this.width,
    caption: this.captionParagraph.text
  };

  return embed;
};


/**
 * Handles clicking on the embedded component to update the selection.
 */
EmbeddedComponent.prototype.select = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });

  // TODO(mkhatib): Unselect the component when the embed plays to allow the
  // user to select it again and delete it.
  return false;
};



/**
 * Returns the operations to execute a deletion of the embedded component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
EmbeddedComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        url: this.url,
        provider: this.provider,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a embedded component.
 * @param {number} index Index to insert the embedded component at.
 * @return {Array.<Object>} Operations for inserting the embedded component.
 */
EmbeddedComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        url: this.url,
        provider: this.provider,
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
 * Returns the length of the embedded component content.
 * @return {number} Length of the embedded component content.
 */
EmbeddedComponent.prototype.getLength = function () {
  return 1;
};
