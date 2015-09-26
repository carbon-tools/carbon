'use strict';

var Article = require('./article');
var Paragraph = require('./paragraph');
var Section = require('./section');
var Utils = require('./utils');
var FormattingExtension = require('./extensions/formatting');
var ShortcutsManager = require('./extensions/shortcutsManager');

/**
 * Editor main.
 * @param {HTMLElement} element Editor element to decorate.
 * @param {Object} optParams Optional params to initialize the editor.
 * Default:
 *   {
 *     extensions: [new FormattingExtension()]
 *   }
 */
var Editor = function(element, optParams) {

  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The extensions enabled in this editor.
    extensions: [
        // TODO(mkhatib): Handle different kind of shortcuts (e.g. formatting)
        new FormattingExtension(this),
    ]
  }, optParams);

  /**
   * Unique name to identify the editor.
   * @type {string}
   */
  this.name = Utils.getUID();

  /**
   * Extensions enabled in the editor.
   * @type {Array.<Object>}
   */
  this.extensions = params.extensions;

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

  /**
   * Shortcuts manager to handle keyboard shortcuts on the editor.
   * @type {ShortcutsManager}
   */
  this.shortcutsManager = new ShortcutsManager(this);

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
        placeholderText: 'Play around and see the internal model of the' +
          ' article being displayed to the right. The Editor is still under'+
          ' development.'
      })
    ]
  });

  this.article = new Article({
    sections: [section]
  });
  this.article.selection.initSelectionListener(this.element);

  if (this.extensions) {
    for (var i = 0; i < this.extensions.length; i++) {
      var extension = this.extensions[i];
      if (typeof extension.init === 'function') {
        extension.init(this);
      }
    }
  }
  this.element.addEventListener('keydown', this.handleKeyDownEvent.bind(this));
  this.element.addEventListener('cut', this.handleCut.bind(this));
  this.element.addEventListener('paste', this.handlePaste.bind(this));
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
    ops.push.apply(ops, this.getDeleteSelectionOps());

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
        ops.push.apply(ops, this.getSplitParagraphOps(
            -inBetweenParagraphs.length));

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
            cursorOffset: 0,
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

        ops.push.apply(ops, this.getMergeParagraphsOps(
            prevParagraph, currentParagraph, -inBetweenParagraphs.length));
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

        ops.push.apply(ops, this.getMergeParagraphsOps(
            currentParagraph, nextParagraph, -inBetweenParagraphs.length));

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
    var isRemoveOp = [46, 8].indexOf(event.keyCode) !== -1;
    var cursorOffsetDirection = 1;
    if (event.keyCode === 8) {
      cursorOffsetDirection = -1;
    } else if (event.keyCode === 46) {
      cursorOffsetDirection = 0;
    }

    setTimeout(function() {
      var newValue = currentParagraph.dom.innerText;
      var newOffset = selection.end.offset + cursorOffsetDirection;

      if (!isRemoveOp) {
        var insertedChar = newValue.charAt(Math.min(newOffset, newValue.length) - 1);
        ops.push({
          do: {
            op: 'insertChars',
            paragraph: currentParagraph.name,
            cursorOffset: newOffset,
            value: insertedChar,
            index: selection.end.offset
          },
          undo: {
            op: 'removeChars',
            paragraph: currentParagraph.name,
            cursorOffset: selection.end.offset,
            index: selection.end.offset,
            count: 1
          }
        });
      } else if (oldValue) {
        var deletedChar = oldValue.charAt(newOffset);
        ops.push({
          do: {
            op: 'removeChars',
            paragraph: currentParagraph.name,
            cursorOffset: newOffset,
            index: newOffset,
            count: 1
          },
          undo: {
            op: 'insertChars',
            paragraph: currentParagraph.name,
            cursorOffset: selection.end.offset,
            value: deletedChar,
            index: newOffset
          }
        });
      }

      article.transaction(ops);
    }, 3);
  }

  // Dispatch a `change` event
  var dispatchEvent = this.dispatchEvent.bind(this);
  setTimeout(function() {
    dispatchEvent(new Event('change'));
  }, 10);
};


/**
 * Generates the operations needed to delete current selection.
 * @return {Array.<Object>} List of operations to delete selection.
 */
Editor.prototype.getDeleteSelectionOps = function() {
  var ops = [];
  var count;
  var selection = this.article.selection;
  var section = selection.getSectionAtStart();
  var inBetweenParagraphs = section.getParagraphsBetween(
      selection.start.paragraph, selection.end.paragraph);

  for (var i = 0; i < inBetweenParagraphs.length; i++) {
    ops.push({
      do: {
        op: 'updateParagraph',
        paragraph: inBetweenParagraphs[i].name,
        cursorOffset: 0,
        value: '',
      },
      undo: {
        op: 'updateParagraph',
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
    var lastParagraphIndex = section.paragraphs.indexOf(
        selection.end.paragraph);

    // TODO(mkhatib): Figure out a way to handle this without discarding
    // the formats of the text.
    ops.push({
      do: {
        op: 'updateParagraph',
        paragraph: selection.end.paragraph.name,
        cursorOffset: 0,
        value: '',
      },
      undo: {
        op: 'updateParagraph',
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
        selection.start.offset, firstParagraphOldText.length);

    // remove chars from first paragraph.
    // insert chars into first paragraph.
    ops.push({
      do: {
        op: 'removeChars',
        paragraph: selection.start.paragraph.name,
        cursorOffset: selection.start.offset,
        index: selection.start.offset,
        count: firstParagraphText.length
      },
      undo: {
        op: 'insertChars',
        paragraph: selection.start.paragraph.name,
        cursorOffset: selection.start.offset,
        selectRange: firstParagraphText.length,
        index: selection.start.offset,
        value: firstParagraphText
      }
    });

    count = lastParagraphOldText.length - lastParagraphText.length;
    ops.push({
      do: {
        op: 'insertChars',
        paragraph: selection.start.paragraph.name,
        cursorOffset: selection.start.offset,
        index: selection.start.offset,
        value: lastParagraphText
      },
      undo: {
        op: 'removeChars',
        paragraph: selection.start.paragraph.name,
        cursorOffset: selection.start.offset,
        index: selection.start.offset,
        count: count
      }
    });
  } else {
    var currentParagraph = selection.start.paragraph;
    var selectedText = currentParagraph.text.substring(
        selection.start.offset, selection.end.offset);
    count = selection.end.offset - selection.start.offset;
    ops.push({
      do: {
        op: 'removeChars',
        paragraph: currentParagraph.name,
        cursorOffset: selection.start.offset,
        index: selection.start.offset,
        count: count
      },
      undo: {
        op: 'insertChars',
        paragraph: currentParagraph.name,
        cursorOffset: selection.start.offset,
        selectRange: count,
        index: selection.start.offset,
        value: selectedText
      }
    });
  }

  return ops;
};


/**
 * Generates the operations needed to split a paragraph into two at the cursor.
 * @param  {number} indexOffset Offset to add to paragraphs index.
 * @return {Array.<Object>} List of operations to split the paragraph.
 */
Editor.prototype.getSplitParagraphOps = function(indexOffset) {
  var ops = [];
  var selection = this.article.selection;
  var currentParagraph = selection.getParagraphAtEnd();
  var currentIndex = currentParagraph.section.paragraphs.indexOf(
      currentParagraph);
  var afterCursorText = currentParagraph.text.substring(
      selection.end.offset, currentParagraph.text.length);
  var beforeCursorText = currentParagraph.text.substring(
      0, selection.start.offset);
  var uid = Utils.getUID();
  ops.push({
    do: {
      op: 'insertParagraph',
      section: selection.end.paragraph.section.name,
      paragraph: uid,
      index: currentIndex + 1 + indexOffset
    },
    undo: {
      op: 'deleteParagraph',
      paragraph: uid
    }
  });

  ops.push({
    do: {
      op: 'updateParagraph',
      paragraph: currentParagraph.name,
      cursorOffset: beforeCursorText.length,
      value: beforeCursorText,
    },
    undo: {
      op: 'updateParagraph',
      paragraph: currentParagraph.name,
      cursorOffset: beforeCursorText.length,
      value: currentParagraph.text
    }
  });

  ops.push({
    do: {
      op: 'updateParagraph',
      paragraph: uid,
      cursorOffset: 0,
      value: afterCursorText,
    },
    undo: {
      op: 'updateParagraph',
      paragraph: uid,
      cursorOffset: 0,
      value: ''
    }
  });

  return ops;
};


/**
 * Generates the operations needed to merge two paragraphs.
 * TODO(mkhatib): Figure out a way to handle this without discarding the formats
 * of the text in the paragraphs.
 * @param  {Paragraph} firstP First Paragraph.
 * @param  {Paragraph} secondP Second Paragraph.
 * @param  {number} indexOffset Offset to add to paragraphs index.
 * @return {Array.<Object>} List of operations to merge the paragraphs.
 */
Editor.prototype.getMergeParagraphsOps = function(
    firstP, secondP, indexOffset) {
  var ops = [];
  var secondPIndex = secondP.section.paragraphs.indexOf(secondP);
  var offsetAfterOperation = firstP.text.length;

  ops.push({
    do: {
      op: 'updateParagraph',
      paragraph: secondP.name,
      cursorOffset: 0,
      value: '',
    },
    undo: {
      op: 'updateParagraph',
      paragraph: secondP.name,
      cursorOffset: 0,
      value: secondP.text
    }
  });

  ops.push({
    do: {
      op: 'deleteParagraph',
      paragraph: secondP.name
    },
    undo: {
      op: 'insertParagraph',
      section: secondP.section.name,
      paragraph: secondP.name,
      index: secondPIndex + indexOffset
    }
  });

  ops.push({
    do: {
      op: 'updateParagraph',
      paragraph: firstP.name,
      cursorOffset: offsetAfterOperation,
      value: firstP.text + secondP.text,
    },
    undo: {
      op: 'updateParagraph',
      paragraph: firstP.name,
      cursorOffset: offsetAfterOperation,
      value: firstP.text
    }
  });

  return ops;
};


/**
 * Handles paste event for the editor.
 * @param  {Event} event Paste Event.
 */
Editor.prototype.handlePaste = function(event) {
  var pastedContent;
  if (window.clipboardData && window.clipboardData.getData) { // IE
    pastedContent = window.clipboardData.getData('Text');
  } else if (event.clipboardData && event.clipboardData.getData) {
    pastedContent = event.clipboardData.getData('text/html');
  }

  var tempEl = document.createElement('div');
  tempEl.innerHTML = pastedContent;

  var ops = this.processPastedContent(tempEl);
  this.article.transaction(ops);

  event.preventDefault();
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this paragraph.
 */
Editor.prototype.getJSONModel = function() {
  return this.article.getJSONModel();
};


/**
 * Sanitizes and generates list of operations to properly insert pasted
 * content into the article.
 *
 * TODO(mkhatib): Probably move this to its own module and
 * make it easier for people to customize or override this with
 * their own sanitizer.
 *
 * @param  {HTMLElement} element HTML Element to sanitize and create ops for.
 * @return {Array.<Object>} List of operations objects that represents the
 * the pasted content.
 */
Editor.prototype.processPastedContent = function(element, indexOffset) {
  var ops = [];
  var text, uid, paragraphType, appendOperations;
  var textPasted = element.innerText;
  var children = element.childNodes;

  var selection = this.article.selection;
  var currentParagraph = selection.start.paragraph;
  var section = selection.getSectionAtStart();
  var startParagraphIndex = section.paragraphs.indexOf(currentParagraph);
  var currentIndex = indexOffset || startParagraphIndex;
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  var INLINE_ELEMENTS = 'B BR BIG I SMALL ABBR ACRONYM CITE EM STRONG A BDO'+
      ' SPAN SUB SUP #text'.split(' ');

  function hasOnlyInlineChildNodes(elem) {
    var children = elem.childNodes;
    for (var i = 0; i < children.length ; i++) {
      if (INLINE_ELEMENTS.indexOf(children[i].nodeName) === -1) {
        return false;
      }
    }
    return true;
  }

  function getTextProp(el) {
    var textProp;

    if (el.nodeType === Node.TEXT_NODE) {
      textProp = "data";
    } else if (isFirefox) {
      textProp = "textContent";
    } else {
      textProp = "innerText";
    }

    return textProp;
  }

  function isInlinePaste(children) {
    var metaNodes = 0;
    for (var i = 0; i < children.length; i++) {
      if (children[i] && children[i].nodeName.toLowerCase() === 'meta') {
        metaNodes++;
      }
    }

    if (children.length - metaNodes < 2) {
      return true;
    }
  }

  if (!children || !children.length || isInlinePaste(children)) {

    // Text before and after pasting.
    var textStart = currentParagraph.text.substring(0, selection.start.offset);

    // Calculate cursor offset before and after pasting.
    var offsetAfterOperation = (textStart + textPasted).length;
    var offsetBeforeOperation = textStart.length;

    ops.push({
      do: {
        op: 'insertChars',
        paragraph: currentParagraph.name,
        cursorOffset: offsetAfterOperation,
        value: textPasted,
        index: offsetBeforeOperation
      },
      undo: {
        op: 'removeChars',
        paragraph: currentParagraph.name,
        cursorOffset: offsetBeforeOperation,
        index: offsetBeforeOperation,
        count: textPasted.length
      }
    });
  } else {
    // When pasting multi-line split the current paragraph if pasting
    // mid-paragraph.
    if (!selection.isCursorAtEnding()) {
      ops.push.apply(ops, this.getSplitParagraphOps(
          currentIndex));
    }
    currentIndex++;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      var tag = el.nodeName && el.nodeName.toLowerCase();
      switch (tag) {
        // These tags are currently unsupported for paste and are stripped out.
        case undefined:
        case 'meta':
        case 'script':
        case 'style':
        case 'embed':
        case 'br':
        case 'hr':
        case 'img':
        case 'figure':
          continue;
        // All the following will just insert a normal paragraph for now.
        // TODO(mkhatib): When the editor supports more paragraph types
        // fix this to allow pasting lists and other types.
        case 'ul':
        case 'ol':
        case 'p':
        case '#text':
          paragraphType = Paragraph.Types.Paragraph;
          break;
        case 'blockquote':
          paragraphType = Paragraph.Types.Quote;
          break;
        case 'h1':
          paragraphType = Paragraph.Types.MainHeader;
          break;
        case 'h2':
          paragraphType = Paragraph.Types.SecondaryHeader;
          break;
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          paragraphType = Paragraph.Types.ThirdHeader;
          break;
        case 'pre':
          paragraphType = Paragraph.Types.Code;
          break;


        default:
          // To preserve inline styling.
          if (hasOnlyInlineChildNodes(children[i])) {
            // TODO(mkhatib): This is here to preserve inline styling, which
            // is currently unsupported by the editor. Once this is added
            // change this to reflect that. Currently just add a non-styled
            // paragraph.
            paragraphType = Paragraph.Types.Paragraph;
          } else {
            // In case there are still more block elements, recursively get
            // their operations and add them to the operations list.

            // TODO(mkhatib): This is very clumsy and not very readable, move
            // the recursive process to its own helper method and make it more
            // readable.
            appendOperations = this.processPastedContent(
                children[i], currentIndex);

            // Increase the currentIndex by the amount of paragraphs we've added
            // which is the amount of operations over 2 (2 operations per
            // paragraph, one insert one update.).
            currentIndex += appendOperations.length/2;
          }
      }

      if (appendOperations) {
        Array.prototype.push.apply(ops, appendOperations);
      } else {
        // Add an operation to insert new paragraph and update its text.
        uid = Utils.getUID();
        text = el[getTextProp(el)];
        ops.push({
          do: {
            op: 'insertParagraph',
            section: section.name,
            paragraph: uid,
            index: currentIndex++,
            paragraphType: paragraphType
          },
          undo: {
            op: 'deleteParagraph',
            paragraph: uid,
          }
        });
        ops.push({
          do: {
            op: 'updateParagraph',
            paragraph: uid,
            cursorOffset: text.length,
            value: text
          },
          undo: {
            op: 'updateParagraph',
            paragraph: uid,
            cursorOffset: 0,
            value: ''
          }
        });
      }
    }
  }
  return ops;
};


/**
 * Handles cut event for the editor.
 */
Editor.prototype.handleCut = function() {
  var ops = this.getDeleteSelectionOps();
  var article = this.article;
  var dispatchEvent = this.dispatchEvent.bind(this);
  setTimeout(function() {
    article.transaction(ops);
    dispatchEvent(new Event('change'));
  }, 20);
};

