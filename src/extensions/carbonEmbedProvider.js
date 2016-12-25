'use strict';

var AbstractEmbedProvider = require('./abstractEmbedProvider');
var Utils = require('../utils');

/**
 * Carbon embed provider uses different providers to provide support for
 * differnet URLs - uses the offical service when possible
 * (e.g. supports CORS or jsonp) and uses noembed as alternative.
 * @param {Object=} opt_params Optional params to configure the provider with.
 * @implements {./abstractEmbedProvider}
 * @constructor
 */
var CarbonEmbedProvider = function(opt_params) {
  var params = Utils.extend({
    servicesConfig: {
      facebookNotes: true,
      twitter: true,
      instagram: true,
      github: false,
      soundcloud: false,
      youtube: false,
      vimeo: false,
      vine: false,
      slideshare: false,
      facebookPosts: true,
      facebookVideos: false,
    },
  }, opt_params);


  /**
   * The different services enabled or disabled configuration.
   * @type {Object}
   */
  this.servicesConfig = params.servicesConfig;

};
CarbonEmbedProvider.prototype = Object.create(AbstractEmbedProvider.prototype);
module.exports = CarbonEmbedProvider;


/* eslint max-len: 0 */
/**
 * Mapping Providers URL RegExes and their matching oEmbed endpoints.
 * @type {Object}
 */
CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP = {
  // Ref: https://developers.facebook.com/docs/plugins/oembed-endpoints
  facebookVideos: {
    // Matches Facebook Video URLs.
    '^(https?://(?:www\.)facebook\.com/(?:video\.php\?v=\\d+|.*?/videos/\\d+))$':
        // oEmbed endpoint for facebook videos.
        'https://apps.facebook.com/plugins/video/oembed.json/',
        // 'https://noembed.com/embed',
  },
  facebookPosts: {
    // Matches Facebook Posts URLs. (incl. posts, photos, story...etc)
    '^(https?:\/\/www\.facebook\.com\/(?:photo\.php\?.+|photos\/\\d+|[a-zA-Z0-9\-.]+\/(posts|photos|activity)\/.+|permalink\.php\?story_fbid=\\\d+|media\/set\?set=\\d+|questions\/\\d+))':
        // oEmbed endpoint for facebook posts.
        'https://apps.facebook.com/plugins/post/oembed.json/',
        // 'https://noembed.com/embed'
  },
  facebookNotes: {
    // Matches Facebook Notes URLs.
    '^(https?:\/\/www\.facebook\.com\/notes\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+\/\\d+)':
        // oEmbed endpoint for facebook posts.
        'https://apps.facebook.com/plugins/post/oembed.json/',
        // 'https://noembed.com/embed'
  },
  soundcloud: {
    '^https?://soundcloud.com/.*/.*$':
        'https://soundcloud.com/oembed?format=js',
  },
  youtube: {
    '^(?:https?://(?:www\.)?youtube\.com/(?:[^\/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})$':
        'https://www.youtube.com/oembed?format=json',
  },
  vimeo: {
    '^http(?:s?)://(?:www\.)?vimeo\.com/(([0-9]+)|channels/.+/.+|groups/.+/videos/.+)':
        'https://vimeo.com/api/oembed.json',
  },
  vine: {
    '^http(?:s?)://(?:www\.)?vine\.co/v/([a-zA-Z0-9]{1,13})$':
        'https://vine.co/oembed.json',
  },
  twitter: {
    // Moments - doesn't seem to support jsonp!
    // '^https?://(?:www\.)?twitter\.com/i/moments/[a-zA-Z0-9_]+/?$':
        // 'https://publish.twitter.com/oembed.json',

    // Statuses.
    '^https?://(?:www\.)?twitter\.com/[a-zA-Z0-9_]+/status/\\d+$':
        'https://api.twitter.com/1/statuses/oembed.json',
  },
  instagram: {
    '^https?://(?:www\.)?instagr\.?am(?:\.com)?/p/[a-zA-Z0-9_\-]+/?':
        'https://www.instagram.com/publicapi/oembed/',
  },
  slideshare: {
    '^https?://(?:www\.)?slideshare\.net/[a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+':
        'https://www.slideshare.net/api/oembed/2?format=jsonp',
  },
  github: {
    '^https?://gist\.github\.com/.*':
        'https://noembed.com/embed?format=json',
  },
};


/**
 * Returns the URL to call for oembed response.
 * @param {string} url URL to create the url for.
 * @param {Object=} opt_args Arguments to pass with the URL.
 * @return {string|null}
 */
CarbonEmbedProvider.prototype.getOEmbedEndpointForUrl = function(
    url, opt_args) {
  var urlParams = Utils.extend({
    url: url,
  }, opt_args);

  var queryParts = [];
  for (var name in urlParams) {
    queryParts.push([name, urlParams[name]].join('='));
  }

  var endpoint = this.getOEmbedBaseForUrl_(url);
  if (!endpoint) {
    console.error('Could not find oembed endpoint for url: ', url);
    return null;
  }
  var separator = endpoint.indexOf('?') === -1 ? '?' : '&';
  return [endpoint, queryParts.join('&')].join(separator);
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @return {string}
 */
CarbonEmbedProvider.prototype.getUrlsRegex = function() {
  var Services = CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP;
  var regexStringParts = [];
  for (var service in Services) {
    // If the service is enabled.
    if (this.servicesConfig[service]) {
      // Add its regexes to the global regex match.
      for (var regexStr in Services[service]) {
        regexStringParts.push(regexStr);
      }
    }
  }
  return regexStringParts.join('|');
};



/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} opt_args Optional arguments to pass with the URL.
 */
CarbonEmbedProvider.prototype.getEmbedForUrl = function(
    url, callback, opt_args) {
  var oEmbedEndpoint = this.getOEmbedEndpointForUrl(url, opt_args);
  if (!oEmbedEndpoint) {
    return;
  }
  // jshint unused: false
  function jsonp(url, jsonpCallback) {
    var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(data) {
      delete window[callbackName];
      document.body.removeChild(script);
      jsonpCallback(data);
    };

    var script = document.createElement('script');
    script.src = (
        url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName);
    document.body.appendChild(script);
  }

  jsonp(oEmbedEndpoint, callback);
};


/**
 * Matches URL to the service and its oembed endpoint.
 * @param  {string} url URL.
 * @return {string|null} OEmbed endpoint for the url service.
 * @private
 */
CarbonEmbedProvider.prototype.getOEmbedBaseForUrl_ = function(url) {
  var Services = CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP;
  for (var service in Services) {
    // If the service is enabled.
    if (this.servicesConfig[service]) {
      // Add its regexes to the global regex match.
      for (var regexStr in Services[service]) {
        var regex = new RegExp(regexStr, 'i');
        var match = regex.exec(url);
        if (match) {
          return Services[service][regexStr];
        }
      }
    }
  }
  return null;
};
