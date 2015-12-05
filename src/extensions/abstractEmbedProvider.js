'use strict';

var Errors = require('../errors');

/**
 * An abstract class for embed providers to subclass and implement its methods.
 */
var AbstractEmbedProvider = function() {
};
module.exports = AbstractEmbedProvider;


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} optArgs Optional arguments to pass with the URL.
 */
AbstractEmbedProvider.prototype.getEmbedForUrl = function(
    url, callback, optArgs) {
  // jshint unused: false
  throw Errors.NotImplementedError(
      'AbstractEmbedProvider need to implement getEmbedForUrl');
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @return {string}
 */
AbstractEmbedProvider.prototype.getUrlsRegex = function() {
  // jshint unused: false
  throw Errors.NotImplementedError(
      'AbstractEmbedProvider need to implement getUrlsRegexStr');
};
