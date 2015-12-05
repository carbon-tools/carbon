'use strict';

var Errors = {};
module.exports = Errors;


/**
 * An error to use when methods are not implemented.
 * @param {string} message Message for the exception.
 */
Errors.NotImplementedError = function (message) {
  this.name = 'NotImplementedError';
  this.message = (message || '');
};
Errors.NotImplementedError.prototype = Error.prototype;


/**
 * An error to use when registeration is already done.
 * @param {string} message Message for the exception.
 */
Errors.AlreadyRegisteredError = function (message) {
  this.name = 'AlreadyRegisteredError';
  this.message = (message || '');
};
Errors.AlreadyRegisteredError.prototype = Error.prototype;


Errors.ConfigrationError = function (message) {
  this.name = 'ConfigrationError';
  this.message = (message || '');
};
Errors.ConfigrationError.prototype = Error.prototype;
