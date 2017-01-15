'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');


/**
 * Upload Extension enables upload button on the toolbelt.
 * @param  {../../editor} editor Editor instance this installed on.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var UploadManager = function(editor, opt_params) {
  var params = Utils.extend({
    uploaders: [],
  }, opt_params);

  /**
   * The editor this toolbelt belongs to.
   * @type {../editor}
   */
  this.editor = editor;

  /**
   * @type {Array<./abstract-uploader}
   */
  this.uploaders = params.uploaders || [];
};
UploadManager.prototype = Object.create(AbstractExtension.prototype);
module.exports = UploadManager;


/**
 * Extension class name.
 * @type {string}
 */
UploadManager.CLASS_NAME = 'UploadManager';


/**
 * Notify uploaders with the new attachment added.
 * @param {../attachment} attachment
 */
UploadManager.prototype.upload = function(attachment) {
  for (var i = 0; i < this.uploaders.length; i++) {
    var uploader = this.uploaders[i];
    if (uploader.onUpload) {
      var handled = uploader.onUpload(attachment);
      // TODO(mkhatib): Think maybe about allowing multiple uploaders handling
      // the same upload.
      if (handled) {
        return;
      }
    }
  }
};
