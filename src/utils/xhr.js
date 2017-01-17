'use strict';

/**
 * @typedef {{
 *   url: string,
 *   params: (Object=|undefined),
 *   method: (string|undefined),
 *   body: (ArrayBuffer|ArrayBufferView|Blob|Document|DOMString|FormData|undefined),
 *   files: (Array<File|Blob>|undefined),
 *   onSuccess: (function(Object=)|undefined),
 *   onError: (function(Object=)|undefined),
 *   onProgress: (function(Object=)|undefined),
 * }}
 */
var XHRSendConfigDef;


/**
 * Converts a data URI into a Blob.
 * @param {string} dataURI
 * @param {string=} opt_name
 * @return {!Blob}
 */
function dataUriToBlob(dataURI, opt_name) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  // eslint-disable-next-line no-undef
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {
    type: mimeString,
    name: (opt_name || '') + new Date().toString(),
  });
}


/**
 * Read file data URL.
 * @param {!File} file File picked by the user.
 * @param {function(string)} callback Callback function when the reading is complete.
 */
function readFileAsDataURI(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsDataURL(file);
};


/**
 * Sends an XHR request with the passed config.
 * @param {XHRSendConfigDef} config
 */
function send(config) {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      if (xhttp.status == 200) {
        var json = JSON.parse(xhttp.responseText);
        if (config.onSuccess) {
          config.onSuccess(json);
        }
      } else {
        if (config.onError) {
          config.onError();
        }
      }
    }
  };

  if (config.onProgress) {
    xhttp.upload.onprogress = function(event) {
      config.onProgress(parseInt(event.loaded / event.total * 100.0, 10));
    };
  }

  var endpoint = addParamsToUrl(config.url, config.params);
  xhttp.open(config.method || 'GET', endpoint, true);

  var data;
  if (config.body) {
    data = config.body;
  } else if (config.files) {
    data = new FormData();
    for (var i = 0; i < config.files.length; i++) {
      data.append('file', config.files[i], config.files[i].name || 'Untitled');
    }
  } else {
  }
  xhttp.send(data);
}


/**
 * Adds passed parameters to URL.
 * @param {string} url
 * @param {Object} params
 * @return {string}
 */
function addParamsToUrl(url, params) {
  if (!params) {
    return url;
  }

  var paramsArray = [];
  for (var key in params) {
    var value = encodeURIComponent(params[key]);
    paramsArray.push([key, value].join('='));
  }
  var paramsString = paramsArray.join('&');
  return [url, paramsString].join(
    url.indexOf('?') === -1 ? '?' : '&');
}


module.exports.send = send;
module.exports.addParamsToUrl = addParamsToUrl;
module.exports.dataUriToBlob = dataUriToBlob;
module.exports.readFileAsDataURI = readFileAsDataURI;
