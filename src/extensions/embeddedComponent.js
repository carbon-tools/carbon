'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');
var I18n = require('../i18n');


/**
 * EmbeddedComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     name: Utils.getUID()
 *   }
 */
var EmbeddedComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    url: null,
    provider: null,
    caption: null,
    sizes: null
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

  /**
   * Sizes of the embedded component in different container sizes.
   * @type {object}
   */
  this.sizes = params.sizes;

  /**
   * Placeholder text to show if the EmbeddedComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: I18n.get('placeholder.embed'),
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(EmbeddedComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
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
 * @type {Array.<number>}
 */
EmbeddedComponent.RENDER_FOR_SCREEN_SIZES = [350, 450, 600];


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

  /**
   * This is a very ugly hack to fix Facebook embeds width and heights
   * changing to 0px on re-render and reloading FB SDK.
   *
   * This checks all FB embeds and fixes their heights and widths.
   *
   * @param  {string} width Width of the container of the embed.
   * @param  {string} height Height of the container of the embed.
   */
  var fixFacebookEmbedSizes_ = function(width, height) {
    return function () {
      var fbPostDoms = document.querySelectorAll('.carbon .fb-post');
      for (var i = 0; i < fbPostDoms.length; i++) {
        var fbPostDom = fbPostDoms[i];

        var spanEl = fbPostDom.querySelector('span');
        var spanWidth = spanEl.style.width;
        if (spanWidth === '0px') {
          spanEl.style.width = width;
          spanEl.style.height = height;
        } else if (spanWidth === '') {
          setTimeout(fixFacebookEmbedSizes_(width, height), 200);
          break;
        }
      }
    };
  };

  // TODO(mkhatib): Provide a lite mode load to allow loading a placeholder
  // and only load the scripts and iframes on click.
  if (oembedData.html) {
    this.embedDom.innerHTML = oembedData.html;
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width);
    var screen = this.getClosestSupportedScreenSize_(containerWidth);
    var fbPostDom = this.embedDom.querySelector('.fb-post');
    if (fbPostDom) {
      fbPostDom.setAttribute('data-width', screen);
    }
    this.executeScriptsIn_(this.embedDom);

    // Facebook posts wouldn't render if the SDK have already been loaded
    // before. So we need to manually trigger parse.
    if (fbPostDom && window.FB && this.sizes) {
      FB.XFBML.parse();
      var height = parseInt(styles.height) + 20;
      setTimeout(
          fixFacebookEmbedSizes_(screen + 'px', height + 'px'),
          500);
    }

    if (this.editMode && !this.sizes) {
      var screenSizes = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES;
      for (var j = 0; j < screenSizes.length; j++) {
        this.renderForScreen_(screenSizes[j]);
      }
    }

  } else {
    // TODO(mkhatib): Figure out a way to embed (link, image, embed) types.
    console.error('Embedding non-rich component is not supported yet.');
  }
};


/**
 * Executes scripts included in the passed element.
 * @param  {Element} element
 * @private
 */
EmbeddedComponent.prototype.executeScriptsIn_ = function(element) {
  var scripts = element.getElementsByTagName('script');
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
};


/**
 * Renders the embedded component for specific screen to store the different
 * sizes for different screents.
 * @param  {number} screen Screen width to render it for.
 * @param  {String} html The HTML to render in that size.
 * @private
 */
EmbeddedComponent.prototype.renderForScreen_ = function(screen) {
  this.loadEmbed_(function(oembedData) {
    var html = oembedData.html;
    var embedDom = document.createElement('div');
    embedDom.style.position = 'absolute';
    embedDom.style.top = '-99999px';
    embedDom.style.left = '-99999px';
    embedDom.style.width = screen + 'px';

    embedDom.innerHTML = html;
    document.body.appendChild(embedDom);

    // For facebook to render the post for the required size it needs a
    // data-width attribute present on .fb-post element.
    var fbPostDom = embedDom.querySelector('.fb-post');
    if (fbPostDom) {
      fbPostDom.setAttribute('data-width', screen);
    }

    if (fbPostDom && window.FB) {
      FB.XFBML.parse();
    } else {
      this.executeScriptsIn_(embedDom);
    }

    this.updateSize_(screen, embedDom);
    Utils.addResizeListener(
        embedDom, this.updateSize_.bind(this, screen, embedDom));

    // Cleanup.
    // TODO(mkhatib): Figure out a better way to do this.
    setTimeout(function() {
      Utils.removeResizeListener(
          embedDom, this.updateSize_.bind(this, screen, embedDom));
      document.body.removeChild(embedDom);
    }.bind(this), 10000);

  }.bind(this), { width: screen });
};


/**
 * Polls the element for size changes and update width and height when
 * they stabalize for at least 3 seconds.
 * @private
 */
EmbeddedComponent.prototype.updateSize_ = function(screen, embedDom) {
  var styles = window.getComputedStyle(embedDom);
  this.sizes = this.sizes || {};
  this.sizes[screen] = {
    width: parseInt(styles.width),
    height: parseInt(styles.height)
  };
};


/**
 * Returns the closest screen size to the width.
 * @param  {number} width
 * @return {number}
 */
EmbeddedComponent.prototype.getClosestSupportedScreenSize_ = function(width) {
  var screenSizes = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES;
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
EmbeddedComponent.prototype.getRatioFor_ = function (width) {
  var screen = this.getClosestSupportedScreenSize_(width);

  return (this.sizes[screen].height/this.sizes[screen].width * 100) + '%';
};


/**
 * Whether the embedded component should render or not.
 * @return {boolean} true if the supported screen size has changed.
 */
EmbeddedComponent.prototype.shouldRerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var currentWidth = parseInt(this.containerDom.style.width);
  return screen !== currentWidth;
};


/**
 * Rerenders the embedded component. This allows for responsive embeds.
 * The article will tell the embed to rerender when its size change.
 */
EmbeddedComponent.prototype.rerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var ratio = this.getRatioFor_(containerWidth);

  this.containerDom.style.width = screen + 'px';
  this.embedDom.className = 'embed-container';
  this.embedDom.style.paddingBottom = ratio;

  setTimeout(function() {
    this.loadEmbed_(this.oEmbedDataLoaded_.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth)
    });
  }.bind(this), 200);
};


/**
 * @override
 */
EmbeddedComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);

    this.containerDom = document.createElement(
        EmbeddedComponent.CONTAINER_TAG_NAME);
    this.containerDom.className = EmbeddedComponent.CONTAINER_CLASS_NAME;

    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width);
    this.containerDom.style.width = this.getClosestSupportedScreenSize_(
        containerWidth) + 'px';

    // TODO(mkhatib): Render a nice placeholder until the data has been
    // loaded.
    if (this.url) {
      this.embedDom = document.createElement(
          EmbeddedComponent.EMBED_TAG_NAME);

      if (this.sizes) {
        var ratio = this.getRatioFor_(containerWidth);
        this.embedDom.className = 'embed-container';
        this.embedDom.style.paddingBottom = ratio;
      }
      this.containerDom.appendChild(this.embedDom);
      this.dom.appendChild(this.containerDom);
    }

    if (this.editMode) {
      this.overlayDom = document.createElement(
          EmbeddedComponent.OVERLAY_TAG_NAME);
      this.overlayDom.className = EmbeddedComponent.OVERLAY_CLASS_NAME;
      this.containerDom.appendChild(this.overlayDom);
      this.overlayDom.addEventListener('click', this.select.bind(this));

      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener('focus', this.select.bind(this));
      this.containerDom.appendChild(this.selectionDom);

      this.captionParagraph.dom.setAttribute('contenteditable', true);
    }

    this.captionParagraph.render(this.dom, {editMode: this.editMode});

    this.loadEmbed_(this.oEmbedDataLoaded_.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth)
    });
  }
};


/**
 * Loads the embed from the embed provider.
 * @private
 */
EmbeddedComponent.prototype.loadEmbed_ = function(callback, optArgs) {
  var embedProvider = Loader.load('embedProviders')[this.provider];
  embedProvider.getEmbedForUrl(this.url, callback, optArgs);
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
        sizes: this.sizes
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
        sizes: this.sizes,
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
