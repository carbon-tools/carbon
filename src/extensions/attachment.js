'use strict';

var Utils = require('../utils');
var I18n = require('../i18n');
var Selection = require('../selection');
var viewport = require('../utils/viewport');

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
   * Listeners to attachment upload failed.
   * @type {Array<function>}
   * @private
   */
  this.onErrorListeners_ = [];

  /**
   * Listeners to attachment upload retry.
   * @type {Array<function>}
   * @private
   */
  this.onRetryListeners_ = [];

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
  // this.progressDom_ = document.createElement('div');
  // this.progressDom_.className = 'carbon-attachment-progress-bar';
  this.attachmentDom_.classList.add('pending');

  /**
   * Uploading status UI.
   * @type {!Element}
   */
  this.statusDom_ = document.createElement('div');
  this.statusDom_.className = 'carbon-attachment-status-container';

  /**
   * Uploading status loader.
   * @type {!Element}
   */
  this.statusLoaderDom_ = document.createElement('div');
  this.statusLoaderDom_.className = 'carbon-attachment-status-loader loader';
  this.checkMarkDom_ = document.createElement('div');
  this.checkMarkDom_.className = 'checkmark draw';
  this.statusLoaderDom_.appendChild(this.checkMarkDom_);

  /**
   * Uploading status message.
   * @type {!Element}
   */
  this.statusMessageDom_ = document.createElement('div');
  this.statusMessageDom_.className = 'carbon-attachment-status-message';
  this.statusMessageDom_.innerText = I18n.get('label.attachment.pending');

  this.statusDom_.appendChild(this.statusLoaderDom_);
  this.statusDom_.appendChild(this.statusMessageDom_);
  // this.attachmentDom_.appendChild(this.progressDom_);
  this.attachmentDom_.appendChild(this.statusDom_);
  var retryButton = document.createElement('button');
  retryButton.className = 'retry-button';
  retryButton.innerText = I18n.get('button.attachment.retry');
  retryButton.addEventListener('click', this.handleRetry_.bind(this));
  this.attachmentDom_.appendChild(retryButton);
  this.figure.dom.appendChild(this.attachmentDom_);
};
module.exports = Attachment;


/**
 * Sets upload progress for the attachment.
 * @param {number} progress Progress for the uploading process.
 */
Attachment.prototype.setUploadProgress = function(progress) {
  this.progress = progress;
  this.statusMessageDom_.innerText = parseInt(progress, 10) + '%';
  requestAnimationFrame(function() {
    if (progress > 0) {
      this.attachmentDom_.classList.remove('pending');
      this.attachmentDom_.classList.add('uploading');
    }
  }.bind(this));
};


/**
 * Sets upload progress for the attachment.
 * @param {Object=} data
 */
Attachment.prototype.uploadComplete = function(data) {

  requestAnimationFrame(function() {
    this.attachmentDom_.classList.remove('pending');
    this.attachmentDom_.classList.remove('uploading');
    this.attachmentDom_.classList.add('done');

    this.setAttributes({
      src: data.src,
      srcset: data.srcset,
      caption: data.caption,
      isAttachment: false,
    });

    setTimeout(function() {
      try {
        this.figure.dom.removeChild(this.attachmentDom_);
      } catch (unusedE) {
      }
    }.bind(this), 2000);
  }.bind(this));

  for (var i = 0; i < this.onDoneListeners_.length; i++) {
    this.onDoneListeners_[i]();
  }
};


/**
 * Subscribes to be notified when the attachment is done uploading.
 * @param {function} callback
 */
Attachment.prototype.onDone = function(callback) {
  if (this.onDoneListeners_.indexOf(callback) === -1) {
    this.onDoneListeners_.push(callback);
  }
};


/**
 * Marks attachment as failed upload.
 * TODO(mkhatib): Implement upload failed handler. Possibly allowing retries.
 */
Attachment.prototype.uploadFailed = function() {
  requestAnimationFrame(function() {
    this.attachmentDom_.classList.remove('done');
    this.attachmentDom_.classList.remove('pending');
    this.attachmentDom_.classList.remove('uploading');
    this.attachmentDom_.classList.add('error');
    this.statusMessageDom_.innerText = I18n.get('label.attachment.error');
  }.bind(this));

  for (var i = 0; i < this.onErrorListeners_.length; i++) {
    this.onErrorListeners_[i]();
  }
};


/**
 * Subscribes to be notified when the attachment upload is errored.
 * @param {function} callback
 */
Attachment.prototype.onError = function(callback) {
  if (this.onErrorListeners_.indexOf(callback) === -1) {
    this.onErrorListeners_.push(callback);
  }
};


/**
 * Notify listenres to retry the upload.
 */
Attachment.prototype.handleRetry_ = function() {
  requestAnimationFrame(function() {
    this.attachmentDom_.classList.remove('done');
    this.attachmentDom_.classList.remove('uploading');
    this.attachmentDom_.classList.remove('error');
    this.attachmentDom_.classList.add('pending');
    this.statusMessageDom_.innerText = I18n.get('label.attachment.pending');
  }.bind(this));

  for (var i = 0; i < this.onRetryListeners_.length; i++) {
    this.onRetryListeners_[i]();
  }
};


/**
 * Subscribes to be notified when the attachment upload is retried.
 * @param {function} callback
 */
Attachment.prototype.onRetry = function(callback) {
  if (this.onRetryListeners_.indexOf(callback) === -1) {
    this.onRetryListeners_.push(callback);
  }
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

  // If the figure finished uploading and it's still selected and in viewport,
  // reselect to show the toolbar.
  viewport.ifElementInViewport(this.figure.dom, function() {
    var selection = Selection.getInstance();
    var selectedComponent = selection.getComponentAtStart();
    if (selectedComponent === this.figure) {
      this.figure.select();
    }
  }.bind(this));
};
