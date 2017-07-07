'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var Figure = require('../../figure');
var Attachment = require('../attachment');
var Loader = require('../../loader');
var readFileAsDataURI = require('../../utils/xhr').readFileAsDataURI;


/**
 * Maximum concurrent uploads and data-uri reads at a time.
 * @type {number}
 */
var MAX_RUNNING_UPLOAD_TASKS = 5;


/**
 * Queues requested attachments to allow a limited number of file reads and
 * uploads concurrently to avoid killing the browser :-).
 * @param {Array<./abstract-uploader>} uploaders
 * @constructor
 */
var UploadQueue = function(uploaders) {
  /**
   * Deferred uploading tasks.
   * @type {Array<UploadTaskDef>}
   * @private
   */
  this.queue_ = [];

  /**
   * Currently running uploading tasks.
   * @type {Array<UploadTaskDef>}
   * @private
   */
  this.runningQueue_ = [];

  /**
   * Queue of attachments that failed to upload.
   */
  this.failedQueue_ = [];

  /**
   * @type {Array<./abstract-uploader>}
   * @private
   */
  this.uploaders_ = uploaders;
};


/**
 * Return the status of each queue.
 * @return {Object}
 */
UploadQueue.prototype.getStatus = function() {
  return {
    pending: this.queue_.length,
    uploading: this.runningQueue_.length,
    failed: this.failedQueue_.length,
  };
};


/**
 * Adds a new uploading task to the queue and starts the queue.
 * @param {../attachment} attachment
 */
UploadQueue.prototype.add = function(attachment) {
  this.queue_.push({
    id: 'task-' + Utils.getUID(),
    attachment: attachment,
    retryCount: -1,
  });
  this.start();
};


/**
 * Kicks off uploads to MAX_RUNNING_UPLOAD_TASKS of concurrent uploads.
 */
UploadQueue.prototype.start = function() {
  while (this.queue_.length > 0 &&
        this.runningQueue_.length < MAX_RUNNING_UPLOAD_TASKS) {
    var task = this.queue_.splice(0, 1)[0];
    this.runningQueue_.push(task);
    if (task.retryCount < 0) {
      task.attachment.onDone(this.taskComplete_.bind(this, task));
      task.attachment.onError(this.taskFailed_.bind(this, task));
      task.attachment.onRetry(this.retryTask_.bind(this, task));
      task.retryCount++;
    }
    this.run(task);
  }
};


/**
 * Removes a task from running queue.
 * @param {UploadTaskDef} task
 */
UploadQueue.prototype.taskComplete_ = function(task) {
  console.log('completed upload task:', task.id);
  var index = this.runningQueue_.indexOf(task);
  this.runningQueue_.splice(index, 1);
  this.start();
};


/**
 * Removes a task from running queue and puts it in failed queue.
 * @param {UploadTaskDef} task
 */
UploadQueue.prototype.taskFailed_ = function(task) {
  console.log('upload task failed:', task.id);
  var index = this.runningQueue_.indexOf(task);
  this.runningQueue_.splice(index, 1);
  this.failedQueue_.push(task);
  this.start();
};


/**
 * Removes a task from running queue and puts it in failed queue.
 * @param {UploadTaskDef} task
 */
UploadQueue.prototype.retryTask_ = function(task) {
  console.log('retrying failed upload task:', task.id);
  var index = this.failedQueue_.indexOf(task);
  if (index === -1) {
    console.warn('Task was not found in failed queue...');
    return;
  }
  this.failedQueue_.splice(index, 1);
  this.queue_.push(task);
  this.start();
};

/**
 * Reads the task attachment file content as Data URI.
 * @param {UploadTaskDef} task
 */
UploadQueue.prototype.run = function(task) {
  readFileAsDataURI(
      task.attachment.file,
      this.updateImagePreview_.bind(this, task.attachment));
};


/**
 * Updates the attachment figure source to the dataURI preview.
 */
UploadQueue.prototype.updateImagePreview_ = function(attachment, dataUri) {
  attachment.figure.updateAttributes({
    src: dataUri,
  });
  this.upload(attachment);
};


/**
 * Notify uploaders with the new attachment added.
 * @param {../attachment} attachment
 */
UploadQueue.prototype.upload = function(attachment) {
  for (var i = 0; i < this.uploaders_.length; i++) {
    var uploader = this.uploaders_[i];
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
   * @private
   */
  this.uploaders_ = params.uploaders || [];

  /** @type {../layoutExtension} */
  this.layoutExtension_ = params.layoutExtension ||
      Loader.load('LayoutingExtension');

  /**
   * Queues and manage when file reads and uploads happen.
   * @type {UploadQueue}
   * @private
   */
  this.uploadQueue_ = new UploadQueue(this.uploaders_);
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
 * Returns the status of each queue in uploading.
 * @return {Object}
 */
UploadManager.prototype.getStatus = function() {
  return this.uploadQueue_.getStatus();
};


/**
 * Inserts Grid layout, figures and attachments and initiate uploading files.
 * @param {Array<File|Blob>} files
 * @param {../../component} atComponent where to insert uploaded files.
 * @param {boolean=} opt_insertAfter whether to insert the attachment after the component.
 */
UploadManager.prototype.attachFilesAt = function(files, atComponent,
    opt_insertAfter, opt_figuresOptions) {
  var componentRef = atComponent;
  var currentLayout = componentRef.section;
  var insertAfter = (opt_insertAfter === undefined
      ? componentRef instanceof Figure
      : opt_insertAfter);
  var attachment;
  var figureOptions;
  if (files.length > 1 && this.layoutExtension_ &&
      !currentLayout.allowMoreItems()) {
    var numOfPhotos = 0;
    var remainingFilesCount = files.length;
    var shouldInsertLayoutAfter = insertAfter;
    for (var i = 0; i < files.length; i += numOfPhotos) {
      var layout = this.layoutExtension_.newLayoutAt(
          'layout-responsive-grid', componentRef, shouldInsertLayoutAfter);
      shouldInsertLayoutAfter = true;
      if (files.length <= 5) {
        numOfPhotos = files.length;
      } else {
        // Split Photos into groups.
        numOfPhotos = Math.floor(Math.random() * 4) + 2;
      }
      var loopTimes = Math.min(numOfPhotos, remainingFilesCount);
      for (var j = 0; j < loopTimes; j++) {
        figureOptions = (
            opt_figuresOptions && opt_figuresOptions[i + j]) || {};
        attachment = this.createPlaceholderAttachment_(
            files[i + j], layout, j, figureOptions);
        // Queue Upload for the attachment.
        this.uploadQueue_.add(attachment);
        remainingFilesCount--;
      }
      // Update the component reference to the accurate one after a layout might
      // have split and the component reference needs to update.
      componentRef = layout.getLastComponent(); //Utils.getReference(atComponent.name);
    }
  } else {
    var offsetIndex = insertAfter ? 1 : 0;
    if ((componentRef instanceof Figure) &&
          this.layoutExtension_ && !currentLayout.allowMoreItems()) {
      currentLayout = this.layoutExtension_.newLayoutAt(
          'layout-responsive-grid', componentRef, insertAfter);

      // Update the component reference to the accurate one after a layout might
      // have split and the component reference needs to update.
      componentRef = Utils.getReference(componentRef.name);
      this.editor.article.transaction(componentRef.getDeleteOps());

      componentRef.section = currentLayout;
      this.editor.article.transaction(componentRef.getInsertOps(0));

      componentRef = Utils.getReference(componentRef.name);
    }
    for (var w = 0; w < files.length; w++) {
      figureOptions = (
          opt_figuresOptions && opt_figuresOptions[w]) || {};
      attachment = this.createPlaceholderAttachment_(
          files[w], currentLayout,
          componentRef.getIndexInSection() + offsetIndex,
          figureOptions);
      // Queue Upload for the attachment.
      this.uploadQueue_.add(attachment);
    }
  }
};


/**
 * Creates an attachment and figure combo and inserts it into the layout.
 * The figure at this point is only displayed with a placeholder image.
 * @param {File|Blob} file
 * @param {../../layout} inLayout Layout to insert the figure in.
 * @param {number} atIndexInLayout where to insert in layout.
 * @return {../attachment}
 * @private
 */
UploadManager.prototype.createPlaceholderAttachment_ = function(
    file, inLayout, atIndexInLayout, opt_figureOptions) {
  var figureOptions = opt_figureOptions || {};
  // Create a figure with a placeholder image.
  var figure = new Figure({
    isAttachment: true,
    caption: figureOptions.caption,
    alt: figureOptions.alt,
  });
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
  attachment.onDone(function() {
    this.editor.dispatchEvent(new Event('change'));
  }.bind(this));
  return attachment;
};
