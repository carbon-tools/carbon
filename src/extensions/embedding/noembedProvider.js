'use strict';

var AbstractEmbedProvider = require('./abstractEmbedProvider');
var Utils = require('../../utils');
var xhr = require('../../utils/xhr');

/**
 * Provides an Embed Provider using Embedly APIs.
 * @param {Object=} opt_params Config params.
 *   required: apiKey
 * @implements {./abstractEmbedProvider}
 * @constructor
 */
var NoembedProvider = function(opt_params) {
  var params = Utils.extend({
    endpoint: 'https://noembed.com/embed',
    apiKey: null,
  }, opt_params);

  /**
   * Embedly oembed endpoint.
   * @type {string}
   */
  this.endpoint = params.endpoint;

  /**
   * API Key for embedly app.
   * @type {string}
   */
  this.apiKey = params.apiKey;
};
NoembedProvider.prototype = Object.create(AbstractEmbedProvider.prototype);
module.exports = NoembedProvider;


/**
 * Regex string for all URLs embedly provider can handle.
 * @type {?string}
 */
NoembedProvider.SUPPORTED_URLS_REGEX_STRING = null;


/**
 * Loads the supported providers.
 * @private
 */
NoembedProvider.prototype.loadSupportedProviders_ = function(callback) {
  var providersEndpoint = 'https://noembed.com/providers';
  if (!NoembedProvider.SUPPORTED_URLS_REGEX_STRING) {
    xhr.send({
      url: providersEndpoint,
      onSuccess: function(providers) {
        this.parseSupportedProviders_(providers);
        callback(NoembedProvider.SUPPORTED_URLS_REGEX_STRING);
      }.bind(this),
    });
  } else {
    callback(NoembedProvider.SUPPORTED_URLS_REGEX_STRING);
  }
};


/**
 * Parses response from supported provider request.
 * @private
 */
NoembedProvider.prototype.parseSupportedProviders_ = function(providers) {
  var patterns = [];
  for (var i = 0; i < providers.length; i++) {
    Utils.arrays.extend(patterns, providers[i].patterns);
  }
  NoembedProvider.SUPPORTED_URLS_REGEX_STRING = patterns.join('|');
};


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} opt_args Optional arguments to pass with the URL.
 */
NoembedProvider.prototype.getEmbedForUrl = function(
    url, callback, opt_args) {
  var endpoint = this.getOEmbedEndpointForUrl(url, opt_args);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      var json = JSON.parse(xhttp.responseText);
      callback(json);
    }
  };
  xhttp.open('GET', endpoint, true);
  xhttp.send();
};


/**
 * Returns the URL to call for oembed response.
 * @param {string} url URL to create the url for.
 * @param {Object=} opt_args Arguments to pass with the URL.
 * @return {string}
 */
NoembedProvider.prototype.getOEmbedEndpointForUrl = function(url, opt_args) {
  var urlParams = Utils.extend({
    url: url,
  }, opt_args);
  var queryParts = [];
  for (var name in urlParams) {
    queryParts.push([name, urlParams[name]].join('='));
  }
  return [this.endpoint, queryParts.join('&')].join('?');
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @param {Function} callback A callback function to call with the result.
 */
NoembedProvider.prototype.getUrlsRegex = function(callback) {
  console.log('NoembedProvider.getUrlsRegex');
  this.loadSupportedProviders_(callback);
};
