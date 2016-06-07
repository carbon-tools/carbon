'use strict';

var Utils = require('./utils');
var Errors = require('./errors');
var Loader = require('./loader');
var Selection = require('./selection');

/**
 * Component main.
 * @param {Object} optParams Optional params to initialize the Component object.
 * Default:
 *   {
 *     name: Utils.getUID()
 *   }
 */
var Component = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The editor this component belongs to.
    editor: null,
    // The section this component is added to.
    section: null,
    // Generate a UID as a reference for this Component.
    name: Utils.getUID(),
    // Indicates if this component is an inline component.
    inline: false,
    // Points to the parent component if this component is encompased within it.
    parentComponent: null
  }, optParams);

  /**
   * Editor this component is added it.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * This indicates if this component is inline and shouldn't allow multiple
   * components.
   * @type {boolean}
   */
  this.inline = params.inline;

  /**
   * If the component is contained within another this will point to the parent.
   * @type {Component}
   */
  this.parentComponent = params.parentComponent;

  /**
   * Name to reference this Component.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Section this Component belongs to.
   * @type {Section}
   */
  this.section = params.section;

  /**
   * Component DOM.
   * @type {HTMLElement}
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
   * @type {HTMLElement}
   */
  this.selectionDom = null;

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
 * @param  {Editor} editor Editor instance which installed the module.
 */
Component.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Get the next Component if any.
 * @return {Component} Next sibling Component.
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
      if (component && component.components) {
        return component.getFirstComponent();
      }
    }
    return component;
  }
};


/**
 * Get the previous Component if any.
 * @return {Component} Previous sibling Component.
 */
Component.prototype.getPreviousComponent = function() {
  if (this.section) {
    var i = this.section.components.indexOf(this);
    var component = this.section.components[i - 1];
    if (!component) {
      component = this.section.getPreviousComponent();
      if (component && component.components) {
        return component.getLastComponent();
      }
    }
    return component;
  }
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
  return null;
};


/**
 * Renders a component in an element.
 * @param  {HTMLElement} element Element to render component in.
 * @param  {Object} options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 */
Component.prototype.render = function(element, options) {
  this.editMode = !!(options && options.editMode);
  if (!this.isRendered && this.dom) {
    this.dom.setAttribute('carbon', '1');
    Utils.setReference(this.name, this);
    this.isRendered = true;
    if (options && options.insertBefore) {
      element.insertBefore(this.dom, options.insertBefore);
    } else {
      element.appendChild(this.dom);
    }
  }
};


/**
 * Returns the operations to execute a deletion of the component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 */
Component.prototype.getDeleteOps = function(optIndexOffset) {
  // jshint unused:false
  throw Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting a component.
 * @param {number} index Index to insert the component at.
 * on undoing operation for re-inserting.
 */
Component.prototype.getInsertOps = function (index) {
  // jshint unused:false
  throw Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting characters in a component.
 * @param {string} chars The characters to insert in a component.
 * @param  {number=} index Index to insert the characters at.
 */
Component.prototype.getInsertCharsOps = function(chars, index) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component Must Implement getInsertCharsOps');
};


/**
 * Returns the operations to execute removing characters in a component.
 * @param {string} chars The characters to remove in a component.
 * @param {number} index Index to remove the characters starting at.
 * @param {number=} optDirection The directions to remove chars at.
 */
Component.prototype.getRemoveCharsOps = function(chars, index, optDirection) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component Must Implement getRemoveCharsOps');
};


/**
 * Returns the operations to execute updating a component attributes.
 * @param  {Object} attrs Attributes to update for the component.
 * @param  {number=} optCursorOffset Optional cursor offset.
 * @param  {number=} optSelectRange Optional selecting range.
 */
Component.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component does not Implement getUpdateOps');
};


/**
 * Selects the component.
 * @param  {number} offset Selection offset.
 */
Component.prototype.select = function(offset) {
  if (this.selectionDom) {
    this.selectionDom.focus();
  }
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: offset
  });
};


/**
 * Returns the length of the component content.
 * @return {number} Length of the component content.
 */
Component.prototype.getLength = function () {
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
Component.prototype.getDomLength = function () {
  return this.getLength();
};


/**
 * Whether the component should re-render itself or not.
 * @return {boolean}
 */
Component.prototype.shouldRerender = function () {
  return false;
};


/**
 * Ask the component to rerender itself.
 */
Component.prototype.rerender = function () {
  // pass.
};
