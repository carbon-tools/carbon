'use strict';

var Utils = require('../utils');
var CustomEventTarget = require('../customEventTarget');


/**
 * TextField component to add to toolbars.
 * @param {Object=} opt_params Optional params.
 * @extends {../customEventTarget}
 * @constructor
 */
var TextField = function(opt_params) {
  var params = Utils.extend({
    placeholder: 'New field',
    name: Utils.getUID(),
    required: true,
    data: {},
    value: '',
  }, opt_params);

  CustomEventTarget.call(this);

  /**
   * Field name.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Extra data on the field.
   * @type {Object}
   */
  this.data = params.data;

  /**
   * Field placeholder.
   * @type {string}
   */
  this.placeholder = params.placeholder;

  /**
   * Whether the field is required.
   * @type {boolean}
   */
  this.required = params.required;

  /**
   * The parent button of the field.
   * @type {?./button}
   */
  this.parentButton = null;

  /**
   * Value entered in the field.
   * @type {string}
   */
  this.value = params.value;

  /**
   * Input field element.
   * @type {!Element}
   */
  this.dom = document.createElement(TextField.TAG_NAME);
  this.dom.setAttribute('placeholder', this.placeholder);
  this.dom.setAttribute('name', this.name);
  this.dom.setAttribute('required', this.required);
  this.dom.addEventListener('keyup', this.handleKeyUp.bind(this));
};
TextField.prototype = Object.create(CustomEventTarget.prototype);
module.exports = TextField;


/**
 * Input field element tag name.
 * @type {string}
 */
TextField.TAG_NAME = 'input';


/**
 * Handles key up event and update the value of the field.
 * @param {!Event} event Keyboard event.
 */
TextField.prototype.handleKeyUp = function(event) {
  this.value = this.dom.value;
  var newEvent = new CustomEvent('keyup', {
    detail: {target: this},
  });
  newEvent.keyCode = event.keyCode;
  this.dispatchEvent(newEvent);
};


/**
 * Sets the value of the field.
 * @param {string} value Value to set to the field.
 */
TextField.prototype.setValue = function(value) {
  this.value = value;
  this.dom.value = value;
};
