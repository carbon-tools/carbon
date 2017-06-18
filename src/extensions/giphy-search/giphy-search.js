'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Figure = require('../../figure');
var Loader = require('../../loader');
var I18n = require('../../i18n');
var Utils = require('../../utils');


/**
 * @typedef {{
 *   apiKey: string,
 * }} */
var GiphySearchParamsDef;


/**
 * @typedef {{
 *   data: {
 *     image_original_url: string,
 *   }
 * }}
 */
var GiphyJsonResponseDef;


/**
 * GiphySearch main.
 * @param {GiphySearchParamsDef=} opt_params Optional params.
 * Default:
 *   {
 *     apiKey: null,
 *   }
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var GiphySearch = function(editor, opt_params) {
  var params = Utils.extend({
    apiKey: null,
  }, opt_params);

  /** @type {string} */
  this.apiKey_ = params.apiKey;

  this.registerRegexes_(editor);
};
GiphySearch.prototype = Object.create(AbstractExtension.prototype);
module.exports = GiphySearch;


/**
 * String name for the component class.
 * @type {string}
 */
GiphySearch.CLASS_NAME = 'GiphySearch';

// Register GiphyComponent as Figure component to allow legacy
// GiphyComponent to still work by initializing a new Figure :-).
Loader.register('GiphyComponent', Figure);


/**
 * Regex strings list that for matching Giphy search terms.
 * @type {string}
 */
GiphySearch.GIPHY_SEARCH_REGEX = '^\\+giphy\\s(.+[a-zA-Z])$';


/**
 * Giphy endpoint for random search.
 * Ref: https://github.com/Giphy/GiphyAPI
 * @type {string}
 */
GiphySearch.GIPHY_RANDOM_ENDPOINT = 'https://api.giphy.com/v1/gifs/random?';


/**
 * Handles onInstall when the GiphySearch module installed in an editor.
 * @param  {../../editor} editor Instance of the editor that installed the module.
 * @param {GiphySearchParamsDef=} opt_params Optional params.
 */
GiphySearch.onInstall = function(editor, opt_params) {
  if (!opt_params || !opt_params.apiKey) {
    throw new Error('apiKey parameter is required for GiphySearch extension');
  }
};


/**
 * Registers regular experessions to create giphy component from if matched.
 * @param  {../../editor} editor The editor to register regexes with.
 * @private
 */
GiphySearch.prototype.registerRegexes_ = function(editor) {
  editor.registerRegex(
      I18n.get('regex.giphy') || GiphySearch.GIPHY_SEARCH_REGEX,
      this.handleMatchedRegex.bind(this));
};


/**
 * Creates a figure component from a link.
 * @param {../../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
GiphySearch.prototype.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var searchTextSplit = matchedComponent.text.split(/\s/).slice(1);
  var captionText = searchTextSplit.join(' ');
  var giphyQuery = searchTextSplit.join('+');

  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];

  // Call Giphy Random Endpoint.
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var src;
      /* jshint ignore:start */
      // Get the image url from the random search response.
      var json = /** @type {GiphyJsonResponseDef} */ (
          JSON.parse(xhttp.responseText));
      src = json['data']['image_original_url'];
      /* jshint ignore:end */
      // If result is found for the query, create a component.
      if (src) {
        var figure = new Figure({
          src: src,
          caption: captionText,
        });
        figure.section = matchedComponent.section;

        // Delete current matched component with its text.
        Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

        // Add the new component created from the text.
        Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

        opsCallback(ops);
      }
    }
  };
  xhttp.open('GET', GiphySearch.GIPHY_RANDOM_ENDPOINT +
    'api_key=' + this.apiKey_ + '&' + giphyQuery, true);
  xhttp.send();
};
