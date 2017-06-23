'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var Errors = require('../../errors');
var Button = require('../../toolbars/button');
var I18n = require('../../i18n');


/**
 * CodeEditingExtension allow embedding different code editors.
 *
 * @param {../../editor} editor Editor instance installing this extension.
 * @param {Object=} opt_params Config params.
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var CodeEditingExtension = function(editor, opt_params) {
  var params = Utils.extend({
    editorConfig: {
      params: {},
      ComponentClass: null,
    },
    toolbarNames: [],
  }, opt_params);

  /**
   * A reference to the editor this extension is enabled in.
   * @type {../../editor}
   */
  this.editor = editor;

  /**
   * The component class to use for embedding.
   * @type {function(new:./embeddedComponent, Object=)}
   */
  this.ComponentClass = params.editorConfig.ComponentClass;

  /**
   * The params to pass the component class when initiating.
   */
  this.editorParams = params.editorConfig.params;

  /**
   * Toolbar name to insert a button for file picker on.
   * @type {Array<string>}
   */
  this.toolbarNames = (
      params.toolbarNames || [CodeEditingExtension.TOOLBAR_NAME]);

  this.init();
};
CodeEditingExtension.prototype = Object.create(AbstractExtension.prototype);
module.exports = CodeEditingExtension;


/**
 * Extension class name.
 * @type {string}
 */
CodeEditingExtension.CLASS_NAME = 'CodeEditingExtension';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
CodeEditingExtension.TOOLBAR_NAME = 'block-toolbar';


/**
 * Regex to insert the coding component.
 * @type {string}
 */
CodeEditingExtension.CODE_REGEX = '```([\w\-])+';


/**
 * Instantiate an instance of the extension and configure it.
 * @param  {../../editor} unusedEditor Instance of the editor installing this extension.
 * @param  {Object} config Configuration for the extension.
 * @static
 */
CodeEditingExtension.onInstall = function(editor, config) {
  if (!config.editorConfig || !config.editorConfig.ComponentClass) {
    throw new Errors.ConfigrationError(
        'CodeEditingExtension needs a "ComponentClass" configuration');
  }
  editor.registerRegex(
      CodeEditingExtension.CODE_REGEX,
      CodeEditingExtension.handleMatchedRegex);
};


/**
 * Registers the different regexes for each provider.
 */
CodeEditingExtension.prototype.init = function() {
  for (var j = 0; j < this.toolbarNames.length; j++) {
    var toolbar = this.editor.getToolbar(this.toolbarNames[j]);
    if (!toolbar) {
      console.warn('Could not find toolbar "' + this.toolbarNames[j] + '".' +
          'Make sure the extension that provides that toolbar is installed.');
      continue;
    }

    // Add embedding buttons to the toolbelt.
    var buttons = [{
      label: I18n.get('button.code'),
      icon: I18n.get('button.icon.code'),
    }];

    for (var i = 0; i < buttons.length; i++) {
      var button = new Button({
        label: buttons[i].label,
        icon: buttons[i].icon,
      });
      button.dom.classList.add('code-button');
      button.addEventListener(
          'click', this.handleInsertClicked.bind(this), false);
      toolbar.addButton(button);
    }
  }
};


/**
 * Handles inserting a new code element.
 */
CodeEditingExtension.prototype.handleInsertClicked = function() {
  var newCodeEditor = new this.ComponentClass(Utils.extend(this.editorParams, {
    editor: this.editor,
    section: this.editor.selection.getSectionAtStart(),
  }));
  var index = this.editor.selection.getComponentAtStart().getIndexInSection();
  this.editor.article.transaction(newCodeEditor.getInsertOps(index));
};


/**
 * Make sure to give the editor component the power to handle keydown.
 * @return {boolean}
 */
CodeEditingExtension.prototype.onKeydown = function(unusedEvent) {
  var selection = this.editor.article.selection;
  var currentComponent = selection.getComponentAtEnd();
  if (currentComponent instanceof this.ComponentClass) {
    return true;
  }
};


/**
 * Handles regex match by instantiating a component.
 * @param {../../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 * @param  {string} provider Embed provider name.
 */
CodeEditingExtension.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var language = matchedComponent.text.substring(3);
  var embeddedComponent = new this.ComponentClass({
    provider: language,
  });
  embeddedComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, embeddedComponent.getInsertOps(atIndex));

  opsCallback(ops);
};
