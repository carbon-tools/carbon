'use strict';

var Button = require('../toolbars/button');
var Utils = require('../utils');
var Figure = require('../figure');
var Attachment = require('./attachment');


/**
 * An upload button that extends Button to style the upload button.
 * @param {Object=} optParams Optional parameters.
 */
var UploadButton = function (optParams) {
  var params = Utils.extend({
    label: 'Upload',
  }, optParams);

  Button.call(this, params);

  this.dom.classList.add(UploadButton.UPLOAD_CONTAINER_CLASS_NAME);

  /**
   * Upload button input element.
   * @type {HTMLElement}
   */
  this.uploadButtonDom = document.createElement(UploadButton.TAG_NAME);
  this.uploadButtonDom.setAttribute('type', 'file');
  this.uploadButtonDom.setAttribute('name', this.name);
  this.uploadButtonDom.addEventListener('change', this.handleChange.bind(this));

  this.dom.appendChild(this.uploadButtonDom);
};
UploadButton.prototype = Object.create(Button.prototype);


/**
 * Upload button container class name.
 * @type {string}
 */
UploadButton.UPLOAD_CONTAINER_CLASS_NAME = 'upload-button';


/**
 * Upload button element tag name.
 * @type {string}
 */
UploadButton.TAG_NAME = 'input';


/**
 * Handles file change when selecting a file.
 * @param {Event} event File event containing the selected files.
 */
UploadButton.prototype.handleChange = function(event) {
  var eventDetails = { target: this, files: event.target.files };
  var newEvent = new CustomEvent('change', {detail: eventDetails});
  this.dispatchEvent(newEvent);
  event.target.value = '';
};


/**
 * Upload Extension enables upload button on the toolbelt.
 */
var UploadExtension = function () {
  /**
   * The editor this toolbelt belongs to.
   * @type {Editor}
   */
  this.editor = null;

  /**
   * The toolbelt toolbar.
   * @type {Toolbar}
   */
  this.toolbelt = null;
};
module.exports = UploadExtension;


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
UploadExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Event name for attachment added.
 * @type {string}
 */
UploadExtension.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Initialize the upload button and listener.
 * @param  {Editor} editor The editor to enable the extension on.
 */
UploadExtension.prototype.init = function(editor) {
  this.editor = editor;
  this.toolbelt = this.editor.getToolbar(
      UploadExtension.TOOLBELT_TOOLBAR_NAME);

  var uploadButton = new UploadButton({
    label: 'Upload Photo'
  });
  uploadButton.addEventListener('change', this.handleUpload.bind(this));
  this.toolbelt.addButton(uploadButton);
};


/**
 * Handles selecting a file.
 * @param  {Event} event Event fired from UploadButton.
 */
UploadExtension.prototype.handleUpload = function(event) {
  var that = this;
  // TODO(mkhatib): Create attachment per supported file.
  var file = event.detail.files[0];

  // Read the file as Data URL.
  this.readFileAsDataUrl_(file, function(dataUrl) {
    var selection = that.editor.article.selection;
    var component = selection.getComponentAtStart();

    // Create a figure with the file Data URL and insert it.
    var figure = new Figure({src: dataUrl});
    figure.section = selection.getSectionAtStart();
    var insertFigureOps = figure.getInsertOps(component.getIndexInSection());
    that.editor.article.transaction(insertFigureOps);

    // Create an attachment to track the figure and insertion operations.
    var attachment = new Attachment({
      file: file,
      figure: selection.getComponentAtStart(),
      editor: that.editor,
      insertedOps: insertFigureOps
    });

    // Dispatch an attachment added event to allow clients to upload the file.
    var newEvent = new CustomEvent(
      UploadExtension.ATTACHMENT_ADDED_EVENT_NAME, {
        detail: { attachment: attachment }
    });
    that.editor.dispatchEvent(newEvent);
  });
};


/**
 * Read file data URL.
 * @param  {File} file File picked by the user.
 * @param  {Function} callback Callback function when the reading is complete.
 */
UploadExtension.prototype.readFileAsDataUrl_ = function(file, callback) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    // jshint unused: false
    return function(e) {
      callback(e.target.result);
    };
  }(file));
  reader.readAsDataURL(file);
};
