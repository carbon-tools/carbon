'use strict';

var AbstractEmbedProvider = require('./abstractEmbedProvider');
var Utils = require('../../utils');


/**
 * Provides an Embed Provider using Embedly APIs.
 * @param {Object=} opt_params Config params.
 *   required: apiKey
 * @implements {./abstractEmbedProvider}
 * @constructor
 */
var EmbedlyProvider = function(opt_params) {
  var params = Utils.extend({
    endpoint: 'https://api.embed.ly/1/oembed',
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
EmbedlyProvider.prototype = Object.create(AbstractEmbedProvider.prototype);
module.exports = EmbedlyProvider;


/**
 * Regex string for all URLs embedly provider can handle.
 * @constant
 */
EmbedlyProvider.SUPPORTED_URLS_REGEX_STRING = '^((https?://(www\.flickr\.com/photos/.*|flic\.kr/.*|.*imgur\.com/.*|.*dribbble\.com/shots/.*|drbl\.in/.*|giphy\.com/gifs/.*|gph\.is/.*|vid\.me/.*|www\.slideshare\.net/.*/.*|www\.slideshare\.net/mobile/.*/.*|.*\.slideshare\.net/.*/.*|slidesha\.re/.*|www\.kickstarter\.com/projects/.*/.*|linkedin\.com/in/.*|linkedin\.com/pub/.*|.*\.linkedin\.com/in/.*|.*\.linkedin\.com/pub/.*|linkedin\.com/in/.*|linkedin\.com/company/.*|.*\.linkedin\.com/company/.*|www\.sliderocket\.com/.*|sliderocket\.com/.*|app\.sliderocket\.com/.*|portal\.sliderocket\.com/.*|beta-sliderocket\.com/.*|maps\.google\.com/maps\?.*|maps\.google\.com/\?.*|maps\.google\.com/maps/ms\?.*|www\.google\..*/maps/.*|google\..*/maps/.*|tumblr\.com/.*|.*\.tumblr\.com/post/.*|pastebin\.com/.*|storify\.com/.*/.*|prezi\.com/.*/.*|www\.wikipedia\.org/wiki/.*|.*\.wikipedia\.org/wiki/.*|www\.behance\.net/gallery/.*|behance\.net/gallery/.*|jsfiddle\.net/.*|www\.gettyimages\.com/detail/photo/.*|gty\.im/.*|jsbin\.com/.*/.*|jsbin\.com/.*|codepen\.io/.*/pen/.*|codepen\.io/.*/pen/.*|quora\.com/.*/answer/.*|www\.quora\.com/.*/answer/.*|www\.qzzr\.com/quiz/.*|.*amazon\..*/gp/product/.*|.*amazon\..*/.*/dp/.*|.*amazon\..*/dp/.*|.*amazon\..*/o/ASIN/.*|.*amazon\..*/gp/offer-listing/.*|.*amazon\..*/.*/ASIN/.*|.*amazon\..*/gp/product/images/.*|.*amazon\..*/gp/aw/d/.*|www\.amzn\.com/.*|amzn\.com/.*|fiverr\.com/.*/.*|www\.fiverr\.com/.*/.*|.*youtube\.com/watch.*|.*\.youtube\.com/v/.*|youtu\.be/.*|.*\.youtube\.com/user/.*|.*\.youtube\.com/.*#.*/.*|m\.youtube\.com/watch.*|m\.youtube\.com/index.*|.*\.youtube\.com/profile.*|.*\.youtube\.com/view_play_list.*|.*\.youtube\.com/playlist.*|www\.youtube\.com/embed/.*|youtube\.com/gif.*|www\.youtube\.com/gif.*|www\.youtube\.com/attribution_link.*|youtube\.com/attribution_link.*|youtube\.ca/.*|youtube\.jp/.*|youtube\.com\.br/.*|youtube\.co\.uk/.*|youtube\.nl/.*|youtube\.pl/.*|youtube\.es/.*|youtube\.ie/.*|it\.youtube\.com/.*|youtube\.fr/.*|.*twitch\.tv/.*|.*twitch\.tv/.*/b/.*|www\.ustream\.tv/recorded/.*|www\.ustream\.tv/channel/.*|www\.ustream\.tv/.*|ustre\.am/.*|.*\.dailymotion\.com/video/.*|.*\.dailymotion\.com/.*/video/.*|www\.livestream\.com/.*|new\.livestream\.com/.*|coub\.com/view/.*|coub\.com/embed/.*|vine\.co/v/.*|www\.vine\.co/v/.*|www\.vimeo\.com/groups/.*/videos/.*|www\.vimeo\.com/.*|vimeo\.com/groups/.*/videos/.*|vimeo\.com/.*|vimeo\.com/m/#/.*|player\.vimeo\.com/.*|www\.ted\.com/talks/.*\.html.*|www\.ted\.com/talks/lang/.*/.*\.html.*|www\.ted\.com/index\.php/talks/.*\.html.*|www\.ted\.com/index\.php/talks/lang/.*/.*\.html.*|www\.ted\.com/talks/|khanacademy\.org/.*|www\.khanacademy\.org/.*|www\.facebook\.com/video\.php.*|www\.facebook\.com/.*/posts/.*|fb\.me/.*|www\.facebook\.com/.*/videos/.*|fb\.com|plus\.google\.com/.*|www\.google\.com/profiles/.*|google\.com/profiles/.*|soundcloud\.com/.*|soundcloud\.com/.*/.*|soundcloud\.com/.*/sets/.*|soundcloud\.com/groups/.*|snd\.sc/.*))|(https://(vidd\.me/.*|vid\.me/.*|maps\.google\.com/maps\?.*|maps\.google\.com/\?.*|maps\.google\.com/maps/ms\?.*|www\.google\..*/maps/.*|google\..*/maps/.*|storify\.com/.*/.*|quora\.com/.*/answer/.*|www\.quora\.com/.*/answer/.*|www\.qzzr\.com/quiz/.*|.*youtube\.com/watch.*|.*\.youtube\.com/v/.*|youtu\.be/.*|.*\.youtube\.com/playlist.*|www\.youtube\.com/embed/.*|youtube\.com/gif.*|www\.youtube\.com/gif.*|www\.youtube\.com/attribution_link.*|youtube\.com/attribution_link.*|youtube\.ca/.*|youtube\.jp/.*|youtube\.com\.br/.*|youtube\.co\.uk/.*|youtube\.nl/.*|youtube\.pl/.*|youtube\.es/.*|youtube\.ie/.*|it\.youtube\.com/.*|youtube\.fr/.*|coub\.com/view/.*|coub\.com/embed/.*|vine\.co/v/.*|www\.vine\.co/v/.*|gifs\.com/gif/.*|www\.gifs\.com/gif/.*|gifs\.com/.*|www\.gifs\.com/.*|www\.vimeo\.com/.*|vimeo\.com/.*|player\.vimeo\.com/.*|khanacademy\.org/.*|www\.khanacademy\.org/.*|www\.facebook\.com/video\.php.*|www\.facebook\.com/.*/posts/.*|fb\.me/.*|www\.facebook\.com/.*/videos/.*|plus\.google\.com/.*|soundcloud\.com/.*|soundcloud\.com/.*/.*|soundcloud\.com/.*/sets/.*|soundcloud\.com/groups/.*)))';


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} opt_args Optional arguments to pass with the URL.
 */
EmbedlyProvider.prototype.getEmbedForUrl = function(
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
EmbedlyProvider.prototype.getOEmbedEndpointForUrl = function(url, opt_args) {
  var urlParams = Utils.extend({
    key: this.apiKey,
    // luxe: 1,
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
EmbedlyProvider.prototype.getUrlsRegex = function(callback) {
  callback(EmbedlyProvider.SUPPORTED_URLS_REGEX_STRING);
};
