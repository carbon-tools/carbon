'use strict';

var AbstractExtension = require('../core/abstract-extension');
var Utils = require('../utils');
var Button = require('../toolbars/button');
var I18n = require('../i18n');
var dataUriToBlob = require('../utils/xhr').dataUriToBlob;


/**
 * Allows users to take selfies and insert them into the article.
 * @param  {../editor} editor Editor installing this extension.
 * @param {Object=} opt_params Optional parameters.
 * @constructor
 */
var SelfieExtension = function(editor, opt_params) {
  // TODO(mkhatib): Add config params for size and shutter sound.
  var params = Utils.extend({
    uploadManager: null,
    toolbarNames: [],
  }, opt_params);

  // Create offscreen canvas to use as video buffer from the webcam.
  // TODO(mkhatib): Maybe actually insert it as a Figure when /selfie
  // is typed to see live view of it and then the picture is taken!
  this.camDom = document.getElementById(SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
  if (!this.camDom) {
    this.camDom = document.createElement('div');
    this.camDom.style.position = 'absolute';
    this.camDom.style.top = '-9999px';
    this.camDom.style.left = '-9999px';
    this.camDom.setAttribute('id', SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
    document.body.appendChild(this.camDom);
  }

  Webcam.set({
    'width': 320,
    'height': 240,
    'dest_width': 1280,
    'dest_height': 720,
    'crop_width': 1280,
    'crop_height': 720,
    'image_format': 'jpeg',
    'jpeg_quality': 90,
  });

  /**
   * Editor instance this extension was installed on.
   * @type {../editor}
   */
  this.editor = editor;

  /**
   * Upload manager to uplaod through.
   * @type {./uploading/upload-manager}
   * @private
   */
  this.uploadManager_ = params.uploadManager;

  /**
   * Toolbar name to insert a button for file picker on.
   * @type {Array<string>}
   */
  this.toolbarNames = (
      params.toolbarNames || [SelfieExtension.TOOLBELT_TOOLBAR_NAME]);

  this.init();
};
SelfieExtension.prototype = Object.create(AbstractExtension.prototype);
module.exports = SelfieExtension;


/**
 * Extension class name.
 * @type {string}
 */
SelfieExtension.CLASS_NAME = 'SelfieExtension';


/**
 * The preview element id.
 * @type {string}
 */
SelfieExtension.CAM_PREVIEW_ELEMENT_ID = 'carbon-camera';


/**
 * Command regex to take a selfie.
 * @type {string}
 */
SelfieExtension.COMMAND_REGEX = '^\\+selfie$';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
SelfieExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Initiate an extension instance.
 * @param  {../editor} unusedEditor Editor installing this extension.
 */
SelfieExtension.onInstall = function(unusedEditor) {
  if (!Webcam) {
    console.error('SelfieExtension depends on Webcam.js being loaded. Make' +
      ' sure to include it in your app.');
    return;
  }
};


/**
 * Registers the regex with the editor.
 */
SelfieExtension.prototype.init = function() {
  this.editor.registerRegex(
      I18n.get('regex.selfie') || SelfieExtension.COMMAND_REGEX,
      this.handleMatchedRegex.bind(this));

  for (var i = 0; i < this.toolbarNames.length; i++) {
    var toolbar = this.editor.getToolbar(this.toolbarNames[i]);
    if (!toolbar) {
      console.warn('Could not find toolbar "' + this.toolbarNames[i] + '".' +
          'Make sure the extension that provides that toolbar is installed.');
      continue;
    }
    var selfieButton = new Button({
      label: I18n.get('button.selfie'),
      icon: I18n.get('button.icon.selfie'),
    });
    selfieButton.addEventListener(
        'click', this.handleInsertClicked.bind(this), false);
    toolbar.addButton(selfieButton);
  }
};


/**
 * Takes a selfie from the webcam and make a callback with the operations
 * to execute to insert it.
 * @param  {function(Array<../defs.OperationDef>)} opsCallback Callback to call with the operations to insert
 * the selfie.
 */
SelfieExtension.prototype.letMeTakeASelfie = function(opsCallback) {
  var that = this;
  Webcam.attach('#' + SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
  Webcam.on('live', function() {
    setTimeout(function() {
      Webcam.snap(function(dataUri) {
        var selection = that.editor.article.selection;
        var component = selection.getComponentAtStart();

        var name = 'Selfie-' + new Date();
        var blob = dataUriToBlob(dataUri, name);
        blob.name = name;
        if (that.uploadManager_) {
          that.uploadManager_.attachFilesAt([blob], component);
        }
        if (opsCallback) {
          opsCallback();
        }
      });

      Webcam.off('live');
      Webcam.reset();
    }, 1000);
  });
};


/**
 * Handles regex match by instantiating a component.
 * @param {../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
SelfieExtension.prototype.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var ops = [];
  var atIndex = matchedComponent.getIndexInSection();
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  this.letMeTakeASelfie(function() {
    opsCallback(ops);
  });
};


/**
 * Handles clicking take a selfie button.
 */
SelfieExtension.prototype.handleInsertClicked = function() {
  this.letMeTakeASelfie();
};
