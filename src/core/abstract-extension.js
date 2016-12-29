'use strict';

/**
 * Abstract class that must be extended by extensions installed on the editor.
 * @export
 * @constructor
 */
var AbstractExtension = function(unusedEditor, opt_params) {
};
module.exports = AbstractExtension;

/**
 * Create a one time instantiation for your extension.
 * @export
 */
AbstractExtension.onInstall = function() {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onCopy = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onCut = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onPaste = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onKeyup = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onKeypress = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onKeydown = function(unusedEvent) {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onShortcut = function() {};


/**
 * @export
 * @return {boolean|undefined}
 */
AbstractExtension.prototype.onSelectionChange = function() {};
