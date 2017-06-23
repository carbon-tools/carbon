'use strict';

var Utils = require('./utils');
var Errors = require('./errors');
var Loader = require('./loader');
var Selection = require('./selection');


/**
 * Component main.
 * @param {Object=} opt_params Optional params to initialize the Component object.
 * Default:
 *   {
 *     name: Utils.getUID()
 *   }
 * @constructor
 * @abstract
 */
var Component = function(opt_params) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The editor this component belongs to.
    editor: null,
    // The article this component belongs to.
    article: null,
    // The section this component is added to.
    section: null,
    // Generate a UID as a reference for this Component.
    name: Utils.getUID(),
    // Indicates if this component is an inline component.
    inline: false,
    // Points to the parent component if this component is encompased within it.
    parentComponent: null,
    // Whether this component is still an attachment and hasn't been upgraded.
    isAttachment: false,
    width: null,
    height: null,
  }, opt_params);

  /**
   * Editor this component is added it.
   * @type {./editor}
   */
  this.editor = params.editor;

  /**
   * Editor this component is added it.
   * @type {./article}
   */
  this.article = params.article;

  /**
   * This indicates if this component is part of an attachment that is being
   * uploaded/embedded.
   * @type {boolean}
   */
  this.isAttachment = params.isAttachment;

  /**
   * This indicates if this component is inline and shouldn't allow multiple
   * components.
   * @type {boolean}
   */
  this.inline = params.inline;

  /**
   * If the component is contained within another this will point to the parent.
   * @type {./component}
   */
  this.parentComponent = params.parentComponent;

  /**
   * Name to reference this Component.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Section this Component belongs to.
   * @type {./section}
   */
  this.section = params.section;

  /**
   * Component DOM.
   * @type {?Element}
   */
  this.dom = null;

  /**
   * Whether the component is already rendered.
   * @type {boolean}
   */
  this.isRendered = false;

  /**
   * Whether the article is rendered in edit mode or not.
   * @type {boolean}
   */
  this.editMode = false;


  /**
   * Used to focus non-focusable elements (e.g. figure);
   * @type {?Element}
   */
  this.selectionDom = null;

  /**
   * Component width.
   * @type {?number}
   */
  this.width = params.width;

  /**
   * Component height.
   * @type {?number}
   */
  this.height = params.height;

  /**
   * Whether the item is responsive;
   * @type {boolean}
   */
  this.responsive = false;

  /**
   * Selection instance.
   * @type {./selection}
   */
  this.selection = Selection.getInstance();
};
module.exports = Component;


/**
 * String name for the component class.
 * @type {string}
 */
Component.CLASS_NAME = 'Component';
Loader.register(Component.CLASS_NAME, Component);


/**
 * Called when the module is installed on in an editor.
 * @param  {./editor} unusedEditor Editor instance which installed the module.
 */
Component.onInstall = function(unusedEditor) {
};


/**
 * Called when the module is uninstalled from the an editor.
 */
Component.onDestroy = function() {
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
Component.prototype.getComponentClassName = function() {
  return Component.CLASS_NAME;
};


/**
 * Get the next Component if any.
 * @return {?Component} Next sibling Component.
 */
Component.prototype.getNextComponent = function() {
  // If this is an inline component and it is included in another one.
  // Next component is the parent's next component.
  if (this.parentComponent && this.inline) {
    return this.parentComponent.getNextComponent();
  }

  if (this.section) {
    var i = this.section.components.indexOf(this);
    var component = this.section.components[i + 1];
    if (!component) {
      // If the component is the last component in its section, then return
      // the new component after this section.
      component = this.section.getNextComponent();
    }
    if (component && component.components) {
      return /** @type {./section} */ (component).getFirstComponent();
    }
    return component;
  }

  return null;
};


/**
 * Get the previous Component if any.
 * @return {?Component} Previous sibling Component.
 */
Component.prototype.getPreviousComponent = function() {
  if (this.section) {
    var i = this.section.components.indexOf(this);
    var component = this.section.components[i - 1];
    if (!component) {
      component = this.section.getPreviousComponent();
    }

    if (component && component.components) {
      return /** @type {./section} */ (component).getLastComponent();
    }

    return component;
  }
  return null;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Component.
 */
Component.prototype.getJSONModel = function() {
  var component = {
    component: Component.CLASS_NAME,
    name: this.name,
  };

  if (this.formats) {
    component.formats = this.formats;
  }

  return component;
};


/**
 * Returns the index of the component in the section.
 * @return {number} Index of the component in the section.
 */
Component.prototype.getIndexInSection = function() {
  if (this.section) {
    return this.section.components.indexOf(this);
  } else if (this.parentComponent) {
    if (this.parentComponent.components) {
      return this.parentComponent.components.indexOf(this);
    } else {
      return 0;
    }
  }
  throw Error('Component is not in a section.');
};


/**
 * Renders a component in an element.
 * @param  {!Element} element Element to render component in.
 * @param  {Object=} opt_options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 */
Component.prototype.render = function(element, opt_options) {
  this.editMode = !!(opt_options && opt_options.editMode);
  if (!this.isRendered && this.dom) {
    this.dom.setAttribute('carbon', '1');
    Utils.setReference(this.name, this);
    this.isRendered = true;
    if (opt_options && opt_options.insertBefore) {
      element.insertBefore(this.dom, opt_options.insertBefore);
    } else {
      element.appendChild(this.dom);
    }
  }
};


/**
 * Returns the operations to execute a deletion of the component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 */
Component.prototype.getDeleteOps = function(opt_indexOffset) {
  throw new Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting a component.
 * @param {number} unusedIndex Index to insert the component at.
 * on undoing operation for re-inserting.
 */
Component.prototype.getInsertOps = function(unusedIndex) {
  throw new Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting characters in a component.
 * @param {string} unusedChars The characters to insert in a paragraph.
 * @param {number} unusedIndex Index to insert the characters at.
 * @return {Array<./defs.OperationDef>} Operations for inserting characters in paragraph.
 */
Component.prototype.getInsertCharsOps = function(unusedChars, unusedIndex) {
  throw new Errors.NotImplementedError(
      'Component Must Implement getInsertCharsOps');
};


/**
 * Returns the operations to execute removing characters in a component.
 * @param {string} unusedChars The characters to remove in a component.
 * @param {number} unusedIndex Index to remove the characters starting at.
 * @param {number=} opt_direction The directions to remove chars at.
 */
Component.prototype.getRemoveCharsOps = function(
    unusedChars, unusedIndex, opt_direction) {
  throw new Errors.NotImplementedError(
      'Component Must Implement getRemoveCharsOps');
};


/**
 * Returns the operations to execute updating a component attributes.
 * @param  {Object} unusedAttrs Attributes to update for the component.
 * @param  {number=} opt_cursorOffset Optional cursor offset.
 * @param  {number=} opt_selectRange Optional selecting range.
 */
Component.prototype.getUpdateOps = function(
    unusedAttrs, opt_cursorOffset, opt_selectRange) {
  throw new Errors.NotImplementedError(
      'Component does not Implement getUpdateOps');
};


/**
 * Focus the component.
 */
Component.prototype.focus = function() {
  if (this.selectionDom) {
    this.selectionDom.focus();
  }
};


/**
 * Selects the component.
 * @param  {number=} opt_offset Selection offset.
 */
Component.prototype.select = function(opt_offset) {
  this.focus();
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: opt_offset || 0,
  });
};


/**
 * Returns the length of the component content.
 * @return {number} Length of the component content.
 */
Component.prototype.getLength = function() {
  return 1;
};


/**
 * Returns the length of the component content in the DOM instead in the model.
 * This is useful in cases where the model hasn't been updated yet to reflect
 * pending changes that has already been made to the DOM. For example, applying
 * input changes after a user keep their finger on a keyboard to insert/delete
 * multiple characters.
 *
 * @return {number} Length of the component content in the DOM.
 */
Component.prototype.getDomLength = function() {
  return this.getLength();
};


/**
 * Whether the component should re-render itself or not.
 * @return {boolean}
 */
Component.prototype.shouldRerender = function() {
  return false;
};


/**
 * Ask the component to rerender itself.
 */
Component.prototype.rerender = function() {
  // pass.
};


/**
 * Ask component to update some attributes.
 * @param {Object=} unusedAttrs
 */
Component.prototype.updateAttributes = function(unusedAttrs) {
  // pass.
};


/**
 * Returns the height of the component.
 * @return {?number}
 * @export
 */
Component.prototype.getHeight = function() {
  return this.height;
};


/**
 * Returns the width of the component.
 * @return {?number}
 * @export
 */
Component.prototype.getWidth = function() {
  return this.width;
};


/**
 * Whether the component can be laid out in different
 * layouts.
 * @return {boolean}
 */
Component.prototype.canBeLaidOut = function() {
  return false;
};


/**
 * Whether the component has its own state of selection.
 * @return {boolean}
 */
Component.prototype.hasOwnSelection = function() {
  return false;
};
