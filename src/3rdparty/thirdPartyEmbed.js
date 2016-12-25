'use strict';

var Utils = require('../utils');


/**
 * @typedef {{
 *   html: string,
 *   provider_name: string,
 *   type: string,
 * }}
 */
var OEmbedDataDef;

/**
 * Encapsulates logic for third party oEmbed embedding.
 * @constructor
 */
var ThirdPartyEmbed = function() {

  /**
   * Embed Width.
   * @type {number}
   */
  this.embedWidth = 0;

  /**
   * Embed Height.
   * @type {number}
   */
  this.embedHeight = 0;

  /**
   * Embed type.
   * @type {string}
   */
  this.embedType = 'rich';

  /**
   * Origin of the parent window.
   * @type {string}
   */
  this.origin = '';

  /**
   * Main div outer container.
   * @type {!Element}
   */
  this.dom = /** @type {!Element} */ (
      document.getElementById('outer-container'));

  /**
   * Inner container element
   * @type {!Element}
   */
  this.container = document.createElement('div');
  this.container.className = 'container';
  this.dom.appendChild(this.container);
};
module.exports = ThirdPartyEmbed;


/**
 * Parses the fragment and embed the code.
 */
ThirdPartyEmbed.prototype.init = function() {
  var data = this.parseFragment(location.hash);
  this.origin = data.origin;
  this.embed(data.oEmbedUrl, data.width);
};


/**
 * Notifies the parent with updated width and height.
 * @param  {number} width
 * @param  {number} height
 * @param  {string} origin
 */
ThirdPartyEmbed.prototype.triggerDimensions = function(width, height, origin) {
  this.embedWidth = width;
  this.embedHeight = height;
  this.sendMessage('embed-size', {
    width: width,
    height: height,
  }, origin);
};


/**
 * Embeds the URL by calling its oEmbed endpoint and embedding the content.
 * @param  {string} oEmbedUrl OEmbed Endpoint to call to get the content.
 * @param  {number} width Width of container to load the content in.
 */
ThirdPartyEmbed.prototype.embed = function(oEmbedUrl, width) {
  this.dom.style.width = width + 'px';
  Utils.ajax(oEmbedUrl, function(data) {
    var oembedData = /** @type {OEmbedDataDef} */ (data);
    this.embedType = oembedData.type;

    // If this is a rich embed. Watch its size and notify the parent with
    // changes.
    if (this.embedType === 'rich') {
      Utils.addResizeListener(this.dom, function() {
        var styles = getComputedStyle(this.dom);
        this.triggerDimensions(
          parseFloat(styles.width),
          parseFloat(styles.height),
          this.origin);
        this.dom.style.width = 'auto';
      }.bind(this));
    }

    this.container.innerHTML = oembedData.html;
    this.executeScriptsIn_(this.container);

    // If this is a video or an image embed. Use paddingBottom ratio.
    if (this.embedType === 'video' || this.embedType === 'image') {
      var iframe = this.dom.getElementsByTagName('iframe')[0];
      if (iframe) {
        this.embedWidth = parseFloat(iframe.width);
        this.embedHeight = parseFloat(iframe.height);
      }
      if (this.embedWidth && this.embedHeight) {
        this.triggerDimensions(this.embedWidth, this.embedHeight, this.origin);
        this.container.style.paddingBottom = ((
            this.embedHeight / this.embedWidth) * 100 + '%');
      }
    }

    this.dom.classList.add(oembedData.type);
    /* jshint camelcase: false */
    this.dom.classList.add(oembedData.provider_name);
  }.bind(this), true);
};


/**
 * Executes scripts in the specified element.
 * @param  {!Element} element
 * @private
 */
ThirdPartyEmbed.prototype.executeScriptsIn_ = function(element) {
  var scripts = element.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    /* eslint no-eval: [2, {"allowIndirect": true}] */
    /* eslint no-useless-call: 0 */
    if (!scripts[i].getAttribute('src')) {
      // This is fine. We purposfully evaluate the script to execute it.
      // Using .call(null) hack for a lesser-evil eval that doesn't allow
      // changing the scope.
      eval.call(null, Utils.getTextFromElement(scripts[i]));
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
 * Sends a message to the parent window.
 * @param  {string} type Message type.
 * @param  {Object=} opt_object Optional object to send.
 * @param  {string=} opt_origin
 */
ThirdPartyEmbed.prototype.sendMessage = function(type, opt_object, opt_origin) {
  if (window.parent === window) {
    return;
  }
  var object = opt_object || {};
  object.type = type;
  window.parent.postMessage(object, opt_origin);
};


/**
 * Parses the fragment from the iframe to get passed data from.
 * @param  {string} fragment Fragment to parse.
 * @return {!Object} Parsed JSON object from the fragment.
 */
ThirdPartyEmbed.prototype.parseFragment = function(fragment) {
  var json = fragment.substr(1);
  // Some browser, notably Firefox produce an encoded version of the fragment
  // while most don't. Since we know how the string should start, this is easy
  // to detect.
  if (json.indexOf('{%22') === 0 || json.indexOf('%7B%22') === 0) {
    json = decodeURIComponent(json);
  }
  return /** @type {!Object} */ (json ? JSON.parse(json) : {});
};
