'use strict';

var Utils = require('./utils');
var Section = require('./section');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');


/**
 * @typedef {{
 *  tagName: (string|undefined),
 *  type: (string|undefined),
 *  components: (Array<!./component>|undefined),
 * }}
 */
var LayoutParamsDef;


/**
 * Layout main.
 * @param {LayoutParamsDef=} opt_params Optional params to initialize the Layout object.
 * Default:
 *   {
 *     components: [Paragraph],
 *     tagName: 'div',
 *     type: 'layout-single-column'
 *   }
 * @extends {./section}
 * @constructor
 */
var Layout = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {LayoutParamsDef} */ (Utils.extend({
    tagName: Layout.LAYOUT_TAG_NAME,
    type: Layout.Types.SingleColumn,
    components: [new Paragrarph({
      paragraphType: Paragrarph.Types.Paragraph,
    })],
  }, opt_params));

  Section.call(this, params);

  /** @type {string} */
  this.type = params.type || '';

  this.dom.classList.add('carbon-layout');
  this.dom.classList.add(this.type);
};
Layout.prototype = Object.create(Section.prototype);
module.exports = Layout;


/**
 * String name for the component class.
 * @type {string}
 * @const
 */
Layout.CLASS_NAME = 'Layout';
Loader.register(Layout.CLASS_NAME, Layout);


/**
 * Unordered Layout component container element tag name.
 * @type {string}
 * @const
 */
Layout.LAYOUT_TAG_NAME = 'div';


/**
 * Layout types.
 * @enum {string}
 */
Layout.Types = {
  SingleColumn: 'layout-single-column',
  Bleed: 'layout-bleed',
  Staged: 'layout-staged',
  FloatLeft: 'layout-float-left',
  FloatRight: 'layout-float-right',
  ResponsiveGrid: 'layout-responsive-grid',
};


/**
 * Create and initiate a list object from JSON.
 * @param {./defs.LayoutJsonDef} json JSON representation of the list.
 * @return {Layout} Layout object representing the JSON data.
 */
Layout.fromJSON = function(json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(Utils.extend({
      article: json.article,
    }, json.components[i]));
    components.push(component);
  }

  return new Layout({
    tagName: json.tagName,
    article: json.article,
    name: json.name,
    type: json.type,
    components: components,
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
 * Returns first component in the section.
 * @return {./component} Returns first component.
 * @override
 */
Layout.prototype.getFirstComponent = function() {
  return this.components[0];
};


/**
 * Returns last component in the section.
 * @return {./component} Returns last component.
 * @override
 */
Layout.prototype.getLastComponent = function() {
  return this.components[this.components.length - 1];
};



/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array<./defs.OperationDef>} Layout of operations needed to be executed.
 */
Layout.prototype.getDeleteOps = function(optIndexOffset) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
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
        type: this.type,
      },
    },
  }];

  if (this.section.getLength() < 2) {
    var newLayout = new Layout({
      name: this.name,
      components: [],
    });
    newLayout.section = this.section;
    Utils.arrays.extend(ops, newLayout.getInsertOps(0));
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a list.
 * @param {number} index Index to insert the list at.
 * @return {Array<./defs.OperationDef>} Operations for inserting the list.
 */
Layout.prototype.getInsertOps = function(index) {
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
        type: this.type,
      },
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
    },
  }];
};


/**
 * Returns the operations to execute splitting a list.
 * @param {number} atIndex Index to split the list at.
 * @return {Array<./defs.OperationDef>} Operations for splitting the list.
 */
Layout.prototype.getSplitOps = function(atIndex) {
  var ops = [];
  var i = atIndex;
  var indexOffset = 0;
  for (i = atIndex; i < this.components.length; i++) {
    Utils.arrays.extend(ops, this.components[i].getDeleteOps(indexOffset--));
  }

  var newLayout = new Layout({
    tagName: this.tagName,
    section: this.section,
    components: [],
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
        type: attrs.type,
      },
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      attrs: {
        type: this.type,
      },
    },
  }];
};


/**
 * Returns true if the layout type allows more item to be inserted
 * in it.
 * @return {boolean}
 */
Layout.prototype.allowMoreItems = function() {
  return this.type === Layout.Types.ResponsiveGrid;
};


/**
 * Re-calculate ratios and sizes per child of this layout.
 * @export
 */
Layout.prototype.onChildSizeUpdated = function() {
  if (this.type === Layout.Types.ResponsiveGrid) {
    this.updateChildrenSizes_();
  }
};


/**
 * @private
 */
Layout.prototype.updateChildrenSizes_ = function() {
  if (this.components.length == 1) {
    this.components[0].updateAttributes({
      sizes: '100vw',
    });
    return;
  }
  for (var i = 0; i < this.components.length; i++) {
    var width = parseInt(this.components[i].getWidth(), 10);
    var viewportWidth = parseInt(window.innerWidth, 10);
    if (width) {
      var ratio = (width / viewportWidth) * 100;
      var sizes = ratio + 'vw';
      this.components[i].updateAttributes({
        sizes: sizes,
      });
    }
  }
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
  this.updateChildrenSizes_();
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
Layout.prototype.getLength = function() {
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
    components: [],
  };

  for (var i = 0; i < this.components.length; i++) {
    layout.components.push(this.components[i].getJSONModel());
  }

  return layout;
};
