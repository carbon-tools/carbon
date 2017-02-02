'use strict';

var Utils = require('../utils');
var CustomEventTarget = require('../customEventTarget');

/**
 * Toolbar component for adding controls to the editor.
 * @param {Object=} opt_params Optional Params.
 * @extends {../customEventTarget}
 * @constructor
 */
var Toolbar = function(opt_params) {
  CustomEventTarget.call(this);

  var params = Utils.extend({
    buttons: [],
    classNames: [],
    name: Utils.getUID(),
    rtl: false,
  }, opt_params);

  /**
   * Toolbar name.
   * @type {string}
   */
  this.name = params.name;

  /**
   * If the toolbar is added to a right to left editor.
   * @type {boolean}
   */
  this.rtl = params.rtl;

  /**
   * CSS class names to add to the toolbar.
   * @type {Array<string>}
   */
  this.classNames = params.classNames;
  this.classNames.push(Toolbar.TOOLBAR_CLASS_NAME);
  if (this.rtl) {
    this.classNames.push(Toolbar.RTL_CLASS_NAME);
  }

  /**
   * List of buttons on the toolbar.
   * @type {Array<!./button>}
   */
  this.buttons = [];

  /**
   * The current active button on the toolbar.
   * @type {?./button}
   */
  this.activeButton = null;

  /**
   * Whether the toolbar is visible or not.
   * @type {boolean}
   */
  this.isVisible = false;

  /**
   * Element for rendering the toolbar.
   * @type {!Element}
   */
  this.dom = document.createElement(Toolbar.TAG_NAME);
  this.dom.className = this.classNames.join(' ');

  /**
   * Element for containing both the buttons and fields.
   * @type {!Element}
   */
  this.containerDom = document.createElement(
      Toolbar.BUTTONS_CONTAINER_TAG_NAME);
  this.containerDom.className = Toolbar.BUTTONS_FIELDS_CONTAINER_CLASS_NAME;
  this.dom.appendChild(this.containerDom);


  /**
   * Element for containing buttons of the toolbar.
   * @type {!Element}
   */
  this.buttonsContainer = document.createElement(
      Toolbar.BUTTONS_CONTAINER_TAG_NAME);
  this.buttonsContainer.className = Toolbar.BUTTONS_CONTAINER_CLASS_NAME;
  this.containerDom.appendChild(this.buttonsContainer);

  /**
   * Element for containing fields of the toolbar.
   * @type {!Element}
   */
  this.fieldsContainer = document.createElement(
      Toolbar.FIELDS_CONTAINER_TAG_NAME);
  this.fieldsContainer.className = Toolbar.FIELDS_CONTAINER_CLASS_NAME;
  this.containerDom.appendChild(this.fieldsContainer);

  for (var i = 0; i < params.buttons.length; i++) {
    this.addButton(params.buttons[i]);
  }

  document.body.appendChild(this.dom);
};
Toolbar.prototype = Object.create(CustomEventTarget.prototype);
module.exports = Toolbar;


/**
 * Toolbar container tag name.
 * @type {string}
 */
Toolbar.TAG_NAME = 'div';


/**
 * Fields container tag name.
 * @type {string}
 */
Toolbar.FIELDS_CONTAINER_TAG_NAME = 'div';


/**
 * Buttons container tag name.
 * @type {string}
 */
Toolbar.BUTTONS_CONTAINER_TAG_NAME = 'div';


/**
 * Toolbar css class name.
 * @type {string}
 */
Toolbar.TOOLBAR_CLASS_NAME = 'editor-toolbar';


/**
 * Classname added to RTL toolbars.
 */
Toolbar.RTL_CLASS_NAME = 'rtl';


/**
 * Class added when the toolbar is visible..
 * @type {string}
 */
Toolbar.VISIBLE_CLASS_NAME = 'toolbar-visible';


/**
 * Toolbar buttons container class name.
 * @type {string}
 */
Toolbar.BUTTONS_CONTAINER_CLASS_NAME = 'editor-toolbar-buttons';


/**
 * Toolbar fields container class name.
 * @type {string}
 */
Toolbar.FIELDS_CONTAINER_CLASS_NAME = 'extra-fields-container';


/**
 * Toolbar buttons container class name.
 * @type {string}
 */
Toolbar.BUTTONS_FIELDS_CONTAINER_CLASS_NAME = 'buttons-fields-container';


/**
 * Used to position the toolbars outside the user view.
 * @type {number}
 */
Toolbar.EDGE = -999999;


/**
 * Call to destroy instance and cleanup dom and event listeners.
 */
Toolbar.prototype.onDestroy = function() {
  try {
    document.body.removeChild(this.dom);
  } catch (unusedE) {
  }
};


/**
 * Adds a button to the toolbar.
 * @param {!./button} button The button to add to the toolbar.
 */
Toolbar.prototype.addButton = function(button) {
  var event = new CustomEvent('button-added', {
    detail: {target: this},
  });

  this.buttons.push(button);
  this.buttonsContainer.appendChild(button.dom);
  this.fieldsContainer.appendChild(button.fieldsDom);

  this.dispatchEvent(event);
};


/**
 * Sets the toolbar to be visible or hidden.
 * @param {boolean} isVisible Whether to be visible or not.
 */
Toolbar.prototype.setVisible = function(isVisible) {
  this.isVisible = isVisible;
  if (this.isVisible) {
    this.dom.classList.add(Toolbar.VISIBLE_CLASS_NAME);
  } else {
    this.dom.classList.remove(Toolbar.VISIBLE_CLASS_NAME);
    this.dom.style.top = Toolbar.EDGE + 'px';
    this.dom.style.left = Toolbar.EDGE + 'px';
  }
};


/**
 * Sets the toolbar position relative to start top position of an element.
 * @param {!Element} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToStartTopOf = function(element) {
  var wSelection = window.getSelection();
  var oldRange = wSelection.getRangeAt(0);
  var bounds = element.getBoundingClientRect();
  var tempRange = document.createRange();
  // Set temporary selection at the element first text to allow the positioning
  // to include any floating that is happening to the element.
  try {
    var tempSelectionOn = element;
    if (element.childNodes && element.childNodes.length) {
      tempSelectionOn = element.childNodes[0];
    }
    tempRange.setStart(tempSelectionOn, 0);
    tempRange.setEnd(tempSelectionOn, 1);
    wSelection.removeAllRanges();
    wSelection.addRange(tempRange);
    var newBounds = tempRange.getBoundingClientRect();
    if (newBounds.left && newBounds.right) {
      bounds = newBounds;
    }
    wSelection.removeAllRanges();
    wSelection.addRange(oldRange);
  } catch (e) {
    // pass.
    console.warn(e);
  }


  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset;
  var start = bounds.left;
  if (this.rtl) {
    var toolbarBounds = this.dom.getBoundingClientRect();
    start = bounds.right - toolbarBounds.width;
  }

  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(start, 0) + 'px';
};


/**
 * Sets the toolbar position relative to start bottom position of an element.
 * @param {!Element} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToStartBottomOf = function(element) {
  var bounds = element.getBoundingClientRect();

  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.bottom + window.pageYOffset;
  var start = bounds.left;
  if (this.rtl) {
    var toolbarBounds = this.dom.getBoundingClientRect();
    start = bounds.right - toolbarBounds.width;
  }
  this.dom.style.top = Math.max(top, 0) + 'px';
  this.dom.style.left = Math.max(start, 0) + 'px';
};


/**
 * Sets the toolbar position relative to middle top position of an element.
 * @param {!Element} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToTopOf = function(element) {
  var bounds = element.getBoundingClientRect();
  var windowRect = document.body.getBoundingClientRect();

  // Calculate the left edge of the inline toolbar.
  var clientRect = this.dom.getClientRects()[0];
  var toolbarHeight = clientRect.height;
  var toolbarWidth = clientRect.width;
  var left = ((bounds.left + bounds.right) / 2) - toolbarWidth / 2;
  left = Math.max(10, left);
  left = Math.min(left, windowRect.width - toolbarWidth - 10);
  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset - toolbarHeight - 10;
  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(left, 0) + 'px';
};


/**
 * Sets the toolbar position relative to top of window selection.
 */
Toolbar.prototype.setPositionTopOfSelection = function() {
  var wSelection = window.getSelection();
  var range = wSelection.getRangeAt(0);
  var bounds = range.getBoundingClientRect();
  var windowRect = document.body.getBoundingClientRect();

  // Calculate the left edge of the inline toolbar.
  var clientRect = this.dom.getClientRects()[0];
  var toolbarHeight = clientRect.height;
  var toolbarWidth = clientRect.width;
  var left = ((bounds.left + bounds.right) / 2) - toolbarWidth / 2;
  left = Math.max(10, left);
  left = Math.min(left, windowRect.width - toolbarWidth - 10);
  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset - toolbarHeight - 10;
  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(left, 0) + 'px';
};


/**
 * Returns the button with the passed name.
 * @param  {string} name Name of the button to find.
 * @return {./button|null} Button with the specified name.
 */
Toolbar.prototype.getButtonByName = function(name) {
  for (var i = 0; i < this.buttons.length; i++) {
    if (this.buttons[i].name === name) {
      return this.buttons[i];
    }
  }
  return null;
};


/**
 * Sets the toolbar active button.
 * @param {!./button} button To set active.
 */
Toolbar.prototype.setActiveButton = function(button) {
  if (this.activeButton) {
    this.activeButton.setActive(false);
    this.activeButton = null;
  }

  if (button) {
    button.setActive(true);
    this.activeButton = button;
  }
};


/**
 * Resets the status and the values of the fields.
 */
Toolbar.prototype.resetFields = function() {
  for (var i = 0; i < this.buttons.length; i++) {
    this.buttons[i].resetFields();
  }
};
