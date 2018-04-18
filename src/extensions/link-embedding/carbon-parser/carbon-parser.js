'use strict';

var AbstractLinkParserService = require('../abstract-link-parser-service');
var xhr = require('../../../utils/xhr');
var Utils = require('../../../utils');


/**
 * Carbon Up Upload Service Endpoint.
 * @type {string}
 */
var CARBON_PARSER_SERVICE_ENDPOINT = 'https://manshar-snacks.appspot.com/api/v1/parse';


/**
 * @typedef {{
 *   apiKey: (?string|undefined),
 * }}
 */
var CarbonParserParamsDef;


/**
 * @typedef {{
 *    title: string,
 *    description: string,
 *    image: string,
 *    images: Array<string>,
 * }}
 */
var CarbonParseResponseDef;


/**
 * Parse a URL and return meta data about the page.
 * @param {CarbonParserParamsDef=} opt_params
 * @extends {../abstract-uploader}
 * @constructor
 */
var CarbonParser = function(opt_params) {
  var params = Utils.extend({
    apiKey: null,
  }, opt_params);

  /**
   * API key for Carbon Parser service.
   * @type {string}
   * @private
   */
  this.apiKey_ = params.apiKey;

};
CarbonParser.prototype = Object.create(AbstractLinkParserService.prototype);
module.exports = CarbonParser;


/** @override */
CarbonParser.prototype.parse = function(url, onSuccess, onError) {
  xhr.send({
    url: CARBON_PARSER_SERVICE_ENDPOINT,
    params: {
      'url': url,
    },
    onSuccess: function(data) {
      console.log(data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: function(error) {
      console.log(error);
      if (onError) {
        onError(error);
      }
    },
  });
};
