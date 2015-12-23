'use strict';

var Utils = require('./utils');
var Section = require('./section');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');

/**
 * Layout main.
 * @param {Object} optParams Optional params to initialize the Layout object.
 * Default:
 *   {
 *     components: [Paragraph],
 *     tagName: 'div',
 *     type: 'layout-single-column'
 *   }
 */
var Layout = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    tagName: Layout.LAYOUT_TAG_NAME,
    type: Layout.Types.SingleColumn,
    components: [new Paragrarph({
      paragraphType: Paragrarph.Types.Paragraph
    })]
  }, optParams);

  Section.call(this, params);

  this.type = params.type;

  this.dom.classList.add(this.type);
};
Layout.prototype = Object.create(Section.prototype);
module.exports = Layout;


/**
 * String name for the component class.
 * @type {string}
 */
Layout.CLASS_NAME = 'Layout';
Loader.register(Layout.CLASS_NAME, Layout);


/**
 * Unordered Layout component container element tag name.
 * @type {string}
 */
Layout.LAYOUT_TAG_NAME = 'div';


/**
 * Layout types.
 * @type {Object}
 */
Layout.Types = {
  SingleColumn: 'layout-single-column',
  Bleed: 'layout-bleed',
  Staged: 'layout-staged',
  FloatLeft: 'layout-float-left',
  FloatRight: 'layout-float-right'
};


/**
 * Create and initiate a list object from JSON.
 * @param  {Object} json JSON representation of the list.
 * @return {Layout} Layout object representing the JSON data.
 */
Layout.fromJSON = function (json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new Layout({
    tagName: json.tagName,
    name: json.name,
    type: json.type,
    components: components
  });
};


/**
 * Handles onInstall when Layout module is installed in an editor.
 */
Layout.onInstall = function() {
  // pass.
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
Layout.prototype.getComponentClassName = function() {
  return Layout.CLASS_NAME;
};


/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} Layout of operations needed to be executed.
 */
Layout.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Layout',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        components: this.components,
        tagName: this.tagName,
        type: this.type
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a list.
 * @param {number} index Index to insert the list at.
 * @return {Array.<Object>} Operations for inserting the list.
 */
Layout.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'Layout',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        components: this.components,
        tagName: this.tagName,
        type: this.type
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the operations to execute splitting a list.
 * @param {number} atIndex Index to split the list at.
 * @return {Array.<Object>} Operations for splitting the list.
 */
Layout.prototype.getSplitOps = function (atIndex) {
  var ops = [];
  var i = atIndex;
  for (i = atIndex; i < this.components.length; i++) {
    Utils.arrays.extend(ops, this.components[i].getDeleteOps());
  }

  var newLayout = new Layout({
    tagName: this.tagName,
    section: this.section,
    components: []
  });
  Utils.arrays.extend(ops, newLayout.getInsertOps(
      this.getIndexInSection() + 1));
  for (i = atIndex; i < this.components.length; i++) {
    var className = this.components[i].getComponentClassName();
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(this.components[i].getJSONModel());
    component.section = newLayout;
    Utils.arrays.extend(ops, component.getInsertOps(i - atIndex));
  }

  return ops;
};


/**
 * @override
 */
Layout.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange) {
  return [{
    do: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      attrs: {
        type: attrs.type
      }
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      attrs: {
        type: this.type
      }
    }
  }];
};


/**
 * Updates the type of the layout and reflect the changes to
 * the dom of the layout component.
 * @param  {string} type Type of the layout.
 */
Layout.prototype.updateType = function(type) {
  this.dom.classList.remove(this.type);
  this.type = type;
  this.dom.classList.add(this.type);
};


/**
 * Updates layout attributes.
 * @param  {Object} attrs Attributes to update.
 */
Layout.prototype.updateAttributes = function(attrs) {
  if (attrs.type) {
    this.updateType(attrs.type);
    // TODO(mkhatib): Update class on the layout dom.
  }
};

/**
 * Returns the length of the list content.
 * @return {number} Length of the list content.
 */
Layout.prototype.getLength = function () {
  return this.components.length;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this list.
 */
Layout.prototype.getJSONModel = function() {
  var layout = {
    name: this.name,
    tagName: this.tagName,
    type: this.type,
    component: Layout.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    layout.components.push(this.components[i].getJSONModel());
  }

  return layout;
};
