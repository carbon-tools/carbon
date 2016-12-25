'use strict';


/**
 * Shortcut manager that manages the registeration and delivery of shortcuts
 * events triggered on the editor.
 * @param {../editor} editor The editor to manage the shortcuts for.
 * @constructor
 */
var ShortcutsManager = function(editor) {

  /**
   * The editor to manage the shortcuts for.
   * @type {../editor}
   */
  this.editor = editor;

  /**
   * Registery to keep track of registered events and its listeners.
   * @type {Object.<Function>}
   */
  this.registery = {};

  this.editor.element.addEventListener(
      'keydown', this.handleKeyDownEvent.bind(this));
};
module.exports = ShortcutsManager;


/**
 * Main meta keys used for shortcuts (Shift, Ctrl, Cmd).
 * @type {Array}
 */
ShortcutsManager.META_KEYS = [16, 17, 91];


/**
 * Generates a shortcut ID string for the keyboard event.
 * @param  {Event} event Keyboard event.
 * @return {string|null} Generated shortcut ID (e.g. cmd+shift+a).
 */
ShortcutsManager.prototype.getShortcutId = function(event) {
  var keys = [];
  var keyCode = event.keyCode || event.which;
  if (ShortcutsManager.META_KEYS.indexOf(keyCode) !== -1) {
    return null;
  }

  if (event.metaKey) {
    keys.push('cmd');
  }

  if (event.ctrlKey) {
    keys.push('ctrl');
  }

  if (event.shiftKey) {
    keys.push('shift');
  }

  if (event.altKey) {
    keys.push('alt');
  }

  keys.sort();

  if (keyCode) {
    keys.push(String.fromCharCode(keyCode));
  }

  return keys.join('+').toLowerCase();
};


/**
 * Checks if the current event is for a shortcut.
 * @param  {Event} event Keyboard event shortcut.
 * @return {boolean} True if the shortcut is for the event.
 */
ShortcutsManager.prototype.isShortcutEvent = function(event) {
  var keyCode = event.keyCode || event.which;
  return !!((event.metaKey || event.ctrlKey) && keyCode &&
          (ShortcutsManager.META_KEYS.indexOf(keyCode) === -1));
};


/**
 * Handles keydown events.
 * @param  {Event} event Keyboard event.
 * @return {boolean} True if the event wasn't handled and should bubble up.
 */
ShortcutsManager.prototype.handleKeyDownEvent = function(event) {
  if (this.isShortcutEvent(event)) {
    var shortcutId = this.getShortcutId(event);

    // If the shortcut is registered.
    if (this.registery[shortcutId]) {

      // Call the listener callback method passing the event.
      var returnValue = this.registery[shortcutId](event);

      // Stop the event from bubbling up if it was handled.
      if (returnValue === false) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }

  // Not handled bubble it up.
  return true;
};


/**
 * Registers a handler for a shortcut.
 * @param  {string} shortcutId A shortcut ID to listen to.
 * @param  {Function} handler Callback handler for the shortcut.
 * @param  {boolean=} optForce Optional parameter to force replacing an already
 * existing shortcut listener.
 */
ShortcutsManager.prototype.register = function(shortcutId, handler, optForce) {
  // If the shortcut already registered throw an error.
  if (this.registery[shortcutId] && !optForce) {
    throw new Error(
      '"' + shortcutId + '" shortcut has already been registered.');
  }

  this.registery[shortcutId] = handler;
};


/**
 * Clears all registerations.
 */
ShortcutsManager.prototype.onDestroy = function() {
  this.registery = {};
};
