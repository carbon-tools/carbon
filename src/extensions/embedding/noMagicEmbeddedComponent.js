'use strict';

var Utils = require('../../utils');
var Component = require('../../component');
var Loader = require('../../loader');
var EmbeddedComponent = require('./embeddedComponent');

/**
 * @typedef {{
 *   url: string,
 *   provider: string,
 *   caption: ?string,
 *   sizes: Object,
 *   type: ?string,
 *   serviceName: string
 * }} */
var NoMagicEmbeddedComponentParamsDef;


/**
 * NoMagicEmbeddedComponent main.
 * @param {NoMagicEmbeddedComponentParamsDef=} opt_params Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     name: Utils.getUID()
 *   }
 * @extends {../../component}
 * @constructor
 */
var NoMagicEmbeddedComponent = function(opt_params) {
  EmbeddedComponent.call(this, opt_params);

  this.isDropTarget = true;
};
NoMagicEmbeddedComponent.prototype = Object.create(EmbeddedComponent.prototype);
module.exports = NoMagicEmbeddedComponent;

/**
 * String name for the component class.
 * @type {string}
 */
NoMagicEmbeddedComponent.CLASS_NAME = 'EmbeddedComponent';
Loader.register(
    NoMagicEmbeddedComponent.CLASS_NAME,
    NoMagicEmbeddedComponent,
    /* force this component to register as EmbeddedComponent */ true);


/**
 * NoMagicEmbeddedComponent component element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.TAG_NAME = 'figure';


/**
 * NoMagicEmbeddedComponent element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.COMPONENT_CLASS_NAME = 'embedded';


/**
 * NoMagicEmbeddedComponent component inner container element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.CONTAINER_TAG_NAME = 'div';


/**
 * NoMagicEmbeddedComponent component inner container element class name.
 * @type {string}
 */
NoMagicEmbeddedComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.EMBED_TAG_NAME = 'div';


/**
 * Caption element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
NoMagicEmbeddedComponent.OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * Embed types.
 * @enum {string}
 */
NoMagicEmbeddedComponent.Types = {
  Rich: 'rich',
  Video: 'video',
  Link: 'link',
  Image: 'photo',
};


/**
 * Iframe URL to load third party embeds in (production).
 * @type {string}
 */
NoMagicEmbeddedComponent.IFRAME_URL = 'https://cdn.carbon.tools/__VERSION__/nomagic-iframe.html';


/**
 * Iframe URL to load third party embeds in (for development).
 * @type {string}
 */
NoMagicEmbeddedComponent.DEV_IFRAME_URL = (
    'http://iframe.localhost:8000/dist/nomagic-iframe.html');


/**
 * Name of the message to listen to for embed size.
 * @type {string}
 */
NoMagicEmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE = 'embed-size';


/**
 * A fallback provider name when provider is not installed.
 */
NoMagicEmbeddedComponent.FALLBACK_PROVIDER_NAME = 'fallback';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
NoMagicEmbeddedComponent.prototype.getComponentClassName = function() {
  return NoMagicEmbeddedComponent.CLASS_NAME;
};

/**
 * Create and initiate an embedded component from JSON.
 * @param  {NoMagicEmbeddedComponentParamsDef} json JSON representation of the embedded component.
 * @return {NoMagicEmbeddedComponent} NoMagicEmbeddedComponent object representing JSON data.
 */
NoMagicEmbeddedComponent.fromJSON = function(json) {
  return new NoMagicEmbeddedComponent(json);
};


/**
 * Handles onInstall when the NoMagicEmbeddedComponent module installed in an editor.
 */
NoMagicEmbeddedComponent.onInstall = function() {
};


/**
 * Sets the loaded HTML data on the embedded component.
 * @param  {Object} oembedData Data returned from oEmbed API.
 */
NoMagicEmbeddedComponent.prototype.oEmbedDataLoaded_ = function(oembedData) {
  if (!oembedData) {
    console.warn('Cound not find oembed for URL: ', this.url);
    return;
  }

  if (oembedData.html) {
    // Render the main embedded component.
    this.render_(this.embedDom, oembedData);
  } else {
    // TODO(mkhatib): Figure out a way to embed (link, image, embed) types.
    console.error('Embedding non-rich component is not supported yet.');
  }
};


/**
 * Renders the embedded component for specific screen to store the different
 * sizes for different screents.
 * @param  {!Element} embedDom Element to embed in.
 * @private
 */
NoMagicEmbeddedComponent.prototype.render_ = function(embedDom, oembedData) {
  var baseUrl = NoMagicEmbeddedComponent.IFRAME_URL;
  // If running on localhost for development?
  if (document.location.host.match(/localhost/)) {
    baseUrl = NoMagicEmbeddedComponent.DEV_IFRAME_URL;
  }

  // Get oembed URL for the URL.
  var providers = Loader.load('embedProviders');
  var embedProvider = /** @type {./abstractEmbedProvider} */ (
      providers[this.provider] ||
      providers[NoMagicEmbeddedComponent.FALLBACK_PROVIDER_NAME]);
  var oEmbedUrl = embedProvider.getOEmbedEndpointForUrl(this.url);

  // Add data to the hash of the iframe URL to pass it to the child iframe.
  var fullUrl = baseUrl + '#' + encodeURIComponent(JSON.stringify({
    oEmbedUrl: oEmbedUrl,
    origin: document.location.origin,
  }));

  var iframe = /** @type {!HTMLIFrameElement} */ (
      document.createElement('iframe'));
  iframe.src = fullUrl;
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('width', '100%');

  if (oembedData.type === 'rich') {
    if (oembedData.height) {
      iframe.setAttribute('height', oembedData.height);
    }
  }
  Utils.listen(iframe, NoMagicEmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE,
    function(data) {
      if (oembedData.type === 'rich') {
        iframe.setAttribute('height', data.height);
      } else if (oembedData.type === 'video' || oembedData.type == 'photo') {
        this.embedDom.style.paddingBottom = (
            data.height / data.width * 100) + '%';
      }
    }.bind(this));
  embedDom.appendChild(iframe);
};


/**
 * Whether the embedded component should render or not.
 * @return {boolean} true if the supported screen size has changed.
 */
NoMagicEmbeddedComponent.prototype.shouldRerender = function() {
  return false;
};


/**
 * Rerenders the embedded component. This allows for responsive embeds.
 * The article will tell the embed to rerender when its size change.
 */
NoMagicEmbeddedComponent.prototype.rerender = function() {
};


/**
 * @override
 */
NoMagicEmbeddedComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    this.containerDom = document.createElement(
        NoMagicEmbeddedComponent.CONTAINER_TAG_NAME);
    this.containerDom.className = NoMagicEmbeddedComponent.CONTAINER_CLASS_NAME;

    if (this.url) {
      this.embedDom = document.createElement(
          NoMagicEmbeddedComponent.EMBED_TAG_NAME);
      this.embedDom.classList.add('embed-container');
      this.containerDom.appendChild(this.embedDom);
      this.dom.appendChild(this.containerDom);
    }
    this.captionParagraph.render(this.dom, {editMode: this.editMode});

    this.loadEmbed_(function(oembedData) {
      this.type = oembedData.type;
      /* jshint camelcase: false */
      this.serviceName = oembedData.provider || oembedData.provider_name;
      if (this.serviceName) {
        this.dom.classList.add(this.serviceName.replace(/\s/ig, '-'));
      }

      if (oembedData.type === 'video' || oembedData.type === 'photo') {
        if (oembedData.height && oembedData.width) {
          this.embedDom.style.paddingBottom = (
              oembedData.height / oembedData.width * 100) + '%';
          this.dom.classList.add('responsive');
          this.dom.setAttribute('embedType', this.type);
          this.embedDom.classList.add('responsive-video');
          this.responsive = true;
        }
      }

      // TODO(mkhatib): Render a nice placeholder until the data has been
      // loaded.

      if (this.editMode) {
        this.overlayDom = document.createElement(
            NoMagicEmbeddedComponent.OVERLAY_TAG_NAME);
        this.overlayDom.className = NoMagicEmbeddedComponent.OVERLAY_CLASS_NAME;
        this.containerDom.appendChild(this.overlayDom);
        this.overlayDom.addEventListener('click', this.handleClick.bind(this));

        this.selectionDom = document.createElement('div');
        this.selectionDom.innerHTML = '&nbsp;';
        this.selectionDom.className = 'selection-pointer';
        this.selectionDom.setAttribute('contenteditable', true);
        this.selectionDom.addEventListener(
            'focus', this.handleClick.bind(this));
        this.containerDom.appendChild(this.selectionDom);

        this.captionParagraph.dom.setAttribute('contenteditable', true);
      }

      this.oEmbedDataLoaded_(oembedData);
    }.bind(this));
  }
};
