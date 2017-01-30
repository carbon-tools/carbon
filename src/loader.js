'use strict';

var Errors = require('./errors');

/**
 * Loader A loader to register modules and load them on runtime.
 * e.g. Loader.register('YouTubeComponent', YouTubeComponent);
 * var YC = Loader.load('YouTubeComponent');
 */
var Loader = (function() {

  /**
   * @constructor
   */
  var Loader = function() {
    /**
     * The registery for the components and its modules.
     * @type {Object}
     */
    this.registery = {};
  };


  /**
   * Registers a module with the loader.
   * @param  {string} name Name of module to register.
   * @param  {Function} module The module.
   * @param  {boolean=} optForce Forcing registering even when its already
   * registered.
   */
  Loader.prototype.register = function(name, module, optForce) {
    if (this.registery[name] && !optForce) {
      throw new Errors.AlreadyRegisteredError(
          'The module name "' + name + '" has already been registered.');
    }

    this.registery[name] = module;
  };


  /**
   * Unregisters a module with the loader.
   * @param  {string} name Name of module to register.
   */
  Loader.prototype.unregister = function(name) {
    this.registery[name] = undefined;
    delete this.registery[name];
  };


  /**
   * Returns the module registered to the name.
   * @param {string} name Module's name to load.
   * @return {Function} The module requested.
   */
  Loader.prototype.load = function(name) {
    return this.registery[name];
  };

  var instance = new Loader();
  return {
    register: function(name, module, optForce) {
      instance.register(name, module, optForce);
    },

    unregister: function(name) {
      instance.unregister(name);
    },

    load: function(name) {
      return instance.load(name);
    },
  };
})();
module.exports = Loader;
