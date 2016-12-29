'use strict';

var AbstractExtension = require('../../core/abstract-extension');
var Selection = require('../../selection');
var Paragraph = require('../../paragraph');
var opsFromHtml = require('../../core/operations/ops-from-html');


/**
 * An extension to handle copy-cut-paste in the editor.
 * @param {../../editor} editor Editor instance installing this extension.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../../core/abstract-extension}
 * @constructor
 * @export
 */
var CopyCutPaste = function(editor, opt_params) {
  /**
   * @type {../../editor}
   * @private
   */
  this.editor_ = editor;

  /**
   * @type {../../selection}
   * @private
   */
  this.selection_ = Selection.getInstance();
};
CopyCutPaste.prototype = Object.create(AbstractExtension.prototype);
module.exports = CopyCutPaste;


/**
 * @export
 */
CopyCutPaste.CLASS_NAME = 'CopyCutPaste';


/**
 * Handles paste event for the editor.
 * @param  {Event} unusedEvent Copy Event.
 * @return {boolean|undefined}
 */
CopyCutPaste.prototype.onCopy = function(unusedEvent) {
  // TODO(mkhatib): Handle copying a selected component.
};


/**
 * Handles paste event for the editor.
 * @param  {Event} event Paste Event.
 * @return {boolean|undefined}
 */
CopyCutPaste.prototype.onPaste = function(event) {
  var startComponent = this.selection_.getComponentAtEnd();
  var endComponent = this.selection_.getComponentAtEnd();
  var pastedContent = getClipboardContent_(
      event, /* opt_isInline */ startComponent.inline);
  if (!pastedContent) {
    console.warn('CopyCutPaste: Could not get pasted content.');
    return;
  }
  // Delete current selection for a paste-over.
  var ops = this.selection_.getDeleteSelectionOps();
  this.editor_.article.transaction(ops);

  // Generate and execute the operations needed to paste the content.
  var pasteOps = opsFromHtml(pastedContent);
  this.editor_.article.transaction(pasteOps);

  // TODO(mkhatib): Move this to a helper method somewhere.
  // Loop over the new content to execute any elements that has a registered
  // regex and a factory method. For example, is the pasted content is an image
  // URL turn it into an actual image.
  var factoryMethod;
  var that = this;

  if (startComponent.getPreviousComponent()) {
    startComponent = startComponent.getPreviousComponent();
  }
  if (endComponent.getNextComponent()) {
    endComponent = endComponent.getNextComponent();
  }

  var opsCallback = function(ops) {
    that.editor_.article.transaction(ops);
    setTimeout(function() {
      that.editor_.dispatchEvent(new Event('change'));
    }, 2);
  };

  var currentComponent = startComponent;
  while (currentComponent && currentComponent !== endComponent) {
    var currentIsParagraph = currentComponent instanceof Paragraph;
    if (currentIsParagraph) {
      factoryMethod = this.editor_.componentFactory.match(
          currentComponent.text);
      if (factoryMethod) {
        factoryMethod(currentComponent, opsCallback);
      }
    }

    currentComponent = currentComponent.getNextComponent();
  }

  this.selection_.updateSelectionFromWindow();
  return true;
};


/**
 * Handles cut event for the editor.
 * @return {boolean|undefined}
 */
CopyCutPaste.prototype.onCut = function(unusedEvent) {
  // Don't handle input in the editor, we'll handle changes ourselves.
  this.editor_.disableInput();
  var ops = this.selection_.getDeleteSelectionOps();
  var article = this.editor_.article;
  var dispatchEvent = this.editor_.dispatchEvent.bind(this.editor_);
  setTimeout(function() {
    try {
      article.transaction(ops);
    } finally {
      // Don't forget to re-enable input in editor.
      this.editor_.enableInput();
    }
    dispatchEvent(new Event('change'));
  }, 20);

  return true;
};


/**
 * Returns clipboard data.
 * @param {Event} event
 * @param {boolean=} opt_isInline Whether the content is to be inserted inline.
 * @return {string|null}
 * @private
 */
function getClipboardContent_(event, opt_isInline) {
  if (window.clipboardData && window.clipboardData.getData) { // IE
    return window.clipboardData.getData('Text');
  } else if (event.clipboardData && event.clipboardData.getData) {
    var cbData = event.clipboardData;
    // Enforce inline paste when pasting in an inline component
    // (e.g. figcaption).
    if (opt_isInline) {
      // TODO(mkhatib): This would strip away any inline formatting as well.
      // Should probably implement a separate way.
      var pastedContent = cbData.getData('text/plain');
      return pastedContent.split('\n').join(' ');
    } else {
      return cbData.getData('text/html') || cbData.getData('text/plain');
    }
  }
  return null;
}
