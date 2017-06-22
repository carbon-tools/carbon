'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Utils = require('../../utils');
var Errors = require('../../errors');
var Loader = require('../../loader');
var Button = require('../../toolbars/button');
var Paragraph = require('../../paragraph');
var I18n = require('../../i18n');

/**
 * EmbeddingExtension allows embedding different kind of components using
 * different providers.
 * @param {../../editor} editor Editor instance installing this extension.
 * @param {Object=} opt_params Config params.
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var EmbeddingExtension = function(editor, opt_params) {
  var params = Utils.extend({
    embedProviders: null,
    ComponentClass: null,
    toolbarNames: [],
  }, opt_params);

  /**
   * A reference to the editor this extension is enabled in.
   * @type {../../editor}
   */
  this.editor = editor;

  /**
   * Maps the different providers with their instances.
   * @type {Object}
   */
  this.embedProviders = params.embedProviders;

  /**
   * The component class to use for embedding.
   * @type {function(new:./embeddedComponent, Object=)}
   */
  this.ComponentClass = params.ComponentClass;

  /**
   * Toolbar name to insert a button for file picker on.
   * @type {Array<string>}
   */
  this.toolbarNames = (
      params.toolbarNames || [EmbeddingExtension.TOOLBELT_TOOLBAR_NAME]);

  this.init();
};
EmbeddingExtension.prototype = Object.create(AbstractExtension.prototype);
module.exports = EmbeddingExtension;


/**
 * Extension class name.
 * @type {string}
 */
EmbeddingExtension.CLASS_NAME = 'EmbeddingExtension';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
EmbeddingExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Instantiate an instance of the extension and configure it.
 * @param  {../../editor} unusedEditor Instance of the editor installing this extension.
 * @param  {Object} config Configuration for the extension.
 * @static
 */
EmbeddingExtension.onInstall = function(unusedEditor, config) {
  if (!config.embedProviders || !config.ComponentClass) {
    throw new Errors.ConfigrationError(
        'EmbeddingExtension needs "embedProviders" and "ComponentClass"');
  }

  // Register the embedProviders with the loader to allow components to
  // access them. Force this?
  Loader.register('embedProviders', config.embedProviders, true);
};


/**
 * Installs provider and register its regular expression and callback.
 * @param {string} name Provider's name.
 * @param {Object} provider Instace of the initiated provider.
 */
EmbeddingExtension.prototype.installProvider = function(name, provider) {
  var self = this;

  /**
   * Callback wrapper to allow passing provider for the callback.
   * @param  {string} provider Provider name.
   * @return {../../defs.ComponentFactoryMethodDef} Regex match handler.
   */
  var handleRegexMatchProvider = function(name) {
    return function(matchedComponent, opsCallback) {
      self.handleRegexMatch(matchedComponent, opsCallback, name);
    };
  };

  provider.getUrlsRegex(function(regexStr) {
    self.editor.registerRegex(
        regexStr, handleRegexMatchProvider(name), true);
  });
};


/**
 * Registers the different regexes for each provider.
 */
EmbeddingExtension.prototype.init = function() {
  for (var provider in this.embedProviders) {
    this.installProvider(provider, this.embedProviders[provider]);
  }

  for (var j = 0; j < this.toolbarNames.length; j++) {
    var toolbar = this.editor.getToolbar(this.toolbarNames[j]);
    if (!toolbar) {
      console.warn('Could not find toolbar "' + this.toolbarNames[j] + '".' +
          'Make sure the extension that provides that toolbar is installed.');
      continue;
    }

    // Add embedding buttons to the toolbelt.
    var toolbeltButtons = [{
      label: I18n.get('button.video'),
      icon: I18n.get('button.icon.video'),
      placeholder: I18n.get('placeholder.video'),
    }, {
      label: I18n.get('button.photo'),
      icon: I18n.get('button.icon.photo'),
      placeholder: I18n.get('placeholder.photo'),
    }, {
      label: I18n.get('button.post'),
      icon: I18n.get('button.icon.post'),
      placeholder: I18n.get('placeholder.post'),
    }, {
      label: I18n.get('button.gif'),
      icon: I18n.get('button.icon.gif'),
      placeholder: I18n.get('placeholder.gif'),
    }, {
      label: I18n.get('button.quiz'),
      icon: I18n.get('button.icon.quiz'),
      placeholder: I18n.get('placeholder.quiz'),
    }];

    for (var i = 0; i < toolbeltButtons.length; i++) {
      var insertVideoButton = new Button({
        label: toolbeltButtons[i].label,
        icon: toolbeltButtons[i].icon,
        data: {
          placeholder: toolbeltButtons[i].placeholder,
        },
      });
      insertVideoButton.addEventListener(
          'click', this.handleInsertClicked.bind(this), false);
      toolbar.addButton(insertVideoButton);
    }
  }
};


EmbeddingExtension.prototype.handleInsertClicked = function(event) {
  var button = event.detail.target;
  var placeholder = button.data.placeholder;
  var newP = new Paragraph({
    placeholderText: placeholder,
    section: this.editor.selection.getSectionAtStart(),
  });

  var index = this.editor.selection.getComponentAtStart().getIndexInSection();
  this.editor.article.transaction(newP.getInsertOps(index));
};



/**
 * Handles regex match by instantiating a component.
 * @param {../../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 * @param  {string} provider Embed provider name.
 */
EmbeddingExtension.prototype.handleRegexMatch = function(
    matchedComponent, opsCallback, provider) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var embeddedComponent = new this.ComponentClass({
    url: matchedComponent.text,
    provider: provider,
  });
  embeddedComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, embeddedComponent.getInsertOps(atIndex));

  opsCallback(ops);
};
