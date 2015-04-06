'use strict';

var Article = require('./article');
var Paragraph = require('./paragraph');
var Section = require('./section');
var Utils = require('./utils');

/**
 * Editor main.
 * @param {HTMLElement} element Editor element to decorate.
 */
var Editor = function(element) {

  /**
   * Element to decorate the editor on.
   * @type {HTMLElement}
   */
  this.element = element;

  /**
   * Main article model.
   * @type {Article}
   */
  this.article = null;

  this.init();
};
Editor.prototype = new Utils.CustomEventTarget();
module.exports = Editor;


/**
 * Initialize the editor article model and event listeners.
 */
Editor.prototype.init = function() {
  // This is just to render and test the initial dom creation.
  // This will probably change dramatically as we go forward.
  // TODO(mkhatib): Drop these.

  var section = new Section({
    paragraphs: [
      new Paragraph({
        placeholderText: 'Manshar Editor Demo',
        paragraphType: Paragraph.Types.MainHeader
      }),
      new Paragraph({
        placeholderText: 'This is just a demo.',
        paragraphType: Paragraph.Types.ThirdHeader
      }),
      new Paragraph({
        placeholderText: 'Play around and see the internal model of the article being displayed to the right. The Editor is still under development.'
      })
    ]
  });

  this.article = new Article({
    sections: [section]
  });
  this.article.selection.initSelectionListener(this.element);

  this.element.addEventListener('keydown', this.handleKeyDownEvent.bind(this));
  this.element.className += ' manshar-editor';
  this.element.setAttribute('contenteditable', true);
  this.element.appendChild(this.article.dom);

  this.article.selection.setCursor({
    paragraph: section.paragraphs[0],
    offset: 0
  });
};


/**
 * Handels `keydown` events.
 * @param  {Event} event Event object.
 */
Editor.prototype.handleKeyDownEvent = function(event) {
  var preventDefault = false;
  var currentParagraph = this.article.selection.getParagraphAtEnd();
  switch (event.keyCode) {
    // Enter.
    case 13:
      // TODO(mkhatib): Maybe Move handling the enter to inside the Paragraph
      // class.
      // TODO(mkhatib): What if text were already selected?
      // TODO(mkhatib): What if pressing enter at beginning of paragraph or in
      // the middle of it.

      // If the next paragraph is a placeholder, just move the cursor to it
      // and don't insert a new paragraph.
      var nextParagraph = currentParagraph.getNextParagraph();
      if (nextParagraph && nextParagraph.isPlaceholder()) {
        this.article.selection.setCursor({
          paragraph: nextParagraph,
          offset: 0
        });
      } else {
        var newParagraph = new Paragraph();
        this.article.insertParagraph(newParagraph);
      }
      preventDefault = true;
      break;
    default:
      break;
  }

  if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  } else if (currentParagraph) {
    // Update current paragraph internal text model.
    setTimeout(currentParagraph.updateTextFromDom.bind(currentParagraph), 5);
  }

  // Dispatch a `change` event
  var dispatchEvent = this.dispatchEvent.bind(this);
  setTimeout(function() {
    dispatchEvent(new Event('change'));
  }, 10);
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this paragraph.
 */
Editor.prototype.getJSONModel = function() {
  return this.article.getJSONModel();
};
