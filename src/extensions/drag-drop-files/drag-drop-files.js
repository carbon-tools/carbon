'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var Figure = require('../../figure');
var Attachment = require('../attachment');
var dom = require('../../utils/dom');


/**
 * Number off the screen.
 * @type {number}
 */
var EDGE = '-99999px';


/**
 * Drag and Drop extension allowing attaching files by dropping them over the editor.
 * @param  {../../editor} editor Editor instance this installed on.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var DragDropFiles = function(editor, opt_params) {
  var params = Utils.extend({
    uploadManager: null,
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
   * @type {!Element}
   */
  this.dropAtAnchorDom_ = document.createElement('div');
  this.dropAtAnchorDom_.className = 'drag-drop-anchor';
  document.body.appendChild(this.dropAtAnchorDom_);

  /**
   * The component at the time of the drop off.
   * @type {!../component}
   */
  this.componentAtPoint_ = null;

  this.init();
};
DragDropFiles.prototype = Object.create(AbstractExtension.prototype);
module.exports = DragDropFiles;


/**
 * Extension class name.
 * @type {string}
 */
DragDropFiles.CLASS_NAME = 'DragDropFiles';


/**
 * Event name for attachment added.
 * @type {string}
 */
DragDropFiles.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Initialize the drag-drop listeners.
 * TODO(mkhatib): Cleanup on uninstalling the extension.
 */
DragDropFiles.prototype.init = function() {
  this.editor.element.addEventListener(
      'dragenter' , this.handleDragEnter_.bind(this));
  this.editor.element.addEventListener(
      'dragover' , this.handledragOver_.bind(this));
  this.editor.element.addEventListener(
      'drop' , this.handleDrop_.bind(this));
};


/**
 * Handles dragenter event.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handleDragEnter_ = function(event) {
  event.preventDefault();
  event.stopPropagation();
};


/**
 * Handles dragover event, stores the component at the dragging point and shows
 * the anchor UI.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handledragOver_ = function(event) {
  event.preventDefault();
  event.stopPropagation();
  this.componentAtPoint_ = this.normalizeComponent_(
      dom.componentFromPoint(event.clientX, event.clientY));
  this.dropAtAnchorDom_.style.top = this.componentAtPoint_.dom.offsetTop + 'px';
};


/**
 * Handles drop event, hiding the anchor UI and adding the attachments.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handleDrop_ = function(event) {
  event.preventDefault();
  event.stopPropagation();
  this.dropAtAnchorDom_.style.top = EDGE;
  this.attachFiles_(this.componentAtPoint_, event);
};


/**
 * Handles attaching a file.
 * @param {../../component} component to insert at.
 * @param  {Event} event Event fired from drop.
 * @private
 */
DragDropFiles.prototype.attachFiles_ = function(component, event) {
  var that = this;
  var files = event.dataTransfer.files;

  var fileLoaded = function(dataUrl, file) {
    var selection = that.editor.article.selection;

    // Create a figure with the file Data URL and insert it.
    var figure = new Figure({src: dataUrl, isAttachment: true});
    figure.section = component.section;
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
      DragDropFiles.ATTACHMENT_ADDED_EVENT_NAME, {
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
DragDropFiles.prototype.readFileAsDataUrl_ = function(file, callback) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    return function(e) {
      callback(e.target.result, f);
    };
  }(file));
  reader.readAsDataURL(file);
};


/**
 * Returns the actual component instead of a container.
 * @param {../../component} component
 * @private
 */
DragDropFiles.prototype.normalizeComponent_ = function(component) {
  while (component.components) {
    component = /** @type {../../section} */ (component).getFirstComponent();
  }
  if (component.inline) {
    component = component.parentComponent;
  }
  return component;
};
