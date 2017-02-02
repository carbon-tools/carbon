'use strict';

var Utils = require('../utils');
var Selection = require('../selection');


/**
 * Allow for updating attributes in history and in the component for
 * uploading files and media.
 * @param {Object=} opt_params Optional Parameters.
 * @constructor
 */
var Attachment = function(opt_params) {
  var params = Utils.extend({
    file: null,
    dataUri: null,
    // TODO(mkhatib): Make this general for any kind of component
    // (e.g. video, pdf...etc)
    figure: null,
    insertedOps: null,
  }, opt_params);

  /**
   * The file that was picked by the user.
   * @type {File}
   */
  this.file = params.file;

  /**
   * Data URI of the attachment. This might be set when the attachment
   * came from a non-input file (e.g. webcam).
   * @type {string}
   */
  this.dataUri = params.dataUri;

  /**
   * Figure inserted for this attachment.
   * @type {../figure}
   */
  this.figure = params.figure;

  /**
   * Operations used to insert the component.
   * @type {Array<../defs.OperationDef>}
   */
  this.insertedOps = params.insertedOps;


  /**
   * Listeners to attachment upload complete.
   * @type {Array<function>}
   * @private
   */
  this.onDoneListeners_ = [];

  /**
   * Attachment-related DOM.
   * @type {!Element}
   */
  this.attachmentDom_ = document.createElement('div');
  this.attachmentDom_.className = 'carbon-attachment-inner';

  /**
   * Uploading progress bar UI.
   * @type {!Element}
   */
  this.progressDom_ = document.createElement('div');
  this.progressDom_.className = 'carbon-attachment-progress-bar';

  this.attachmentDom_.appendChild(this.progressDom_);
  this.figure.dom.appendChild(this.attachmentDom_);
};
module.exports = Attachment;


/**
 * Sets upload progress for the attachment.
 * @param {number} progress Progress for the uploading process.
 */
Attachment.prototype.setUploadProgress = function(progress) {
  this.progress = progress;
  requestAnimationFrame(function() {
    this.progressDom_.style.width = progress + '%';
  }.bind(this));
};


/**
 * Sets upload progress for the attachment.
 * @param {Object=} data
 */
Attachment.prototype.uploadComplete = function(data) {
  this.setAttributes({
    src: data.src,
    srcset: data.srcset,
    caption: data.caption,
    isAttachment: false,
  });

  try {
    this.figure.dom.removeChild(this.attachmentDom_);
  } catch (unusedE) {
  }

  for (var i = 0; i < this.onDoneListeners_.length; i++) {
    this.onDoneListeners_[i]();
  }
};


/**
 * Subscribes to be notified when the attachment is done uploading.
 * @param {function} callback
 */
Attachment.prototype.onDone = function(callback) {
  this.onDoneListeners_.push(callback);
};


/**
 * Marks attachment as failed upload.
 * TODO(mkhatib): Implement upload failed handler. Possibly allowing retries.
 */
Attachment.prototype.uploadFailed = function() {
};


/**
 * Sets attributes for the inserted component and updates the insertion
 * operations in history.
 * @param {Object} attrs Attributes to update.
 */
Attachment.prototype.setAttributes = function(attrs) {
  // TODO(mkhatib): This is a hack to update previous history operation.
  // Think of a better way to do this.
  for (var i = 0; i < this.insertedOps.length; i++) {
    var newAttrs = Utils.extend(this.insertedOps[i].do.attrs || {}, attrs);
    this.insertedOps[i].do.attrs = newAttrs;
  }
  // Update the figure object attributes to reflect the changes.
  this.figure.updateAttributes(attrs);

  // If the figure finished uploading and it's still selected,
  // reselect to show the toolbar.
  var selection = Selection.getInstance();
  var selectedComponent = selection.getComponentAtStart();
  if (selectedComponent === this.figure) {
    this.figure.select();
  }
};
