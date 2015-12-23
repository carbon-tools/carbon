'use strict';

var Utils = require('../utils');
var Attachment = require('./attachment');
var Figure = require('../figure');
var Button = require('../toolbars/button');
var I18n = require('../i18n');


/**
 * Allows users to take selfies and insert them into the article.
 * @param {Object=} optParams Optional parameters.
 */
var SelfieExtension = function(optParams) {

  var params = Utils.extend({
    // TODO(mkhatib): Add config params for size and shutter sound.
    editor: null,
  }, optParams);

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

  /* jshint ignore:start */
  Webcam.set({
    width: 320,
    height: 240,
    dest_width: 1280,
    dest_height: 720,
    crop_width: 1280,
    crop_height: 720,
    image_format: 'jpeg',
    jpeg_quality: 90
  });
  /* jshint ignore:end */

  /**
   * Editor instance this extension was installed on.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * Toolbelt toolbar instance.
   * @type {Toolbar}
   */
  this.toolbelt = this.editor.getToolbar(SelfieExtension.TOOLBELT_TOOLBAR_NAME);

};
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
 * Event to fire when the selfie is taken.
 * @type {String}
 */
SelfieExtension.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
SelfieExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Initiate an extension instance.
 * @param  {Editor} editor Editor installing this extension.
 */
SelfieExtension.onInstall = function (editor) {
  if (!Webcam) {
    console.error('SelfieExtension depends on Webcam.js being loaded. Make' +
      ' sure to include it in your app.');
    return;
  }

  var extension = new SelfieExtension({
    editor: editor
  });
  extension.init();
};


/**
 * Registers the regex with the editor.
 */
SelfieExtension.prototype.init = function() {
  this.editor.registerRegex(
      I18n.get('regex.selfie') || SelfieExtension.COMMAND_REGEX,
      this.handleMatchedRegex.bind(this));

  var selfieButton = new Button({
    label: I18n.get('button.selfie'),
    icon: I18n.get('button.icon.selfie')
  });
  selfieButton.addEventListener('click', this.handleInsertClicked.bind(this));
  this.toolbelt.addButton(selfieButton);
};


/**
 * Takes a selfie from the webcam and make a callback with the operations
 * to execute to insert it.
 * @param  {Function} opsCallback Callback to call with the operations to insert
 * the selfie.
 */
SelfieExtension.prototype.letMeTakeASelfie = function(opsCallback) {
  var that = this;
  var ops = [];
  Webcam.attach('#' + SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
  Webcam.on('live', function () {
    setTimeout(function() {
      Webcam.snap(function(dataUri) {
        var selection = that.editor.article.selection;
        var component = selection.getComponentAtStart();
        var atIndex = component.getIndexInSection();
        // Create a figure with the file Data URL and insert it.
        var figure = new Figure({src: dataUri});
        figure.section = selection.getSectionAtStart();
        var insertFigureOps = figure.getInsertOps(atIndex);

        // Add the new component created from the text.
        Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

        if (opsCallback) {
          opsCallback(ops);
        }

        // Create an attachment to track the figure and insertion operations.
        var attachment = new Attachment({
          dataUri: dataUri,
          figure: selection.getSectionAtStart().getComponentByName(figure.name),
          editor: that.editor,
          insertedOps: insertFigureOps
        });

        // Dispatch an attachment added event to allow clients to upload the
        // file.
        var newEvent = new CustomEvent(
          SelfieExtension.ATTACHMENT_ADDED_EVENT_NAME, {
            detail: { attachment: attachment }
        });
        that.editor.dispatchEvent(newEvent);
      });

      Webcam.off('live');
      Webcam.reset();
    }, 1000);
  });
};


/**
 * Handles regex match by instantiating a component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
SelfieExtension.prototype.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var ops = [];
  var atIndex = matchedComponent.getIndexInSection();
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  this.letMeTakeASelfie(function(newOps) {
    Utils.arrays.extend(ops, newOps);
    opsCallback(ops);
  });
};


/**
 * Handles clicking take a selfie button.
 */
SelfieExtension.prototype.handleInsertClicked = function() {
  var that = this;
  this.letMeTakeASelfie(function(ops) {
    that.editor.article.transaction(ops);
    that.editor.dispatchEvent(new Event('change'));
  });
};
