'use strict';

var Utils = {};
module.exports = Utils;

/**
 * Stores global references for retreival.
 * @type {Object}
 */
Utils.GLOBAL_REFERENCE = {};

/**
 * Extends first object with second object and overrides its
 * attributes and returns a new object.
 *
 * Example:
 *
 *   var newObj = Utils.extend({name: 'mk', age: 14}, {name: 'rasha'});
 *   // newObj is now {name: 'rasha', age: 14}
 * @param  {Object} firstObj
 * @param  {Object} secondObj
 * @return {Object} Combined new object.
 */
Utils.extend = function(firstObj, secondObj) {
  var tmpObj = {}, attr;

  for (attr in firstObj) {
    tmpObj[attr] = firstObj[attr];
  }

  for (attr in secondObj) {
    tmpObj[attr] = secondObj[attr];
  }

  return tmpObj;
};


/**
 * Store a global reference for an object.
 * @param {string} key Key to store the object at.
 * @param {Object|string|number} value Any value you'd like to store at key.
 */
Utils.setReference = function(key, value) {
  Utils.GLOBAL_REFERENCE[key] = value;
};


/**
 * Get a global reference for an object.
 * @param {string} key Key to get the object at.
 */
Utils.getReference = function(key) {
  return Utils.GLOBAL_REFERENCE[key];
};


/**
 * Generates a random alphanumeric ID.
 * @param  {number} optLength Length of the ID to generate.
 * @return {string} Random alphanumeric ID.
 */
Utils.getUID = function(optLength) {
  var length = optLength || 4;
  var chars = [];
  var sourceSet = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    chars.push(sourceSet.charAt(Math.floor(Math.random() * sourceSet.length)));
  }

  return chars.join('');
};


/**
 * Whether an event will produce a character or not.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if the key will produce a change.
 */
Utils.willTypeCharacter = function(event) {
  var NO_CHANGE_KEYS = [
    // Command keys.
    16, 17, 18, 19, 20, 27,
    // Pages keys.
    33, 34, 35, 36,
    // Arrow keys.
    37, 38, 39, 40,
    // Other keys.
    45, 91, 92, 93,
    // Funcion Keys F1-F12
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    // Locks
    144, 145
  ];

  return (NO_CHANGE_KEYS.indexOf(event.keyCode) === -1 &&
          !event.ctrlKey && !event.metaKey);
};


/**
 * Checks if the event is undo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is undo.
 */
Utils.isUndo = function(event) {
  return !!((event.ctrlKey || event.metaKey) &&
          event.keyCode === 90 && !event.shiftKey);
};


/**
 * Checks if the event is redo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is redo.
 */
Utils.isRedo = function(event) {
  return !!((event.ctrlKey || event.metaKey) &&
          (event.keyCode === 89 ||
           (event.shiftKey && event.keyCode === 90)));
};


/**
 * Custom Event Target base class to allow listening and firing events.
 */
Utils.CustomEventTarget = function() {
  this._init();
};


/**
 * Initializes the custom event target.
 * @private
 */
Utils.CustomEventTarget.prototype._init = function() {
  this._registrations = {};
};


/**
 * Returns the listeners for the specific type.
 * @param  {string} type Event name.
 * @param  {boolean} useCapture
 * @return {Array.<function>} List of listeners.
 * @private
 */
Utils.CustomEventTarget.prototype._getListeners = function(type, useCapture) {
  var capType = (useCapture ? '1' : '0')+type;
  if (!(capType in this._registrations)) {
    this._registrations[capType] = [];
  }
  return this._registrations[capType];
};


/**
 * Adds event listener for object.
 * @param  {string} type Event name.
 * @param  {Function} listener Callback function.
 * @param  {boolean} useCapture
 */
Utils.CustomEventTarget.prototype.addEventListener = function(type, listener, useCapture) {
  var listeners = this._getListeners(type, useCapture);
  var ix = listeners.indexOf(listener);
  if (ix === -1) {
    listeners.push(listener);
  }
};


/**
 * Removes event listener for object.
 * @param  {string} type Event name.
 * @param  {Function} listener Callback function.
 * @param  {boolean} useCapture
 */
Utils.CustomEventTarget.prototype.removeEventListener = function(type, listener, useCapture) {
    var listeners = this._getListeners(type, useCapture);
    var ix = listeners.indexOf(listener);
    if (ix !== -1) {
      listeners.splice(ix, 1);
    }
};


/**
 * Dispatches the event
 * @param  {Event} event Event object.
 * @return {boolean} Whether the event has not been defaultPrevented.
 */
Utils.CustomEventTarget.prototype.dispatchEvent = function(event) {
  var listeners = this._getListeners(event.type, false).slice();
  for (var i= 0; i<listeners.length; i++) {
    listeners[i].call(this, event);
  }
  return !event.defaultPrevented;
};
