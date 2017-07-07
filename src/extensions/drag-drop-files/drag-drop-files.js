'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var dom = require('../../utils/dom');
var absOffsetTop = require('../../utils/viewport').absOffsetTop;
var Loader = require('../../loader');
// var Figure = require('../../figure');


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
   * The component that started the drag if any.
   * @type {!../component}
   */
  this.draggedComponent_ = null;

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
  this.bindedHandleDragStart_ = this.handleDragStart_.bind(this);
  /** @private */
  this.bindedHandleDragEnter_ = this.handleDragEnter_.bind(this);
  /** @private */
  this.bindedHandleDragLeave_ = this.handleDragLeave_.bind(this);
  /** @private */
  this.bindedHandleDragOver_ = this.handledragOver_.bind(this);
  /** @private */
  this.bindedHandleDrop_ = this.handleDrop_.bind(this);
  /** @private */
  this.bindedHandleDragEnd_ = this.handleDragEnd_.bind(this);

  /** @type {../layoutExtension} */
  this.layoutExtension_ = params.layoutExtension ||
      Loader.load('LayoutingExtension');

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
      'dragstart' , this.bindedHandleDragStart_);
  this.droppableElement_.addEventListener(
      'dragenter' , this.bindedHandleDragEnter_);
  this.droppableElement_.addEventListener(
      'dragleave' , this.bindedHandleDragLeave_);
  this.droppableElement_.addEventListener(
      'dragover' , this.bindedHandleDragOver_);
  this.droppableElement_.addEventListener(
      'drop' , this.bindedHandleDrop_);
  this.droppableElement_.addEventListener(
      'dragend' , this.bindedHandleDragEnd_);
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
      'dragstart' , this.bindedHandleDragStart_);
  this.droppableElement_.removeEventListener(
      'dragenter' , this.bindedHandleDragEnter_);
  this.droppableElement_.removeEventListener(
      'dragleave' , this.bindedHandleDragLeave_);
  this.droppableElement_.removeEventListener(
      'dragover' , this.bindedHandleDragOver_);
  this.droppableElement_.removeEventListener(
      'drop' , this.bindedHandleDrop_);
  this.droppableElement_.removeEventListener(
      'dragend' , this.bindedHandleDragEnd_);
};



/**
 * Handles dragenter event.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handleDragStart_ = function(event) {
  this.draggedComponent_ = this.normalizeComponent_(
      dom.componentFromPoint(event.clientX, event.clientY));
  this.draggedComponent_.dom.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
};


/**
 * Handles dragenter event.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handleDragEnter_ = function(event) {
  event.preventDefault();
  event.stopPropagation();

  this.componentAtPoint_ = this.normalizeComponent_(
      dom.componentFromPoint(event.clientX, event.clientY));
  var isDropTarget = this.isDroppableOn_(
      this.draggedComponent_, this.componentAtPoint_);
  if (isDropTarget) {
    event.target.classList.add('over');
  }
};


/**
 * Handles dragleave event.
 * @param {!Event} event
 * @private
 */
DragDropFiles.prototype.handleDragLeave_ = function(event) {
  event.target.classList.remove('over');
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
    // TODO(mk): Potentially improve performance of this.
    var isDropTarget = this.isDroppableOn_(
        this.draggedComponent_, this.componentAtPoint_);
    if (isDropTarget) {
      var mouseX = event.clientX;
      var offsetStart = this.componentAtPoint_.dom.offsetLeft;
      var halfPoint = offsetStart + parseInt(event.target.offsetWidth, 10) / 2;
      if (mouseX > halfPoint) {
        event.target.classList.add('over-right');
        event.target.classList.remove('over-left');
        this.insertAfter_ = !this.editor.rtl;
      } else {
        event.target.classList.add('over-left');
        event.target.classList.remove('over-right');
        this.insertAfter_ = this.editor.rtl;
      }
    }
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
  this.dropAtAnchorDom_.style.top = EDGE;
  event.target.classList.remove('over');
  event.target.classList.remove('over');
  event.target.classList.remove('over-left');
  event.target.classList.remove('over-right');
  event.preventDefault();
  event.stopPropagation();
  var files = event.dataTransfer.files;

  var componentRef = this.componentAtPoint_;
  var isDropTarget = this.isDroppableOn_(
      this.draggedComponent_, this.componentAtPoint_);
  var canBeInGrid = this.canMergeIntoGrid_(
      this.draggedComponent_, this.componentAtPoint_);
  if (files.length > 0 && this.uploadManager_) {
    this.uploadManager_.attachFilesAt(
        files, this.componentAtPoint_, this.insertAfter_);
  } else if (this.draggedComponent_) {
    var movingComponent = this.draggedComponent_;
    this.draggedComponent_.dom.classList.remove('dragging');

    var currentLayout = componentRef.section;

    // For now only support Figure as a dropping point where it creates
    // a grid.
    if (isDropTarget && canBeInGrid &&
        this.layoutExtension_ && !currentLayout.allowMoreItems()) {
      currentLayout = this.layoutExtension_.newLayoutAt(
          'layout-responsive-grid', componentRef, this.insertAfter_);

      // Update the component reference to the accurate one after a layout might
      // have split and the component reference needs to update.
      componentRef = Utils.getReference(componentRef.name);
      this.editor.article.transaction(componentRef.getDeleteOps());

      componentRef.section = currentLayout;
      this.editor.article.transaction(componentRef.getInsertOps(0));

      componentRef = Utils.getReference(componentRef.name);
    }


    // TODO(mk): Items that are already in grid can be merged with items that
    // canBeInGrid is false. Need to put them outside of that layout.
    var offsetIndex = 0;
    if (this.insertAfter_) {
      offsetIndex = 1;
    }

    var removeFigureOps = movingComponent.getDeleteOps();
    this.editor.article.transaction(removeFigureOps);

    movingComponent.section = componentRef.section;
    var insertFigureOps = movingComponent.getInsertOps(
          componentRef.getIndexInSection() + offsetIndex);


    this.editor.article.transaction(insertFigureOps);
    this.editor.dispatchEvent(new Event('change'));
  }
};


/**
 * Handles drop end.
 * @private
 */
DragDropFiles.prototype.handleDragEnd_ = function() {
  this.dropAtAnchorDom_.style.top = EDGE;
  if (this.draggedComponent_) {
    this.draggedComponent_.dom.classList.remove('dragging');
  }
};


DragDropFiles.prototype.isDroppableOn_ = function(dragged, target) {
  if (!target) {
    return true;
  }

  if (target.getComponentClassName() == 'Paragraph') {
    return true;
  }

  if (!target.isDropTarget) {
    return false;
  }

  if (!dragged) {
    return true;
  }

  if (dragged.getComponentClassName() !== target.getComponentClassName()) {
    return false;
  }

  if (target.responsive === undefined) {
    return true;
  }

  if (target.responsive && dragged.responsive) {
    return true;
  }

  return false;
};


DragDropFiles.prototype.canMergeIntoGrid_ = function(dragged, target) {
  if (!target) {
    return true;
  }

  if (target.getComponentClassName() == 'Paragraph') {
    return false;
  }

  if (!target.isDropTarget) {
    return false;
  }

  if (!dragged && target.getComponentClassName() == 'Figure') {
    return true;
  }

  if (dragged.getComponentClassName() !== target.getComponentClassName()) {
    return false;
  }

  if (target.responsive === undefined && dragged.responsive === undefined) {
    return true;
  }

  if (target.responsive && dragged.responsive) {
    return true;
  }

  return false;
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
