/**
 * Custom Event Target base class to allow listening and firing events.
 * @constructor
 */
var CustomEventTarget = function() {
  /** @private @type {!Object} */
  this.registrations_ = {};
};
module.exports = CustomEventTarget;


/**
 * Returns the listeners for the specific type.
 * @param  {string} type Event name.
 * @param  {boolean} useCapture
 * @return {Array<function(Event)>} List of listeners.
 * @private
 */
CustomEventTarget.prototype.getListeners_ = function(type, useCapture) {
  var capType = (useCapture ? '1' : '0') + type;
  if (!(capType in this.registrations_)) {
    this.registrations_[capType] = [];
  }
  return this.registrations_[capType];
};


/**
 * Adds event listener for object.
 * @param  {string} type Event name.
 * @param  {function(Event)} listener Callback function.
 * @param  {boolean} useCapture
 */
CustomEventTarget.prototype.addEventListener = function(
    type, listener, useCapture) {
  var listeners = this.getListeners_(type, useCapture);
  var ix = listeners.indexOf(listener);
  if (ix === -1) {
    listeners.push(listener);
  }
};


/**
 * Removes event listener for object.
 * @param  {string} type Event name.
 * @param  {function(Event)} listener Callback function.
 * @param  {boolean} useCapture
 */
CustomEventTarget.prototype.removeEventListener = function(
    type, listener, useCapture) {
  var listeners = this.getListeners_(type, useCapture);
  var ix = listeners.indexOf(listener);
  if (ix !== -1) {
    listeners.splice(ix, 1);
  }
};


/**
 * Removes all event listeners for object.
 */
CustomEventTarget.prototype.clearEventListeners = function() {
  this.registrations_ = {};
};

/**
 * Dispatches the event
 * @param  {Event} event Event object.
 * @return {boolean} Whether the event has not been defaultPrevented.
 */
CustomEventTarget.prototype.dispatchEvent = function(event) {
  var listeners = this.getListeners_(event.type, false).slice();
  for (var i = 0; i < listeners.length; i++) {
    listeners[i].call(this, event);
  }
  return !event.defaultPrevented;
};
