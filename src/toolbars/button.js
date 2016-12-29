'use strict';

var Utils = require('../utils');
var CustomEventTarget = require('../customEventTarget');


/**
 * Button component to add to toolbars.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../customEventTarget}
 * @constructor
 */
var Button = function(opt_params) {
  var params = Utils.extend({
    label: 'New Button',
    icon: '',
    name: Utils.getUID(),
    fields: [],
    data: {},
  }, opt_params);

  CustomEventTarget.call(this);

  /**
   * Name of the button.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Extra data to attach to the button.
   * @type {Object}
   */
  this.data = params.data;

  /**
   * Fields for the button.
   * @type {Array<./textField>}
   */
  this.fields = [];

  /**
   * Button container element.
   * @type {!Element}
   */
  this.dom = document.createElement(Button.CONTAINER_TAG_NAME);
  this.dom.className = Button.CONTAINER_CLASS_NAME;

  /**
   * Button element.
   * @type {!Element}
   */
  this.buttonDom = document.createElement(Button.TAG_NAME);
  this.buttonDom.setAttribute('name', this.name);
  var icon = document.createElement('i');
  icon.className = params.icon;
  this.buttonDom.appendChild(icon);
  var span = document.createElement('span');
  Utils.setTextForElement(span, params.label);
  this.buttonDom.appendChild(span);
  this.buttonDom.addEventListener('click', this.handleClick.bind(this));
  this.dom.appendChild(this.buttonDom);

  /**
   * Fields container element.
   * @type {!Element}
   */
  this.fieldsDom = document.createElement(Button.FIELDS_CONTAINER_TAG_NAME);
  this.fieldsDom.className = Button.FIELDS_CONTAINER_CLASS_NAME;
  for (var i = 0; i < params.fields.length; i++) {
    this.addField(params.fields[i]);
  }
};
Button.prototype = Object.create(CustomEventTarget.prototype);
module.exports = Button;


/**
 * Button container element tag name.
 * @type {string}
 */
Button.CONTAINER_TAG_NAME = 'div';


/**
 * Button container element class name.
 * @type {string}
 */
Button.CONTAINER_CLASS_NAME = 'button-container';


/**
 * Button element tag name.
 * @type {string}
 */
Button.TAG_NAME = 'button';


/**
 * Button fields container tag name.
 * @type {string}
 */
Button.FIELDS_CONTAINER_TAG_NAME = 'div';


/**
 * Button fields container class name.
 * @type {string}
 */
Button.FIELDS_CONTAINER_CLASS_NAME = 'extra-fields';


/**
 * Active button class name.
 * @type {string}
 */
Button.ACTIVE_CLASS_NAME = 'active';


/**
 * Hidden class name.
 * @type {string}
 */
Button.HIDDEN_CLASS_NAME = 'hidden';


/**
 * Handles a click on the button.
 */
Button.prototype.handleClick = function() {
  var newEvent = new CustomEvent('click', {
    detail: {target: this},
  });
  this.dispatchEvent(newEvent);
};


/**
 * Adds a field to the button.
 * @param {./textField} field A field to add to the button.
 */
Button.prototype.addField = function(field) {
  field.parentButton = this;
  this.fields.push(field);
  this.fieldsDom.appendChild(field.dom);
};


/**
 * Sets the button as active.
 * @param {boolean} isActive Whether the button is active or not.
 */
Button.prototype.setActive = function(isActive) {
  this.isActive = isActive;
  if (this.isActive) {
    this.dom.classList.add(Button.ACTIVE_CLASS_NAME);
    this.fieldsDom.classList.add(Button.ACTIVE_CLASS_NAME);
    if (this.hasExtraFields()) {
      this.fields[0].dom.focus();
    }
  } else {
    this.dom.classList.remove(Button.ACTIVE_CLASS_NAME);
    this.fieldsDom.classList.remove(Button.ACTIVE_CLASS_NAME);
  }
};


/**
 * Sets the button as visible or not.
 * @param {boolean} isVisible Whether the button should be visible or not.
 */
Button.prototype.setVisible = function(isVisible) {
  this.isVisible = isVisible;
  if (this.isVisible) {
    this.dom.classList.remove(Button.HIDDEN_CLASS_NAME);
  } else {
    this.dom.classList.add(Button.HIDDEN_CLASS_NAME);
  }
};


/**
 * Returns true if the button has extra fields.
 * @return {boolean} True if the button has extra fields.
 */
Button.prototype.hasExtraFields = function() {
  return !!(this.fields && this.fields.length);
};


/**
 * Returns a field with the specified name.
 * @param {string} name Field name.
 * @return {./textField|null} Returns a field with the name.
 */
Button.prototype.getFieldByName = function(name) {
  for (var i = 0; i < this.fields.length; i++) {
    if (this.fields[i].name === name) {
      return this.fields[i];
    }
  }
  return null;
};


/**
 * Resets the value of all fields for the button.
 */
Button.prototype.resetFields = function() {
  for (var i = 0; i < this.fields.length; i++) {
    this.fields[i].setValue('');
  }
};
