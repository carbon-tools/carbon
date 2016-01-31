'use strict';

var Utils = require('../utils');


/**
 * Encapsulates logic for third party oEmbed embedding.
 */
var ThirdPartyEmbed = function () {

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
  this.origin = null;

  /**
   * Main div outer container.
   * @type {HTMLElement}
   */
  this.dom = document.getElementById('outer-container');

  /**
   * Inner container element.
   * @type {HTMLElement}
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
  this.embedWidth = parseFloat(width);
  this.embedHeight = parseFloat(height);
  this.sendMessage('embed-size', {
    width: width,
    height: height,
  }, origin);
};


/**
 * Embeds the URL by calling its oEmbed endpoint and embedding the content.
 * @param  {string} oEmbedUrl OEmbed Endpoint to call to get the content.
 * @param  {number} width Width of container to load the content in.
 * @return {[type]}        [description]
 */
ThirdPartyEmbed.prototype.embed = function(oEmbedUrl, width) {
  this.dom.style.width = width + 'px';
  Utils.ajax(oEmbedUrl, function(oembedData) {
    this.embedType = oembedData.type;

    // If this is a rich embed. Watch its size and notify the parent with
    // changes.
    if (this.embedType === 'rich') {
      Utils.addResizeListener(this.dom, function() {
        var styles = getComputedStyle(this.dom);
        this.triggerDimensions(styles.width, styles.height, this.origin);
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
        this.container.style.paddingBottom = (this.embedHeight/this.embedWidth) * 100 + '%';
      }
    }

    this.dom.classList.add(oembedData.type);
    /* jshint camelcase: false */
    this.dom.classList.add(oembedData.provider_name);
  }.bind(this), true);
};


/**
 * Executes scripts in the specified element.
 * @param  {HTMLElement} element.
 * @private
 */
ThirdPartyEmbed.prototype.executeScriptsIn_ = function(element) {
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
 * Sends a message to the parent window.
 * @param  {string} type Message type.
 * @param  {Object=} optObject Optional object to send.
 * @param  {string=} origin.
 */
ThirdPartyEmbed.prototype.sendMessage = function(type, optObject, origin) {
  if (window.parent === window) {
    return;
  }
  var object = optObject || {};
  object.type = type;
  window.parent.postMessage(object, origin);
};


/**
 * Parses the fragment from the iframe to get passed data from.
 * @param  {string} fragment Fragment to parse.
 * @return {Object} Parsed JSON object from the fragment.
 */
ThirdPartyEmbed.prototype.parseFragment = function(fragment) {
  var json = fragment.substr(1);
  // Some browser, notably Firefox produce an encoded version of the fragment
  // while most don't. Since we know how the string should start, this is easy
  // to detect.
  if (json.indexOf('{%22') === 0 || json.indexOf('%7B%22') === 0) {
    json = decodeURIComponent(json);
  }
  return json ? JSON.parse(json) : {};
};
