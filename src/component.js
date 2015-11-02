'use strict';

var Utils = require('./utils');
var Errors = require('./errors');


/**
 * Component main.
 * @param {Object} optParams Optional params to initialize the Component object.
 * Default:
 *   {
 *     ComponentType: Component.Types.Component,
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
  Utils.setReference(this.name, this);

  /**
   * Section this Component belongs to.
   * @type {Section}
   */
  this.section = params.section;

  /**
   * If component is nested within another component.
   * @type {Component}
   */
  this.parentComponent = null;

};
module.exports = Component;


/**
 * String name for the component class.
 * @type {string}
 */
Component.CLASS_NAME = 'Component';


/**
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Component.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Registers regular experessions to handle if matched in the editor.
 * @param  {ComponentFactory} componentFactory The component factory to register
 * the regex with.
 */
Component.registerRegexes = function(componentFactory) {
  // jshint unused: false
  throw Errors.NotImplementedError(
      this.constructor.name + '.registerRegexes is not implmeneted.');
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
      return this.section.getNextComponent();
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
      return this.section.getPreviousComponent();
    }
    return component;
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Component.
 */
Component.prototype.getJSONModel = function() {
  var Component = {
    name: this.name,
    text: this.text,
    ComponentType: this.ComponentType
  };

  if (this.formats) {
    Component.formats = this.formats;
  }

  return Component;
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
 * Returns the length of the component content.
 * @return {number} Length of the component content.
 */
Component.prototype.getLength = function () {
  return 0;
};
