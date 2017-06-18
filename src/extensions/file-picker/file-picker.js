'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Button = require('../../toolbars/button');
var Utils = require('../../utils');
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
    toolbarNames: [],
  }, opt_params);

  /**
   * The editor this toolbelt belongs to.
   * @type {../../editor}
   */
  this.editor = editor;

  /**
   * @type {Array<../uploading/upload-manager}
   */
  this.uploadManager_ = params.uploadManager;

  /**
   * Toolbar name to insert a button for file picker on.
   * @type {Array<string>}
   */
  this.toolbarNames = params.toolbarNames || [FilePicker.TOOLBELT_TOOLBAR_NAME];

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
 * Initialize the upload button and listener.
 */
FilePicker.prototype.init = function() {
  for (var i = 0; i < this.toolbarNames.length; i++) {
    var toolbar = this.editor.getToolbar(this.toolbarNames[i]);
    if (!toolbar) {
      console.warn('Could not find toolbar "' + this.toolbarNames[i] + '".' +
          'Make sure the extension that provides that toolbar is installed.');
      continue;
    }
    var uploadButton = new UploadButton({
      label: I18n.get('button.upload'),
      icon: I18n.get('button.icon.upload'),
    });
    uploadButton.addEventListener(
        'change', this.handleUpload.bind(this), false);
    toolbar.addButton(uploadButton);
  }
};


/**
 * Handles selecting a file.
 * @param  {Event} event Event fired from UploadButton.
 */
FilePicker.prototype.handleUpload = function(event) {
  var files = event.detail.files;
  var selection = this.editor.article.selection;
  var component = selection.getComponentAtStart();
  if (this.uploadManager_) {
    this.uploadManager_.attachFilesAt(files, component);
  }
};
