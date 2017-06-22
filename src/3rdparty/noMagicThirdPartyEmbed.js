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
var NoMagicThirdPartyEmbed = function() {

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
module.exports = NoMagicThirdPartyEmbed;


/**
 * Parses the fragment and embed the code.
 */
NoMagicThirdPartyEmbed.prototype.init = function() {
  var data = this.parseFragment(location.hash);
  this.origin = data.origin;
  this.embed(data.oEmbedUrl);
};


/**
 * Embeds the URL by calling its oEmbed endpoint and embedding the content.
 * @param  {string} oEmbedUrl OEmbed Endpoint to call to get the content.
 */
NoMagicThirdPartyEmbed.prototype.embed = function(oEmbedUrl) {
  Utils.ajax(oEmbedUrl, function(data) {
    var oembedData = /** @type {OEmbedDataDef} */ (data);
    this.embedType = oembedData.type;

    this.container.innerHTML = oembedData.html;
    this.executeScriptsIn_(this.container);

    Utils.addResizeListener(this.dom, function() {
      // var styles = getComputedStyle(this.dom);
      this.triggerDimensions(
        parseFloat(document.body.offsetWidth),
        parseFloat(document.body.offsetHeight),
        this.origin);
      this.dom.style.width = 'auto';
    }.bind(this));

    // If this is a video or an image embed. Use paddingBottom ratio.
    var iframe = this.dom.getElementsByTagName('iframe')[0];
    if (this.embedType === 'video' || this.embedType === 'photo') {
      if (oembedData.width && oembedData.height) {
        this.embedWidth = oembedData.width;
        this.embedHeight = oembedData.height;
      } else if (iframe) {
        this.embedWidth = parseFloat(iframe.width);
        this.embedHeight = parseFloat(iframe.height);
      }
      // if (this.embedWidth && this.embedHeight) {
      //   this.container.style.paddingBottom = ((
      //       this.embedHeight / this.embedWidth) * 100 + '%');
      // }
    } else if (this.embedType === 'rich') {
      setTimeout(function() {
        this.triggerDimensions(
          parseFloat(document.body.offsetWidth),
          parseFloat(document.body.offsetHeight),
          this.origin);
      }.bind(this), 2000);
    }


    this.dom.classList.add(oembedData.type);
    /* jshint camelcase: false */
    this.dom.classList.add(oembedData.provider_name);
  }.bind(this), true);
};


/**
 * Notifies the parent with updated width and height.
 * @param  {number} width
 * @param  {number} height
 * @param  {string} origin
 */
NoMagicThirdPartyEmbed.prototype.triggerDimensions = function(
    width, height, origin) {
  this.embedWidth = width;
  this.embedHeight = height;
  this.sendMessage('embed-size', {
    width: width,
    height: height,
  }, origin);
};


/**
 * Sends a message to the parent window.
 * @param  {string} type Message type.
 * @param  {Object=} opt_object Optional object to send.
 * @param  {string=} opt_origin
 */
NoMagicThirdPartyEmbed.prototype.sendMessage = function(
    type, opt_object, opt_origin) {
  if (window.parent === window) {
    return;
  }
  var object = opt_object || {};
  object.type = type;
  window.parent.postMessage(object, opt_origin);
};


/**
 * Executes scripts in the specified element.
 * @param  {!Element} element
 * @private
 */
NoMagicThirdPartyEmbed.prototype.executeScriptsIn_ = function(element) {
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
 * Parses the fragment from the iframe to get passed data from.
 * @param  {string} fragment Fragment to parse.
 * @return {!Object} Parsed JSON object from the fragment.
 */
NoMagicThirdPartyEmbed.prototype.parseFragment = function(fragment) {
  var json = fragment.substr(1);
  // Some browser, notably Firefox produce an encoded version of the fragment
  // while most don't. Since we know how the string should start, this is easy
  // to detect.
  if (json.indexOf('{%22') === 0 || json.indexOf('%7B%22') === 0) {
    json = decodeURIComponent(json);
  }
  return /** @type {!Object} */ (json ? JSON.parse(json) : {});
};
