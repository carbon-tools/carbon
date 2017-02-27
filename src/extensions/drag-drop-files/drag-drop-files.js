'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var dom = require('../../utils/dom');
var absOffsetTop = require('../../utils/viewport').absOffsetTop;


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
    droppableElement: null,
  }, opt_params);

  /**
   * The editor this toolbelt belongs to.
   * @type {../../editor}
   */
  this.editor = editor;

  /**
   * The element where it can receive drops.
   * @type {!Element}
   */
  this.droppableElement_ = params.droppableElement || this.editor.element;

  /**
   * @type {Array<../uploading/upload-manager}
   */
  this.uploadManager_ = params.uploadManager;

  /**
   * @type {!Element}
   */
  this.dropAtAnchorDom_ = document.createElement('div');
  this.dropAtAnchorDom_.className = 'drag-drop-anchor';

  /**
   * The component at the time of the drop off.
   * @type {!../component}
   */
  this.componentAtPoint_ = null;

  /**
   * Track whether the drop is going to happen after the component
   * tracked in this.componentAtPoint_.
   */
  this.insertAfter_ = null;

  /** @private */
  this.bindedHandleDragEnter_ = this.handleDragEnter_.bind(this);
  /** @private */
  this.bindedHandleDragOver_ = this.handledragOver_.bind(this);
  /** @private */
  this.bindedHandleDrop_ = this.handleDrop_.bind(this);

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
 * Initialize the drag-drop listeners.
 */
DragDropFiles.prototype.init = function() {
  document.body.appendChild(this.dropAtAnchorDom_);
  this.droppableElement_.addEventListener(
      'dragenter' , this.bindedHandleDragEnter_);
  this.droppableElement_.addEventListener(
      'dragover' , this.bindedHandleDragOver_);
  this.droppableElement_.addEventListener(
      'drop' , this.bindedHandleDrop_);
};


/**
 * Cleanup event listeners.
 */
DragDropFiles.prototype.onDestroy = function() {
  try {
    document.body.removeChild(this.dropAtAnchorDom_);
  } catch (unusedE) {
  }
  this.droppableElement_.removeEventListener(
      'dragenter' , this.bindedHandleDragEnter_);
  this.droppableElement_.removeEventListener(
      'dragover' , this.bindedHandleDragOver_);
  this.droppableElement_.removeEventListener(
      'drop' , this.bindedHandleDrop_);
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
  var lastComp = this.editor.article.getLastComponent().getLastComponent();
  var firstComp = this.editor.article.getFirstComponent().getFirstComponent();
  if (this.componentAtPoint_) {
    // TODO(mkhatib): Update the indicator to reflect insertion point better
    // specially when inserting next to another iamge for example.
    // TODO(mkhatib): When dropping an image on top of another the result should
    // create a grid layout (if not already in one).
    this.dropAtAnchorDom_.style.top = (
        this.componentAtPoint_.dom.offsetTop + 'px');
    this.insertAfter_ = false;
  } else if (event.clientY <= firstComp.dom.offsetTop) {
    this.componentAtPoint_ = firstComp;
    this.dropAtAnchorDom_.style.top = firstComp.dom.offsetTop + 'px';
    this.insertAfter_ = false;
  } else {
    var lastCompBottom = lastComp.dom.offsetTop + lastComp.dom.offsetHeight;
    var dropOffset = Math.max(absOffsetTop(event.target),
        event.clientY + event.screenY);
    if (dropOffset >= lastCompBottom) {
      this.componentAtPoint_ = lastComp;
      this.dropAtAnchorDom_.style.top = lastCompBottom + 'px';
      this.insertAfter_ = true;
    }
  }
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
  var files = event.dataTransfer.files;
  if (this.uploadManager_) {
    this.uploadManager_.attachFilesAt(
        files, this.componentAtPoint_, this.insertAfter_);
  }
};


/**
 * Returns the actual component instead of a container.
 * @param {../../component} component
 * @private
 */
DragDropFiles.prototype.normalizeComponent_ = function(component) {
  while (component && component.components) {
    component = /** @type {../../section} */ (component).getFirstComponent();
  }

  if (!component) {
    return null;
  }

  if (component.inline) {
    component = component.parentComponent;
  }
  return component;
};
