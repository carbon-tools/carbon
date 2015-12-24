/**
 * Contains helper methods to upload anonymous objects to a public
 * GCS bucket to have a better uploading experience in the demo.
 */

var GCS = {};

GCS.PROJECT = null;
GCS.clientId = null;
GCS.scopes = 'https://www.googleapis.com/auth/devstorage.full_control';
GCS.API_VERSION = 'v1';
GCS.BUCKET = null;
GCS.GROUP = null;

GCS.init = function(params) {
  GCS.PROJECT = params.projectId;
  GCS.clientId = params.clientId;
  GCS.apiKey = params.apiKey;
  GCS.BUCKET = params.bucket;
  GCS.GROUP = params.group;
};

GCS.handleClientLoad = function () {
  gapi.client.setApiKey(GCS.apiKey);
};

/**
 * Load the Google Cloud Storage API.
 */
GCS.initializeApi = function () {
  gapi.client.load('storage', GCS.API_VERSION);
};


/**
 * Google Cloud Storage API request to insert an object into
 * your Google Cloud Storage bucket.
 */
GCS.insertObject = function (file, callback) {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = function(e) {
    var contentType = file.type || 'application/octet-stream';
    var metadata = {
      'name': file.name,
      'mimeType': contentType
    };

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delim;

    //Note: gapi.client.storage.objects.insert() can only insert
    //small objects (under 64k) so to support larger file sizes
    //we're using the generic HTTP request method gapi.client.request()
    var request = gapi.client.request({
      'path': '/upload/storage/' + GCS.API_VERSION + '/b/' + GCS.BUCKET + '/o',
      'method': 'POST',
      'params': {
        'uploadType': 'multipart',
        'predefinedAcl':'publicRead'
      },
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
        'x-goog-acl': 'public-read'
      },
      'body': multipartRequestBody});
    try{
      request.execute(function(resp) {
        if (callback) {
          callback(resp);
        }
      });
    }
    catch(e) {
      alert('An error has occurred: ' + e.message);
    }
  }
}
