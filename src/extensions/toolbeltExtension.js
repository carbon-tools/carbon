'use strict';

var Selection = require('../selection');
var Toolbar = require('../toolbars/toolbar');
var Button = require('../toolbars/button');


/**
 * Toolbelt extension for the editor.
 *   Adds an extendable toolbar for components to add buttons to.
 */
var Toolbelt = function () {

  /**
   * The editor this toolbelt belongs to.
   * @type {Editor}
   */
  this.editor = null;

  /**
   * The toolbelt toolbar.
   * @type {Toolbar}
   */
  this.toolbar = null;

  /**
   * The editor's block toolbar.
   * @type {Toolbar}
   */
  this.blockToolbar = null;

  /**
   * The insert button to show the toolbelt when clicked.
   * @type {Toolbar}
   */
  this.insertButton = new Button({ label: '+' });
  this.insertButton.setVisible(false);
  this.insertButton.addEventListener(
      'click', this.handleInsertClick.bind(this));
};
module.exports = Toolbelt;


/**
 * Extension class name.
 * @type {string}
 */
Toolbelt.CLASS_NAME = 'Toolbelt';


/**
 * Initializes the toolbelt extensions.
 * @param  {Editor} editor Editor instance this installed on.
 */
Toolbelt.onInstall = function(editor) {
  var toolbeltExtension = new Toolbelt();
  toolbeltExtension.init(editor);
};


/**
 * Call to destroy instance and cleanup dom and event listeners.
 */
Toolbelt.onDestroy = function() {
  // pass
};


/**
 * Initiates the toolbelt extension.
 * @param  {Editor} editor The editor to initialize the extension for.
 */
Toolbelt.prototype.init = function(editor) {
  this.editor = editor;
  this.blockToolbar = this.editor.getToolbar(Toolbelt.BLOCK_TOOLBAR_NAME);
  this.blockToolbar.addButton(this.insertButton);

  // Create a new toolbar for the toolbelt.
  this.toolbar = new Toolbar({
    name: Toolbelt.TOOLBELT_TOOLBAR_NAME,
    classNames: [Toolbelt.TOOLBELT_TOOLBAR_CLASS_NAME],
    rtl: this.editor.rtl
  });
  this.toolbar.addEventListener(
      'button-added', this.handleButtonAdded.bind(this));

  // Register the toolbelt toolbar with the editor.
  this.editor.registerToolbar(Toolbelt.TOOLBELT_TOOLBAR_NAME, this.toolbar);

  // Listen to selection changes.
  this.editor.article.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.handleSelectionChangedEvent.bind(this));
};


/**
 * Toolbelt toolbar name.
 * @type {string}
 */
Toolbelt.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Toolbelt toolbar class name.
 * @type {string}
 */
Toolbelt.TOOLBELT_TOOLBAR_CLASS_NAME = 'toolbelt-toolbar';


/**
 * Block toolbar name.
 * @type {string}
 */
Toolbelt.BLOCK_TOOLBAR_NAME = 'block-toolbar';


/**
 * Handles clicking the insert button to expand the toolbelt.
 */
Toolbelt.prototype.handleInsertClick = function() {
  this.toolbar.setPositionToStartBottomOf(this.insertButton.dom);
  this.toolbar.setVisible(!this.toolbar.isVisible);
};


/**
 * Handles selection change event on the editor to hide the toolbelt.
 */
Toolbelt.prototype.handleSelectionChangedEvent = function() {
  this.toolbar.setVisible(false);
};


/**
 * Handles new button added to toolbelt to show the insert button.
 */
Toolbelt.prototype.handleButtonAdded = function () {
  this.insertButton.setVisible(true);
};
