'use strict';

var Article = require('./article');
var Selection = require('./selection');
var Paragraph = require('./paragraph');
var List = require('./list');
var Figure = require('./figure');
var Section = require('./section');
var Utils = require('./utils');
var FormattingExtension = require('./extensions/formattingExtension');
var ShortcutsManager = require('./extensions/shortcutsManager');
var ComponentFactory = require('./extensions/componentFactory');
var Toolbar = require('./toolbars/toolbar');
var ToolbeltExtension = require('./extensions/toolbeltExtension');
var UploadExtension = require('./extensions/uploadExtension');
var I18n = require('./i18n');


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
    modules: [],
    rtl: false,
    locale: 'en',
    article: new Article({
      sections: [new Section({
        components: [new Paragraph({
          placeholder: 'Editor'
        })]
      })]
    }),
  }, optParams);

  I18n.setCurrentLocale(params.locale);

  /**
   * Registers, matches and create components based on registered regex.
   * @type {ComponentFactory}
   */
  this.componentFactory = new ComponentFactory();

  /**
   * Unique name to identify the editor.
   * @type {string}
   */
  this.name = Utils.getUID();

  /**
   * Indicates if the editor is for an RTL article.
   * @type {boolean}
   */
  this.rtl = params.rtl;

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
  this.article.editor = this;

  /**
   * Shortcuts manager to handle keyboard shortcuts on the editor.
   * @type {ShortcutsManager}
   */
  this.shortcutsManager = new ShortcutsManager(this);

  /**
   * This editor's toolbars.
   * @type {Object.<String: Toolbar>}
   */
  this.toolbars = {};

  /**
   * Selection instance for the editor.
   * @type {Selection}
   */
  this.selection = Selection.getInstance();

  /**
   * Editor's inline toolbar.
   * @type {Toolbar}
   */
  var inlineToolbar = new Toolbar({
    name: Editor.INLINE_TOOLBAR_NAME,
    classNames: [Editor.INLINE_TOOLBAR_CLASS_NAME],
    rtl: this.rtl
  });
  this.registerToolbar(Editor.INLINE_TOOLBAR_NAME, inlineToolbar);

  /**
   * Editor's block toolbar.
   * @type {Toolbar}
   */
  var blockToolbar = new Toolbar({
    name: Editor.BLOCK_TOOLBAR_NAME,
    classNames: [Editor.BLOCK_TOOLBAR_CLASS_NAME],
    rtl: this.rtl
  });
  this.registerToolbar(Editor.BLOCK_TOOLBAR_NAME, blockToolbar);

  /**
   * Components installed and enabled in the editor.
   * @type {Object.<string, Function>}
   */
  this.installedModules = {};

  // Install built-in Components.
  this.install(Section);
  this.install(Paragraph);
  this.install(List);
  this.install(Figure);

  // Install built-in extensions.
  this.install(FormattingExtension);
  this.install(ToolbeltExtension);
  this.install(UploadExtension);

  // Install user provided components and extensions.
  for (var i = 0; i < params.modules.length; i++) {
    this.install(params.modules[i]);
  }


  this.composition_ = {
    component: null,
    start: null,
    update: null,
    end: null
  };

  this.init();
  this.setArticle(this.article);
};
Editor.prototype = new Utils.CustomEventTarget();
module.exports = Editor;


/**
 * Class name for the inline toolbar.
 * @type {String}
 */
Editor.INLINE_TOOLBAR_CLASS_NAME = 'editor-inline-toolbar';


/**
 * Class name for the inline toolbar.
 * @type {String}
 */
Editor.BLOCK_TOOLBAR_CLASS_NAME = 'editor-block-toolbar';


/**
 * Name of the block toolbar.
 * @type {string}
 */
Editor.BLOCK_TOOLBAR_NAME = 'block-toolbar';


/**
 * Name of the inline toolbar.
 * @type {string}
 */
Editor.INLINE_TOOLBAR_NAME = 'inline-toolbar';


/**
 * Name of the inline toolbar.
 * @type {string}
 */
Editor.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Loads Article model from JSON.
 * @param  {Object} json JSON representation of the article.
 */
Editor.prototype.loadJSON = function (json) {
  var article = Article.fromJSON(json);
  this.setArticle(article);
};


/**
 * Initialize the editor article model and event listeners.
 */
Editor.prototype.init = function() {
  this.selection.initSelectionListener(this.element);

  this.element.addEventListener('keydown', this.handleKeyDownEvent.bind(this));
  this.element.addEventListener('input', this.handleInputEvent.bind(this));
  this.element.addEventListener('cut', this.handleCut.bind(this));
  this.element.addEventListener('paste', this.handlePaste.bind(this));
  this.element.classList.add('carbon-editor');
  this.element.setAttribute('contenteditable', true);

  this.selection.addEventListener(
      Selection.Events.SELECTON_CHANGED,
      this.handleSelectionChanged.bind(this));
};


/**
 * Call to destroy the editor instance and cleanup dom and event listeners.
 */
Editor.prototype.destroy = function () {
  var name;
  for (name in this.toolbars) {
    if (this.toolbars[name].onDestroy) {
      this.toolbars[name].onDestroy();
    }
  }

  for (name in this.installedModules) {
    if (this.installedModules[name].onDestroy) {
      this.installedModules[name].onDestroy();
    }
  }

  this.componentFactory.onDestroy();
  this.shortcutsManager.onDestroy();
  this.selection.clearEventListeners();
};


/**
 * Sets the article model of the editor.
 * @param {Article} article Article object to use for the editor.
 */
Editor.prototype.setArticle = function(article) {
  article.editor = this;
  this.article = article;
};


/**
 * Renders the editor and article inside the element.
 */
Editor.prototype.render = function() {
  // TODO(mkhatib): Maybe implement a destroy on components to cleanup
  // and remove their DOM, listeners, in progress XHR or others.
  while (this.element.firstChild) {
    this.element.removeChild(this.element.firstChild);
  }
  this.article.render(this.element, {editMode: true});
  // this.element.appendChild(this.article.dom);
  this.selection.setCursor({
    component: this.article.sections[0].components[0],
    offset: 0
  });
  this.dispatchEvent(new Event('change'));
};


/**
 * Installs and activate a component type to use in the editor.
 * @param  {Function} ModuleClass The component class.
 * @param  {Object=} optArgs Optional arguments to pass to onInstall of module.
 * @param {boolean=} optForce Whether to force registeration.
 */
Editor.prototype.install = function(ModuleClass, optArgs, optForce) {
  if (this.installedModules[ModuleClass.CLASS_NAME] && !optForce) {
    console.warn(ModuleClass.CLASS_NAME +
        ' module has already been installed in this editor.');
  }
  this.installedModules[ModuleClass.CLASS_NAME] = ModuleClass;
  ModuleClass.onInstall(this, optArgs);
};


/**
 * Registers a keyboard shortcut in the editor.
 * @param  {string} shortcutId Shortcut string e.g. 'ctrl+b'.
 * @param  {Function} handler Callback handler for handling the shortcut.
 * @param  {boolean=} optForce Whether to override an already registered one.
 */
Editor.prototype.registerShrotcut = function(shortcutId, handler, optForce) {
  this.shortcutsManager.register(shortcutId, handler, optForce);
};


/**
 * Returns true if the editor is empty.
 * @return {boolean} True if the editor is empty
 */
Editor.prototype.isEmpty = function() {
  return this.article.getLength() === 0;
};


/**
 * Returns the first header paragraph in the article.
 * @return {string} First header of the article.
 */
Editor.prototype.getTitle = function() {
  return this.article.getTitle();
};


/**
 * Returns the first non-header paragraph in the article.
 * @return {string} First non-header paragraph of the article.
 */
Editor.prototype.getSnippet = function() {
  return this.article.getSnippet();
};


/**
 * Registers a toolbar with the editor.
 * @param  {string} name Name of the toolbar.
 * @param  {Toolbar} toolbar Toolbar object.
 */
Editor.prototype.registerToolbar = function (name, toolbar) {
  this.toolbars[name] = toolbar;
};


/**
 * Returns the toolbar registered in this editor with the provided name.
 * @param  {string} name Name of the toolbar.
 * @return {Toolbar} Toolbar object.
 */
Editor.prototype.getToolbar = function (name) {
  return this.toolbars[name];
};


/**
 * Returns the component class function for the string passed.
 * @param  {string} name Name of the function.
 * @return {Function} Class function for the component.
 */
Editor.prototype.getModule = function (name) {
  return this.installedModules[name];
};


/**
 * Registers a regex with the factory.
 * @param  {string} regex String regular expression to register for.
 * @param  {Function} factoryMethod Callback factory method for handling match.
 * @param  {boolean=} optForce Forcing registering even when its already
 * registered.
 */
Editor.prototype.registerRegex = function (regex, factoryMethod, optForce) {
  this.componentFactory.registerRegex(regex, factoryMethod, optForce);
};


/**
 * Dipatches the selection changed event to its listeners.
 * @param  {Event} event Selection changed event.
 */
Editor.prototype.handleSelectionChanged = function(event) {
  this.dispatchEvent(event);
};


/**
 * Handles input event and updates the current word.
 * This allows us to add some support for editing on mobile though very buggy
 * and not snappy.
 *
 * TODO(mkhatib): Revisit this and think of a better way to handle editing
 * on mobile!
 *
 */
Editor.prototype.handleInputEvent = function() {
  var currentLength = this.selection.start.component.getLength();
  var self = this;
  var offset = this.selection.start.offset;

  // HACK: A very ugly hack to allow us to update the entire
  // paragraph after the event happens. Because we can't preventDefault
  // the composition event to avoid duplicates and because of another bug
  // that changes selections sometimes to the previous component we have to
  // set the cursor to select the correct component again.
  var cursor = {
    component: this.selection.start.component,
    offset: this.selection.start.offset
  };
  self.selection.setCursor(cursor);
  setTimeout(function() {
    var component = self.selection.start.component;
    var newLength = Utils.getTextFromElement(component.dom).length;
    var direction = 1;
    if (newLength < currentLength) {
      direction = -1;
    }
    var ops = component.getUpdateOps(
        {}, offset + direction, undefined,
        Utils.getTextFromElement(component.dom));
    self.article.transaction(ops);
  }, 3);

  // Another way to do this is to use the following in compositionupdate event.
  // Though found this to be slightly buggier from the above.
  // The nice thing about this is it doesn't require updating the whole model,
  // instead it only update the touched word.
  // var ops = this.selection.start.component.getUpdateWordOps(
  //     event.data, this.selection.end.offset);
  // var self = this;
  // var cursor = {
  //   component: this.selection.start.component,
  //   offset: this.selection.start.offset
  // };
  // setTimeout(function() {
  //   self.selection.setCursor(cursor);
  //   setTimeout(function() {
  //     self.article.transaction(ops);
  //   }, 2);
  // }, 1);
};


/**
 * Handels `keydown` events.
 * @param  {Event} event Event object.
 */
Editor.prototype.handleKeyDownEvent = function(event) {
  var selection = this.article.selection, newP;
  var article = this.article;
  var preventDefault = false;
  var ops = [];
  var inBetweenComponents = [];
  var offset, currentOffset;
  var that = this;

  if (Utils.isUndo(event)) {
    this.article.undo();
    preventDefault = true;
  } else if (Utils.isRedo(event)) {
    this.article.redo();
    preventDefault = true;
  } else if (Utils.isSelectAll(event)) {
    selection.select({
      component: article.getFirstComponent(),
      offset: 0
    }, {
      component: article.getLastComponent(),
      offset: article.getLastComponent().getLength()
    });
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
  var currentIndex = currentComponent.getIndexInSection();
  var nextComponent = currentComponent.getNextComponent();
  var prevComponent = currentComponent.getPreviousComponent();
  var currentIsParagraph = currentComponent instanceof Paragraph;
  var nextIsParagraph = nextComponent instanceof Paragraph;
  var prevIsParagraph = prevComponent instanceof Paragraph;

  switch (event.keyCode) {
    // Enter.
    case 13:
      // TODO(mkhatib): I don't like that we keep checking if the component is
      // an instanceof Paragraph. Maybe find a better way to manage this.
      if (!selection.isCursorAtEnding() && currentIsParagraph &&
          !currentComponent.inline) {
        Utils.arrays.extend(ops, this.getSplitParagraphOps(
            -inBetweenComponents.length));
      } else if (nextIsParagraph &&
          (nextComponent.isPlaceholder() || currentComponent.inline)) {
        // If the next paragraph is a placeholder, just move the cursor to it
        // and don't insert a new paragraph.
        selection.setCursor({
          component: nextComponent,
          offset: 0
        });
      } else {
        var factoryMethod;
        if (currentIsParagraph) {
          factoryMethod = this.componentFactory.match(
              currentComponent.text);
        }

        if (factoryMethod) {
          factoryMethod(currentComponent, function(ops) {
            article.transaction(ops);
            setTimeout(function() {
              that.dispatchEvent(new Event('change'));
            }, 10);
          });
        } else {
          var insertType = currentComponent.paragraphType;
          var insertInSection = selection.getSectionAtEnd();
          var atIndex = currentIndex - inBetweenComponents.length + 1;
          if (insertType === Paragraph.Types.ListItem) {
            if (currentComponent.getLength() === 0) {
              var list = insertInSection;
              insertType = Paragraph.Types.Paragraph;
              insertInSection = selection.getSectionAtEnd().section;
              // If this is not the last element of the list split the list.
              if (atIndex < list.getLength()) {
                Utils.arrays.extend(ops, list.getSplitOps(atIndex));
              }
              Utils.arrays.extend(ops, currentComponent.getDeleteOps(atIndex));
              atIndex = selection.getSectionAtEnd().getIndexInSection() + 1;
            }
          } else if (currentComponent.parentComponent &&
                     currentComponent.inline) {
            insertInSection = currentComponent.parentComponent.section;
            atIndex = currentComponent.parentComponent.getIndexInSection() + 1;
            insertType = Paragraph.Types.Paragraph;
          } else {
            insertType = Paragraph.Types.Paragraph;
          }

          newP = new Paragraph({
            section: insertInSection,
            paragraphType: insertType
          });
          Utils.arrays.extend(ops, newP.getInsertOps(atIndex));
        }
      }

      this.article.transaction(ops);
      preventDefault = true;
      break;

    // Backspace.
    case 8:
      if (!currentIsParagraph) {
        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length));
        if (prevComponent) {
          this.article.transaction(ops);
          offset = 0;
          if (prevIsParagraph) {
            offset = prevComponent.getLength();
          }
          selection.setCursor({
            component: prevComponent,
            offset: offset
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
        if (prevIsParagraph) {
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
      } else if (selection.isCursorAtBeginning() && !prevComponent) {
        preventDefault = true;
      }
      break;

    // Delete.
    case 46:
      if (!currentIsParagraph) {
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
        if (nextIsParagraph) {
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

    // Left.
    case 37:
      if (prevComponent && !currentIsParagraph) {
        offset = 0;
        if (prevIsParagraph) {
          offset = prevComponent.getLength();
        }

        selection.setCursor({
          component: prevComponent,
          offset: offset
        });
        preventDefault = true;
      }
      break;

    // Up.
    case 38:
      if (prevComponent) {
        offset = 0;
        if (prevIsParagraph && !currentIsParagraph) {
          if (currentIsParagraph) {
            currentOffset = selection.start.offset;
            offset = Math.min(prevComponent.getLength(), currentOffset);
          } else {
            offset = prevComponent.getLength();
          }
          selection.setCursor({
            component: prevComponent,
            offset: offset
          });
          preventDefault = true;
        }
      }
      break;

    // Right.
    case 39:
      if (selection.isCursorAtEnding() && nextComponent) {
        selection.setCursor({
          component: nextComponent,
          offset: 0
        });
        preventDefault = true;
      }
      break;

    // Down.
    case 40:
      if (nextComponent) {
        if (nextIsParagraph && !currentIsParagraph) {
          currentOffset = selection.end.offset;
          offset = Math.min(nextComponent.getLength(), currentOffset);
          selection.setCursor({
            component: nextComponent,
            offset: offset
          });
          preventDefault = true;
        }
      }
      break;

    default:
      break;
  }

  // On chrome mobile, 229 event is fired on every keydown.
  // Just ignore it.
  if (event.keyCode === 229) {
    // pass
  } else if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  } else if (currentComponent && Utils.willTypeCharacter(event)) {
    // Update current paragraph internal text model.
    var oldValue = currentComponent.text;
    var oldOffset = selection.end.offset;
    var isRemoveOp = [46, 8].indexOf(event.keyCode) !== -1;
    var cursorOffsetDirection = 1;
    if (event.keyCode === 8) {
      cursorOffsetDirection = -1;
    } else if (event.keyCode === 46) {
      cursorOffsetDirection = 0;
    }

    setTimeout(function() {
      var newValue = Utils.getTextFromElement(currentComponent.dom);
      var newOffset = oldOffset + cursorOffsetDirection;

      if (!isRemoveOp) {
        var insertedChar = newValue.charAt(
            Math.min(newOffset, newValue.length) - 1);
        Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
            insertedChar, oldOffset));
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
    var lastComponent = selection.getComponentAtEnd();
    Utils.arrays.extend(ops, lastComponent.getDeleteOps(
        -inBetweenComponents.length));

    if (lastComponent instanceof Paragraph) {
      var lastParagraphOldText = lastComponent.text;
      var lastParagraphText = lastParagraphOldText.substring(
          selection.end.offset, lastParagraphOldText.length);

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

      var endParagraphFormatting = lastComponent.getFormatsForRange(
          selection.end.offset, lastParagraphOldText.length);
      var formatShift = -lastCount + selection.start.offset;
      for (var k = 0; k < endParagraphFormatting.length; k++) {
        endParagraphFormatting[k].from += formatShift;
        endParagraphFormatting[k].to += formatShift;
      }

      Utils.arrays.extend(ops, startParagraph.getUpdateOps({
        formats: endParagraphFormatting
      }, firstParagraphOldText.length - firstParagraphText.length));
    }
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
  var currentIndex = currentComponent.getIndexInSection();
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
      formats: afterCursorShiftedFormats,
      paragraphType: currentComponent.paragraphType
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

  var startComponent = this.selection.getComponentAtEnd();
  if (startComponent.getPreviousComponent()) {
    startComponent = startComponent.getPreviousComponent();
  }

  var ops = this.processPastedContent(tempEl);
  this.article.transaction(ops);

  var factoryMethod;
  var that = this;
  var endComponent = this.selection.getComponentAtEnd();
  if (endComponent.getNextComponent()) {
    endComponent = endComponent.getNextComponent();
  }
  var currentComponent = startComponent;

  var opsCallback = function(ops) {
    that.article.transaction(ops);
    setTimeout(function() {
      that.dispatchEvent(new Event('change'));
    }, 2);
  };

  while (currentComponent !== endComponent) {
    var currentIsParagraph = currentComponent instanceof Paragraph;
    if (currentIsParagraph) {
      factoryMethod = this.componentFactory.match(
          currentComponent.text);
      if (factoryMethod) {
        factoryMethod(currentComponent, opsCallback);
      }
    }

    currentComponent = currentComponent.getNextComponent();
  }

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
 * Returns the HTML for the article.
 * @return {string} Rendered HTML of the article.
 */
Editor.prototype.getHTML = function() {
  return this.article.dom.outerHTML;
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
  var text, paragraphType, appendOperations, newP;
  var textPasted = Utils.getTextFromElement(element);
  var children = element.childNodes;
  var component;
  var selection = this.article.selection;
  var currentComponent = selection.getComponentAtStart();
  var section = selection.getSectionAtStart();
  var startParagraphIndex = currentComponent.getIndexInSection();
  var currentIndex = indexOffset || startParagraphIndex;

  var INLINE_ELEMENTS = 'B BR BIG I SMALL ABBR ACRONYM CITE EM STRONG A BDO'+
      ' STRIKE S SPAN SUB SUP #text META'.split(' ');

  function hasOnlyInlineChildNodes(elem) {
    var children = elem.childNodes;
    for (var i = 0; i < children.length ; i++) {
      if (INLINE_ELEMENTS.indexOf(children[i].nodeName) === -1) {
        return false;
      }
    }
    return true;
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
    var lines = textPasted.split('\n');
    if (lines.length < 2) {
      // Text before and after pasting.
      var textStart = currentComponent.text.substring(0, selection.start.offset);

      // Calculate cursor offset before pasting.
      var offsetBeforeOperation = textStart.length;

      Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
          textPasted, offsetBeforeOperation));
    } else {
      // TODO(mkhatib): Maybe allow pasting new lined paragraphs once we
      // have better support for it.
      for (var lineNum = 0; lineNum < lines.length; lineNum++) {
        if (lines[lineNum].trim().length > 0) {
          newP = new Paragraph({
              section: section,
              text: lines[lineNum]
          });
          Utils.arrays.extend(
              ops, newP.getInsertOps(currentIndex++));
        }
      }
    }
  } else if (hasOnlyInlineChildNodes(element)) {
    text = Utils.getTextFromElement(element);

    newP = new Paragraph({
        section: section,
        text: text,
        formats: FormattingExtension.generateFormatsForNode(element)
    });
    Utils.arrays.extend(
        ops, newP.getInsertOps(currentIndex++));
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
          for (var j = 0; j < allImgs.length; j++) {
            component = new Figure({
              src: allImgs[j].getAttribute('src')
            });
            component.section = selection.getSectionAtEnd();
            Utils.arrays.extend(
                ops, component.getInsertOps(currentIndex++));
          }
          paragraphType = null;
          break;
        case 'img':
          component = new Figure({
            src: el.getAttribute('src')
          });
          component.section = selection.getSectionAtEnd();
          Utils.arrays.extend(
              ops, component.getInsertOps(currentIndex++));
          paragraphType = null;
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
      } else if (paragraphType) {
        // Add an operation to insert new paragraph and update its text.
        text = Utils.getTextFromElement(el);

        newP = new Paragraph({
            section: section,
            text: text,
            paragraphType: paragraphType,
            formats: FormattingExtension.generateFormatsForNode(el)
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
