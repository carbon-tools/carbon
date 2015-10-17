'use strict';

var Article = require('./article');
var Paragraph = require('./paragraph');
var Figure = require('./figure');
var Section = require('./section');
var Utils = require('./utils');
var FormattingExtension = require('./extensions/formatting');
var ShortcutsManager = require('./extensions/shortcutsManager');
var ComponentFactory = require('./extensions/componentFactory');


/**
 * Editor main.
 * @param {HTMLElement} element Editor element to decorate.
 * @param {Object} optParams Optional params to initialize the editor.
 * Default:
 *   {
 *     extensions: [new FormattingExtension()]
 *   }
 */
var Editor = function (element, optParams) {

  // Override default params with passed ones if any.
  var params = Utils.extend({
    article: new Article({
      sections: [new Section({
        components: [new Paragraph({
          placeholder: 'Editor',
          paragraphType: Paragraph.Types.MainHeader
        })]
      })]
    }),
    // The extensions enabled in this editor.
    extensions: [
        // TODO(mkhatib): Handle different kind of shortcuts (e.g. formatting)
        new FormattingExtension(this)
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
  this.article = params.article;

  /**
   * Shortcuts manager to handle keyboard shortcuts on the editor.
   * @type {ShortcutsManager}
   */
  this.shortcutsManager = new ShortcutsManager(this);

  /**
   * Registers, matches and create components based on registered regex.
   * @type {ComponentFactory}
   */
  this.componentFactory = new ComponentFactory({
    componentsClasses: [Figure]
  });

  this.init();
};
Editor.prototype = new Utils.CustomEventTarget();
module.exports = Editor;


/**
 * Initialize the editor article model and event listeners.
 */
Editor.prototype.init = function() {
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
    component: this.article.sections[0].components[0],
    offset: 0
  });
};


/**
 * Handels `keydown` events.
 * @param  {Event} event Event object.
 */
Editor.prototype.handleKeyDownEvent = function(event) {
  var selection = this.article.selection, newP;
  var preventDefault = false;
  var ops = [];
  var inBetweenComponents = [];

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
    inBetweenComponents = section.getComponentsBetween(
        selection.getComponentAtStart(), selection.getComponentAtEnd());
    Utils.arrays.extend(ops, this.getDeleteSelectionOps());

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
  var currentComponent = selection.getComponentAtEnd();
  var currentIndex = currentComponent.section.components.indexOf(
      currentComponent);
  var nextComponent = currentComponent.getNextComponent();
  var prevComponent = currentComponent.getPreviousComponent();

  switch (event.keyCode) {
    // Enter.
    case 13:
      // TODO(mkhatib): I don't like that we keep checking if the component is
      // an instanceof Paragraph. Maybe find a better way to manage this.
      if (!selection.isCursorAtEnding() &&
          currentComponent instanceof Paragraph) {
        Utils.arrays.extend(ops, this.getSplitParagraphOps(
            -inBetweenComponents.length));
      } else if (nextComponent instanceof Paragraph &&
          nextComponent.isPlaceholder()) {
        // If the next paragraph is a placeholder, just move the cursor to it
        // and don't insert a new paragraph.
        selection.setCursor({
          component: nextComponent,
          offset: 0
        });
      } else {
        var factoryMethod;
        if (currentComponent instanceof Paragraph) {
          factoryMethod = this.componentFactory.match(
              currentComponent.text);
        }

        if (factoryMethod) {
          var atIndex = currentIndex - inBetweenComponents.length;

          // Delete current paragraph with its text.
          Utils.arrays.extend(ops, currentComponent.getDeleteOps(atIndex));
          var component = factoryMethod(currentComponent.text);
          component.section = selection.getSectionAtEnd();
          // Add the new component created from the text.
          Utils.arrays.extend(ops, component.getInsertOps(atIndex));
        }

        newP = new Paragraph({section: selection.getSectionAtEnd()});
        Utils.arrays.extend(
            ops, newP.getInsertOps(
                currentIndex - inBetweenComponents.length + 1));
      }

      this.article.transaction(ops);
      preventDefault = true;
      break;

    // Backspace.
    case 8:
      if (!(currentComponent instanceof Paragraph)) {
        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length));
        if (prevComponent) {
          this.article.transaction(ops);
          selection.setCursor({
            component: prevComponent,
            offset: prevComponent.getLength()
          });
        } else if (nextComponent) {
          this.article.transaction(ops);
          selection.setCursor({
            component: nextComponent,
            offset: 0
          });
        } else {
          newP = new Paragraph({section: selection.getSectionAtEnd()});
          Utils.arrays.extend(
              ops, newP.getInsertOps(
                  currentIndex - inBetweenComponents.length));
          this.article.transaction(ops);
        }
        preventDefault = true;
      } else if (selection.isCursorAtBeginning() && prevComponent) {
        offsetAfterOperation = 0;
        // If the cursor at the beginning of paragraph. Merge Paragraphs if the
        // previous component is a paragraph.
        if (prevComponent instanceof Paragraph) {
          offsetAfterOperation = prevComponent.text.length;

          Utils.arrays.extend(ops, this.getMergeParagraphsOps(
              prevComponent, currentComponent, -inBetweenComponents.length));
          this.article.transaction(ops);
        }

        selection.setCursor({
          component: prevComponent,
          offset: offsetAfterOperation
        });

        preventDefault = true;
      }
      break;

    // Delete.
    case 46:
      if (!(currentComponent instanceof Paragraph)) {
        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length));
        if (prevComponent) {
          this.article.transaction(ops);
          selection.setCursor({
            component: prevComponent,
            offset: prevComponent.getLength()
          });
        } else if (nextComponent) {
          this.article.transaction(ops);
          selection.setCursor({
            component: nextComponent,
            offset: 0
          });
        } else {
          newP = new Paragraph({section: selection.getSectionAtEnd()});
          Utils.arrays.extend(
              ops, newP.getInsertOps(
                  currentIndex - inBetweenComponents.length));
          this.article.transaction(ops);
        }
        preventDefault = true;
      } else if (selection.isCursorAtEnding() && nextComponent) {
        // If cursor at the end of the paragraph. Merge Paragraphs if the
        // next component is a paragraph.
        if (nextComponent instanceof Paragraph) {
          offsetAfterOperation = currentComponent.text.length;

          Utils.arrays.extend(ops, this.getMergeParagraphsOps(
              currentComponent, nextComponent, -inBetweenComponents.length));

          this.article.transaction(ops);

          selection.setCursor({
            component: currentComponent,
            offset: offsetAfterOperation
          });
        } else {
          selection.setCursor({
            component: nextComponent,
            offset: 0
          });
        }
        preventDefault = true;
      }
      break;
    default:
      break;
  }

  if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  } else if (currentComponent && Utils.willTypeCharacter(event)) {
    // Update current paragraph internal text model.
    var oldValue = currentComponent.text;
    var article = this.article;
    var isRemoveOp = [46, 8].indexOf(event.keyCode) !== -1;
    var cursorOffsetDirection = 1;
    if (event.keyCode === 8) {
      cursorOffsetDirection = -1;
    } else if (event.keyCode === 46) {
      cursorOffsetDirection = 0;
    }

    setTimeout(function() {
      var newValue = currentComponent.dom.innerText;
      var newOffset = selection.end.offset + cursorOffsetDirection;

      if (!isRemoveOp) {
        var insertedChar = newValue.charAt(
            Math.min(newOffset, newValue.length) - 1);
        Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
            insertedChar, selection.end.offset));
      } else if (oldValue) {
        var deletedChar = oldValue.charAt(newOffset);
        Utils.arrays.extend(ops, currentComponent.getRemoveCharsOps(
            deletedChar, newOffset, cursorOffsetDirection));
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
  var inBetweenComponents = section.getComponentsBetween(
      selection.getComponentAtStart(), selection.getComponentAtEnd());

  for (var i = 0; i < inBetweenComponents.length; i++) {
    Utils.arrays.extend(ops, inBetweenComponents[i].getDeleteOps(-i));
  }

  if (selection.getComponentAtEnd() !== selection.getComponentAtStart()) {
    var lastParagraphOldText = selection.getComponentAtEnd().text;
    var lastParagraphText = lastParagraphOldText.substring(
        selection.end.offset, lastParagraphOldText.length);

    var lastComponent = selection.getComponentAtEnd();
    Utils.arrays.extend(ops, lastComponent.getDeleteOps(
        -inBetweenComponents.length));

    var firstParagraphOldText = selection.getComponentAtStart().text;
    var firstParagraphText = firstParagraphOldText.substring(
        selection.start.offset, firstParagraphOldText.length);

    var startParagraph = selection.getComponentAtStart();
    var startParagraphFormats = startParagraph.getFormatsForRange(
        selection.start.offset, firstParagraphOldText.length);

    var selectRange = firstParagraphOldText.length - selection.start.offset;
    Utils.arrays.extend(ops, startParagraph.getUpdateOps({
      formats: startParagraphFormats
    }, selection.start.offset, selectRange));

    Utils.arrays.extend(ops, startParagraph.getRemoveCharsOps(
        firstParagraphText, selection.start.offset));

    var lastCount = lastParagraphOldText.length - lastParagraphText.length;
    Utils.arrays.extend(ops, startParagraph.getInsertCharsOps(
        lastParagraphText, selection.start.offset));

    var endParagraphFormatting = selection.getComponentAtEnd().getFormatsForRange(
        selection.end.offset, lastParagraphOldText.length);
    var formatShift = -lastCount + selection.start.offset;
    for (var k = 0; k < endParagraphFormatting.length; k++) {
      endParagraphFormatting[k].from += formatShift;
      endParagraphFormatting[k].to += formatShift;
    }

    Utils.arrays.extend(ops, startParagraph.getUpdateOps({
      formats: endParagraphFormatting
    }, firstParagraphOldText.length - firstParagraphText.length));
  } else {
    var currentComponent = selection.getComponentAtStart();
    var selectedText = currentComponent.text.substring(
        selection.start.offset, selection.end.offset);
    count = selection.end.offset - selection.start.offset;
    var currentComponentFormats = currentComponent.getFormatsForRange(
        selection.start.offset, selection.end.offset);

    Utils.arrays.extend(ops, currentComponent.getUpdateOps({
      formats: currentComponentFormats
    }, selection.start.offset, count));

    Utils.arrays.extend(ops, currentComponent.getRemoveCharsOps(
        selectedText, selection.start.offset));
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
  var currentComponent = selection.getComponentAtEnd();
  var currentIndex = currentComponent.section.components.indexOf(
      currentComponent);
  var afterCursorText = currentComponent.text.substring(
      selection.end.offset, currentComponent.text.length);

  var afterCursorFormats = currentComponent.getFormatsForRange(
      selection.start.offset, currentComponent.text.length);

  Utils.arrays.extend(ops, currentComponent.getUpdateOps({
    formats: afterCursorFormats
  }, selection.start.offset));

  Utils.arrays.extend(ops, currentComponent.getRemoveCharsOps(
      afterCursorText, selection.start.offset));

  var afterCursorShiftedFormats = Utils.clone(afterCursorFormats);
  var formatShift = -selection.start.offset;
  for (var k = 0; k < afterCursorShiftedFormats.length; k++) {
    afterCursorShiftedFormats[k].from += formatShift;
    afterCursorShiftedFormats[k].to += formatShift;
  }

  var newP = new Paragraph({
      section: selection.getSectionAtEnd(),
      text: afterCursorText,
      formats: afterCursorShiftedFormats
  });
  Utils.arrays.extend(
      ops, newP.getInsertOps(currentIndex + indexOffset + 1));

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
  var offsetAfterOperation = firstP.text.length;

  Utils.arrays.extend(ops, secondP.getDeleteOps(-indexOffset));

  Utils.arrays.extend(ops, firstP.getInsertCharsOps(
      secondP.text, offsetAfterOperation));

  var secondPFormatting = Utils.clone(secondP.formats);
  var formatShift = firstP.text.length;
  for (var k = 0; k < secondPFormatting.length; k++) {
    secondPFormatting[k].from += formatShift;
    secondPFormatting[k].to += formatShift;
  }

  Utils.arrays.extend(ops, firstP.getUpdateOps({
    formats: secondPFormatting
  }, offsetAfterOperation));

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
    pastedContent = event.clipboardData.getData('text/html') ||
        event.clipboardData.getData('text/plain');
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
  var text, paragraphType, appendOperations;
  var textPasted = element.innerText;
  var children = element.childNodes;
  var component;
  var selection = this.article.selection;
  var currentComponent = selection.getComponentAtStart();
  var section = selection.getSectionAtStart();
  var startParagraphIndex = section.components.indexOf(currentComponent);
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
    var textStart = currentComponent.text.substring(0, selection.start.offset);

    // Calculate cursor offset before pasting.
    var offsetBeforeOperation = textStart.length;

    Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
        textPasted, offsetBeforeOperation));
  } else {
    // When pasting multi-line split the current paragraph if pasting
    // mid-paragraph.
    if (!selection.isCursorAtEnding()) {
      Utils.arrays.extend(ops, this.getSplitParagraphOps(
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
          continue;
        case 'figure':
          var allImgs = el.getElementsByTagName('img');
          if (!allImgs || !allImgs.length) {
            continue;
          }
          var imgOps = [];
          for (var j = 0; j < allImgs.length; j++) {
            component = new Figure({
              src: allImgs[j].getAttribute('src')
            });
            component.section = selection.getSectionAtEnd();
            Utils.arrays.extend(
                imgOps, component.getInsertOps(currentIndex++));
          }

          // TODO(mkhatib): Images are copied twice. Investigate.
          appendOperations = imgOps;
          break;
        case 'img':
          component = new Figure({
            src: el.getAttribute('src')
          });
          component.section = selection.getSectionAtEnd();
          appendOperations = component.getInsertOps(currentIndex++);
          break;
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
        Utils.arrays.extend(ops, appendOperations);
      } else {
        // Add an operation to insert new paragraph and update its text.
        text = el[getTextProp(el)];

        var newP = new Paragraph({
            section: section,
            text: text,
            paragraphType: paragraphType
        });
        Utils.arrays.extend(
            ops, newP.getInsertOps(currentIndex++));
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

