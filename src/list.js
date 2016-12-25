'use strict';

var Utils = require('./utils');
var Section = require('./section');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');


/**
 * @typedef {{
 *   tagName: (string|undefined),
 *   components: (Array<!./component>|undefined),
 * }}
 */
var ListParamsDef;


/**
 * List main.
 * @param {Object=} opt_params Optional params to initialize the List object.
 * Default:
 *   {
 *     components: [Paragraph],
 *     tagName: 'ul'
 *   }
 * @extends {./section}
 * @constructor
 */
var List = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {ListParamsDef} */ (Utils.extend({
    tagName: List.UNORDERED_LIST_TAG,
    components: [new Paragrarph({
      paragraphType: Paragrarph.Types.ListItem,
    })],
  }, opt_params));

  Section.call(this, params);
};
List.prototype = Object.create(Section.prototype);
module.exports = List;


/**
 * String name for the component class.
 * @type {string}
 */
List.CLASS_NAME = 'List';
Loader.register(List.CLASS_NAME, List);


/**
 * Unordered List component container element tag name.
 * @type {string}
 */
List.UNORDERED_LIST_TAG = 'UL';


/**
 * Ordered List component container element tag name.
 * @type {string}
 */
List.ORDERED_LIST_TAG = 'OL';


/**
 * Regex string for matching unordered list.
 * @type {string}
 */
List.UNORDERED_LIST_REGEX = '^(?:\\*|-)\\s?(.*)';


/**
 * Regex strings for matching ordered list.
 * @type {string}
 */
List.ORDERED_LIST_REGEX = '^(?:1\\.|-|_|\\))\\s?(.*)';


/**
 * Create and initiate a list object from JSON.
 * @param  {./defs.ListJsonDef} json JSON representation of the list.
 * @return {List} List object representing the JSON data.
 */
List.fromJSON = function(json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new List({
    tagName: json.tagName,
    name: json.name,
    components: components,
  });
};


/**
 * Handles onInstall when List module is installed in an editor.
 * @param  {./editor} editor Instance of the editor that installed the module.
 */
List.onInstall = function(editor) {
  List.registerRegexes_(editor);
};


/**
 * Registers regular experessions to create image from if matched.
 * @param  {./editor} editor The editor to register the regex with.
 */
List.registerRegexes_ = function(editor) {
  editor.registerRegex(List.UNORDERED_LIST_REGEX, List.handleULMatchedRegex);
  editor.registerRegex(List.ORDERED_LIST_REGEX, List.handleOLMatchedRegex);
};


/**
 * Returns list of operations to create a list from a matched regex.
 * @param  {./component} component Matched regex component.
 * @param  {string} text Text for creating the list item.
 * @param  {string} listType UL or OL.
 * @return {Array<./defs.OperationDef>} List of operations to create a list.
 */
List.createListOpsForMatchedRegex_ = function(component, text, listType) {
  var atIndex = component.getIndexInSection();
  var ops = [];
  var list = new List({
    tagName: listType,
    section: component.section,
    components: [new Paragrarph({
      text: text,
      paragraphType: Paragrarph.Types.ListItem,
    })],
  });

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, component.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, list.getInsertOps(atIndex));

  var newLi = new Paragrarph({
    paragraphType: Paragrarph.Types.ListItem,
    section: list,
  });

  // Add the new component created from the text.
  Utils.arrays.extend(ops, newLi.getInsertOps(1));

  return ops;
};


/**
 * Creates an unordered list component from matched regex component.
 * @param {./paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<./defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
List.handleULMatchedRegex = function(matchedComponent, opsCallback) {
  var regex = new RegExp(List.UNORDERED_LIST_REGEX);
  var matches = regex.exec(matchedComponent.text);
  var text = matches[1];
  var ops = List.createListOpsForMatchedRegex_(
      matchedComponent, text, List.UNORDERED_LIST_TAG);
  opsCallback(ops);
};


/**
 * Creates an ordered list component from matched regex component.
 * @param {./paragraph} matchedComponent Component that matched registered regex.
 * @param {function(Array<./defs.OperationDef>)} opsCallback Callback to send list of operations to exectue.
 */
List.handleOLMatchedRegex = function(matchedComponent, opsCallback) {
  var regex = new RegExp(List.ORDERED_LIST_REGEX);
  var matches = regex.exec(matchedComponent.text);
  var text = matches[1];
  var ops = List.createListOpsForMatchedRegex_(
      matchedComponent, text, List.ORDERED_LIST_TAG);
  opsCallback(ops);
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
List.prototype.getComponentClassName = function() {
  return List.CLASS_NAME;
};


/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<./defs.OperationDef>} List of operations needed to be executed.
 */
List.prototype.getDeleteOps = function(opt_indexOffset, opt_cursorAfterOp) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        components: this.components,
        tagName: this.tagName,
      },
    },
  }];
};


/**
 * Returns the operations to execute inserting a list.
 * @param {number} index Index to insert the list at.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<./defs.OperationDef>} Operations for inserting the list.
 */
List.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        components: this.components,
        tagName: this.tagName,
      },
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorBeforeOp,
    },
  }];
};


/**
 * Returns the operations to execute splitting a list.
 * @param {number} atIndex Index to split the list at.
 * @return {Array<./defs.OperationDef>} Operations for splitting the list.
 */
List.prototype.getSplitOps = function(atIndex) {
  var ops = [];
  var i = atIndex;
  for (i = atIndex; i < this.components.length; i++) {
    Utils.arrays.extend(ops, this.components[i].getDeleteOps());
  }

  var newList = new List({
    tagName: this.tagName,
    section: this.section,
    components: [],
  });
  Utils.arrays.extend(ops, newList.getInsertOps(
      this.getIndexInSection() + 1));
  for (i = atIndex; i < this.components.length; i++) {
    var className = this.components[i].getComponentClassName();
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(this.components[i].getJSONModel());
    component.section = newList;
    Utils.arrays.extend(ops, component.getInsertOps(i - atIndex));
  }

  return ops;
};


/**
 * Returns the length of the list content.
 * @return {number} Length of the list content.
 */
List.prototype.getLength = function() {
  return this.components.length;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this list.
 */
List.prototype.getJSONModel = function() {
  var section = {
    name: this.name,
    tagName: this.tagName,
    component: List.CLASS_NAME,
    components: [],
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};
