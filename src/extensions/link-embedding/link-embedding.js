'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var EmbeddedLink = require('./embedded-link-component');
var I18n = require('../../i18n');
var Utils = require('../../utils');
var Selection = require('../../selection');
var viewport = require('../../utils/viewport');


/**
 * @typedef {{
 *   parsingService: ./carbon-parser/carbon-parser.CarbonParser,
 * }} */
var LinkEmbeddingParamsDef;


/**
 * LinkEmbedding main.
 * @param {LinkEmbeddingParamsDef=} opt_params Optional params.
 * Default:
 *   {
 *     parsingService: null,
 *   }
 * @extends {../../core/abstract-extension}
 * @constructor
 */
var LinkEmbedding = function(editor, opt_params) {
  var params = Utils.extend({
    parsingService: null,
  }, opt_params);

  /** @type {./abstract-link-parser-service.AbstractLinkParserService} */
  this.parsingService_ = params.parsingService;

  this.registerRegexes_(editor);
};
LinkEmbedding.prototype = Object.create(AbstractExtension.prototype);
module.exports = LinkEmbedding;


/**
 * String name for the component class.
 * @type {string}
 */
LinkEmbedding.CLASS_NAME = 'LinkEmbedding';


/**
 * Regex string matching a URL.
 * @type {string}
 */
LinkEmbedding.LINK_REGEX = (
    '^https?:\/\/(www\\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}' +
    '\\.[a-z]{2,6}([-a-zA-Z0-9@:%_\+.~#?&//=]*)$');


/**
 * Handles onInstall when the LinkEmbedding module installed in an editor.
 * @param  {../../editor} editor Instance of the editor that installed the module.
 * @param {LinkEmbeddingParamsDef=} opt_params Optional params.
 */
LinkEmbedding.onInstall = function(editor, opt_params) {
  if (!opt_params || !opt_params.parsingService) {
    throw new Error(
        'parsingService parameter is required for LinkEmbedding extension');
  }
};


/**
 * Registers regular experessions to create embedded link from if matched.
 * @param  {../../editor} editor The editor to register regexes with.
 * @private
 */
LinkEmbedding.prototype.registerRegexes_ = function(editor) {
  editor.registerRegex(
      I18n.get('regex.linkEmbedding') || LinkEmbedding.LINK_REGEX,
      this.handleMatchedRegex.bind(this));
};


/**
 * Creates a figure component from a link.
 * @param {../../paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<../../defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
LinkEmbedding.prototype.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var url = matchedComponent.text;
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];

  var embeddedLink = new EmbeddedLink({
    url: url,
    title: I18n.get('label.embeddedLink.titlePending'),
    description: I18n.get('label.embeddedLink.descriptionPending'),
  });
  embeddedLink.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, embeddedLink.getInsertOps(atIndex));

  opsCallback(ops);

  embeddedLink = Utils.getReference(embeddedLink.name);
  this.parsingService_.parse(url, function(data) {

    this.updateEmbeddedLinkOps(embeddedLink, ops, {
      title: data['title'],
      description: data['description'],
      image: data['image'],
    });

  }.bind(this), function(error) {
    console.log(error);
  });

};


LinkEmbedding.prototype.updateEmbeddedLinkOps = function(
    embeddedLink, insertedOps, attrs) {
  // TODO(mkhatib): This is a hack to update previous history operation.
  // Think of a better way to do this.
  for (var i = 0; i < insertedOps.length; i++) {
    var newAttrs = Utils.extend(insertedOps[i].do.attrs || {}, attrs);
    insertedOps[i].do.attrs = newAttrs;
  }
  // Update the figure object attributes to reflect the changes.
  embeddedLink.updateAttributes(attrs);

  // If the figure finished uploading and it's still selected and in viewport,
  // reselect to show the toolbar.
  viewport.ifElementInViewport(embeddedLink.dom, function() {
    var selection = Selection.getInstance();
    var selectedComponent = selection.getComponentAtStart();
    if (selectedComponent === embeddedLink) {
      embeddedLink.select();
    }
  });
};
