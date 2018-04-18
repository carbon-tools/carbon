'use strict';

var Article = require('./article');
var AbstractExtension = require('./core/abstract-extension');
var Selection = require('./selection');
var Paragraph = require('./paragraph');
var List = require('./list');
var Figure = require('./figure');
var Section = require('./section');
var Utils = require('./utils');
var ShortcutsManager = require('./extensions/shortcutsManager');
var ComponentFactory = require('./extensions/componentFactory');
var Toolbar = require('./toolbars/toolbar');
var I18n = require('./i18n');
var Layout = require('./layout');
var CustomEventTarget = require('./customEventTarget');
var CopyCutPaste = require('./extensions/copy-cut-paste').CopyCutPaste;
var Component = require('./component');


/**
 * Editor main.
 * @param {!Element} element Editor element to decorate.
 * @param {Object=} opt_params Optional params to initialize the editor.
 * Default:
 *   {
 *     extensions: [new FormattingExtension()]
 *   }
 * @extends {./customEventTarget};
 * @constructor
 */
var Editor = function(element, opt_params) {

  // Override default params with passed ones if any.
  var params = Utils.extend({
    modules: [],
    rtl: false,
    locale: 'en',
    article: new Article({
      sections: [new Section({
        components: [new Layout({
          components: [new Paragraph({
            placeholder: 'Editor',
          })],
        })],
      })],
    }),
  }, opt_params);

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
   * @type {!Element}
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
   * @type {Object<string, ./toolbars/toolbar>}
   */
  this.toolbars = {};

  /**
   * Selection instance for the editor.
   * @type {Selection}
   */
  this.selection = Selection.getInstance();

  /**
   * Flag used to disable handleInputEvent
   */
  this.disableInputHandler_ = false;

  /**
   * Editor's inline toolbar.
   * @type {Toolbar}
   */
  var inlineToolbar = new Toolbar({
    name: Editor.INLINE_TOOLBAR_NAME,
    classNames: [Editor.INLINE_TOOLBAR_CLASS_NAME],
    rtl: this.rtl,
  });
  this.registerToolbar(Editor.INLINE_TOOLBAR_NAME, inlineToolbar);

  /**
   * Editor's block toolbar.
   * @type {Toolbar}
   */
  var blockToolbar = new Toolbar({
    name: Editor.BLOCK_TOOLBAR_NAME,
    classNames: [Editor.BLOCK_TOOLBAR_CLASS_NAME],
    rtl: this.rtl,
  });
  this.registerToolbar(Editor.BLOCK_TOOLBAR_NAME, blockToolbar);

  /**
   * Components installed and enabled in the editor.
   * @type {Object<string, function(new:./component)>}
   */
  this.installedComponents = {};

  // Install built-in Components.
  this.install(Section);
  this.install(Paragraph);
  this.install(List);
  this.install(Figure);

  /**
   * Components installed and enabled in the editor.
   * @type {Object<string, ./core/abstract-extension>}
   */
  this.installedExtensions = {};

  // Install built-in extensions.
  this.install(CopyCutPaste);

  // Install user provided components and extensions.
  for (var i = 0; i < params.modules.length; i++) {
    this.install(params.modules[i]);
  }

  this.init();
  this.setArticle(this.article);
};
Editor.prototype = new CustomEventTarget();
module.exports = Editor;


/**
 * Class name for the inline toolbar.
 * @type {string}
 * @const
 */
Editor.INLINE_TOOLBAR_CLASS_NAME = 'editor-inline-toolbar';


/**
 * Class name for the inline toolbar.
 * @type {string}
 * @const
 */
Editor.BLOCK_TOOLBAR_CLASS_NAME = 'editor-block-toolbar';


/**
 * Name of the block toolbar.
 * @type {string}
 * @const
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
Editor.prototype.loadJSON = function(json) {
  var article = Article.fromJSON(json);
  this.setArticle(article);
};


/**
 * Initialize the editor article model and event listeners.
 */
Editor.prototype.init = function() {
  this.selection.initSelectionListener(this.element);

  this.element.addEventListener('keydown', this.handleKeyDownEvent.bind(this));
  this.element.addEventListener(
      'keypress', this.handleKeyPressEvent.bind(this));
  this.element.addEventListener('keyup', this.handleKeyUpEvent.bind(this));

  this.element.addEventListener('input', Utils.debounce(
      this.handleInputEvent.bind(this), 200).bind(this));

  this.element.addEventListener('cut', this.handleCut_.bind(this));
  this.element.addEventListener('paste', this.handlePaste_.bind(this));
  this.element.classList.add('carbon-editor');
  this.element.setAttribute('contenteditable', true);

  this.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.handleSelectionChanged.bind(this));
};


/**
 * Call to destroy the editor instance and cleanup dom and event listeners.
 */
Editor.prototype.destroy = function() {
  var name;
  for (name in this.toolbars) {
    if (this.toolbars[name].onDestroy) {
      this.toolbars[name].onDestroy();
    }
  }

  for (name in this.installedComponents) {
    if (this.installedComponents[name].onDestroy) {
      this.installedComponents[name].onDestroy();
    }
  }

  for (name in this.installedExtensions) {
    if (this.installedExtensions[name].onDestroy) {
      this.installedExtensions[name].onDestroy();
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
 * Trims empty blank lines at the beginning and the end of the editor.
 */
Editor.prototype.trim = function() {
  this.article.trim();
};


/**
 * Removes empty layout components.
 */
Editor.prototype.clean = function() {
  this.article.clean();
};


/**
 * Renders the editor and article inside the element.
 * @export
 */
Editor.prototype.render = function() {
  // TODO(mkhatib): Maybe implement a destroy on components to cleanup
  // and remove their DOM, listeners, in progress XHR or others.
  while (this.element.firstChild) {
    try {
      this.element.removeChild(this.element.firstChild);
    } catch (unusedE) {
    }
  }
  this.article.render(this.element, {editMode: true});

  if (this.rtl) {
    this.article.dom.classList.add('rtl');
  }

  var firstLayout = /** @type {./layout} */ (this.article.sections[0]);
  var firstSection = /** @type {./section} */ (firstLayout.getFirstComponent());
  this.selection.setCursor({
    component: firstSection.getFirstComponent(),
    offset: 0,
  });
  this.dispatchEvent(new Event('change'));
};


/**
 * Installs and activate a component type to use in the editor.
 * @param {function(new:./component)|function(new:./core/abstract-extension)} ModuleClass The component class.
 * @param {Object=} opt_args Optional arguments to pass to onInstall of module.
 * @param {boolean=} opt_force Whether to force registeration.
 * @export
 */
Editor.prototype.install = function(ModuleClass, opt_args, opt_force) {
  if (ModuleClass.prototype instanceof AbstractExtension) {
    this.installExtension_(ModuleClass, opt_args, opt_force);
  } else if (ModuleClass.prototype instanceof Component) {
    this.installComponent_(ModuleClass, opt_args, opt_force);
  }
};


/**
 * Installs and activate a component type to use in the editor.
 * @param {function(new:./component)} ModuleClass The component class.
 * @param {Object=} opt_args Optional arguments to pass to onInstall of module.
 * @param {boolean=} opt_force Whether to force registeration.
 * @private
 */
Editor.prototype.installComponent_ = function(
    ModuleClass, opt_args, opt_force) {
  if (!(ModuleClass.prototype instanceof Component)) {
    throw new Error('Component passed does not extend Component class.');
  }

  if (this.installedComponents[ModuleClass.CLASS_NAME] && !opt_force) {
    // TODO(mkhatib): Think about whether it should be possible to install
    // multiple instances of an extension.
    console.warn(ModuleClass.CLASS_NAME +
        ' component has already been installed in this editor.');
  }

  if (ModuleClass.onInstall) {
    ModuleClass.onInstall(this, opt_args);
  }
  this.installedComponents[ModuleClass.CLASS_NAME] = ModuleClass;
};



/**
 * Installs and activate a component type to use in the editor.
 * @param {function(new:./core/abstract-extension, Editor, Object=)} ModuleClass The component class.
 * @param {Object=} opt_args Optional arguments to pass to onInstall of module.
 * @param {boolean=} opt_force Whether to force registeration.
 * @private
 */
Editor.prototype.installExtension_ = function(
    ModuleClass, opt_args, opt_force) {
  if (!(ModuleClass.prototype instanceof AbstractExtension)) {
    throw new Error(
        'Extension passed does not extend AbstractExtension class.');
  }

  if (this.installedExtensions[ModuleClass.CLASS_NAME] && !opt_force) {
    // TODO(mkhatib): Think about whether it should be possible to install
    // multiple instances of an extension.
    console.warn(ModuleClass.CLASS_NAME +
        ' extension has already been installed in this editor.');
  }

  if (ModuleClass.onInstall) {
    ModuleClass.onInstall(this, opt_args);
  }
  this.installedExtensions[ModuleClass.CLASS_NAME] = new ModuleClass(
      this, opt_args);
};


/**
 * Registers a keyboard shortcut in the editor.
 * @param  {string} shortcutId Shortcut string e.g. 'ctrl+b'.
 * @param  {Function} handler Callback handler for handling the shortcut.
 * @param  {boolean=} opt_force Whether to override an already registered one.
 */
Editor.prototype.registerShrotcut = function(shortcutId, handler, opt_force) {
  this.shortcutsManager.register(shortcutId, handler, opt_force);
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
 * @param {number=} optWordCount Number of words to return in the snippet.
 * @return {string} First non-header paragraph of the article.
 */
Editor.prototype.getSnippet = function(optWordCount) {
  return this.article.getSnippet(optWordCount);
};


/**
 * Registers a toolbar with the editor.
 * @param  {string} name Name of the toolbar.
 * @param  {Toolbar} toolbar Toolbar object.
 */
Editor.prototype.registerToolbar = function(name, toolbar) {
  this.toolbars[name] = toolbar;
};


/**
 * Unregisters a toolbar with the editor.
 * @param  {string} name Name of the toolbar.
 */
Editor.prototype.unregisterToolbar = function(name) {
  delete this.toolbars[name];
};


/**
 * Returns the toolbar registered in this editor with the provided name.
 * @param  {string} name Name of the toolbar.
 * @return {Toolbar} Toolbar object.
 */
Editor.prototype.getToolbar = function(name) {
  return this.toolbars[name];
};


/**
 * Returns the component class function for the string passed.
 * @param  {string} name Name of the function.
 * @return {Function} Class function for the component.
 */
Editor.prototype.getModule = function(name) {
  return this.installedComponents[name] || this.installedExtensions[name];
};


/**
 * Registers a regex with the factory.
 * @param  {string} regex String regular expression to register for.
 * @param  {./defs.ComponentFactoryMethodDef} factoryMethod Callback factory method for handling match.
 * @param  {boolean=} opt_force Forcing registering even when its already
 * registered.
 */
Editor.prototype.registerRegex = function(regex, factoryMethod, opt_force) {
  this.componentFactory.registerRegex(regex, factoryMethod, opt_force);
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
  // Short circuit the function if handling input is disabled
  if (this.disableInputHandler_ === true) {
    return;
  }

  var diffText;
  var cursorOffset = this.selection.start.offset;
  var component = this.selection.start.component;
  var modelText = component.text;
  var modelLength = component.getLength();

  if (!(component instanceof Paragraph)) {
    return;
  }

  var domText = Utils.getTextFromElement(component.dom);
  var domLength = domText.length;

  var diffLength = domLength - modelLength;

  var ops = [];

  if (diffLength < 0) {
    // Delete removed text.
    diffText = modelText.substring(cursorOffset, cursorOffset - diffLength);
    Utils.arrays.extend(ops, component.getRemoveCharsOps(
        diffText, cursorOffset));
  } else if (diffLength > 0) {
    // Insert new text.
    diffText = domText.substring(cursorOffset - diffLength, cursorOffset);
    Utils.arrays.extend(ops, component.getInsertCharsOps(
        diffText, Math.max(cursorOffset - diffLength, 0)));
  }

  this.article.transaction(ops);
  this.dispatchEvent(new Event('change'));

};


/**
 * Forces handling any pending input changes.
 * @private
 */
Editor.prototype.handlePendingInputIfAny_ = function() {
  this.enableInput();
  this.handleInputEvent();
};


/**
 * Handels `keyup` events.
 * @param {Event} event
 */
Editor.prototype.handleKeyUpEvent = function(event) {
  // Record accent in `keyup` because of cases where keyCode == 229 in `keydown`
  // doesn't tell us what is the carret.
  if (this.accentOpInProgress && Utils.willTypeOrMoveCursor(event)) {
    this.accentInProgress = Utils.getAccent(event);
  }
  // User removed his finger from the key re-enable input handler.
  this.enableInput();
};


/**
 * Handles `keypress` events.
 *
 * The only current use of keypress event is to handle accented characters.
 * The reason we need keypress event, is it's the only KeyboardEvent
 * that will tell us the true form of the typed character whether
 * it's capital case or small case through the keyCode.
 *
 * @param  {Event} event
 */
Editor.prototype.handleKeyPressEvent = function(event) {
  if (!Utils.isMac() || !this.accentInProgress) {
    return;
  }

  var selection = this.article.selection;
  var currentComponent = selection.getComponentAtEnd();

  var accentedChar = Utils.getAccentedCharacter(
        this.accentInProgress, String.fromCharCode(event.keyCode));
  if (accentedChar) {
    var ops = [];
    Utils.arrays.extend(ops, currentComponent.getRemoveCharsOps(
        this.accentInProgress, selection.start.offset - 1, -1));
    Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
        accentedChar, selection.start.offset));
    this.article.transaction(ops);
    event.preventDefault();
  }

  if (Utils.willTypeOrMoveCursor(event)) {
    this.accentInProgress = null;
    this.accentOpInProgress = false;
  }
};


/**
 * Handels `keydown` events.
 * @param  {Event} event Event object.
 */
Editor.prototype.handleKeyDownEvent = function(event) {
  this.disableInput();
  var INPUT_INSERTING = 'insert-chars';
  var INPUT_REMOVING = 'remove-chars';
  var selection = this.article.selection, newP;
  var article = this.article;
  var preventDefault = false;
  var ops = [];
  var inBetweenComponents = [];
  var offset, currentOffset;
  var that = this;
  var cursor = null;
  var movingBetweenParagraphs = false;

  /*
   * Map direction arrows between rtl and ltr
   */
  var leftKey = 37;
  var rightKey = 39;
  var nextArrow = this.rtl ? leftKey : rightKey;
  var previousArrow = this.rtl ? rightKey : leftKey;

  var offsetAfterOperation;
  var currentComponent = selection.getComponentAtEnd();
  var currentIndex = currentComponent.getIndexInSection();
  var nextComponent = currentComponent.getNextComponent();
  var prevComponent = currentComponent.getPreviousComponent();
  var currentIsParagraph = currentComponent instanceof Paragraph;
  var nextIsParagraph = nextComponent instanceof Paragraph;
  var prevIsParagraph = prevComponent instanceof Paragraph;

  for (var key in this.installedExtensions) {
    var extension = this.installedExtensions[key];
    var result = extension.onKeydown(event);
    if (result) {
      return;
    }
  }

  // Execute any debounced input handler right away to apply any
  // unupdated content before moving to other operations.
  if (event.keyCode === 13) {
    this.handlePendingInputIfAny_();
  }

  // When switching the current input operation that is being done,
  // from deleting to inserting or the other way, make sure to execute
  // any debounced input handler right away to apply any unupdated content
  // before moving to other operations. This restriction simplifies the way
  // we handle input changes instead of worrying about replacing characters
  // and having to deal with calculating more complicated string differences.
  if (event.keyCode === 8 || event.keyCode === 46) {
    if (this.currentOperation_ === INPUT_INSERTING) {
      this.handlePendingInputIfAny_();
    }
    this.currentOperation_ = INPUT_REMOVING;
  } else {
    if (this.currentOperation_ === INPUT_REMOVING) {
      this.handlePendingInputIfAny_();
    }
    this.currentOperation_ = INPUT_INSERTING;
  }

  if (Utils.isUndo(event)) {
    this.article.undo();
    selection.updateSelectionFromWindow();
    preventDefault = true;
  } else if (Utils.isRedo(event)) {
    this.article.redo();
    selection.updateSelectionFromWindow();
    preventDefault = true;
  } else if (Utils.isSelectAll(event)) {
    var firstLayout = article.getFirstComponent();
    var lastLayout = article.getLastComponent();
    selection.select({
      component: firstLayout.getFirstComponent(),
      offset: 0,
    }, {
      component: lastLayout.getLastComponent(),
      offset: lastLayout.getLastComponent().getLength(),
    });
    preventDefault = true;
  }

  // If selected text and key pressed will produce a change. Remove selected.
  // i.e. Enter, characters, space, backspace...etc
  else if (selection.isRange() && Utils.willTypeCharacter(event)) {
    var section = selection.getSectionAtStart();
    if (section) {
      inBetweenComponents = section.getComponentsBetween(
          selection.getComponentAtStart(), selection.getComponentAtEnd());
    }
    Utils.arrays.extend(ops, selection.getDeleteSelectionOps());

    this.article.transaction(ops);
    selection.setCursor(selection.start);
    ops = [];

    // Only stop propagation on special characters (Enter, Delete, Backspace)
    // We already handled or will handle them in the switch statement.
    // For all others (e.g. typing a char key) don't stop propagation and
    // allow the contenteditable to handle it.
    var stopPropagationCodes = [13, 8, 46];
    preventDefault = stopPropagationCodes.indexOf(event.keyCode) !== -1;
  }

  // Hide placeholders in paragraphs while. This is due to the way we debounce
  // updating the paragraph model until later.
  // TODO(mkhatib): This is pretty hacky. Find a better way to do this.
  if (Utils.willTypeCharacter(event) && currentIsParagraph &&
      currentComponent.getLength() === 0 &&
      currentComponent.getDomLength() !== 0) {
    currentComponent.dom.classList.remove('show-placeholder');
  }

  // On Macs we need to handle accented characters ourselves.
  // On windows, it seems this seem to work out of the box.
  // TODO(mkhatib): Test on platforms and browsers to apply this to
  // required platforms.
  if (Utils.isMac()) {
    if (this.accentInProgress) {
      // This is handled in keypress event for an accurate keycode.
      return;
    } else if (Utils.isAccent(event) || event.keyCode === 229) {
      // Is alt and e pressed - mark that there's an accent typing in process.
      this.accentOpInProgress = true; //Utils.getAccent(event);
    }
  }

  switch (event.keyCode) {
    // Enter.
    case 13:
      // TODO(mkhatib): I don't like that we keep checking if the component is
      // an instanceof Paragraph. Maybe find a better way to manage this.
      if (!selection.isCursorAtEnding() && currentIsParagraph &&
          !currentComponent.inline) {
        Utils.arrays.extend(ops, currentComponent.getSplitOpsAt(
            selection, -inBetweenComponents.length));
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
        } else if (nextIsParagraph &&
                   (nextComponent.isPlaceholder() || currentComponent.inline)) {
          // If the next paragraph is a placeholder, just move the cursor to it
          // and don't insert a new paragraph.
          selection.setCursor({
            component: nextComponent,
            offset: 0,
          });
        } else {
          var insertType = currentComponent.paragraphType;
          var insertInSection = selection.getSectionAtEnd();
          var atIndex = currentIndex - inBetweenComponents.length + 1;
          cursor = {
            component: currentComponent.name,
            offset: selection.end.offset,
          };
          if (insertType === Paragraph.Types.ListItem) {
            if (currentComponent.getLength() === 0) {
              var list = insertInSection;
              insertType = Paragraph.Types.Paragraph;
              insertInSection = selection.getSectionAtEnd().section;
              // If this is not the last element of the list split the list.
              if (atIndex < list.getLength()) {
                Utils.arrays.extend(ops, list.getSplitOps(atIndex));
              }
              Utils.arrays.extend(ops, currentComponent.getDeleteOps(
                  atIndex, cursor));
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

          // If current layout is not column get the next column layout and
          // insert the new paragraph at the top of that layout.
          // TODO(mkhatib): Maybe move this logic inside Layout to get the
          // layout that enter should insert component at (e.g. getEnterOps).
          var currentSection = (
              currentComponent.parentComponent || currentComponent).section;
          if (currentSection instanceof Layout &&
              currentSection.type !== Layout.Types.SingleColumn) {
            insertInSection = nextComponent ? nextComponent.section : null;
            atIndex = 0;

            // If next layout is not single-column create one and insert the new
            // paragraph into.
            if (!insertInSection ||
                (insertInSection instanceof Layout &&
                 insertInSection.type !== Layout.Types.SingleColumn)) {
              insertInSection = new Layout({
                type: Layout.Types.SingleColumn,
                section: currentSection.section,
                components: [],
              });
              Utils.arrays.extend(
                  ops, insertInSection.getInsertOps(
                      currentSection.getIndexInSection() + 1));
            }
          }

          newP = new Paragraph({
            section: insertInSection,
            paragraphType: insertType,
          });
          Utils.arrays.extend(ops, newP.getInsertOps(atIndex, cursor));
        }
      }

      this.article.transaction(ops);
      preventDefault = true;
      break;

    // Backspace.
    case 8:
      if (!currentIsParagraph || !currentComponent.getLength()) {
        // Paragraph is empty or a non-text component. Delete it.
        this.handlePendingInputIfAny_();
        cursor = undefined;
        if (prevComponent) {
          cursor = {offset: 0};
          if (prevIsParagraph) {
            cursor.offset = prevComponent.getLength();
          }
          cursor.component = prevComponent.name;
        } else if (nextComponent) {
          cursor = {
            offset: 0,
            component: nextComponent.name,
          };
        }

        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length, cursor));

        // If this is the last component in the article, insert a new paragraph
        // to make sure the editor always have a place to type.
        if (!prevComponent && !nextComponent) {
          newP = new Paragraph({section: selection.getSectionAtEnd()});
          Utils.arrays.extend(
              ops, newP.getInsertOps(
                  currentIndex - inBetweenComponents.length, cursor));
        }
        this.article.transaction(ops);
        preventDefault = true;
      } else if (selection.isCursorAtBeginning() && prevComponent) {
        this.handlePendingInputIfAny_();
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
          offset: offsetAfterOperation,
        });

        preventDefault = true;
      } else if (selection.isCursorAtBeginning() && !prevComponent) {
        this.handlePendingInputIfAny_();
        // If first paragraph and cursor at the beginning of it - do nothing.
        preventDefault = true;
      }
      break;

    // Delete.
    case 46:
      if (!currentIsParagraph) {
        this.handlePendingInputIfAny_();
        cursor = undefined;
        if (prevComponent) {
          cursor = {
            component: prevComponent.name,
            offset: prevComponent.getLength(),
          };
        } else if (nextComponent) {
          cursor = {
            component: nextComponent.name,
            offset: 0,
          };
        }

        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length, cursor));

        if (!nextComponent && !prevComponent) {
          newP = new Paragraph({section: selection.getSectionAtEnd()});
          Utils.arrays.extend(
              ops, newP.getInsertOps(
                  currentIndex - inBetweenComponents.length, cursor));
        }
        this.article.transaction(ops);
        preventDefault = true;
      } else if (selection.isCursorAtEnding() && nextComponent) {
        this.handlePendingInputIfAny_();
        // If cursor at the end of the paragraph. Merge Paragraphs if the
        // next component is a paragraph.
        if (nextIsParagraph) {
          offsetAfterOperation = currentComponent.text.length;

          Utils.arrays.extend(ops, this.getMergeParagraphsOps(
              currentComponent, nextComponent, -inBetweenComponents.length));

          this.article.transaction(ops);

          selection.setCursor({
            component: currentComponent,
            offset: offsetAfterOperation,
          });
        } else {
          this.handlePendingInputIfAny_();
          selection.setCursor({
            component: nextComponent,
            offset: 0,
          });
        }
        preventDefault = true;
      }
      break;

    // Left.
    case previousArrow:
      if (currentIsParagraph) {
        this.handlePendingInputIfAny_();
      }
      if (prevComponent && !currentIsParagraph) {
        offset = 0;
        if (prevIsParagraph) {
          offset = prevComponent.getLength();
        }

        selection.setCursor({
          component: prevComponent,
          offset: offset,
        });
        preventDefault = true;
      }
      break;

    // Up.
    case 38:
      movingBetweenParagraphs = prevIsParagraph && currentIsParagraph;
      if (currentIsParagraph) {
        this.handlePendingInputIfAny_();
      }
      if (prevComponent && !movingBetweenParagraphs) {
        offset = prevIsParagraph ? prevComponent.getLength() : 0;
        selection.setCursor({
          component: prevComponent,
          offset: offset,
        });
        preventDefault = true;
      }
      break;

    // Right.
    case nextArrow:
      if (currentIsParagraph) {
        this.handlePendingInputIfAny_();
      }
      if (selection.isCursorAtEnding() && nextComponent) {
        selection.setCursor({
          component: nextComponent,
          offset: 0,
        });
        preventDefault = true;
      }
      break;

    // Down.
    case 40:
      movingBetweenParagraphs = nextIsParagraph && currentIsParagraph;
      if (currentIsParagraph) {
        this.handlePendingInputIfAny_();
      }
      if (nextComponent && !movingBetweenParagraphs) {
        currentOffset = nextIsParagraph ? selection.end.offset : 0;
        offset = Math.min(nextComponent.getLength(), currentOffset);
        selection.setCursor({
          component: nextComponent,
          offset: offset,
        });
        preventDefault = true;
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
  }

  // Dispatch a `change` event
  var dispatchEvent = this.dispatchEvent.bind(this);
  setTimeout(function() {
    dispatchEvent(new Event('change'));
  }, 10);
};


/**
 * Generates the operations needed to merge two paragraphs.
 * @param  {Paragraph} firstP First Paragraph.
 * @param  {Paragraph} secondP Second Paragraph.
 * @param  {number} indexOffset Offset to add to paragraphs index.
 * @return {Array<./defs.OperationDef>} List of operations to merge the paragraphs.
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
    formats: secondPFormatting,
  }, offsetAfterOperation));

  return ops;
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
  // TODO(mkhatib): This should remove contenteditable attributes from content.
  return this.article.dom.outerHTML;
};


/**
 * Handles paste event for the editor.
 * @param  {Event} event Paste Event.
 * @private
 */
Editor.prototype.handlePaste_ = function(event) {
  // Execute any debounced input handler right away to apply any
  // unupdated content before moving to other operations.
  this.handlePendingInputIfAny_();

  for (var key in this.installedExtensions) {
    var extension = this.installedExtensions[key];
    var result = extension.onPaste(event);
    if (result) {
      event.preventDefault();
      return;
    }
  }
};


/**
 * Handles cut event for the editor.
 * TODO(mkhatib): Explore providing pre and post hooks to these handlers.
 * @param {Event} event
 * @private
 */
Editor.prototype.handleCut_ = function(event) {
  // Execute any debounced input handler right away to apply any
  // unupdated content before moving to other operations.
  this.handlePendingInputIfAny_();

  for (var key in this.installedExtensions) {
    var extension = this.installedExtensions[key];
    var result = extension.onCut(event);
    if (result) {
      return;
    }
  }

};


/**
 * Disables editor handling of input event.
 * TODO(mkhatib): Implement a better way to handle this instead of
 * disabling/enabling input handling.
 */
Editor.prototype.disableInput = function() {
  this.disableInputHandler_ = true;
};


/**
 * Enables editor handling of input event.
 * TODO(mkhatib): Implement a better way to handle this instead of
 * disabling/enabling input handling.
 */
Editor.prototype.enableInput = function() {
  this.disableInputHandler_ = false;
};
