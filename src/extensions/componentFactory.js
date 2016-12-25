'use strict';

var Errors = require('../errors');


/**
 * ComponentFactory A factory to allow components to register regex matches
 * to be notified when a match is found in the editor.
 * @constructor
 */
var ComponentFactory = function() {
  /**
   * The registery for the regexes and its factory methods (callbacks).
   * @type {Object<string, ../defs.ComponentFactoryMethodDef>}
   */
  this.regexToFactories = {};
};
module.exports = ComponentFactory;


/**
 * Registers a regex with the factory.
 * @param  {string} regex String regular expression to register for.
 * @param  {../defs.ComponentFactoryMethodDef} factoryMethod Callback factory method for handling match.
 * @param  {boolean=} optForce Forcing registering even when its already
 * registered.
 */
ComponentFactory.prototype.registerRegex = function(
    regex, factoryMethod, optForce) {
  if (this.regexToFactories[regex] && !optForce) {
    throw new Errors.AlreadyRegisteredError(
        'This Regex "' + regex + '" has already been registered.');
  }

  this.regexToFactories[regex] = factoryMethod;
};


/**
 * Check if the string match any registered regex and return its factory method.
 * @param {string} str String to match against.
 * @return {../defs.ComponentFactoryMethodDef|null} Factory method for creating the matched component.
 */
ComponentFactory.prototype.match = function(str) {
  for (var regexStr in this.regexToFactories) {
    var regex = new RegExp(regexStr);
    var matches = regex.exec(str);
    if (matches) {
      return this.regexToFactories[regexStr];
    }
  }
  return null;
};


/**
 * Clears all registerations.
 */
ComponentFactory.prototype.onDestroy = function() {
  this.regexToFactories = {};
};
