'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var Figure = require('../../figure');
var Attachment = require('../attachment');
var Loader = require('../../loader');


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
    layoutExtension: null,
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

  /** @type {../layoutExtension} */
  this.layoutExtension_ = params.layoutExtension ||
      Loader.load('LayoutingExtension');
};
UploadManager.prototype = Object.create(AbstractExtension.prototype);
module.exports = UploadManager;


/**
 * Extension class name.
 * @type {string}
 */
UploadManager.CLASS_NAME = 'UploadManager';


/**
 * Event name for attachment added.
 * @type {string}
 */
UploadManager.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


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


/**
 * Inserts Grid layout, figures and attachments and initiate uploading files.
 * @param {Array<File|Blob>} files
 * @param {../../component} atComponent where to insert uploaded files.
 */
UploadManager.prototype.attachFilesAt = function(files, atComponent) {
  var componentRef = atComponent;
  if (files.length > 1 && this.layoutExtension_) {
    for (var i = 0; i < files.length; i++) {
      var layout = this.layoutExtension_.newLayoutAt(
          'layout-responsive-grid', componentRef);
      // Update the component reference to the accurate one after a layout might
      // have split and the component reference needs to update.
      componentRef = Utils.getReference(atComponent.name);

      // Split Photos into groups.
      var atIndex = 0;
      var numOfPhotos = Math.floor(Math.random() * 4) + 1;
      var loopTimes = Math.min(i + numOfPhotos, files.length - i);
      for (var j = i; j < i + loopTimes; j++, atIndex++) {
        this.readFileAsDataUrl_(
            files[j], this.fileLoaded_.bind(this), layout, atIndex);
      }
      i += numOfPhotos - 1;
    }
  } else {
    // TODO(mkhatib): Use this when dropping multiple files onto an already
    // created grid layout so it adds to it instead of creating new one.
    for (var w = 0; w < files.length; w++) {
      this.readFileAsDataUrl_(
          files[w], this.fileLoaded_.bind(this),
          componentRef.section, componentRef.getIndexInSection());
    }
  }
};


/**
 * Inserts figure and initiate attachment and upload.
 * @param {!File} file File picked by the user.
 * @param {function(string, File)} callback Callback function when the reading is complete.
 * @param {../../layout} inLayout Layout to insert the figure in.
 * @param {number} atIndexInLayout where to insert in layout.
 * @private
 */
UploadManager.prototype.fileLoaded_ = function(
    dataUrl, file, inLayout, atIndexInLayout) {
  // Create a figure with the file Data URL and insert it.
  var figure = new Figure({src: dataUrl, isAttachment: true});
  figure.section = inLayout;
  var insertFigureOps = figure.getInsertOps(atIndexInLayout);
  this.editor.article.transaction(insertFigureOps);
  this.editor.dispatchEvent(new Event('change'));

  // Create an attachment to track the figure and insertion operations.
  var attachment = new Attachment({
    file: file,
    figure: Utils.getReference(figure.name),
    editor: this.editor,
    insertedOps: insertFigureOps,
  });

  // Dispatch an attachment added event to allow clients to upload the file.
  var newEvent = new CustomEvent(
    UploadManager.ATTACHMENT_ADDED_EVENT_NAME, {
      detail: {attachment: attachment},
    });
  this.editor.dispatchEvent(newEvent);
  this.upload(attachment);
};


/**
 * Read file data URL.
 * @param {!File} file File picked by the user.
 * @param {function(string, File)} callback Callback function when the reading is complete.
 * @param {../../layout} inLayout Layout to insert the figure in.
 * @param {number} atIndexInLayout where to insert in layout.
 * @private
 */
UploadManager.prototype.readFileAsDataUrl_ = function(
    file, callback, inLayout, atIndexInLayout) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    return function(e) {
      callback(e.target.result, f, inLayout, atIndexInLayout);
    };
  }(file));
  reader.readAsDataURL(file);
};
