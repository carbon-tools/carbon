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
    // Generate a UID as a reference for this Component.
    name: Utils.getUID()
  }, optParams);

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
  this.section = null;

};
module.exports = Component;


/**
 * String name for the component class.
 * @type {string}
 */
Component.CLASS_NAME = 'Component';


Component.onInstall = function (editor) {
  // jshint unused: false
  // pass.
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
  if (this.section) {
    var i = this.section.components.indexOf(this);
    return this.section.components[i + 1];
  }
};


/**
 * Get the previous Component if any.
 * @return {Component} Previous sibling Component.
 */
Component.prototype.getPreviousComponent = function() {
  if (this.section) {
    var i = this.section.components.indexOf(this);
    return this.section.components[i - 1];
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
  return this.section.components.indexOf(this);
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
