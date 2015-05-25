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
  var selection = this.article.selection;
  var preventDefault = false;
  var ops = [];
  var inBetweenParagraphs = [];

  if (Utils.isUndo(event)) {
    this.article.undo();
    preventDefault = true;
  } else if (Utils.isRedo(event)) {
    this.article.redo();
    preventDefault = true;
  }

  // If selected text and key pressed will produce a change. Remove selected.
  // i.e. Enter, characters, space, backspace...etc
  else if (selection.isRange() && Utils.willTypeCharacter(event)) {
    var section = selection.getSectionAtStart();
    inBetweenParagraphs = section.getParagraphsBetween(
        selection.start.paragraph, selection.end.paragraph);

    for (var i = 0; i < inBetweenParagraphs.length; i++) {
      ops.push({
        do: {
          op: 'updateText',
          paragraph: inBetweenParagraphs[i].name,
          cursorOffset: 0,
          value: '',
        },
        undo: {
          op: 'updateText',
          paragraph: inBetweenParagraphs[i].name,
          cursorOffset: inBetweenParagraphs[i].text.length,
          value: inBetweenParagraphs[i].text
        }
      });
      var paragraphIndex = section.paragraphs.indexOf(inBetweenParagraphs[i]);
      ops.push({
        do: {
          op: 'deleteParagraph',
          paragraph: inBetweenParagraphs[i].name
        },
        undo: {
          op: 'insertParagraph',
          section: inBetweenParagraphs[i].section.name,
          paragraph: inBetweenParagraphs[i].name,
          index: paragraphIndex - i
        }
      });
    }

    if (selection.end.paragraph !== selection.start.paragraph) {
      var lastParagraphOldText = selection.end.paragraph.text;
      var lastParagraphText = lastParagraphOldText.substring(
          selection.end.offset, lastParagraphOldText.length);
      var lastParagraphIndex = section.paragraphs.indexOf(selection.end.paragraph);
      ops.push({
        do: {
          op: 'updateText',
          paragraph: selection.end.paragraph.name,
          cursorOffset: 0,
          value: '',
        },
        undo: {
          op: 'updateText',
          paragraph: selection.end.paragraph.name,
          cursorOffset: selection.end.offset,
          value: lastParagraphOldText
        }
      });
      ops.push({
        do: {
          op: 'deleteParagraph',
          paragraph: selection.end.paragraph.name
        },
        undo: {
          op: 'insertParagraph',
          section: selection.end.paragraph.section.name,
          paragraph: selection.end.paragraph.name,
          index: lastParagraphIndex - inBetweenParagraphs.length
        }
      });

      var firstParagraphOldText = selection.start.paragraph.text;
      var firstParagraphText = firstParagraphOldText.substring(
          0, selection.start.offset);
      ops.push({
        do: {
          op: 'updateText',
          paragraph: selection.start.paragraph.name,
          cursorOffset: firstParagraphText.length,
          value: firstParagraphText + lastParagraphText,
        },
        undo: {
          op: 'updateText',
          paragraph: selection.start.paragraph.name,
          cursorOffset: selection.start.offset,
          value: firstParagraphOldText
        }
      });
    }

    this.article.transaction(ops);
    ops = [];

    // Only stop propagation on special characters (Enter, Delete, Backspace)
    // We already handled or will handle them in the switch statement.
    // For all others (e.g. typing a char key) don't stop propagation and
    // allow the contenteditable to handle it.
    var stopPropagationCodes = [13, 8, 46];
    preventDefault = stopPropagationCodes.indexOf(event.keyCode) !== -1;
  }

  var offsetAfterOperation;
  var currentParagraph = selection.getParagraphAtEnd();
  var currentIndex = currentParagraph.section.paragraphs.indexOf(
      currentParagraph);
  var nextParagraph = currentParagraph.getNextParagraph();
  var prevParagraph = currentParagraph.getPreviousParagraph();

  switch (event.keyCode) {
    // Enter.
    case 13:
      var uid = Utils.getUID();
      if (!selection.isCursorAtEnding()) {
        var afterCursorText = currentParagraph.text.substring(
            selection.end.offset, currentParagraph.text.length);
        var beforeCursorText = currentParagraph.text.substring(
            0, selection.start.offset);
        ops.push({
          do: {
            op: 'insertParagraph',
            section: selection.end.paragraph.section.name,
            paragraph: uid,
            index: currentIndex - inBetweenParagraphs.length + 1
          },
          undo: {
            op: 'deleteParagraph',
            paragraph: uid
          }
        });

        ops.push({
          do: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: beforeCursorText.length,
            value: beforeCursorText,
          },
          undo: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: beforeCursorText.length,
            value: currentParagraph.text
          }
        });

        ops.push({
          do: {
            op: 'updateText',
            paragraph: uid,
            cursorOffset: 0,
            value: afterCursorText,
          },
          undo: {
            op: 'updateText',
            paragraph: uid,
            cursorOffset: 0,
            value: ''
          }
        });

      } else if (nextParagraph && nextParagraph.isPlaceholder()) {
        // If the next paragraph is a placeholder, just move the cursor to it
        // and don't insert a new paragraph.
        selection.setCursor({
          paragraph: nextParagraph,
          offset: 0
        });
      } else {
        ops.push({
          do: {
            op: 'insertParagraph',
            section: selection.end.paragraph.section.name,
            paragraph: uid,
            index: currentIndex - inBetweenParagraphs.length + 1
          },
          undo: {
            op: 'deleteParagraph',
            paragraph: uid
          }
        });
      }
      this.article.transaction(ops);
      preventDefault = true;
      break;

    // Backspace.
    case 8:
      // If the cursor at the beginning of paragraph. Merge Paragraphs.
      if (selection.isCursorAtBeginning() && prevParagraph) {
        offsetAfterOperation = prevParagraph.text.length;

        ops.push({
          do: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: 0,
            value: '',
          },
          undo: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: 0,
            value: currentParagraph.text
          }
        });

        ops.push({
          do: {
            op: 'deleteParagraph',
            paragraph: currentParagraph.name
          },
          undo: {
            op: 'insertParagraph',
            section: currentParagraph.section.name,
            paragraph: currentParagraph.name,
            index: currentIndex - inBetweenParagraphs.length
          }
        });

        ops.push({
          do: {
            op: 'updateText',
            paragraph: prevParagraph.name,
            cursorOffset: offsetAfterOperation,
            value: prevParagraph.text + currentParagraph.text,
          },
          undo: {
            op: 'updateText',
            paragraph: prevParagraph.name,
            cursorOffset: offsetAfterOperation,
            value: prevParagraph.text
          }
        });

        this.article.transaction(ops);

        selection.setCursor({
          paragraph: prevParagraph,
          offset: offsetAfterOperation
        });
        preventDefault = true;
      }
      break;

    // Delete.
    case 46:
      // If cursor at the end of the paragraph. Merge Paragraphs.
      if (selection.isCursorAtEnding() && nextParagraph) {
        offsetAfterOperation = currentParagraph.text.length;

        ops.push({
          do: {
            op: 'updateText',
            paragraph: nextParagraph.name,
            cursorOffset: 0,
            value: '',
          },
          undo: {
            op: 'updateText',
            paragraph: nextParagraph.name,
            cursorOffset: 0,
            value: nextParagraph.text
          }
        });

        ops.push({
          do: {
            op: 'deleteParagraph',
            paragraph: nextParagraph.name
          },
          undo: {
            op: 'insertParagraph',
            section: nextParagraph.section.name,
            paragraph: nextParagraph.name,
            index: currentIndex + 1 - inBetweenParagraphs.length
          }
        });

        ops.push({
          do: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: offsetAfterOperation,
            value: currentParagraph.text + nextParagraph.text,
          },
          undo: {
            op: 'updateText',
            paragraph: currentParagraph.name,
            cursorOffset: offsetAfterOperation,
            value: currentParagraph.text
          }
        });

        this.article.transaction(ops);

        selection.setCursor({
          paragraph: currentParagraph,
          offset: offsetAfterOperation
        });
        preventDefault = true;
      }
      break;
    default:
      break;
  }

  if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  } else if (currentParagraph && Utils.willTypeCharacter(event)) {
    // Update current paragraph internal text model.
    var oldValue = currentParagraph.text;
    var article = this.article;
    var cursorOffsetDirection = event.keyCode === 8 ? -1 : 1;
    setTimeout(function() {
      ops.push({
        do: {
          op: 'updateText',
          paragraph: currentParagraph.name,
          cursorOffset: selection.end.offset + cursorOffsetDirection,
          value: currentParagraph.dom.innerText,
        },
        undo: {
          op: 'updateText',
          paragraph: currentParagraph.name,
          cursorOffset: selection.end.offset,
          value: oldValue
        }
      });
      article.transaction(ops);
    }, 5);
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
