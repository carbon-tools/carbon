'use strict';

var Utils = require('../utils');
var Errors = require('../errors');


/**
 * ComponentFactory A factory to allow components to register regex matches
 * to be notified when a match is found in the editor.
 * @param {Object} optParams Optional params to initialize ComponentFactory.
 */
var ComponentFactory = function (optParams) {
  var params = Utils.extend({
    componentsClasses: []
  }, optParams);

  /**
   * The components classes that would need to register their regexs.
   * @type {Array.<Function>}
   */
  this.componentsClasses = params.componentsClasses;

  /**
   * The registery for the regexes and its factory methods (callbacks).
   * @type {Object}
   */
  this.regexToFactories = {};

  this.init();
};
module.exports = ComponentFactory;


/**
 * Initializes the component factory by calling the components registerRegexes
 * methods passing the instance of the factory.
 */
ComponentFactory.prototype.init = function() {
  for (var i = 0; i < this.componentsClasses.length; i++) {
    var ComponentClass = this.componentsClasses[i];
    ComponentClass.registerRegexes(this);
  }
};


/**
 * Registers a regex with the factory.
 * @param  {string} regex String regular expression to register for.
 * @param  {Function} factoryMethod Callback factory method for handling match.
 * @param  {boolean=} optForce Forcing registering even when its already
 * registered.
 */
ComponentFactory.prototype.registerRegex = function(
    regex, factoryMethod, optForce) {
  if (this.regexToFactories[regex] && !optForce) {
    throw Errors.AlreadyRegisteredError(
        'This Regex "' + regex + '" has already been registered.');
  }

  this.regexToFactories[regex] = factoryMethod;
};


/**
 * Check if the string match any registered regex and return its factory method.
 * @param {string} str String to match against.
 * @return {Function} Factory method for creating the matched component.
 */
ComponentFactory.prototype.match = function(str) {
  for (var regexStr in this.regexToFactories) {
    var regex = new RegExp(regexStr);
    var matches = regex.exec(str);
    if (matches) {
      return this.regexToFactories[regexStr];
    }
  }
};
