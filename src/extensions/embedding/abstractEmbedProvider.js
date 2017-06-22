'use strict';

/**
 * An abstract class for embed providers to subclass and implement its methods.
 * @interface
 */
var AbstractEmbedProvider = function() {
};
module.exports = AbstractEmbedProvider;


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} unusedUrl Url to get the oembed response for.
 * @param {Function} unusedCallback A callback function to call with the result.
 * @param {Object=} opt_args Optional arguments to pass with the URL.
 */
AbstractEmbedProvider.prototype.getEmbedForUrl = function(
    unusedUrl, unusedCallback, opt_args) {
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @param {Function} unusedCallback A callback function to call with the result.
 */
AbstractEmbedProvider.prototype.getUrlsRegex = function(unusedCallback) {
};


/**
 * Returns the URL to call for oembed response.
 * @param {string} unusedUrl URL to create the url for.
 * @param {Object=} opt_args Arguments to pass with the URL.
 * @return {string|null}
 */
AbstractEmbedProvider.prototype.getOEmbedEndpointForUrl = function(
    unusedUrl, opt_args) {
};
