'use strict';

/**
 * Abstract uploader interface.
 */
var AbstractUploader = function() {
};
module.exports = AbstractUploader;


/**
 * Called when an attachment needs to be uploaded.
 * @param {../attachment} unusedAttachment
 * @return {boolean} True if the attachment has been handled.
 */
AbstractUploader.prototype.onUpload = function(unusedAttachment) {
};
