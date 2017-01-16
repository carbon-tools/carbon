'use strict';

var AbstractUploader = require('../abstract-uploader');
var xhr = require('../../../utils/xhr');
var Utils = require('../../../utils');


/**
 * TODO(mkhatib): Update this URL to up.carbon.tools.
 * Carbon Up Upload Service Endpoint.
 * @type {string}
 */
var CARBON_UP_SERVICE_ENDPOINT = 'https://carbon-tools.appspot.com/api/v1/resource/upload/';


/**
 * How many URLs should be cached.
 * @type {number}
 */
var CACHED_UPLOAD_URLS_COUNT = 10;


/**
 * When to request more upload URLs.
 * @type {number}
 */
var CACHED_UPLOAD_URLS_THRESHOLD = 5;


/**
 * The different widths to generate sources for.
 * TODO(mkhatib): Make this configurable, and implemente data sources for
 * better management of this and allowing future dynamic calculation of these.
 * @type {Array<number>}
 */
var GENERATE_SOURCES_FOR_WIDTHS = [
  120, 240, 360, 480, 600, 720, 1080, 1440, 2400, 3000, 3600, 4200, 4800, 5400,
];


/**
 * @typedef {{
 *   apiKey: (?string|undefined),
 * }}
 */
var CarbonUpUploaderParamsDef;


/**
 * @typedef {{
 *   result: Array<UploadUrlResponseDef>,
 * }}
 */
var GetUploadUrlsResponseDef;


/**
 * @typedef {{
 *   upload_url: string,
 * }}
 */
var UploadUrlResponseDef;


/**
 * @typedef {{
 *   result: {
 *      image_url: string,
 *      name: string,
 *   },
 * }}
 */
var UploadResultResponseDef;


/**
 * Uploads attachments to Carbon Up service.
 * @param {CarbonUpUploaderParamsDef=} opt_params
 * @extends {../abstract-uploader}
 * @constructor
 */
var CarbonUpUploader = function(opt_params) {
  var params = Utils.extend({
    apiKey: null,
  }, opt_params);

  /**
   * API key for Carbon Up service.
   * @type {string}
   * @private
   */
  this.apiKey_ = params.apiKey;

  /**
   * Cached upload URLs for Carbon Up service.
   * @type {Array<string>}
   * @private
   */
  this.cachedUploadUrls_ = [];

  this.getUploadUrl_();
};
CarbonUpUploader.prototype = Object.create(AbstractUploader.prototype);
module.exports = CarbonUpUploader;


/** @override */
CarbonUpUploader.prototype.onUpload = function(attachment) {
  this.getUploadUrl_(this.upload_.bind(this, attachment));
  return true;
};


/**
 * Requests upload URLs for Carbon Up service and caches them.
 * @param {function(string)=} opt_callback If provided called with upload URL.
 * @private
 */
CarbonUpUploader.prototype.getUploadUrl_ = function(opt_callback) {
  var currentUrlsCount = this.cachedUploadUrls_.length;
  if (currentUrlsCount > 0 && opt_callback) {
    opt_callback(this.cachedUploadUrls_.splice(0, 1)[0]);
  }

  if (currentUrlsCount < CACHED_UPLOAD_URLS_THRESHOLD) {
    xhr.send({
      url: CARBON_UP_SERVICE_ENDPOINT,
      params: {
        'count': CACHED_UPLOAD_URLS_COUNT,
      },
      onSuccess: this.onFetchUrls_.bind(this),
    });
  }
};


/**
 * Uploads the attachment to the provided upload url.
 * @param {../../attachment} attachment
 * @param {string} uploadUrl
 * @private
 */
CarbonUpUploader.prototype.upload_ = function(attachment, uploadUrl) {
  xhr.send({
    url: uploadUrl,
    method: 'POST',
    files: [attachment.file],
    onFail: attachment.uploadFailed.bind(attachment),
    onSuccess: this.onSuccess_.bind(this, attachment),
    onProgress: attachment.setUploadProgress.bind(attachment),
  });
};


/**
 * @param {../../attachment} attachment
 * @param {UploadResultResponseDef} data
 */
CarbonUpUploader.prototype.onSuccess_ = function(attachment, data) {
  var baseSrc = data.result.image_url;
  var srcset = [];
  for (var i = 0; i < GENERATE_SOURCES_FOR_WIDTHS.length; i++) {
    var width = GENERATE_SOURCES_FOR_WIDTHS[i];
    srcset.push({
      descriptor: width + 'w',
      src: baseSrc + '=w' + width,
    });
  }
  attachment.uploadComplete({
    src: baseSrc + '=s0',
    srcset: srcset,
    caption: data.result.name,
  });
};


/**
 * Updates cached upload URLs.
 * @param {GetUploadUrlResponseDef=} data
 * @private
 */
CarbonUpUploader.prototype.onFetchUrls_ = function(data) {
  var urlsArray = data.result.map(function(obj) {
    return obj.upload_url;
  });
  this.cachedUploadUrls_ = Utils.arrays.extend(
      this.cachedUploadUrls_, urlsArray);
};
