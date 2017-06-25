'use strict';

var Utils = require('../../utils');
var Component = require('../../component');
var Paragrarph = require('../../paragraph');
var Loader = require('../../loader');
var I18n = require('../../i18n');


/**
 * @typedef {{
 *   url: string,
 *   provider: string,
 *   caption: ?string,
 *   sizes: Object,
 *   type: ?string,
 *   serviceName: string
 * }} */
var EmbeddedComponentParamsDef;


/**
 * EmbeddedComponent main.
 * @param {EmbeddedComponentParamsDef=} opt_params Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     name: Utils.getUID()
 *   }
 * @extends {../../component}
 * @constructor
 */
var EmbeddedComponent = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {EmbeddedComponentParamsDef} */ (Utils.extend({
    url: null,
    provider: null,
    caption: null,
    sizes: {},
    type: EmbeddedComponent.Types.Rich,
    serviceName: null,
  }, opt_params));

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

  /**
   * Embed service name (e.g. twitter).
   * @type {string}
   */
  this.serviceName = params.serviceName;

  /**
   * Embed type.
   * @type {string}
   */
  this.type = params.type || EmbeddedComponent.Types.Rich;

  /**
   * Sizes of the embedded component in different container sizes.
   * @type {!Object}
   */
  this.sizes = params.sizes || {};

  /**
   * Placeholder text to show if the EmbeddedComponent is empty.
   * @type {string}
   */
  this.caption = params.caption || '';

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {../../paragraph}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: I18n.get('placeholder.embed') || '',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true,
  });

  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(EmbeddedComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  // TODO(mkhatib): Allow this once embeddable stuff works and
  // we have a better responsive solutions on mobile.
  this.dom.setAttribute('draggable', true);
  this.dom.className = EmbeddedComponent.COMPONENT_CLASS_NAME;

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
 * EmbeddedComponent element tag name.
 * @type {string}
 */
EmbeddedComponent.COMPONENT_CLASS_NAME = 'embedded';


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
 * The screen sizes to render the component for.
 * @type {Array<number>}
 */
EmbeddedComponent.RENDER_FOR_SCREEN_SIZES = [300, 450, 600, 900, 1200];


/**
 * Embed types.
 * @enum {string}
 */
EmbeddedComponent.Types = {
  Rich: 'rich',
  Video: 'video',
  Link: 'link',
  Image: 'image',
};


/**
 * Iframe URL to load third party embeds in (production).
 * @type {string}
 */
EmbeddedComponent.IFRAME_URL = 'https://cdn.carbon.tools/__VERSION__/iframe.html';


/**
 * Iframe URL to load third party embeds in (for development).
 * @type {string}
 */
EmbeddedComponent.DEV_IFRAME_URL = (
    'http://iframe.localhost:8000/dist/iframe.html');


/**
 * Container to render offscreen.
 * @type {string}
 */
EmbeddedComponent.OFFSCREEN_CONTAINER_ID = 'carbon-off-screen';


/**
 * CLass name for temp rendering container.
 * @type {string}
 */
EmbeddedComponent.TEMP_RENDER_CONTAINER_CLASSNAME = 'temp-render';


/**
 * Name of the message to listen to for embed size.
 * @type {string}
 */
EmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE = 'embed-size';


/**
 * A fallback provider name when provider is not installed.
 */
EmbeddedComponent.FALLBACK_PROVIDER_NAME = 'fallback';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
EmbeddedComponent.prototype.getComponentClassName = function() {
  return EmbeddedComponent.CLASS_NAME;
};

/**
 * Create and initiate an embedded component from JSON.
 * @param  {EmbeddedComponentParamsDef} json JSON representation of the embedded component.
 * @return {EmbeddedComponent} EmbeddedComponent object representing JSON data.
 */
EmbeddedComponent.fromJSON = function(json) {
  return new EmbeddedComponent(json);
};


/**
 * Handles onInstall when the EmbeddedComponent module installed in an editor.
 */
EmbeddedComponent.onInstall = function() {
  var offScreen = document.getElementById(
      EmbeddedComponent.OFFSCREEN_CONTAINER_ID);
  if (!offScreen) {
    offScreen = document.createElement('div');
    offScreen.id = EmbeddedComponent.OFFSCREEN_CONTAINER_ID;
    offScreen.style.width = '3000px';
    document.body.appendChild(offScreen);
  }
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

  /**
   * Removes the temp rendering dom from document.
   * @param  {!Element} embedDom Element to remove.
   */
  function cleanupRenderingDom_(embedDom) {
    return function() {
      try {
        embedDom.parentNode.removeChild(embedDom);
      } catch (e) {
        console.warn(e);
      }
    };
  }

  // TODO(mkhatib): Provide a lite mode load to allow loading a placeholder
  // and only load the scripts and iframes on click.
  if (oembedData.html) {

    // Render the main embedded component.
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width, 10);
    var screen = (
        this.getClosestSupportedScreenSize_(containerWidth) || containerWidth);
    this.renderForScreen_(screen, this.embedDom);


    // In edit mode. Try to render the component in for different screen sizes
    // to allow us to pre-calculate the width and height it will take in
    // that screen size.
    // Do this only for Rich embeds since they don't maintain a fixed aspect
    // ratio - unlike video and image embeds.
    if (this.editMode && this.type === EmbeddedComponent.Types.Rich) {
      var offScreen = document.getElementById(
          EmbeddedComponent.OFFSCREEN_CONTAINER_ID);
      var screenSizes = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES;

      for (var j = 0; j < screenSizes.length; j++) {
        if (!this.sizes || !this.sizes[screenSizes[j]]) {
          var embedDom = document.createElement('div');
          embedDom.className = (
              EmbeddedComponent.TEMP_RENDER_CONTAINER_CLASSNAME);
          embedDom.style.width = screenSizes[j] + 'px';
          offScreen.appendChild(embedDom);
          this.renderForScreen_(screenSizes[j], embedDom);
          setTimeout(cleanupRenderingDom_(embedDom), 10000);
        }
      }

    }
  } else {
    // TODO(mkhatib): Figure out a way to embed (link, image, embed) types.
    console.error('Embedding non-rich component is not supported yet.');
  }
};


/**
 * Renders the embedded component for specific screen to store the different
 * sizes for different screents.
 * @param  {number} screen Screen width to render it for.
 * @param  {!Element} embedDom Element to embed in.
 * @private
 */
EmbeddedComponent.prototype.renderForScreen_ = function(screen, embedDom) {
  var baseUrl = EmbeddedComponent.IFRAME_URL;
  // If running on localhost for development?
  if (document.location.host.match(/localhost/)) {
    baseUrl = EmbeddedComponent.DEV_IFRAME_URL;
  }

  // Get oembed URL for the URL.
  var providers = Loader.load('embedProviders');
  var embedProvider = /** @type {./abstractEmbedProvider} */ (
      providers[this.provider] ||
      providers[EmbeddedComponent.FALLBACK_PROVIDER_NAME]);
  var oEmbedUrl = embedProvider.getOEmbedEndpointForUrl(this.url, {
    width: screen,
  });

  // Add data to the hash of the iframe URL to pass it to the child iframe.
  var fullUrl = baseUrl + '#' + encodeURIComponent(JSON.stringify({
    width: screen,
    oEmbedUrl: oEmbedUrl,
    origin: document.location.origin,
  }));

  var iframe = /** @type {!HTMLIFrameElement} */ (
      document.createElement('iframe'));
  iframe.src = fullUrl;
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('width', '100%');

  // Set initial height of 50% of the width for visual improvement. This would
  // be updated as the iframe renders.
  iframe.setAttribute('height', (screen / 2) + 'px');

  Utils.listen(iframe, EmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE,
      function(data) {
        this.sizes[screen] = {
          width: parseFloat(data.width),
          height: parseFloat(data.height),
        };
        this.updateSize_();
        iframe.setAttribute('height', data.height);
      }.bind(this));
  embedDom.appendChild(iframe);
};


/**
 * Returns the closest screen size to the width.
 * @param  {number} width
 * @return {number}
 */
EmbeddedComponent.prototype.getClosestSupportedScreenSize_ = function(width) {
  var screenSizes = [];
  for (var size in this.sizes) {
    screenSizes.push(parseInt(size, 10));
  }

  for (var i = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES.length; i > 0; i--) {
    var standardScreenSize = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES[i];
    if (standardScreenSize && screenSizes.indexOf(standardScreenSize) === -1) {
      screenSizes.push(standardScreenSize);
    }
  }
  screenSizes.sort(function(a, b) {
    return a - b;
  });

  for (var j = screenSizes.length; j > 0; j--) {
    if (screenSizes[j] <= width) {
      return screenSizes[j];
    }
  }
  return screenSizes[0];
};


/**
 * Calculates and returns the ration for the closest screen size for rendering
 * in the required width.
 * @param  {number} width Width of the container to render the component in.
 * @return {string} Height to Width Ration in percentage.
 */
EmbeddedComponent.prototype.getRatioFor_ = function(width) {
  var screen = this.getClosestSupportedScreenSize_(width);
  var size = this.sizes[screen];
  return size && (size.height / size.width * 100) + '%';
};


/**
 * Whether the embedded component should render or not.
 * @return {boolean} true if the supported screen size has changed.
 */
EmbeddedComponent.prototype.shouldRerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width, 10);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var currentWidth = parseInt(this.containerDom.style.width, 10);
  return screen !== currentWidth;
};


/**
 * Rerenders the embedded component. This allows for responsive embeds.
 * The article will tell the embed to rerender when its size change.
 */
EmbeddedComponent.prototype.rerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width, 10);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var ratio = this.getRatioFor_(containerWidth);

  this.containerDom.style.width = screen + 'px';
  this.embedDom.className = 'embed-container';
  this.embedDom.style.paddingBottom = ratio;

  setTimeout(function() {
    this.loadEmbed_(this.oEmbedDataLoaded_.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth),
    });
  }.bind(this), 200);
};


/**
 * Updates the size of the embed.
 * @private
 */
EmbeddedComponent.prototype.updateSize_ = function() {
  if (!Utils.isEmpty(this.sizes)) {
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width, 10);
    // Only add the ratio padding-bottom trick for fixed-ratio embeds.
    if (this.type === EmbeddedComponent.Types.Video ||
        this.type === EmbeddedComponent.Types.Image) {
      this.embedDom.classList.add('ratio-container');
      var ratio = this.getRatioFor_(containerWidth);
      this.embedDom.style.paddingBottom = ratio;
      this.embedDom.style.width = 'auto';
      this.embedDom.style.height = 'auto';
    } else if (containerWidth) {
      var screen = this.getClosestSupportedScreenSize_(containerWidth);
      if (screen && this.sizes[screen]) {
        this.embedDom.style.paddingBottom = 0;
        this.embedDom.style.width = this.sizes[screen].width + 'px';
        this.embedDom.style.height = this.sizes[screen].height + 'px';
      }
    }
  } else {
    this.embedDom.style.paddingBottom = '56.25%';
  }
};


/**
 * @override
 */
EmbeddedComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width, 10);

    this.containerDom = document.createElement(
        EmbeddedComponent.CONTAINER_TAG_NAME);
    this.containerDom.className = EmbeddedComponent.CONTAINER_CLASS_NAME;

    if (this.url) {
      this.embedDom = document.createElement(
          EmbeddedComponent.EMBED_TAG_NAME);
      this.embedDom.classList.add('embed-container');
      this.updateSize_();
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

      // TODO(mkhatib): Render a nice placeholder until the data has been
      // loaded.
      if (this.url) {
        this.updateSize_();
      }

      if (this.editMode) {
        this.overlayDom = document.createElement(
            EmbeddedComponent.OVERLAY_TAG_NAME);
        this.overlayDom.className = EmbeddedComponent.OVERLAY_CLASS_NAME;
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

        if (!this.sizes) {
          this.containerDom.style.width = this.getClosestSupportedScreenSize_(
              containerWidth) + 'px';
        }
      }

      this.oEmbedDataLoaded_(oembedData);
    }.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth),
    });

  }
};


/**
 * Loads the embed from the embed provider.
 * @private
 */
EmbeddedComponent.prototype.loadEmbed_ = function(callback, optArgs) {
  var providers = Loader.load('embedProviders');
  var embedProvider = (
      providers[this.provider] ||
      providers[EmbeddedComponent.FALLBACK_PROVIDER_NAME]);
  if (embedProvider) {
    embedProvider.getEmbedForUrl(this.url, callback, optArgs);
  } else {
    console.warn('Could not find embed provider ' + this.provider);
  }
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
    sizes: this.sizes,
    caption: this.captionParagraph.text,
    type: this.type,
    serviceName: this.serviceName,
  };

  return embed;
};



/**
 * Handles clicking on the embedded component to update the selection.
 */
EmbeddedComponent.prototype.handleClick = function() {
  this.select();

  // TODO(mkhatib): Unselect the component when the embed plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Returns the operations to execute a deletion of the embedded component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<../../defs.OperationDef>} List of operations needed to be executed.
 */
EmbeddedComponent.prototype.getDeleteOps = function(
    opt_indexOffset, opt_cursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        url: this.url,
        provider: this.provider,
        caption: this.caption,
        sizes: this.sizes,
        type: this.type,
        serviceName: this.serviceName,
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
 * Returns the operations to execute inserting a embedded component.
 * @param {number} index Index to insert the embedded component at.
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<../../defs.OperationDef>} Operations for inserting the embedded component.
 */
EmbeddedComponent.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
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
        sizes: this.sizes,
        caption: this.caption,
        type: this.type,
        serviceName: this.serviceName,
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
 * Returns the length of the embedded component content.
 * @return {number} Length of the embedded component content.
 */
EmbeddedComponent.prototype.getLength = function() {
  return 1;
};

/**
 * @override
 */
EmbeddedComponent.prototype.canBeLaidOut = function() {
  return true;
};
