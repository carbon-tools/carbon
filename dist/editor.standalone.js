(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.manshar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Selection = require('./selection');
var Paragraph = require('./paragraph');
var Utils = require('./utils');


/**
 * Article main.
 * @param {Object} optParams Optional params to initialize the Article object.
 * Default:
 *   {
 *     sections: []
 *   }
 */
var Article = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The sections that is in this article.
    sections: []
  }, optParams);

  /**
   * Selection object.
   * @type {Selection}
   */
  this.selection = Selection.getInstance();

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Article.TAG_NAME);

  /**
   * The article sections.
   * @type {Array.<Section>}
   */
  this.sections = [];
  for (var i = 0; i < params.sections.length; i++) {
    this.insertSection(params.sections[i]);
  }

  /**
   * Operations history on the article.
   * @type {Array.<Object>}
   */
  this.history = [];

  /**
   * Currently at history point.
   * @type {number}
   */
  this.historyAt = 0;

};
module.exports = Article;

/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Article.TAG_NAME = 'article';


/**
 * Inserts a new section in article.
 * @param  {Section} section Section object.
 * @return {Section} The inserted section.
 */
Article.prototype.insertSection = function(section) {
  // Section should always have a paragraph when inserted into article.
  if (!section.paragraphs || !section.paragraphs.length) {
    section.insertParagraphAt(new Paragraph(), 0);
  }

  this.sections.push(section);
  this.dom.appendChild(section.dom);
  return section;
};


/**
 * Removes a section from article.
 * @param  {Section} section Section to remove.
 * @return {Section} Removed section.
 */
Article.prototype.removeSection = function(section) {
  var index = this.sections.indexOf(section);
  this.sections.splice(index, 1);
  return section;
};


// TODO: Implement.
Article.prototype.updateSection = function(section) {
  return section;
};


/**
 * Inserts a new paragraph in article.
 * @param  {Paragraph} paragraph Paragraph object.
 * @return {Paragraph} The inserted paragraph.
 */
Article.prototype.insertParagraph = function(paragraph) {
  var section = this.selection.getSectionAtEnd().
      insertParagraph(paragraph);
  return section;
};


/**
 * Removes a paragraph from article.
 * @param  {Paragraph} paragraph Paragraph to remove.
 * @return {Paragraph} Removed paragraph.
 */
Article.prototype.removeParagraph = function(paragraph) {
  var index = this.sections.indexOf(paragraph);
  this.paragraphs.splice(index, 1);
  return paragraph;
};


// TODO: Implement.
Article.prototype.updateParagraph = function(paragraph) {
  return paragraph;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Article.prototype.getJSONModel = function() {
  var article = {
    sections: []
  };

  for (var i = 0; i < this.sections.length; i++) {
    article.sections.push(this.sections[i].getJSONModel());
  }

  return article;
};


/**
 * Apply list of operations to the article model.
 * @param  {Array.<Object>} ops List of operations to apply.
 */
Article.prototype.transaction = function(ops) {
  if (this.historyAt < this.history.length) {
    this.history.splice(
        this.historyAt, this.history.length - this.historyAt);
  }
  this.history.push(ops);
  this.do();
};


/**
 * Executes the next available operation in the article history.
 */
Article.prototype.do = function() {
  var ops = this.history[this.historyAt++];

  for (var i = 0; i < ops.length; i++) {
    this.exec(ops[i], 'do');
  }
};


/**
 * Executes an operation in the history only if there were any.
 */
Article.prototype.redo = function() {
  if (this.historyAt < this.history.length) {
    this.do();
  }
};


/**
 * Executes the reverse (undo) part of an operation.
 */
Article.prototype.undo = function() {
  if (this.historyAt > 0) {
    var ops = this.history[--this.historyAt];

    for (var i = ops.length - 1; i >= 0; i--) {
      this.exec(ops[i], 'undo');
    }
  }
};


/**
 * Executes an operation with the passed action.
 * @param  {Object} operation An operation object to execute.
 * @param  {string} action Can be 'do' or 'undo'.
 */
Article.prototype.exec = function(operation, action) {
  var op = operation[action].op;
  var paragraph;
  if (op === 'updateText') {
    var value = operation[action].value;
    var paragraphName = operation[action].paragraph;
    paragraph = this.getParagraphByName(paragraphName);
    paragraph.setText(value);

    var selection = this.selection;
    setTimeout(function() {
      // Allow DOM to reflect the updated text before moving the cursor.
      selection.setCursor({
        paragraph: paragraph,
        offset: operation[action].cursorOffset
      });
    }, 5);

  } else if (op === 'deleteParagraph') {
    paragraph = this.getParagraphByName(operation[action].paragraph);
    paragraph.section.removeParagraph(paragraph);
  } else if (op === 'insertParagraph') {
    var section = this.getSectionByName(operation[action].section);
    section.insertParagraphAt(new Paragraph({
      name: operation[action].paragraph
    }), operation[action].index);
  }
};


/**
 * Returns the section that has the specific name.
 * @param  {string} name Name of the section.
 * @return {Section} Section with the passed name.
 */
Article.prototype.getSectionByName = function(name) {
  for (var i = 0; i < this.sections.length; i++) {
    if (this.sections[i].name === name) {
      return this.sections[i];
    }
  }
};


/**
 * Returns the paragraph that has the specific name.
 * @param  {string} name Name of the paragraph.
 * @return {Paragraph} Paragraph with the passed name.
 */
Article.prototype.getParagraphByName = function(name) {
  for (var i = 0; i < this.sections.length; i++) {
    for (var j = 0; j < this.sections[i].paragraphs.length; j++) {
      if (this.sections[i].paragraphs[j].name === name) {
        return this.sections[i].paragraphs[j];
      }
    }
  }
};

},{"./paragraph":4,"./selection":6,"./utils":7}],2:[function(require,module,exports){
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

  return ops;
};


/**
 * Generates the operations needed to merge two paragraphs.
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
      op: 'updateText',
      paragraph: secondP.name,
      cursorOffset: 0,
      value: '',
    },
    undo: {
      op: 'updateText',
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
      op: 'updateText',
      paragraph: firstP.name,
      cursorOffset: offsetAfterOperation,
      value: firstP.text + secondP.text,
    },
    undo: {
      op: 'updateText',
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

  // TODO(mkhatib): Before anything, if any text is selected, delete it.
  var ops = this.processPastedContent(pastedContent);
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
 * @param  {string} html HTML code to sanitize.
 * @return {Array.<Object>} List of operations objects that represents the
 * the pasted content.
 */
Editor.prototype.processPastedContent = function(html) {
  var ops = [];
  var tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  var textPasted = tempDiv.innerText;
  // var lines = tempDiv.innerText.split('\n');
  // var children = tempDiv.childNodes;

  // TODO(mkhatib): This single updateText operation should only be applied
  // to single lines paste.

  // if (!children || !children.length || lines.length < 2) {

  var selection = this.article.selection;
  var currentParagraph = selection.start.paragraph;

  // Text before and after pasting.
  var textStart = currentParagraph.text.substring(0, selection.start.offset);
  var textEnd = currentParagraph.text.substring(
      selection.start.offset, currentParagraph.text.length);

  // Calculate cursor offset before and after pasting.
  var offsetAfterOperation = (textStart + textPasted).length - 1;
  var offsetBeforeOperation = textStart.length;

  ops.push({
    do: {
      op: 'updateText',
      paragraph: currentParagraph.name,
      cursorOffset: offsetAfterOperation,
      value: textStart + textPasted + textEnd
    },
    undo: {
      op: 'updateText',
      paragraph: currentParagraph.name,
      cursorOffset: offsetBeforeOperation,
      value: currentParagraph.text
    }
  });
  // }
  return ops;
};

},{"./article":1,"./paragraph":4,"./section":5,"./utils":7}],3:[function(require,module,exports){
'use strict';

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.Section = require('./section');
module.exports.Selection = require('./selection');

},{"./article":1,"./editor":2,"./paragraph":4,"./section":5,"./selection":6}],4:[function(require,module,exports){
'use strict';

var Utils = require('./utils');


/**
 * Paragraph main.
 * @param {Object} optParams Optional params to initialize the Paragraph object.
 * Default:
 *   {
 *     text: '',
 *     placeholderText: null,
 *     paragraphType: Paragraph.Types.Paragraph,
 *     name: Utils.getUID()
 *   }
 */
var Paragraph = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // Text rendered in this paragraph.
    text: '',
    // If you want to show a placeholder if there was no text.
    placeholderText: null,
    // Paragraph Type one of Paragraph.Types string.
    paragraphType: Paragraph.Types.Paragraph,
    // Generate a UID as a reference for this paragraph.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this paragraph.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this paragraph.
   * @type {string}
   */
  this.text = params.text;

  /**
   * Placeholder text to show if the paragraph is empty.
   * @type {string}
   */
  this.placeholderText = params.placeholderText;

  this.markups = [];

  this.metadata = {};

  this.layout = {};

  /**
   * Section this paragraph belongs to.
   * @type {Section}
   */
  this.section = null;

  /**
   * Paragraph type.
   * @type {string}
   */
  this.paragraphType = params.paragraphType;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(this.paragraphType);
  this.dom.setAttribute('name', this.name);

  if (this.placeholderText) {
    this.dom.setAttribute('placeholder', this.placeholderText);
  } else if (!this.text.length) {
    // Content Editable won't be able to set the cursor for an empty element
    // so we use the zero-length character to workaround that.
    this.dom.innerHTML = '&#8203;';
  }

  this.setText(params.text);
};
module.exports = Paragraph;

// TODO(mkhatib): Maybe define each type as a new function
// instead of putting all the logic for rendering all of these
// under Paragraph.
/**
 * Differet types of a paragraph.
 * @type {Enum}
 */
Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Media: 'figure',
  Embed: 'embed',
  Iframe: 'iframe'
};


/**
 * Updates the text for the paragraph.
 * @param {string} text Text to update to.
 */
Paragraph.prototype.setText = function(text) {
  this.text = text || '';
  if (!this.text.length && !this.placeholderText) {
    this.dom.innerHTML = '&#8203;';
  } else {
    this.dom.innerText = this.text;
  }
};


/**
 * Whether this is a placeholder element.
 * @return {boolean} True if has placeholder text and no input text.
 */
Paragraph.prototype.isPlaceholder = function() {
  return !!this.placeholderText && !this.text.length;
};


/**
 * Get the next paragraph if any.
 * @return {Paragraph} Next sibling paragraph.
 */
Paragraph.prototype.getNextParagraph = function() {
  if (this.section) {
    var i = this.section.paragraphs.indexOf(this);
    return this.section.paragraphs[i + 1];
  }
};


/**
 * Get the previous paragraph if any.
 * @return {Paragraph} Previous sibling paragraph.
 */
Paragraph.prototype.getPreviousParagraph = function() {
  if (this.section) {
    var i = this.section.paragraphs.indexOf(this);
    return this.section.paragraphs[i - 1];
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this paragraph.
 */
Paragraph.prototype.getJSONModel = function() {
  var paragraph = {
    name: this.name,
    text: this.text,
    paragraphType: this.paragraphType
  };

  return paragraph;
};

},{"./utils":7}],5:[function(require,module,exports){
'use strict';

var Selection = require('./selection');
var Utils = require('./utils');


/**
 * Section main.
 * @param {Object} optParams Optional params to initialize the Section object.
 * Default:
 *   {
 *     paragraphs: [],
 *     backgorund: {},
 *     name: Utils.getUID()
 *   }
 */
var Section = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The paragraphs that is in this section.
    paragraphs: [],
    // The background of this section.
    background: {},
    // Generate a UID as a reference for this section.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this Section.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Background settings
   * @type {Object}
   */
  this.background = params.background;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Section.TAG_NAME);
  this.dom.setAttribute('name', this.name);

  /**
   * The section paragraphs.
   * @type {Array.<Paragraph>}
   */
  this.paragraphs = [];
  for (var i = 0; i < params.paragraphs.length; i++) {
    this.insertParagraphAt(params.paragraphs[i], i);
  }

};
module.exports = Section;

/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Section.TAG_NAME = 'section';


/**
 * Inserts a paragraph in the section.
 * @param  {Paragraph} paragraph Paragraph to insert.
 * @param  {number} index Where to insert the paragraph.
 * @return {Paragraph} The inserted paragraph.
 */
Section.prototype.insertParagraphAt = function(paragraph, index) {
  // Update paragraph section reference to point to this section.
  paragraph.section = this;

  // Get current paragraph and its index in the section.
  var nextParagraph = this.paragraphs[index];

  if (!nextParagraph) {
    // If the last paragraph in the section append it to the section.
    this.dom.appendChild(paragraph.dom);
  } else {
    // Otherwise insert it before the next paragraph.
    this.dom.insertBefore(paragraph.dom, nextParagraph.dom);
  }

  this.paragraphs.splice(index, 0, paragraph);

  // Set the cursor to the new paragraph.
  Selection.getInstance().setCursor({
    paragraph: paragraph,
    offset: 0
  });

  return paragraph;
};

/**
 * Removes a paragraph from a section.
 * @param  {Paragraph} paragraph To remove from section.
 * @return {Paragraph} Removed paragraph.
 */
Section.prototype.removeParagraph = function(paragraph) {
  var index = this.paragraphs.indexOf(paragraph);
  var removedParagraph = this.paragraphs.splice(index, 1)[0];
  this.dom.removeChild(removedParagraph.dom);
  return removedParagraph;
};


/**
 * Returns paragraphs from a section between two paragraphs (exclusive).
 * @param  {Paragraph} startParagraph Starting paragraph.
 * @param  {Paragraph} endParagraph Ending paragraph.
 */
Section.prototype.getParagraphsBetween = function(
    startParagraph, endParagraph) {
  var paragraphs = [];
  var startIndex = this.paragraphs.indexOf(startParagraph) + 1;
  var endIndex = this.paragraphs.indexOf(endParagraph);
  for (var i = startIndex; i < endIndex; i++) {
    paragraphs.push(this.paragraphs[i]);
  }
  return paragraphs;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    paragraphs: []
  };

  for (var i = 0; i < this.paragraphs.length; i++) {
    section.paragraphs.push(this.paragraphs[i].getJSONModel());
  }

  return section;
};

},{"./selection":6,"./utils":7}],6:[function(require,module,exports){
'use strict';

var Utils = require('./utils');


/**
 * Selection singletone class.
 */
var Selection = (function() {


    /** Singletone Constructor. */
    var Selection = function() {

      /**
       * Selection start point.
       * @type {Object}
       */
      this.start = {
        paragraph: null,
        offset: null
      };

      /**
       * Selection end point.
       * @type {Object}
       */
      this.end = {
        paragraph: null,
        offset: null
      };
    };


    /**
     * Resets selection start and end point.
     */
    Selection.prototype.reset = function() {
      this.start = {
        paragraph: null,
        offset: null
      };

      this.end = {
        paragraph: null,
        offset: null
      };
    };

    /**
     * Returns the paragraph object at the start of the selection.
     * @return {Paragraph} The paragraph object at the start of selection.
     */
    Selection.prototype.getParagraphAtStart = function() {
      if (this.start) {
        return this.start.paragraph;
      }
    };


    /**
     * Returns the paragraph object at the end of the selection.
     * @return {Paragraph} The paragraph object at the end of selection.
     */
    Selection.prototype.getParagraphAtEnd = function() {
      if (this.end) {
        return this.end.paragraph;
      }
    };


    /**
     * Returns the section object at the start of the selection.
     * @return {Section} The section object at the start of selection.
     */
    Selection.prototype.getSectionAtStart = function() {
      if (this.getParagraphAtStart()) {
        return this.getParagraphAtStart().section;
      }
    };


    /**
     * Returns the section object at the end of the selection.
     * @return {Section} The section object at the end of selection.
     */
    Selection.prototype.getSectionAtEnd = function() {
      if (this.getParagraphAtEnd()) {
        return this.getParagraphAtEnd().section;
      }
    };


    /**
     * Sets the cursor on the selection.
     * @param {Object} cursor An object with `paragraph` and `offset`.
     */
    Selection.prototype.setCursor = function(cursor) {
      // Update start and end points to the cursor value.
      this.start = {
        paragraph: cursor.paragraph,
        offset: cursor.offset
      };

      this.end = {
        paragraph: cursor.paragraph,
        offset: cursor.offset
      };

      // Reflect the update to the cursor to the browser selection.
      this.updateWindowSelectionFromModel();
    };


    /**
     * Updates the window selection from the selection model.
     */
    Selection.prototype.updateWindowSelectionFromModel = function() {
      var range = document.createRange();
      var startNode = this.start.paragraph.dom;
      // Select the #text node instead of the parent element.
      if (this.start.offset > 0) {
        startNode = startNode.firstChild;
      }
      range.setStart(startNode, this.start.offset);

      var endNode = this.end.paragraph.dom;
      // Select the #text node instead of the parent element.
      if (this.end.offset > 0) {
        endNode = endNode.firstChild;
      }
      range.setEnd(endNode, this.end.offset);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };


    /**
     * Updates the selection start and end point from a change on the browser
     * selection.
     */
    Selection.prototype.updateSelectionFromWindow = function() {
      var selection = window.getSelection();

      // Update the selection start point.
      var startNode = selection.anchorNode;
      var start = {
        offset: selection.anchorOffset
      };
      // TODO(mkhatib): Better logic is needed here to get to the node we're
      // interested in. When we start formatting text, there will be multiple
      // levels of nodes that we need to account for.
      if (startNode.nodeName === '#text') {
        startNode = startNode.parentNode;
      }
      start.paragraph = Utils.getReference(startNode.getAttribute('name'));

      // Update the selection end point.
      var endNode = selection.extentNode;
      var end = {
        offset: selection.extentOffset
      };
      if (endNode.nodeName === '#text') {
        endNode = endNode.parentNode;
      }
      end.paragraph = Utils.getReference(endNode.getAttribute('name'));

      var endIndex = end.paragraph.section.paragraphs.indexOf(end.paragraph);
      var startIndex = start.paragraph.section.paragraphs.indexOf(
          start.paragraph);
      var reversedSelection = ((end.paragraph === start.paragraph &&
          end.offset < start.offset) || startIndex > endIndex);

      this.end = reversedSelection ? start : end;
      this.start = reversedSelection ? end : start;
    };


    /**
     * Whether the cursor is at beginning of a paragraph.
     * @return {boolean} True if the cursor at the beginning of paragraph.
     */
    Selection.prototype.isCursorAtBeginning = function() {
      return this.start.offset === 0 && this.end.offset === 0;
    };


    /**
     * Whether the cursor is at ending of a paragraph.
     * @return {boolean} True if the cursor at the ending of paragraph.
     */
    Selection.prototype.isCursorAtEnding = function() {
      return (this.start.offset === this.start.paragraph.text.length &&
              this.end.offset === this.end.paragraph.text.length);
    };


    /**
     * Whether the selection is a range.
     * @return {boolean} True if a range is selected.
     */
    Selection.prototype.isRange = function() {
      return (this.start.paragraph != this.end.paragraph ||
              this.start.offset != this.end.offset);
    };


    /**
     * Initialize selection listeners to the element.
     * @param  {HTMLElement} element The html element to listen for slection
     * changes on.
     */
    Selection.prototype.initSelectionListener = function(element) {
      // On `mouseup` the mouse could have been clicked to move the cursor.
      element.addEventListener('mouseup',
          this.updateSelectionFromWindow.bind(this));

      // Clicking a key would probably also cause the cursor to move.
      element.addEventListener('keyup',
          this.updateSelectionFromWindow.bind(this));
    };

    var instance;
    return {
      /**
       * Returns the single instance of Selection.
       * @return {Selection} The selection instance.
       */
      getInstance: function() {
        if (!instance) {
          instance = new Selection();
          // Hide the constructor so the returned object can't be new'd.
          instance.constructor = null;
        }
        return instance;
      }
    };

})();
module.exports = Selection;

},{"./utils":7}],7:[function(require,module,exports){
'use strict';

var Utils = {};
module.exports = Utils;

/**
 * Stores global references for retreival.
 * @type {Object}
 */
Utils.GLOBAL_REFERENCE = {};

/**
 * Extends first object with second object and overrides its
 * attributes and returns a new object.
 *
 * Example:
 *
 *   var newObj = Utils.extend({name: 'mk', age: 14}, {name: 'rasha'});
 *   // newObj is now {name: 'rasha', age: 14}
 * @param  {Object} firstObj
 * @param  {Object} secondObj
 * @return {Object} Combined new object.
 */
Utils.extend = function(firstObj, secondObj) {
  var tmpObj = {}, attr;

  for (attr in firstObj) {
    tmpObj[attr] = firstObj[attr];
  }

  for (attr in secondObj) {
    tmpObj[attr] = secondObj[attr];
  }

  return tmpObj;
};


/**
 * Store a global reference for an object.
 * @param {string} key Key to store the object at.
 * @param {Object|string|number} value Any value you'd like to store at key.
 */
Utils.setReference = function(key, value) {
  Utils.GLOBAL_REFERENCE[key] = value;
};


/**
 * Get a global reference for an object.
 * @param {string} key Key to get the object at.
 */
Utils.getReference = function(key) {
  return Utils.GLOBAL_REFERENCE[key];
};


/**
 * Generates a random alphanumeric ID.
 * @param  {number} optLength Length of the ID to generate.
 * @return {string} Random alphanumeric ID.
 */
Utils.getUID = function(optLength) {
  var length = optLength || 4;
  var chars = [];
  var sourceSet = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    chars.push(sourceSet.charAt(Math.floor(Math.random() * sourceSet.length)));
  }

  return chars.join('');
};


/**
 * Whether an event will produce a character or not.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if the key will produce a change.
 */
Utils.willTypeCharacter = function(event) {
  var NO_CHANGE_KEYS = [
    // Command keys.
    16, 17, 18, 19, 20, 27,
    // Pages keys.
    33, 34, 35, 36,
    // Arrow keys.
    37, 38, 39, 40,
    // Other keys.
    45, 91, 92, 93,
    // Funcion Keys F1-F12
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    // Locks
    144, 145
  ];

  return (NO_CHANGE_KEYS.indexOf(event.keyCode) === -1 &&
          !event.ctrlKey && !event.metaKey);
};


/**
 * Checks if the event is undo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is undo.
 */
Utils.isUndo = function(event) {
  return !!((event.ctrlKey || event.metaKey) &&
          event.keyCode === 90 && !event.shiftKey);
};


/**
 * Checks if the event is redo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is redo.
 */
Utils.isRedo = function(event) {
  return !!((event.ctrlKey || event.metaKey) &&
          (event.keyCode === 89 ||
           (event.shiftKey && event.keyCode === 90)));
};


/**
 * Custom Event Target base class to allow listening and firing events.
 */
Utils.CustomEventTarget = function() {
  this._init();
};


/**
 * Initializes the custom event target.
 * @private
 */
Utils.CustomEventTarget.prototype._init = function() {
  this._registrations = {};
};


/**
 * Returns the listeners for the specific type.
 * @param  {string} type Event name.
 * @param  {boolean} useCapture
 * @return {Array.<function>} List of listeners.
 * @private
 */
Utils.CustomEventTarget.prototype._getListeners = function(type, useCapture) {
  var capType = (useCapture ? '1' : '0')+type;
  if (!(capType in this._registrations)) {
    this._registrations[capType] = [];
  }
  return this._registrations[capType];
};


/**
 * Adds event listener for object.
 * @param  {string} type Event name.
 * @param  {Function} listener Callback function.
 * @param  {boolean} useCapture
 */
Utils.CustomEventTarget.prototype.addEventListener = function(type, listener, useCapture) {
  var listeners = this._getListeners(type, useCapture);
  var ix = listeners.indexOf(listener);
  if (ix === -1) {
    listeners.push(listener);
  }
};


/**
 * Removes event listener for object.
 * @param  {string} type Event name.
 * @param  {Function} listener Callback function.
 * @param  {boolean} useCapture
 */
Utils.CustomEventTarget.prototype.removeEventListener = function(type, listener, useCapture) {
    var listeners = this._getListeners(type, useCapture);
    var ix = listeners.indexOf(listener);
    if (ix !== -1) {
      listeners.splice(ix, 1);
    }
};


/**
 * Dispatches the event
 * @param  {Event} event Event object.
 * @return {boolean} Whether the event has not been defaultPrevented.
 */
Utils.CustomEventTarget.prototype.dispatchEvent = function(event) {
  var listeners = this._getListeners(event.type, false).slice();
  for (var i= 0; i<listeners.length; i++) {
    listeners[i].call(this, event);
  }
  return !event.defaultPrevented;
};

},{}]},{},[3])(3)
});