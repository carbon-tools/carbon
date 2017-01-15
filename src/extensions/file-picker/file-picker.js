'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Button = require('../../toolbars/button');
var Utils = require('../../utils');
var Figure = require('../../figure');
var Attachment = require('../attachment');
var I18n = require('../../i18n');


/**
 * An upload button that extends Button to style the upload button.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../../toolbars/button}
 * @constructor
 */
var UploadButton = function(opt_params) {
  var params = Utils.extend({
    label: 'Upload',
    icon: '',
  }, opt_params);

  Button.call(this, params);

  this.dom.classList.add(UploadButton.UPLOAD_CONTAINER_CLASS_NAME);

  /**
   * Upload button input element.
   * @type {!Element}
   */
  this.uploadButtonDom = document.createElement(UploadButton.TAG_NAME);
  this.uploadButtonDom.setAttribute('type', 'file');
  this.uploadButtonDom.setAttribute('name', this.name);
  this.uploadButtonDom.setAttribute('multiple', true);
  this.uploadButtonDom.addEventListener(
      'change', this.handleChange.bind(this), false);

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
  var fileEl = /** @type {HTMLInputElement} */ (event.target);
  var eventDetails = {target: this, files: fileEl.files};
  var newEvent = new CustomEvent('change', {detail: eventDetails});
  this.dispatchEvent(newEvent);
  event.target.value = '';
};


/**
 * Upload Extension enables upload button on the toolbelt.
 * @param  {../../editor} editor Editor instance this installed on.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var FilePicker = function(editor, opt_params) {
  var params = Utils.extend({
    uploadManager: null,
  }, opt_params);

  /**
   * The editor this toolbelt belongs to.
   * @type {../../editor}
   */
  this.editor = editor;

  /**
   * The toolbelt toolbar.
   * @type {../../toolbars/toolbar}
   */
  this.toolbelt = null;

  /**
   * @type {Array<../uploading/upload-manager}
   */
  this.uploadManager_ = params.uploadManager;

  this.init();
};
FilePicker.prototype = Object.create(AbstractExtension.prototype);
module.exports = FilePicker;


/**
 * Extension class name.
 * @type {string}
 */
FilePicker.CLASS_NAME = 'FilePicker';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
FilePicker.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Event name for attachment added.
 * @type {string}
 */
FilePicker.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Initialize the upload button and listener.
 */
FilePicker.prototype.init = function() {
  this.toolbelt = this.editor.getToolbar(FilePicker.TOOLBELT_TOOLBAR_NAME);
  var uploadButton = new UploadButton({
    label: I18n.get('button.upload'),
    icon: I18n.get('button.icon.upload'),
  });
  uploadButton.addEventListener('change', this.handleUpload.bind(this), false);
  this.toolbelt.addButton(uploadButton);
};


/**
 * Handles selecting a file.
 * @param  {Event} event Event fired from UploadButton.
 */
FilePicker.prototype.handleUpload = function(event) {
  var that = this;
  // TODO(mkhatib): Create attachment per supported file.
  var files = event.detail.files;

  var fileLoaded = function(dataUrl, file) {
    var selection = that.editor.article.selection;
    var component = selection.getComponentAtStart();

    // Create a figure with the file Data URL and insert it.
    var figure = new Figure({src: dataUrl, isAttachment: true});
    figure.section = selection.getSectionAtStart();
    var insertFigureOps = figure.getInsertOps(component.getIndexInSection());
    that.editor.article.transaction(insertFigureOps);
    that.editor.dispatchEvent(new Event('change'));

    // Create an attachment to track the figure and insertion operations.
    var attachment = new Attachment({
      file: file,
      figure: selection.getComponentAtStart(),
      editor: that.editor,
      insertedOps: insertFigureOps,
    });

    // Dispatch an attachment added event to allow clients to upload the file.
    var newEvent = new CustomEvent(
      FilePicker.ATTACHMENT_ADDED_EVENT_NAME, {
        detail: {attachment: attachment},
      });
    that.editor.dispatchEvent(newEvent);

    if (that.uploadManager_) {
      that.uploadManager_.upload(attachment);
    }
  };

  for (var i = 0; i < files.length; i++) {
    // Read the file as Data URL.
    this.readFileAsDataUrl_(files[i], fileLoaded);
  }
};


/**
 * Read file data URL.
 * @param  {!File} file File picked by the user.
 * @param  {function(string, File)} callback Callback function when the reading is complete.
 * @private
 */
FilePicker.prototype.readFileAsDataUrl_ = function(file, callback) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    return function(e) {
      callback(e.target.result, f);
    };
  }(file));
  reader.readAsDataURL(file);
};

