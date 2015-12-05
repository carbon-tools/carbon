'use strict';

var Utils = require('../utils');
var Errors = require('../errors');
var Loader = require('../loader');


/**
 * EmbeddingExtension allows embedding different kind of components using
 * different providers.
 * @param {Object} optParams Config params.
 * @constructor
 */
var EmbeddingExtension = function (optParams) {
  var params = Utils.extend({
    editor: null,
    embedProviders: null,
    ComponentClass: null
  }, optParams);

  /**
   * A reference to the editor this extension is enabled in.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * Maps the different providers with their instances.
   * @type {Object}
   */
  this.embedProviders = params.embedProviders;

  /**
   * The component class to use for embedding.
   * @type {Component}
   */
  this.ComponentClass = params.ComponentClass;
};
module.exports = EmbeddingExtension;


/**
 * Extension class name.
 * @type {string}
 */
EmbeddingExtension.CLASS_NAME = 'EmbeddingExtension';


/**
 * Instantiate an instance of the extension and configure it.
 * @param  {Editor} editor Instance of the editor installing this extension.
 * @param  {Object} config Configuration for the extension.
 * @static
 */
EmbeddingExtension.onInstall = function (editor, config) {
  if (!config.embedProviders || ! config.ComponentClass) {
    throw Errors.ConfigrationError(
        'EmbeddingExtension needs "embedProviders" and "ComponentClass"');
  }

  var extension = new EmbeddingExtension({
    embedProviders: config.embedProviders,
    ComponentClass: config.ComponentClass,
    editor: editor
  });
  // Register the embedProviders with the loader to allow components to
  // access them.
  Loader.register('embedProviders', config.embedProviders);
  extension.init();
};


/**
 * Registers the different regexes for each provider.
 */
EmbeddingExtension.prototype.init = function() {
  var self = this;

  /**
   * Callback wrapper to allow passing provider for the callback.
   * @param  {string} provider Provider name.
   * @return {Function} Regex match handler.
   */
  var handleRegexMatchProvider = function(provider) {
    return function(matchedComponent, opsCallback) {
      self.handleRegexMatch(matchedComponent, opsCallback, provider);
    };
  };

  // Register regexes in each provider.
  for (var provider in this.embedProviders) {
    var regexStr = this.embedProviders[provider].getUrlsRegex();
    this.editor.registerRegex(regexStr, handleRegexMatchProvider(provider));
  }
};


/**
 * Handles regex match by instantiating a component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 * @param  {string} provider Embed provider name.
 */
EmbeddingExtension.prototype.handleRegexMatch = function(
    matchedComponent, opsCallback, provider) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var embeddedComponent = new this.ComponentClass({
    url: matchedComponent.text,
    provider: provider
  });
  embeddedComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, embeddedComponent.getInsertOps(atIndex));

  opsCallback(ops);
};
