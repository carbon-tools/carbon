(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.carbon = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Selection = require('./selection');
var Paragraph = require('./paragraph');
var Section = require('./section');
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
   * Editor that contains this article.
   * @type {Editor}
   */
  this.editor = params.editor;

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
 * Create and initiate an Article object from JSON.
 * @param  {Object} json JSON representation of the article.
 * @return {Article} Article object representing the JSON data.
 */
Article.fromJSON = function (json) {
  var sections = [];
  for (var i = 0; i < json.sections.length; i++) {
    sections.push(Section.fromJSON(json.sections[i]));
  }

  return new Article({
    sections: sections
  });
};


/**
 * Inserts a new section in article.
 * @param  {Section} section Section object.
 * @return {Section} The inserted section.
 */
Article.prototype.insertSection = function(section) {
  // Section should always have a component when inserted into article.
  if (!section.components || !section.components.length) {
    section.insertComponentAt(new Paragraph(), 0);
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
 * Inserts a new component in article.
 * @param  {Component} component Component object.
 * @return {Component} The inserted component.
 */
Article.prototype.insertComponent = function(component) {
  var section = this.selection.getSectionAtEnd().
      insertComponent(component);
  return section;
};


/**
 * Removes a component from article.
 * @param  {Component} component Component to remove.
 * @return {Component} Removed component.
 */
Article.prototype.removeComponent = function(component) {
  var index = this.sections.indexOf(component);
  this.components.splice(index, 1);
  return component;
};


/**
 * Returns first component in the section.
 * @return {Component} Returns first component.
 */
Article.prototype.getFirstComponent = function() {
  return this.sections[0].getFirstComponent();
};


/**
 * Returns last component in the section.
 * @return {Component} Returns last component.
 */
Article.prototype.getLastComponent = function() {
  return this.sections[this.sections.length - 1].getLastComponent();
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
 * Returns the length of the article.
 * @return {number} Length of article.
 */
Article.prototype.getLength = function() {
  var length = 0;
  for (var i = 0; i < this.sections.length; i++) {
    length += this.sections[i].getLength();
  }
  return length;
};



/**
 * Returns the first header paragraph in the article.
 * @return {string} First header of the article.
 */
Article.prototype.getTitle = function() {
  return this.sections[0].getTitle();
};


/**
 * Returns the first non-header paragraph in the article.
 * @return {string} First non-header paragraph of the article.
 */
Article.prototype.getSnippet = function() {
  return this.sections[0].getSnippet();
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
  var selection = this.selection;
  var op = operation[action].op;
  var component, componentName, value, index, count;

  if (op === 'insertChars') {
    componentName = operation[action].component;
    value = operation[action].value;
    index = operation[action].index;
    component = Utils.getReference(componentName);
    component.insertCharactersAt(value, index);

    if (operation[action].cursorOffset) {
      selection.setCursor({
        component: component,
        offset: operation[action].cursorOffset
      });
    }
  } else if (op === 'removeChars') {
    componentName = operation[action].component;
    index = operation[action].index;
    count = operation[action].count;
    component = Utils.getReference(componentName);
    component.removeCharactersAt(index, count);

    if (operation[action].cursorOffset) {
      selection.setCursor({
        component: component,
        offset: operation[action].cursorOffset
      });
    }
  } else if (op === 'updateComponent') {
    componentName = operation[action].component;
    value = operation[action].value;
    component = Utils.getReference(componentName);

    if (value !== undefined) {
      component.setText(value);
    }

    // If this is to update inline formatting.
    if (operation[action].formats) {
      component.applyFormats(operation[action].formats);
    }

    // If this is to update the component attributes.
    if (operation[action].attrs) {
      component.updateAttributes(operation[action].attrs);
    }

    if (operation[action].cursorOffset !== undefined) {
      if (!operation[action].selectRange) {
        selection.setCursor({
          component: component,
          offset: operation[action].cursorOffset
        });
      } else {
        selection.select({
          component: component,
          offset: operation[action].cursorOffset
        }, {
          component: component,
          offset: operation[action].cursorOffset + operation[action].selectRange
        });
      }
    }
  } else if (op === 'deleteComponent') {
    component = Utils.getReference(operation[action].component);
    component.section.removeComponent(component);
  } else if (op === 'insertComponent') {
    // TODO(mkhatib): Insert components inside a component.
    var section = Utils.getReference(operation[action].section);
    var options = Utils.extend({
      name: operation[action].component,
    }, operation[action].attrs || {});

    var constructorName = operation[action].componentClass;
    var ComponentClass = this.editor.getModule(constructorName);
    component = new ComponentClass(options);
    section.insertComponentAt(component, operation[action].index);
  }
};

},{"./paragraph":17,"./section":18,"./selection":19,"./utils":23}],2:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Errors = require('./errors');
var Loader = require('./loader');

/**
 * Component main.
 * @param {Object} optParams Optional params to initialize the Component object.
 * Default:
 *   {
 *     name: Utils.getUID()
 *   }
 */
var Component = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The editor this component belongs to.
    editor: null,
    // The section this component is added to.
    section: null,
    // Generate a UID as a reference for this Component.
    name: Utils.getUID(),
    // Indicates if this component is an inline component.
    inline: false,
    // Points to the parent component if this component is encompased within it.
    parentComponent: null
  }, optParams);

  /**
   * Editor this component is added it.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * This indicates if this component is inline and shouldn't allow multiple
   * components.
   * @type {boolean}
   */
  this.inline = params.inline;

  /**
   * If the component is contained within another this will point to the parent.
   * @type {Component}
   */
  this.parentComponent = params.parentComponent;

  /**
   * Name to reference this Component.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Section this Component belongs to.
   * @type {Section}
   */
  this.section = params.section;

};
module.exports = Component;


/**
 * String name for the component class.
 * @type {string}
 */
Component.CLASS_NAME = 'Component';
Loader.register(Component.CLASS_NAME);


/**
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Component.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Get the next Component if any.
 * @return {Component} Next sibling Component.
 */
Component.prototype.getNextComponent = function() {
  // If this is an inline component and it is included in another one.
  // Next component is the parent's next component.
  if (this.parentComponent && this.inline) {
    return this.parentComponent.getNextComponent();
  }

  if (this.section) {
    var i = this.section.components.indexOf(this);
    var component = this.section.components[i + 1];
    if (!component) {
      // If the component is the last component in its section, then return
      // the new component after this section.
      return this.section.getNextComponent();
    }
    return component;
  }
};


/**
 * Get the previous Component if any.
 * @return {Component} Previous sibling Component.
 */
Component.prototype.getPreviousComponent = function() {
  if (this.section) {
    var i = this.section.components.indexOf(this);
    var component = this.section.components[i - 1];
    if (!component) {
      return this.section.getPreviousComponent();
    }
    return component;
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Component.
 */
Component.prototype.getJSONModel = function() {
  var Component = {
    component: Component.CLASS_NAME,
    name: this.name,
  };

  if (this.formats) {
    Component.formats = this.formats;
  }

  return Component;
};


/**
 * Returns the index of the component in the section.
 * @return {number} Index of the component in the section.
 */
Component.prototype.getIndexInSection = function() {
  if (this.section) {
    return this.section.components.indexOf(this);
  } else if (this.parentComponent) {
    if (this.parentComponent.components) {
      return this.parentComponent.components.indexOf(this);
    } else {
      return 0;
    }
  }
  return null;
};


/**
 * Returns the operations to execute a deletion of the component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 */
Component.prototype.getDeleteOps = function(optIndexOffset) {
  // jshint unused:false
  throw Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting a component.
 * @param {number} index Index to insert the component at.
 * on undoing operation for re-inserting.
 */
Component.prototype.getInsertOps = function (index) {
  // jshint unused:false
  throw Errors.NotImplementedError('Component Must Implement getDeleteOps');
};


/**
 * Returns the operations to execute inserting characters in a component.
 * @param {string} chars The characters to insert in a component.
 * @param  {number=} index Index to insert the characters at.
 */
Component.prototype.getInsertCharsOps = function(chars, index) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component Must Implement getInsertCharsOps');
};


/**
 * Returns the operations to execute removing characters in a component.
 * @param {string} chars The characters to remove in a component.
 * @param {number} index Index to remove the characters starting at.
 * @param {number=} optDirection The directions to remove chars at.
 */
Component.prototype.getRemoveCharsOps = function(chars, index, optDirection) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component Must Implement getRemoveCharsOps');
};


/**
 * Returns the operations to execute updating a component attributes.
 * @param  {Object} attrs Attributes to update for the component.
 * @param  {number=} optCursorOffset Optional cursor offset.
 * @param  {number=} optSelectRange Optional selecting range.
 */
Component.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange) {
  // jshint unused:false
  throw Errors.NotImplementedError(
      'Component does not Implement getUpdateOps');
};


/**
 * Returns the length of the component content.
 * @return {number} Length of the component content.
 */
Component.prototype.getLength = function () {
  return 1;
};

},{"./errors":4,"./loader":15,"./utils":23}],3:[function(require,module,exports){
'use strict';

var Article = require('./article');
var Selection = require('./selection');
var Paragraph = require('./paragraph');
var List = require('./list');
var Figure = require('./figure');
var Section = require('./section');
var Utils = require('./utils');
var Errors = require('./errors');
var FormattingExtension = require('./extensions/formattingExtension');
var ShortcutsManager = require('./extensions/shortcutsManager');
var ComponentFactory = require('./extensions/componentFactory');
var Toolbar = require('./toolbars/toolbar');
var ToolbeltExtension = require('./extensions/toolbeltExtension');
var UploadExtension = require('./extensions/uploadExtension');


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
    article: new Article({
      sections: [new Section({
        components: [new Paragraph({
          placeholder: 'Editor'
        })]
      })]
    }),
  }, optParams);

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
    classNames: [Editor.INLINE_TOOLBAR_CLASS_NAME]
  });
  this.registerToolbar(Editor.INLINE_TOOLBAR_NAME, inlineToolbar);

  /**
   * Editor's block toolbar.
   * @type {Toolbar}
   */
  var blockToolbar = new Toolbar({
    name: Editor.BLOCK_TOOLBAR_NAME,
    classNames: [Editor.BLOCK_TOOLBAR_CLASS_NAME]
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
  this.element.className += ' carbon-editor';
  this.element.setAttribute('contenteditable', true);

  this.selection.addEventListener(
      Selection.Events.SELECTON_CHANGED,
      this.handleSelectionChanged.bind(this));
};


/**
 * Sets the article model of the editor.
 * @param {Article} article Article object to use for the editor.
 */
Editor.prototype.setArticle = function(article) {
  this.article = article;
  while (this.element.firstChild) {
    this.element.removeChild(this.element.firstChild);
  }

  this.element.appendChild(article.dom);
  this.selection.setCursor({
    component: article.sections[0].components[0],
    offset: 0
  });

  this.dispatchEvent(new Event('change'));
};


/**
 * Installs and activate a component type to use in the editor.
 * @param  {Function} ModuleClass The component class.
 */
Editor.prototype.install = function(ModuleClass) {
  if (this.installedModules[ModuleClass.CLASS_NAME]) {
    throw Errors.AlreadyRegisteredError(ModuleClass.CLASS_NAME +
        ' module has already been installed in this editor.');
  }
  this.installedModules[ModuleClass.CLASS_NAME] = ModuleClass;
  ModuleClass.onInstall(this);
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

  switch (event.keyCode) {
    // Enter.
    case 13:
      // TODO(mkhatib): I don't like that we keep checking if the component is
      // an instanceof Paragraph. Maybe find a better way to manage this.
      if (!selection.isCursorAtEnding() &&
          currentComponent instanceof Paragraph &&
          !currentComponent.inline) {
        Utils.arrays.extend(ops, this.getSplitParagraphOps(
            -inBetweenComponents.length));
      } else if (nextComponent instanceof Paragraph &&
          (nextComponent.isPlaceholder() || currentComponent.inline)) {
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
      if (!(currentComponent instanceof Paragraph)) {
        Utils.arrays.extend(ops, currentComponent.getDeleteOps(
            -inBetweenComponents.length));
        if (prevComponent) {
          this.article.transaction(ops);
          offset = 0;
          if (prevComponent instanceof Paragraph) {
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
      } else if (selection.isCursorAtBeginning() && !prevComponent) {
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

    // Left.
    case 37:
      if (selection.isCursorAtBeginning() && prevComponent) {
        offset = 0;
        if (prevComponent instanceof Paragraph) {
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
        if (prevComponent instanceof Paragraph) {
          currentOffset = selection.start.offset;
          offset = Math.min(prevComponent.getLength(), currentOffset);
        }
        selection.setCursor({
          component: prevComponent,
          offset: offset
        });
        preventDefault = true;
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
        offset = 0;
        if (nextComponent instanceof Paragraph) {
          currentOffset = selection.end.offset;
          offset = Math.min(nextComponent.getLength(), currentOffset);
        }
        selection.setCursor({
          component: nextComponent,
          offset: offset
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
  } else if (currentComponent && Utils.willTypeCharacter(event)) {
    // Update current paragraph internal text model.
    var oldValue = currentComponent.text;
    var isRemoveOp = [46, 8].indexOf(event.keyCode) !== -1;
    var cursorOffsetDirection = 1;
    if (event.keyCode === 8) {
      cursorOffsetDirection = -1;
    } else if (event.keyCode === 46) {
      cursorOffsetDirection = 0;
    }

    setTimeout(function() {
      var newValue = Utils.getTextFromElement(currentComponent.dom);
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

    // Text before and after pasting.
    var textStart = currentComponent.text.substring(0, selection.start.offset);

    // Calculate cursor offset before pasting.
    var offsetBeforeOperation = textStart.length;

    Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
        textPasted, offsetBeforeOperation));
  } else if (hasOnlyInlineChildNodes(element)) {
    text = Utils.getTextFromElement(element);

    newP = new Paragraph({
        section: section,
        text: text,
        paragraphType: paragraphType,
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

},{"./article":1,"./errors":4,"./extensions/componentFactory":6,"./extensions/formattingExtension":7,"./extensions/shortcutsManager":9,"./extensions/toolbeltExtension":10,"./extensions/uploadExtension":11,"./figure":13,"./list":14,"./paragraph":17,"./section":18,"./selection":19,"./toolbars/toolbar":22,"./utils":23}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

var Utils = require('../utils');


/**
 * Allow for updating attributes in history and in the component for
 * uploading files and media.
 * @param {Object=} optParams Optional Parameters.
 */
var Attachment = function (optParams) {
  var params = Utils.extend({
    file: null,
    // TODO(mkhatib): Make this general for any kind of component
    // (e.g. video, pdf...etc)
    figure: null,
    insertedOps: null
  }, optParams);

  /**
   * The file that was picked by the user.
   * @type {File}
   */
  this.file = params.file;

  /**
   * Figure inserted for this attachment.
   * @type {Figure}
   */
  this.figure = params.figure;

  /**
   * Operations used to insert the component.
   * @type {Array.<Object>}
   */
  this.insertedOps = params.insertedOps;
};
module.exports = Attachment;


/**
 * Sets upload progress for the attachment.
 * @param {number} progress Progress for the uploading process.
 */
Attachment.prototype.setUploadProgress = function(progress) {
  this.progress = progress;

  // TODO(mkhatib): Update UI indication of the upload progress.
};


/**
 * Sets attributes for the inserted component and updates the insertion
 * operations in history.
 * @param {Object} attrs Attributes to update.
 */
Attachment.prototype.setAttributes = function(attrs) {
  // TODO(mkhatib): This is a hack to update previous history operation.
  // Think of a better way to do this.
  for (var i = 0; i < this.insertedOps.length; i++) {
    var newAttrs = Utils.extend(this.insertedOps[i].do.attrs || {}, attrs);
    this.insertedOps[i].do.attrs = newAttrs;
  }
  // Update the figure object attributes to reflect the changes.
  this.figure.updateAttributes(attrs);
};

},{"../utils":23}],6:[function(require,module,exports){
'use strict';

var Errors = require('../errors');


/**
 * ComponentFactory A factory to allow components to register regex matches
 * to be notified when a match is found in the editor.
 */
var ComponentFactory = function () {
  /**
   * The registery for the regexes and its factory methods (callbacks).
   * @type {Object}
   */
  this.regexToFactories = {};
};
module.exports = ComponentFactory;


/**
 * Registers a regex with the factory.
 * @param  {string} regex String regular expression to register for.
 * @param  {Function} factoryMethod Callback factory method for handling match.
 * @param  {boolean=} optForce Forcing registering even when its already
 * registered.
 */
ComponentFactory.prototype.registerRegex = function(
    regex, factoryMethod, optForce) {
  if (this.regexToFactories[regex] && !optForce) {
    throw Errors.AlreadyRegisteredError(
        'This Regex "' + regex + '" has already been registered.');
  }

  this.regexToFactories[regex] = factoryMethod;
};


/**
 * Check if the string match any registered regex and return its factory method.
 * @param {string} str String to match against.
 * @return {Function} Factory method for creating the matched component.
 */
ComponentFactory.prototype.match = function(str) {
  for (var regexStr in this.regexToFactories) {
    var regex = new RegExp(regexStr);
    var matches = regex.exec(str);
    if (matches) {
      return this.regexToFactories[regexStr];
    }
  }
};

},{"../errors":4}],7:[function(require,module,exports){
'use strict';

var Paragraph = require('../paragraph');
var Selection = require('../selection');
var Utils = require('../utils');
var Button = require('../toolbars/button');
var TextField = require('../toolbars/textField');


/**
 * Editor formatting logic is an extension to the editor.
 * @param {Object} optParams Optional params to initialize the Formatting object.
 * Default:
 *   {
 *     enableInline: true,
 *     enableBlock: true
 *   }
 */
var Formatting = function(optParams) {

  // Override default params with passed ones if any.
  var params = Utils.extend({
    // TODO: Use these configurations to disable/enable toolbars.
    enableInline: true,
    enableBlock: true
  }, optParams);

  /**
   * Whether inline formatting toolbar is enabled.
   * @type {boolean}
   */
  this.enableInline = params.enableInline;

  /**
   * Whether inline formatting toolbar is enabled.
   * @type {boolean}
   */
  this.enableBlock = params.enableBlock;

  /**
   * Editor reference.
   * @type {Editor}
   */
  this.editor = null;

};
module.exports = Formatting;


/**
 * Extension class name.
 * @type {string}
 */
Formatting.CLASS_NAME = 'Formatting';


/**
 * Active button class name.
 * @type {string}
 */
Formatting.ACTIVE_ACTION_CLASS = 'active';


/**
 * Types of formatting.
 * @enum {string}
 */
Formatting.Types = {
  BLOCK: 'block',
  INLINE: 'inline'
};


/**
 * Enable block formatting toolbar on these types of paragraphs.
 * @type {Array.<String>}
 */
Formatting.BLOCK_ENABLED_ON = [
    Paragraph.Types.Paragraph,
    Paragraph.Types.MainHeader,
    Paragraph.Types.SecondaryHeader,
    Paragraph.Types.ThirdHeader,
    Paragraph.Types.Quote,
    Paragraph.Types.Code
];


/**
 * Actions allowed on the toolbars.
 * @type {Object}
 */
Formatting.Actions = {

  // Block formatting.
  // TODO: Implement Ordered and Unordered lists.
  Block: [{
    label: 'h1',
    value: Paragraph.Types.MainHeader,
    shortcuts: ['alt+cmd+1', 'alt+ctrl+1']
  }, {
    label: 'h2',
    value: Paragraph.Types.SecondaryHeader,
    shortcuts: ['alt+cmd+2', 'alt+ctrl+2']
  }, {
    label: 'h3',
    value: Paragraph.Types.ThirdHeader,
    shortcuts: ['alt+cmd+3', 'alt+ctrl+3']
  }, {
    label: '”',
    value: Paragraph.Types.Quote,
    shortcuts: ['alt+cmd+4', 'alt+ctrl+4']
  }, {
    label: '{}',
    value: Paragraph.Types.Code,
    shortcuts: ['alt+cmd+5', 'alt+ctrl+5']
  }],

  Inline: [{
    label: 'B',
    value: 'strong',
    tagNames: ['strong', 'b'],
    shortcuts: ['ctrl+b', 'cmd+b']
  }, {
    label: 'I',
    value: 'em',
    tagNames: ['em', 'i'],
    shortcuts: ['ctrl+i', 'cmd+i']
  }, {
    label: 'U',
    value: 'u',
    tagNames: ['u'],
    shortcuts: ['ctrl+u', 'cmd+u']
  }, {
    label: 'S',
    value: 's',
    tagNames: ['strike', 's'],
    shortcuts: ['ctrl+s', 'cmd+s']
  }, {
    label: 'a',
    value: 'a',
    attrs: {
      href: {
        required: true,
        placeholder: 'What is the URL?'
      }
    },
    tagNames: ['a'],
    shortcuts: ['ctrl+k', 'cmd+k']
  }]
};


/**
 * Name of the block toolbar.
 * @type {string}
 */
Formatting.BLOCK_TOOLBAR_NAME = 'block-toolbar';


/**
 * Name of the inline toolbar.
 * @type {string}
 */
Formatting.INLINE_TOOLBAR_NAME = 'inline-toolbar';


/**
 * Initializes the formatting extensions.
 * @param  {Editor} editor Editor instance this installed on.
 */
Formatting.onInstall = function(editor) {
  var formattingExtension = new Formatting();
  formattingExtension.init(editor);
};


/**
 * Initializes the formatting extension.
 * @param  {Editor} editor The parent editor for the extension.
 */
Formatting.prototype.init = function(editor) {
  this.editor = editor;
  this.blockToolbar = editor.getToolbar(Formatting.BLOCK_TOOLBAR_NAME);
  this.inlineToolbar = editor.getToolbar(Formatting.INLINE_TOOLBAR_NAME);

  // Inline toolbar used for formatting inline elements (bold, italic...).
  this.initInlineToolbarButtons();

  // Block toolbar used for formatting block elements (h1, h2, pre...).
  this.initBlockToolbarButtons();

  // Register keyboard shortcuts to handle formatting.
  this.registerFormattingShortcuts_();

  // Initializes event listener to update toolbars position and status
  // when selection or cursor change.
  this.editor.article.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.handleSelectionChangedEvent.bind(this));
};


/**
 * Creates inline formatting toolbar.
 * @return {HTMLElement} Toolbar Element.
 */
Formatting.prototype.initInlineToolbarButtons = function() {
  var actions = Formatting.Actions.Inline;
  for (var i = 0; i < actions.length; i++) {
    var fields = this.createExtraFields(actions[i]);
    var button = new Button({
      name: actions[i].value,
      label: actions[i].label,
      data: actions[i],
      fields: fields || []
    });
    button.addEventListener(
        'click', this.handleInlineFormatterClicked.bind(this));
    this.inlineToolbar.addButton(button);
  }
};


/**
 * Creates block formatting toolbar.
 */
Formatting.prototype.initBlockToolbarButtons = function() {
  var actions = Formatting.Actions.Block;
  for (var i = 0; i < actions.length; i++) {
    var button = new Button({
      name: actions[i].value,
      label: actions[i].label,
      data: actions[i]
    });
    button.addEventListener(
        'click', this.handleBlockFormatterClicked.bind(this));
    this.blockToolbar.addButton(button);
  }
};


/**
 * Registers shortcuts to handle formatting.
 */
Formatting.prototype.registerFormattingShortcuts_ = function () {
  for (var formatType in Formatting.Actions) {
    var actions = Formatting.Actions[formatType];
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i];
      for (var j = 0; j < action.shortcuts.length; j++) {
        this.editor.shortcutsManager.register(
            action.shortcuts[j], this.handleKeyboardShortcut.bind(this));
      }
    }
  }
};


/**
 * Creates extra fields for the action.
 * @param  {Object} action Action to create the button for.
 * @return {HTMLElement} div contianer containing extra fields.
 */
Formatting.prototype.createExtraFields = function(action) {
  var fields = [];
  if (!action.attrs) {
    return fields;
  }

  for (var key in action.attrs) {
    var attr = action.attrs[key];
    var field = new TextField({
      placeholder: attr.placeholder,
      required: attr.required,
      name: key
    });
    field.addEventListener(
        'keyup', this.handleInlineInputFieldKeyUp.bind(this));
    fields.push(field);
  }

  return fields;
};


/**
 * Applies a format with attributes from the active button and fields.
 */
Formatting.prototype.applyFormatWithAttrs = function(button) {
  var activeFormatter = button.data.value;
  var attrs = {};
  var fields = button.fields;
  for (var i = 0; i < fields.length; i++) {
    attrs[fields[i].name] = fields[i].value;
  }
  this.handleInlineFormatting(activeFormatter, attrs);
};


/**
 * Handles clicking enter in the attributes fields to apply the format.
 * @param  {Event} event Keyboard event.
 */
Formatting.prototype.handleInlineInputFieldKeyUp = function(event) {
  // Enter.
  if (event.keyCode === 13) {
    this.applyFormatWithAttrs(event.detail.target.parentButton);
  }
};


/**
 * Handles changing in selection or cursor.
 */
Formatting.prototype.handleSelectionChangedEvent = function() {
  var wSelection = window.getSelection();
  var selection = Selection.getInstance();
  var startComp = selection.getComponentAtStart();
  var endComp = selection.getComponentAtEnd();

  this.blockToolbar.setVisible(false);
  this.inlineToolbar.setVisible(false);

  if (wSelection.isCollapsed) {
    if (startComp instanceof Paragraph &&
        Formatting.BLOCK_ENABLED_ON.indexOf(startComp.paragraphType) !== -1) {
      // If there's no selection, show the block toolbar.
      this.blockToolbar.setPositionToStartTopOf(startComp.dom);
      this.blockToolbar.setVisible(true);
    }
    this.reloadBlockToolbarStatus();
  } else if (startComp instanceof Paragraph &&
        // Don't show the inline toolbar when multiple paragraphs are selected.
        startComp === endComp) {
    // Otherwise, show the inline toolbar.
    this.inlineToolbar.setPositionTopOfSelection();
    this.inlineToolbar.setVisible(true);
    this.reloadInlineToolbarStatus();
  }
};


/**
 * Reloads the status of the block toolbar and selects the active action.
 */
Formatting.prototype.reloadBlockToolbarStatus = function() {
  var selection = this.editor.article.selection;
  var paragraph = selection.getComponentAtStart();

  var button = this.blockToolbar.getButtonByName(paragraph.paragraphType);
  this.blockToolbar.setActiveButton(button);
};


/**
 * Reloads the status of the inline toolbar and selects the active action.
 */
Formatting.prototype.reloadInlineToolbarStatus = function() {
  var selection = this.editor.article.selection;
  var paragraph = selection.getComponentAtStart();
  var formatter = paragraph.getSelectedFormatter(selection);
  var activeAction = null;
  var attrs = {};
  var button = null;
  if (formatter) {
    activeAction = this.getFormatterForValue(formatter.type);
    attrs = formatter.attrs;
    button = this.inlineToolbar.getButtonByName(formatter.type);
  }

  this.inlineToolbar.resetFields();
  for (var key in attrs) {
    var field = button.getFieldByName(key);
    field.setValue(attrs[key]);
  }
  this.inlineToolbar.setActiveButton(button);
};


/**
 * Handles block formatter button clicked.
 * @param  {Event} event Click event.
 */
Formatting.prototype.handleBlockFormatterClicked = function(event) {
  var formatter = event.detail.target.data;
  this.handleBlockFormatting(formatter.value);
  this.reloadBlockToolbarStatus();
  event.preventDefault();
  event.stopPropagation();
};


/**
 * Creates the actual operations needed to execute block formatting.
 * @param  {string} Formatter to format the paragraph with.
 */
Formatting.prototype.handleBlockFormatting = function(clickedFormatter) {
  var selection = this.editor.article.selection;
  var paragraphs = selection.getSelectedComponents();
  var ops = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var toType = clickedFormatter;
    if (paragraphs[i].paragraphType === clickedFormatter) {
      toType = Paragraph.Types.Paragraph;
    }

    var index = paragraphs[i].getIndexInSection() + i;
    // Step 1: deleteComponent to remove current Paragraph.
    Utils.arrays.extend(ops, paragraphs[i].getDeleteOps());
    // Step 2: insertComponent to Insert a new Paragraph in its place with the
    // new paragraph type. Make sure to keep the name of the paragraph.
    paragraphs[i].paragraphType = toType;
    Utils.arrays.extend(ops, paragraphs[i].getInsertOps(index));
  }

  // Execute the transaction.
  this.editor.article.transaction(ops);

  // Tell listeners that there was a change in the editor.
  this.editor.dispatchEvent(new Event('change'));
};


/**
 * Applies an inline formatter to a paragraph.
 * @param  {Paragraph} paragraph A paragraph object to apply to format to.
 * @param  {Selection} selection The current selection to apply format to.
 * @param  {Object} format Format object describing the format.
 * @return {Array.<Object>} A list of operations describing the change.
 */
Formatting.prototype.format = function(paragraph, selection, format) {
  var ops = [], newDo, newUndo, newOp;

  var tempOps = paragraph.getUpdateOps(
      {formats: []}, selection.start.offset,
      selection.end.offset - selection.start.offset);
  var defaultDo = tempOps[0].do;

  // See the range already formatted in a similar type.
  var existingFormats = paragraph.getFormattedRanges(format, true);
  if (existingFormats && existingFormats.length) {

    for (var i = 0; i < existingFormats.length; i++) {
      var existingFormat = existingFormats[i];
      // If attrs were passed with the format just update the attributes.
      if (format.attrs) {
        newDo = Utils.clone(defaultDo);
        var doFormat = Utils.clone(existingFormat);
        doFormat.attrs = format.attrs;
        newDo.formats.push(doFormat);

        newUndo = Utils.clone(defaultDo);
        newUndo.formats.push(Utils.clone(existingFormat));
      }

      // If the format is re-applied to the same range remove the format.
      else if (format.to === existingFormat.to &&
          format.from === existingFormat.from) {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(Utils.clone(format));
        newUndo = newDo;
      } else if (format.to === existingFormat.to) {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(format);
        newUndo = newDo;
      } else if (format.from === existingFormat.from) {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(format);
        newUndo = newDo;
      }
      // If the selected range is already formatted and is in the middle split
      // the old format to unformat the selected range.
      else if (format.to < existingFormat.to &&
               format.from > existingFormat.from) {

        newDo = Utils.clone(defaultDo);
        newDo.formats.push(existingFormat);
        newDo.formats.push({
          type: existingFormat.type,
          from: existingFormat.from,
          to: format.from,
          attrs: format.attrs
        });
        newDo.formats.push({
          type: existingFormat.type,
          from: format.to,
          to: existingFormat.to,
          attrs: format.attrs
        });

        newUndo = Utils.clone(newDo);
        newUndo.formats.reverse();
      } else {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(existingFormat);
        newDo.formats.push({
          type: existingFormat.type,
          from: Math.min(existingFormat.from, format.from),
          to: Math.max(existingFormat.to, format.to)
        });

        newUndo = Utils.clone(newDo);
        newUndo.formats.reverse();
      }
    }
  } else {
    // Clear all formats touching the range and apply the new format.
    var unformatRanges = paragraph.getFormatsForRange(format.from, format.to);
    newDo = Utils.clone(defaultDo);
    Utils.arrays.extend(newDo.formats, unformatRanges);
    // Apply the requested format.
    newDo.formats.push(format);

    newUndo = Utils.clone(newDo);
    // Remove attrs from the format in Undo to signal a non-update operation
    // e.g. Remove this formatting.
    delete newUndo.formats[newUndo.formats.length - 1].attrs;
    newUndo.formats.reverse();
  }

  newOp = {
    do: newDo,
    undo: newUndo
  };
  ops.push(newOp);

  return ops;
};


/**
 * Handles inline formatter buttons clicks.
 * @param  {Event} event Click event.
 */
Formatting.prototype.handleInlineFormatterClicked = function(event) {
  var action = event.detail.target.data;
  var clickedFormatter = action.value;
  if (!action.attrs) {
    this.handleInlineFormatting(clickedFormatter);
    this.reloadInlineToolbarStatus();
  } else {
    var selection = this.editor.article.selection;
    var paragraph = selection.getComponentAtStart();
    var activeAction = paragraph.getSelectedFormatter(selection);

    // If the formatter is already applied, remove the formatting.
    if (activeAction && clickedFormatter === activeAction.type) {
      this.handleInlineFormatting(clickedFormatter);
      this.reloadInlineToolbarStatus();
    } else {
      this.inlineToolbar.setActiveButton(event.detail.target);
    }
  }

  event.preventDefault();
  event.stopPropagation();
};


/**
 * Creates the actual operations needed to execute inline formatting.
 * @param  {string} clickedFormatter formatter value string.
 * @param {Array.<Object>} optAttrs Attributes to add to the formatting.
 */
Formatting.prototype.handleInlineFormatting = function(
    clickedFormatter, optAttrs) {
  var selection = this.editor.article.selection;
  var currentParagraph = selection.getComponentAtStart();
  var format = {
    type: clickedFormatter,
    from: selection.start.offset,
    to: selection.end.offset,
    attrs: optAttrs
  };

  // If there's no selection no need to format.
  if (selection.end.offset - selection.start.offset === 0) {
    return;
  }

  var ops = this.format(currentParagraph, selection, format);
  this.editor.article.transaction(ops);

  // Tell listeners that there was a change in the editor.
  this.editor.dispatchEvent(new Event('change'));
};


/**
 * Handles keyboard shortcut event.
 * @param  {Event} event Keyboard event.
 */
Formatting.prototype.handleKeyboardShortcut = function(event) {
  var shortcutId = this.editor.shortcutsManager.getShortcutId(event);

  var inlineFormatter = this.getInlineFormatterForShortcut(shortcutId);
  if (inlineFormatter) {
    this.handleInlineFormatting(inlineFormatter.value);
    return false;
  }

  var blockFormatter = this.getBlockFormatterForShortcut(shortcutId);
  if (blockFormatter) {
    this.handleBlockFormatting(blockFormatter.value);
    return false;
  }

  return true;
};


/**
 * Returns the matched inline formatter for the shortcut.
 * @param  {string} shortcutId Shortcut ID to find the formatter for.
 * @return {Object|null} Inline formatter for the shortcut.
 */
Formatting.prototype.getInlineFormatterForShortcut = function(shortcutId) {
  var inlineFormatters = Formatting.Actions.Inline;
  for (var i = 0; i < inlineFormatters.length; i++) {
    if (inlineFormatters[i].shortcuts.indexOf(shortcutId) !== -1) {
      return inlineFormatters[i];
    }
  }
  return null;
};


/**
 * Returns the matched block formatter for the shortcut.
 * @param  {string} shortcutId Shortcut ID to find the formatter for.
 * @return {Object|null} Block formatter for the shortcut.
 */
Formatting.prototype.getBlockFormatterForShortcut = function(shortcutId) {
  var blockFormatters = Formatting.Actions.Block;
  for (var i = 0; i < blockFormatters.length; i++) {
    if (blockFormatters[i].shortcuts.indexOf(shortcutId) !== -1) {
      return blockFormatters[i];
    }
  }
  return null;
};


/**
 * Returns the action with the specified value;
 * @param  {string} value The value to return action for.
 * @return {Object} Action formatter object.
 */
Formatting.prototype.getFormatterForValue = function(value) {
  var blockFormatters = Formatting.Actions.Block;
  for (var i = 0; i < blockFormatters.length; i++) {
    if (blockFormatters[i].value === value) {
      return blockFormatters[i];
    }
  }

  var inlineFormatters = Formatting.Actions.Inline;
  for (i = 0; i < inlineFormatters.length; i++) {
    if (inlineFormatters[i].value === value) {
      return inlineFormatters[i];
    }
  }
  return null;
};


/**
 * Returns the action with the specified tag name;
 * @param  {string} tagName Tag name to find a matched action.
 * @return {Object} Action formatter object.
 */
Formatting.getActionForTagName = function(tagName) {
  tagName = tagName && tagName.toLowerCase();
  var inlineFormatters = Formatting.Actions.Inline;
  for (var i = 0; i < inlineFormatters.length; i++) {
    if (inlineFormatters[i].tagNames.indexOf(tagName) !== -1) {
      return inlineFormatters[i];
    }
  }
  return null;
};


/**
 * Returns a formats array that represents the inline formats for the node.
 * @param  {Element} node HTML Element to return the formats for.
 * @return {Array.<Object>} Formats array.
 */
Formatting.generateFormatsForNode = function(node) {
  var formats = [];
  var offset = 0;
  var children = node.childNodes;
  for (var i = 0; i < children.length; i++) {
    var inlineEl = children[i];
    var action = Formatting.getActionForTagName(inlineEl.tagName);
    if (action) {
      var attrs = {};
      for (var attr in action.attrs) {
        attrs[attr] = inlineEl.getAttribute(attr);
      }
      formats.push({
        type: action.value,
        from: offset,
        to: offset + Utils.getTextFromElement(inlineEl).length,
        attrs: attrs
      });
    }
    offset += inlineEl.textContent.length;
  }

  return formats;
};

},{"../paragraph":17,"../selection":19,"../toolbars/button":20,"../toolbars/textField":21,"../utils":23}],8:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Loader = require('../loader');

/**
 * GiphyComponent main.
 * @param {Object} optParams Optional params to initialize the GiphyComponent object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 */
var GiphyComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',
    // Generate a UID as a reference for this GiphyComponent.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this GiphyComponent.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this GiphyComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;

  /**
   * Placeholder text to show if the GiphyComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(GiphyComponent.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  this.dom.addEventListener('click', this.handleClick.bind(this));

  this.captionDom = document.createElement(GiphyComponent.CAPTION_TAG_NAME);
  this.captionDom.setAttribute('contenteditable', true);

  this.imgDom = document.createElement(GiphyComponent.IMAGE_TAG_NAME);

  if (this.caption) {
    Utils.setTextForElement(this.captionDom, this.caption);
    this.dom.appendChild(this.captionDom);
  }

  if (this.src) {
    this.imgDom.setAttribute('src', this.src);
    if (this.width) {
      this.imgDom.setAttribute('width', this.width);
    }
    this.dom.appendChild(this.imgDom);
  }
};
GiphyComponent.prototype = new Component();
module.exports = GiphyComponent;


/**
 * String name for the component class.
 * @type {string}
 */
GiphyComponent.CLASS_NAME = 'GiphyComponent';
Loader.register(GiphyComponent.CLASS_NAME, GiphyComponent);


/**
 * GiphyComponent component container element tag name.
 * @type {string}
 */
GiphyComponent.CONTAINER_TAG_NAME = 'figure';


/**
 * Image element tag name.
 * @type {string}
 */
GiphyComponent.IMAGE_TAG_NAME = 'img';


/**
 * Caption element tag name.
 * @type {string}
 */
GiphyComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Regex strings list that for matching Giphy search terms.
 * @type {Array.<string>}
 */
GiphyComponent.GIPHY_SEARCH_REGEXS = [
    '^/giphy\\s(.+[a-zA-Z])$'
];


/**
 * Giphy endpoint for random search.
 * Ref: https://github.com/Giphy/GiphyAPI
 * @type {String.<string>}
 */
GiphyComponent.GIPHY_RANDOM_ENDPOINT = 'https://api.giphy.com/v1/gifs/random?' +
      'api_key=dc6zaTOxFJmzC&' +
      'tag=';


/**
 * Create and initiate a giphy object from JSON.
 * @param  {Object} json JSON representation of the giphy.
 * @return {GiphyComponent} GiphyComponent object representing the JSON data.
 */
GiphyComponent.fromJSON = function (json) {
  return new GiphyComponent(json);
};


/**
 * Handles onInstall when the GiphyComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
GiphyComponent.onInstall = function(editor) {
  GiphyComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all giphy components instances.
};


/**
 * Registers regular experessions to create giphy component from if matched.
 * @param  {Editor} editor The editor to register regexes with.
 * @private
 */
GiphyComponent.registerRegexes_ = function(editor) {
  for (var i = 0; i < GiphyComponent.GIPHY_SEARCH_REGEXS.length; i++) {
    editor.registerRegex(
        GiphyComponent.GIPHY_SEARCH_REGEXS[i],
        GiphyComponent.handleMatchedRegex);
  }
};


/**
 * Creates a figure component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
GiphyComponent.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var giphyQuery = matchedComponent.text.split(/\s/).slice(1).join('+');

  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];

  // Call Giphy Random Endpoint.
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var src;
      /* jshint ignore:start */
      // Get the image url from the random search response.
      src = JSON.parse(xhttp.responseText)['data']['image_original_url'];
      /* jshint ignore:end */
      // If result is found for the query, create a component.
      if  (src) {
        var figure = new GiphyComponent({src: src});
        figure.section = matchedComponent.section;

        // Delete current matched component with its text.
        Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

        // Add the new component created from the text.
        Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

        opsCallback(ops);
      }
    }
  };
  xhttp.open('GET', GiphyComponent.GIPHY_RANDOM_ENDPOINT + giphyQuery, true);
  xhttp.send();
};

/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this GiphyComponent.
 */
GiphyComponent.prototype.getJSONModel = function() {
  var image = {
    component: GiphyComponent.CLASS_NAME,
    name: this.name,
    src: this.src,
    width: this.width,
    caption: this.caption
  };

  return image;
};


/**
 * Handles clicking on the GiphyComponent component to update the selection.
 */
GiphyComponent.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });
};


/**
 * Returns the operations to execute a deletion of the giphy component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
GiphyComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'GiphyComponent',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a GiphyComponent.
 * @param {number} index Index to insert the GiphyComponent at.
 * @return {Array.<Object>} Operations for inserting the GiphyComponent.
 */
GiphyComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'GiphyComponent',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        src: this.src,
        width: this.width,
        caption: this.caption
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the length of the GiphyComponent content.
 * @return {number} Length of the GiphyComponent content.
 */
GiphyComponent.prototype.getLength = function () {
  return 1;
};

},{"../component":2,"../loader":15,"../selection":19,"../utils":23}],9:[function(require,module,exports){
'use strict';


/**
 * Shortcut manager that manages the registeration and delivery of shortcuts
 * events triggered on the editor.
 * @param {Editor} editor The editor to manage the shortcuts for.
 */
var ShortcutsManager = function(editor) {

  /**
   * The editor to manage the shortcuts for.
   * @type {Editor}
   */
  this.editor = editor;

  /**
   * Registery to keep track of registered events and its listeners.
   * @type {Object.<Function>}
   */
  this.registery = {};

  this.editor.element.addEventListener(
      'keydown', this.handleKeyDownEvent.bind(this));
};
module.exports = ShortcutsManager;


/**
 * Main meta keys used for shortcuts (Shift, Ctrl, Cmd).
 * @type {Array}
 */
ShortcutsManager.META_KEYS = [16, 17, 91];


/**
 * Generates a shortcut ID string for the keyboard event.
 * @param  {Event} event Keyboard event.
 * @return {string} Generated shortcut ID (e.g. cmd+shift+a).
 */
ShortcutsManager.prototype.getShortcutId = function(event) {
  var keys = [];
  var keyCode = event.keyCode || event.which;
  if (ShortcutsManager.META_KEYS.indexOf(keyCode) !== -1) {
    return false;
  }

  if (event.metaKey) {
    keys.push('cmd');
  }

  if (event.ctrlKey) {
    keys.push('ctrl');
  }

  if (event.shiftKey) {
    keys.push('shift');
  }

  if (event.altKey) {
    keys.push('alt');
  }

  keys.sort();

  if (keyCode) {
    keys.push(String.fromCharCode(keyCode));
  }

  return keys.join('+').toLowerCase();
};


/**
 * Checks if the current event is for a shortcut.
 * @param  {Event} event Keyboard event shortcut.
 * @return {boolean} True if the shortcut is for the event.
 */
ShortcutsManager.prototype.isShortcutEvent = function(event) {
  var keyCode = event.keyCode || event.which;
  return ((event.metaKey || event.ctrlKey) && keyCode &&
          (ShortcutsManager.META_KEYS.indexOf(keyCode) === -1));
};


/**
 * Handles keydown events.
 * @param  {Event} event Keyboard event.
 * @return {boolean} True if the event wasn't handled and should bubble up.
 */
ShortcutsManager.prototype.handleKeyDownEvent = function(event) {
  if (this.isShortcutEvent(event)) {
    var shortcutId = this.getShortcutId(event);

    // If the shortcut is registered.
    if (this.registery[shortcutId]) {

      // Call the listener callback method passing the event.
      var returnValue = this.registery[shortcutId](event);

      // Stop the event from bubbling up if it was handled.
      if (returnValue === false) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }

  // Not handled bubble it up.
  return true;
};


/**
 * Registers a handler for a shortcut.
 * @param  {string} shortcutId A shortcut ID to listen to.
 * @param  {Function} handler Callback handler for the shortcut.
 * @param  {boolean=} optForce Optional parameter to force replacing an already
 * existing shortcut listener.
 */
ShortcutsManager.prototype.register = function(shortcutId, handler, optForce) {
  // If the shortcut already registered throw an error.
  if (this.registery[shortcutId] && !optForce) {
    throw '"' + shortcutId + '" shortcut has already been registered.';
  }

  this.registery[shortcutId] = handler;
};

},{}],10:[function(require,module,exports){
'use strict';

var Selection = require('../selection');
var Toolbar = require('../toolbars/toolbar');
var Button = require('../toolbars/button');


/**
 * Toolbelt extension for the editor.
 *   Adds an extendable toolbar for components to add buttons to.
 */
var Toolbelt = function () {

  /**
   * The editor this toolbelt belongs to.
   * @type {Editor}
   */
  this.editor = null;

  /**
   * The toolbelt toolbar.
   * @type {Toolbar}
   */
  this.toolbar = null;

  /**
   * The editor's block toolbar.
   * @type {Toolbar}
   */
  this.blockToolbar = null;

  /**
   * The insert button to show the toolbelt when clicked.
   * @type {Toolbar}
   */
  this.insertButton = new Button({ label: '+' });
  this.insertButton.setVisible(false);
  this.insertButton.addEventListener(
      'click', this.handleInsertClick.bind(this));
};
module.exports = Toolbelt;


/**
 * Extension class name.
 * @type {string}
 */
Toolbelt.CLASS_NAME = 'Toolbelt';


/**
 * Initializes the toolbelt extensions.
 * @param  {Editor} editor Editor instance this installed on.
 */
Toolbelt.onInstall = function(editor) {
  var toolbeltExtension = new Toolbelt();
  toolbeltExtension.init(editor);
};


/**
 * Initiates the toolbelt extension.
 * @param  {Editor} editor The editor to initialize the extension for.
 */
Toolbelt.prototype.init = function(editor) {
  this.editor = editor;
  this.blockToolbar = this.editor.getToolbar(Toolbelt.BLOCK_TOOLBAR_NAME);
  this.blockToolbar.addButton(this.insertButton);

  // Create a new toolbar for the toolbelt.
  this.toolbar = new Toolbar({
    name: Toolbelt.TOOLBELT_TOOLBAR_NAME,
    classNames: [Toolbelt.TOOLBELT_TOOLBAR_CLASS_NAME]
  });
  this.toolbar.addEventListener(
      'button-added', this.handleButtonAdded.bind(this));

  // Register the toolbelt toolbar with the editor.
  this.editor.registerToolbar(Toolbelt.TOOLBELT_TOOLBAR_NAME, this.toolbar);

  // Listen to selection changes.
  this.editor.article.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.handleSelectionChangedEvent.bind(this));
};


/**
 * Toolbelt toolbar name.
 * @type {string}
 */
Toolbelt.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Toolbelt toolbar class name.
 * @type {string}
 */
Toolbelt.TOOLBELT_TOOLBAR_CLASS_NAME = 'toolbelt-toolbar';


/**
 * Block toolbar name.
 * @type {string}
 */
Toolbelt.BLOCK_TOOLBAR_NAME = 'block-toolbar';


/**
 * Handles clicking the insert button to expand the toolbelt.
 */
Toolbelt.prototype.handleInsertClick = function() {
  this.toolbar.setPositionToStartBottomOf(this.insertButton.dom);
  this.toolbar.setVisible(!this.toolbar.isVisible);
};


/**
 * Handles selection change event on the editor to hide the toolbelt.
 */
Toolbelt.prototype.handleSelectionChangedEvent = function() {
  this.toolbar.setVisible(false);
};


/**
 * Handles new button added to toolbelt to show the insert button.
 */
Toolbelt.prototype.handleButtonAdded = function () {
  this.insertButton.setVisible(true);
};

},{"../selection":19,"../toolbars/button":20,"../toolbars/toolbar":22}],11:[function(require,module,exports){
'use strict';

var Button = require('../toolbars/button');
var Utils = require('../utils');
var Figure = require('../figure');
var Attachment = require('./attachment');


/**
 * An upload button that extends Button to style the upload button.
 * @param {Object=} optParams Optional parameters.
 */
var UploadButton = function (optParams) {
  var params = Utils.extend({
    label: 'Upload',
  }, optParams);

  Button.call(this, params);

  this.dom.classList.add(UploadButton.UPLOAD_CONTAINER_CLASS_NAME);

  /**
   * Upload button input element.
   * @type {HTMLElement}
   */
  this.uploadButtonDom = document.createElement(UploadButton.TAG_NAME);
  this.uploadButtonDom.setAttribute('type', 'file');
  this.uploadButtonDom.setAttribute('name', this.name);
  this.uploadButtonDom.addEventListener('change', this.handleChange.bind(this));

  this.dom.appendChild(this.uploadButtonDom);
};
UploadButton.prototype = Object.create(Button.prototype);


/**
 * Upload button container class name.
 * @type {string}
 */
UploadButton.UPLOAD_CONTAINER_CLASS_NAME = 'upload-button';


/**
 * Upload button element tag name.
 * @type {string}
 */
UploadButton.TAG_NAME = 'input';


/**
 * Handles file change when selecting a file.
 * @param {Event} event File event containing the selected files.
 */
UploadButton.prototype.handleChange = function(event) {
  var eventDetails = { target: this, files: event.target.files };
  var newEvent = new CustomEvent('change', {detail: eventDetails});
  this.dispatchEvent(newEvent);
  event.target.value = '';
};


/**
 * Upload Extension enables upload button on the toolbelt.
 */
var UploadExtension = function () {
  /**
   * The editor this toolbelt belongs to.
   * @type {Editor}
   */
  this.editor = null;

  /**
   * The toolbelt toolbar.
   * @type {Toolbar}
   */
  this.toolbelt = null;
};
module.exports = UploadExtension;


/**
 * Extension class name.
 * @type {string}
 */
UploadExtension.CLASS_NAME = 'UploadExtension';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
UploadExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Event name for attachment added.
 * @type {string}
 */
UploadExtension.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Initializes the upload extensions.
 * @param  {Editor} editor Editor instance this installed on.
 */
UploadExtension.onInstall = function(editor) {
  var uploadExtension = new UploadExtension();
  uploadExtension.init(editor);
};


/**
 * Initialize the upload button and listener.
 * @param  {Editor} editor The editor to enable the extension on.
 */
UploadExtension.prototype.init = function(editor) {
  this.editor = editor;
  this.toolbelt = this.editor.getToolbar(
      UploadExtension.TOOLBELT_TOOLBAR_NAME);

  var uploadButton = new UploadButton({
    label: 'Upload Photo'
  });
  uploadButton.addEventListener('change', this.handleUpload.bind(this));
  this.toolbelt.addButton(uploadButton);
};


/**
 * Handles selecting a file.
 * @param  {Event} event Event fired from UploadButton.
 */
UploadExtension.prototype.handleUpload = function(event) {
  var that = this;
  // TODO(mkhatib): Create attachment per supported file.
  var file = event.detail.files[0];

  // Read the file as Data URL.
  this.readFileAsDataUrl_(file, function(dataUrl) {
    var selection = that.editor.article.selection;
    var component = selection.getComponentAtStart();

    // Create a figure with the file Data URL and insert it.
    var figure = new Figure({src: dataUrl});
    figure.section = selection.getSectionAtStart();
    var insertFigureOps = figure.getInsertOps(component.getIndexInSection());
    that.editor.article.transaction(insertFigureOps);

    // Create an attachment to track the figure and insertion operations.
    var attachment = new Attachment({
      file: file,
      figure: selection.getComponentAtStart(),
      editor: that.editor,
      insertedOps: insertFigureOps
    });

    // Dispatch an attachment added event to allow clients to upload the file.
    var newEvent = new CustomEvent(
      UploadExtension.ATTACHMENT_ADDED_EVENT_NAME, {
        detail: { attachment: attachment }
    });
    that.editor.dispatchEvent(newEvent);
  });
};


/**
 * Read file data URL.
 * @param  {File} file File picked by the user.
 * @param  {Function} callback Callback function when the reading is complete.
 */
UploadExtension.prototype.readFileAsDataUrl_ = function(file, callback) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    // jshint unused: false
    return function(e) {
      callback(e.target.result);
    };
  }(file));
  reader.readAsDataURL(file);
};

},{"../figure":13,"../toolbars/button":20,"../utils":23,"./attachment":5}],12:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');

/**
 * YouTubeComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 */
var YouTubeComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',

    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '360px',
    // Generate a UID as a reference for this YouTubeComponent.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this YouTubeComponent.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this YouTubeComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;
  this.height = params.height;

  /**
   * Placeholder text to show if the YouTubeComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(YouTubeComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  this.containerDom = document.createElement(
      YouTubeComponent.CONTAINER_TAG_NAME);
  this.containerDom.className = YouTubeComponent.CONTAINER_CLASS_NAME;

  this.overlayDom = document.createElement(
      YouTubeComponent.VIDEO_OVERLAY_TAG_NAME);
  this.overlayDom.className = YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME;
  this.containerDom.appendChild(this.overlayDom);
  this.overlayDom.addEventListener('click', this.handleClick.bind(this));

  this.videoDom = document.createElement(YouTubeComponent.VIDEO_TAG_NAME);
  this.containerDom.appendChild(this.videoDom);

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: 'Type caption for video',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  if (this.src) {
    this.videoDom.setAttribute('src', this.src);
    this.videoDom.setAttribute('frameborder', 0);
    this.videoDom.setAttribute('allowfullscreen', true);
    if (this.width) {
      this.videoDom.setAttribute('width', this.width);
    }
    if (this.height) {
      this.videoDom.setAttribute('height', this.height);
    }
    this.containerDom.appendChild(this.videoDom);
  }

  this.captionDom = this.captionParagraph.dom;
  this.captionDom.setAttribute('contenteditable', true);
  this.dom.appendChild(this.containerDom);
  this.dom.appendChild(this.captionDom);
};
YouTubeComponent.prototype = new Component();
module.exports = YouTubeComponent;

/**
 * String name for the component class.
 * @type {string}
 */
YouTubeComponent.CLASS_NAME = 'YouTubeComponent';
Loader.register(YouTubeComponent.CLASS_NAME, YouTubeComponent);


/**
 * YouTubeComponent component element tag name.
 * @type {string}
 */
YouTubeComponent.TAG_NAME = 'figure';


/**
 * YouTubeComponent component inner container element tag name.
 * @type {string}
 */
YouTubeComponent.CONTAINER_TAG_NAME = 'div';


/**
 * YouTubeComponent component inner container element class name.
 * @type {string}
 */
YouTubeComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_TAG_NAME = 'iframe';


/**
 * Caption element tag name.
 * @type {string}
 */
YouTubeComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME = 'video-overlay';


/**
 * Regex strings list that for matching YouTube URLs.
 * @type {Array.<string>}
 */
YouTubeComponent.YOUTUBE_URL_REGEXS = [
    '(?:https?://(?:www\.)?youtube\.com\/(?:[^\/]+/.+/|' +
    '(?:v|e(?:mbed)?)/|.*[?&]v=)|' +
    'youtu\.be/)([^"&?/ ]{11})'
];


/**
 * Create and initiate a youtube object from JSON.
 * @param  {Object} json JSON representation of the youtube.
 * @return {YouTubeComponent} YouTubeComponent object representing JSON data.
 */
YouTubeComponent.fromJSON = function (json) {
  return new YouTubeComponent(json);
};


/**
 * Handles onInstall when the YouTubeComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
YouTubeComponent.onInstall = function(editor) {
  YouTubeComponent.registerRegexes_(editor);

  // TODO(mkhatib): Initialize a toolbar for all YouTube components instances.
};


/**
 * Registers regular experessions to create YouTube component from if matched.
 * @param  {Editor} editor The editor to register regexes with.
 * @private
 */
YouTubeComponent.registerRegexes_ = function(editor) {
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    editor.registerRegex(
        YouTubeComponent.YOUTUBE_URL_REGEXS[i],
        YouTubeComponent.handleMatchedRegex);
  }
};


/**
 * Creates a YouTube video component from a link.
 * @param  {string} link YouTube video URL.
 * @return {YouTubeComponent} YouTubeComponent component created from the link.
 */
YouTubeComponent.createYouTubeComponentFromLink = function (link, attrs) {
  var src = link;
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    var regex = new RegExp(YouTubeComponent.YOUTUBE_URL_REGEXS);
    var matches = regex.exec(src);
    if (matches) {
      src = YouTubeComponent.createEmbedSrcFromId(matches[1]);
      break;
    }
  }
  return new YouTubeComponent(Utils.extend({src: src}, attrs));
};


/**
 * Creates a YouTube video component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
YouTubeComponent.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var ytComponent = YouTubeComponent.createYouTubeComponentFromLink(
      matchedComponent.text, {});
  ytComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, ytComponent.getInsertOps(atIndex));

  opsCallback(ops);
};


/**
 * Returns the embed src URL for the id.
 * @param  {string} id YouTube video ID.
 * @return {string} Embed src URL.
 */
YouTubeComponent.createEmbedSrcFromId = function (id) {
  return 'https://www.youtube.com/embed/' + id +
    '?rel=0&amp;showinfo=0&amp;iv_load_policy=3';
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this YouTubeComponent.
 */
YouTubeComponent.prototype.getJSONModel = function() {
  var video = {
    component: YouTubeComponent.CLASS_NAME,
    name: this.name,
    src: this.src,
    height: this.height,
    width: this.width,
    caption: this.captionParagraph.text
  };

  return video;
};


/**
 * Handles clicking on the youtube component to update the selection.
 */
YouTubeComponent.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });

  // TODO(mkhatib): Unselect the component when the video plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Returns the operations to execute a deletion of the YouTube component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
YouTubeComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a youtube component.
 * @param {number} index Index to insert the youtube component at.
 * @return {Array.<Object>} Operations for inserting the youtube component.
 */
YouTubeComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        src: this.src,
        width: this.width,
        caption: this.caption
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
YouTubeComponent.prototype.getLength = function () {
  return 1;
};

},{"../component":2,"../loader":15,"../paragraph":17,"../selection":19,"../utils":23}],13:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Selection = require('./selection');
var Component = require('./component');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');

/**
 * Figure main.
 * @param {Object} optParams Optional params to initialize the Figure object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%'
 *     name: Utils.getUID()
 *   }
 */
var Figure = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    captionPlaceholder: 'Type caption for image',
    width: '100%',
  }, optParams);

  Component.call(this, params);

  /**
   * Internal model text in this Figure.
   * @type {string}
   */
  this.src = params.src;

  /**
   * Wether this figure is initialized with Data URL.
   * @type {boolean}
   */
  this.isDataUrl = !!params.src && params.src.indexOf('data:image') === 0;

  /**
   * Width of the figure.
   * @type {string}
   */
  this.width = params.width;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: params.captionPlaceholder,
    text: params.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Figure.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  this.imgDom = document.createElement(Figure.IMAGE_TAG_NAME);
  this.imgDom.addEventListener('click', this.handleClick.bind(this));

  if (this.src) {
    this.imgDom.setAttribute('src', this.src);
    if (this.width) {
      this.imgDom.setAttribute('width', this.width);
    }
    this.dom.appendChild(this.imgDom);
  }

  this.captionDom = this.captionParagraph.dom;
  this.captionDom.setAttribute('contenteditable', true);
  this.dom.appendChild(this.captionDom);
};
Figure.prototype = Object.create(Component.prototype);
module.exports = Figure;


/**
 * String name for the component class.
 * @type {string}
 */
Figure.CLASS_NAME = 'Figure';
Loader.register(Figure.CLASS_NAME, Figure);


/**
 * Figure component container element tag name.
 * @type {string}
 */
Figure.CONTAINER_TAG_NAME = 'figure';


/**
 * Image element tag name.
 * @type {string}
 */
Figure.IMAGE_TAG_NAME = 'img';


/**
 * Caption element tag name.
 * @type {string}
 */
Figure.CAPTION_TAG_NAME = 'figcaption';


/**
 * Regex strings list that for matching image URLs.
 * @type {Array.<string>}
 */
Figure.IMAGE_URL_REGEXS = [
    'https?://(.*)\.(jpg|png|gif|jpeg)$'
];


/**
 * Create and initiate a figure object from JSON.
 * @param  {Object} json JSON representation of the figure.
 * @return {Figure} Figure object representing the JSON data.
 */
Figure.fromJSON = function (json) {
  return new Figure(json);
};


/**
 * Handles onInstall when Paragrarph module is installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
Figure.onInstall = function(editor) {
  Figure.registerRegexes_(editor);
  // TODO(mkhatib): Initialize a toolbar for all Figure components instances.
};


/**
 * Registers regular experessions to create image from if matched.
 * @param  {Editor} editor The editor to register the regex with.
 */
Figure.registerRegexes_ = function(editor) {
  for (var i = 0; i < Figure.IMAGE_URL_REGEXS.length; i++) {
    editor.registerRegex(
        Figure.IMAGE_URL_REGEXS[i],
        Figure.handleMatchedRegex);
  }
};


/**
 * Creates a figure component from a link.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
Figure.handleMatchedRegex = function (matchedComponent, opsCallback) {
  var src = matchedComponent.text;
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var figure = new Figure({src: src});
  figure.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

  opsCallback(ops);
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Figure.
 */
Figure.prototype.getJSONModel = function() {
  var image = {
    component: Figure.CLASS_NAME,
    name: this.name,
    width: this.width,
    caption: this.captionParagraph.text
  };

  if (!this.isDataUrl) {
    image.src = this.src;
  }

  return image;
};


/**
 * Handles clicking on the figure component to update the selection.
 */
Figure.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });
};


/**
 * Returns the operations to execute a deletion of the image component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
Figure.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Figure',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a figure.
 * @param {number} index Index to insert the figure at.
 * @return {Array.<Object>} Operations for inserting the figure.
 */
Figure.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'Figure',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        src: this.src,
        width: this.width,
        caption: this.caption
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the length of the figure content.
 * @return {number} Length of the figure content.
 */
Figure.prototype.getLength = function () {
  return 1;
};


/**
 * Updates figure attributes.
 * @param  {Object} attrs Attributes to update.
 */
Figure.prototype.updateAttributes = function(attrs) {
  if (attrs.src) {
    this.updateSource(attrs.src);
  }

  if (attrs.caption) {
    this.updateCaption(attrs.caption);
  }
};


/**
 * Updates the source attribute for the figure and its dom.
 * @param  {string} src Image source.
 */
Figure.prototype.updateSource = function(src) {
  this.src = src;
  this.isDataUrl = !!this.src && this.src.indexOf('http') !== 0;
  this.imgDom.setAttribute('src', src);
};


/**
 * Updates figure caption and its dom.
 * @param  {string} caption Caption text to update to.
 */
Figure.prototype.updateCaption = function(caption) {
  this.caption = caption;
  this.captionParagraph.setText(caption);
};

},{"./component":2,"./loader":15,"./paragraph":17,"./selection":19,"./utils":23}],14:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Section = require('./section');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');

/**
 * List main.
 * @param {Object} optParams Optional params to initialize the List object.
 * Default:
 *   {
 *     components: [Paragraph],
 *     tagName: 'ul'
 *   }
 */
var List = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    tagName: List.UNORDERED_LIST_TAG,
    components: [new Paragrarph({
      paragraphType: Paragrarph.Types.ListItem
    })]
  }, optParams);

  Section.call(this, params);
};
List.prototype = Object.create(Section.prototype);
module.exports = List;


/**
 * String name for the component class.
 * @type {string}
 */
List.CLASS_NAME = 'List';
Loader.register(List.CLASS_NAME, List);


/**
 * Unordered List component container element tag name.
 * @type {string}
 */
List.UNORDERED_LIST_TAG = 'UL';


/**
 * Ordered List component container element tag name.
 * @type {string}
 */
List.ORDERED_LIST_TAG = 'OL';


/**
 * Regex string for matching unordered list.
 * @type {string}
 */
List.UNORDERED_LIST_REGEX = '^(?:\\*|-)\\s?(.*)';


/**
 * Regex strings for matching ordered list.
 * @type {string}
 */
List.ORDERED_LIST_REGEX = '^(?:1\\.|-|_|\\))\\s?(.*)';


/**
 * Create and initiate a list object from JSON.
 * @param  {Object} json JSON representation of the list.
 * @return {List} List object representing the JSON data.
 */
List.fromJSON = function (json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new List({
    name: json.name,
    components: components
  });
};


/**
 * Handles onInstall when List module is installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
List.onInstall = function(editor) {
  List.registerRegexes_(editor);
};


/**
 * Registers regular experessions to create image from if matched.
 * @param  {Editor} editor The editor to register the regex with.
 */
List.registerRegexes_ = function(editor) {
  editor.registerRegex(List.UNORDERED_LIST_REGEX, List.handleULMatchedRegex);
  editor.registerRegex(List.ORDERED_LIST_REGEX, List.handleOLMatchedRegex);
};


/**
 * Returns list of operations to create a list from a matched regex.
 * @param  {Component} component Matched regex component.
 * @param  {string} text Text for creating the list item.
 * @param  {string} listType UL or OL.
 * @return {Array.<Object>} List of operations to create a list.
 */
List.createListOpsForMatchedRegex_ = function (component, text, listType) {
  var atIndex = component.getIndexInSection();
  var ops = [];
  var list = new List({
    tagName: listType,
    section: component.section,
    components: [new Paragrarph({
      text: text,
      paragraphType: Paragrarph.Types.ListItem
    })]
  });

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, component.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, list.getInsertOps(atIndex));

  var newLi = new Paragrarph({
    paragraphType: Paragrarph.Types.ListItem,
    section: list
  });

  // Add the new component created from the text.
  Utils.arrays.extend(ops, newLi.getInsertOps(1));

  return ops;
};


/**
 * Creates an unordered list component from matched regex component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
List.handleULMatchedRegex = function (matchedComponent, opsCallback) {
  var regex = new RegExp(List.UNORDERED_LIST_REGEX);
  var matches = regex.exec(matchedComponent.text);
  var text = matches[1];
  var ops = List.createListOpsForMatchedRegex_(
      matchedComponent, text, List.UNORDERED_LIST_TAG);
  opsCallback(ops);
};


/**
 * Creates an ordered list component from matched regex component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
List.handleOLMatchedRegex = function (matchedComponent, opsCallback) {
  var regex = new RegExp(List.ORDERED_LIST_REGEX);
  var matches = regex.exec(matchedComponent.text);
  var text = matches[1];
  var ops = List.createListOpsForMatchedRegex_(
      matchedComponent, text, List.ORDERED_LIST_TAG);
  opsCallback(ops);
};


/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
List.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        components: this.components,
        tagName: this.tagName
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a list.
 * @param {number} index Index to insert the list at.
 * @return {Array.<Object>} Operations for inserting the list.
 */
List.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        components: this.components,
        tagName: this.tagName
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the operations to execute splitting a list.
 * @param {number} atIndex Index to split the list at.
 * @return {Array.<Object>} Operations for splitting the list.
 */
List.prototype.getSplitOps = function (atIndex) {
  var ops = this.getDeleteOps();
  var newUID = Utils.getUID();
  Utils.arrays.extend(ops, [{
    do: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: this.getIndexInSection(),
      attrs: {
        components: this.components.slice(0, atIndex),
        tagName: this.tagName
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }, {
    do: {
      op: 'insertComponent',
      componentClass: 'List',
      section: this.section.name,
      cursorOffset: 0,
      component: newUID,
      index: this.getIndexInSection() + 1,
      attrs: {
        components: this.components.slice(atIndex, this.getLength()),
        tagName: this.tagName
      }
    },
    undo: {
      op: 'deleteComponent',
      component: newUID
    }
  }]);

  return ops;
};


/**
 * Returns the length of the list content.
 * @return {number} Length of the list content.
 */
List.prototype.getLength = function () {
  return this.components.length;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this list.
 */
List.prototype.getJSONModel = function() {
  var section = {
    component: List.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};

},{"./loader":15,"./paragraph":17,"./section":18,"./utils":23}],15:[function(require,module,exports){
'use strict';

var Errors = require('./errors');

/**
 * Loader A loader to register modules and load them on runtime.
 * e.g. Loader.register('YouTubeComponent', YouTubeComponent);
 * var YC = Loader.load('YouTubeComponent');
 */
var Loader = (function() {

  var Loader = function () {
    /**
     * The registery for the components and its modules.
     * @type {Object}
     */
    this.registery = {};
  };


  /**
   * Registers a module with the loader.
   * @param  {string} name Name of module to register.
   * @param  {Function} module The module.
   * @param  {boolean=} optForce Forcing registering even when its already
   * registered.
   */
  Loader.prototype.register = function(name, module, optForce) {
    if (this.registery[name] && !optForce) {
      throw Errors.AlreadyRegisteredError(
          'The module name "' + name + '" has already been registered.');
    }

    this.registery[name] = module;
  };


  /**
   * Returns the module registered to the name.
   * @param {string} name Module's name to load.
   * @return {Function} The module requested.
   */
  Loader.prototype.load = function(name) {
    return this.registery[name];
  };

  var instance = new Loader();
  return {
    register: function (name, module, optForce) {
      instance.register(name, module, optForce);
    },

    load: function (name) {
      return instance.load(name);
    }

  };
})();
module.exports = Loader;

},{"./errors":4}],16:[function(require,module,exports){
'use strict';

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.List = require('./list');
module.exports.Figure = require('./figure');
module.exports.YouTubeComponent = require('./extensions/youtubeComponent');
module.exports.Section = require('./section');
module.exports.Selection = require('./selection');

// TODO(mkhatib): Find a better way to expose the classes and without making
// them part of the whole editor Javascript.
module.exports.GiphyComponent = require('./extensions/giphyComponent');

},{"./article":1,"./editor":3,"./extensions/giphyComponent":8,"./extensions/youtubeComponent":12,"./figure":13,"./list":14,"./paragraph":17,"./section":18,"./selection":19}],17:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Component = require('./component');
var Loader = require('./loader');

/**
 * Paragraph main.
 * @param {Object} optParams Optional params to initialize the Paragraph object.
 * Default:
 *   {
 *     text: '',
 *     placeholderText: null,
 *     paragraphType: Paragraph.Types.Paragraph,
 *     formats: [],
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
    // List of inline formats for the paragraph.
    formats: [],
  }, optParams);

  Component.call(this, params);

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

  /**
   * Inline formats for the paragraph.
   * @type {Array.<Object>}
   */
  this.formats = params.formats;

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

  if (this.formats) {
    this.updateInnerDom_();
  }
};
Paragraph.prototype = Object.create(Component.prototype);
module.exports = Paragraph;


/**
 * String name for the component class.
 * @type {string}
 */
Paragraph.CLASS_NAME = 'Paragraph';
Loader.register(Paragraph.CLASS_NAME, Paragraph);


/**
 * Differet types of a paragraph.
 * @type {Enum}
 */
Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Quote: 'blockquote',
  Code: 'pre',
  Caption: 'figcaption',
  ListItem: 'li'
};


/**
 * Create and initiate a paragraph object from JSON.
 * @param  {Object} json JSON representation of the paragraph.
 * @return {Paragraph} Paragraph object representing the JSON data.
 */
Paragraph.fromJSON = function (json) {
  return new Paragraph(json);
};


/**
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Paragraph.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Returns true if the paragraph type is a header.
 * @return {boolean} True if the paragraph is a header.
 */
Paragraph.prototype.isHeader = function() {
  return [
      Paragraph.Types.MainHeader,
      Paragraph.Types.SecondaryHeader,
      Paragraph.Types.ThirdHeader
  ].indexOf(this.paragraphType) !== -1;
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
    Utils.setTextForElement(this.dom, this.text);
  }
};


/**
 * Inserts characters at a specific index.
 * @param  {string} chars A string representing the characters to insert.
 * @param  {number} index Start index to insert characters at.
 */
Paragraph.prototype.insertCharactersAt = function(chars, index) {
  var texts = [this.text.substring(0, index), this.text.substring(index)];
  var updatedText = texts.join(chars);

  this.shiftFormatsFrom_(index, chars.length);
  this.setText(updatedText);
  this.updateInnerDom_();
};


/**
 * Removes number of characters starting from an index.
 * @param  {number} index Start index to start removing characters at.
 * @param  {number} count Number of characters to remove.
 */
Paragraph.prototype.removeCharactersAt = function(index, count) {
  var texts = [this.text.substring(0, index), this.text.substring(index + count)];
  var updatedText = texts.join('');

  this.shiftFormatsFrom_(index, -1 * count);
  this.setText(updatedText);
  this.updateInnerDom_();
};


/**
 * Shift the formats representations by an amount starting from an index.
 * @param  {number} startIndex Start index to start shifting at.
 * @param  {number} shift A positive or negative shift to add to formats index.
 * @private
 */
Paragraph.prototype.shiftFormatsFrom_ = function(startIndex, shift) {
  var toRemove = [];
  for (var i = 0; i < this.formats.length; i++) {
    // If the format is in the range being shifted, remove it.
    if (startIndex <= this.formats[i].from &&
        startIndex - shift >= this.formats[i].to) {
      toRemove.push(i);
    }
    if (this.formats[i].from >= startIndex) {
      this.formats[i].from += shift;
    }
    if (this.formats[i].to > startIndex) {
      this.formats[i].to += shift;
    }
  }

  for (i = 0; i < toRemove.length; i++) {
    this.formats.splice(toRemove[i], 1);
  }
};


/**
 * Updates the inner dom representation of the paragraph to apply formats
 * attached to this paragraph.
 * @private
 */
Paragraph.prototype.updateInnerDom_ = function () {
  if (!this.formats.length) {
    this.setText(this.text);
    return;
  }

  var newDom = document.createElement(this.paragraphType);
  var formatOpen = 0;
  var formatClose = 0;
  var text;
  for (var i = 0; i < this.formats.length; i++) {
    formatOpen = this.formats[i].from;
    if (formatOpen - formatClose > 0) {
      text = this.text.substring(formatClose, formatOpen);
      newDom.appendChild(document.createTextNode(text));
    }
    formatClose = this.formats[i].to;
    var formatEl = document.createElement(this.formats[i].type);
    for (var attr in this.formats[i].attrs) {
      formatEl.setAttribute(attr, this.formats[i].attrs[attr]);
    }
    Utils.setTextForElement(
        formatEl, this.text.substring(formatOpen, formatClose));
    newDom.appendChild(formatEl);
  }
  var length = this.text.length;
  if (length - formatClose > 0) {
    text = this.text.substring(length, formatClose);
    newDom.appendChild(document.createTextNode(text));
  }
  this.dom.innerHTML = newDom.innerHTML;
};


/**
 * Whether this is a placeholder element.
 * @return {boolean} True if has placeholder text and no input text.
 */
Paragraph.prototype.isPlaceholder = function() {
  return !!this.placeholderText && !this.text.length;
};


/**
 * Applies a list of formats to this paragraph.
 * @param  {Array.<Object>} formats A list of format objects to apply.
 */
Paragraph.prototype.applyFormats = function(formats) {
  for (var i = 0; i < formats.length; i++) {
    this.format(formats[i]);
  }
};


/**
 * Returns the currently selected formatter in the range.
 * @param {Selection} selection Selection to get formatter at.
 * @return {Object|null} Currently selected formatter.
 */
Paragraph.prototype.getSelectedFormatter = function(selection) {
  for (var i = 0; i < this.formats.length; i++) {
    if (selection.start.offset >= this.formats[i].from &&
        selection.start.offset < this.formats[i].to &&
        selection.end.offset > this.formats[i].from &&
        selection.end.offset <= this.formats[i].to) {
      return this.formats[i];
    }
  }

  return null;
};


/**
 * Applies a format to this paragraph. This could add, remove or subtract from
 * the formats on the paragraph.
 * @param  {Object} format A format objects to apply.
 */
Paragraph.prototype.format = function(format, clear) {
  // See the range already formatted in a similar type.
  format = Utils.clone(format);
  var originalExistingFormats = this.getFormattedRanges(format, !clear);
  if (originalExistingFormats && originalExistingFormats.length) {
    var existingFormats = Utils.clone(originalExistingFormats);
    for (var i = 0; i < existingFormats.length; i++) {
      var existingFormat = existingFormats[i];
      var index = this.formats.indexOf(originalExistingFormats[i]);
      // If attrs were passed with the format just update the attributes.
      if (format.attrs) {
        existingFormat.attrs = format.attrs;
        this.formats[index] = existingFormat;
      }
      // If the format is re-applied to the same range remove the format.
      else if (format.to === existingFormat.to &&
          format.from === existingFormat.from) {
        this.formats.splice(index, 1);
      } else if (format.to === existingFormat.to || (
          format.to > existingFormat.to &&
          format.from < existingFormat.to && clear)) {
        existingFormat.to = format.from;
        this.formats[index] = existingFormat;
      } else if (format.from === existingFormat.from || (
          format.from < existingFormat.from &&
          format.to > existingFormat.from && clear)) {
        existingFormat.from = format.to;
        this.formats[index] = existingFormat;
      }
      // If the selected range is already formatted and is in the middle split
      // the old format to unformat the selected range.
      else if (format.to < existingFormat.to &&
               format.from > existingFormat.from) {

        this.formats.splice(index, 1);

        this.addNewFormatting({
            type: existingFormat.type, from: existingFormat.from, to: format.from });

        this.addNewFormatting({
            type: existingFormat.type, from: format.to, to: existingFormat.to });
      } else {
        if (!clear) {
          existingFormat.from = Math.min(existingFormat.from, format.from);
          existingFormat.to = Math.max(existingFormat.to, format.to);
          this.formats[index] = existingFormat;
        } else {
          this.formats.splice(index, 1);
        }
      }
    }
  } else {
    var formattedRanges = this.getFormattedRanges(format, false);
    if (!formattedRanges || !formattedRanges.length) {
      this.addNewFormatting(format);
    } else {
      // Clear all formats touching the range and apply the new format.
      if (!clear) {
        this.format(format, true);
        this.format(format);
      }
    }
  }

  if (!clear) {
    this.normalizeFormats_();
  }
  this.updateInnerDom_();
};


/**
 * Merges similar formats that overlaps together.
 */
Paragraph.prototype.normalizeFormats_ = function() {
  if (!this.formats || !this.formats.length) {
    return;
  }

  var newFormats = [Utils.clone(this.formats[0])];
  for (var i = 1; i < this.formats.length; i++) {
    if ((newFormats[newFormats.length - 1].to > this.formats[i].from) ||
        (newFormats[newFormats.length - 1].to === this.formats[i].from &&
         newFormats[newFormats.length - 1].type === this.formats[i].type)) {
      newFormats[newFormats.length - 1].to = this.formats[i].to;
    } else {
      newFormats.push(Utils.clone(this.formats[i]));
    }
  }

  this.formats = newFormats;
};


/**
 * Returns formats representing the range given.
 * @param  {number} from Where to start.
 * @param  {number} to Where to end.
 * @return {Array.<Object>} List of formats representing that range formats.
 */
Paragraph.prototype.getFormatsForRange = function(from, to) {
  var finalFormats = [];
  var rangeFormats = this.getFormattedRanges({
    from: from,
    to: to,
    type: null
  }, false);

  rangeFormats = Utils.clone(rangeFormats);
  for (var j = 0; j < rangeFormats.length; j++) {
    if (rangeFormats[j].from < from && rangeFormats[j].to >= from) {
      rangeFormats[j].from = from;
    }

    if (rangeFormats[j].to > to && rangeFormats[j].from <= to) {
      rangeFormats[j].to = to;
    }

    if (rangeFormats[j].from < rangeFormats[j].to) {
      finalFormats.push(rangeFormats[j]);
    }
  }

  return finalFormats;
};


/**
 * Finds if the paragraph has formatted regions in the format range.
 * @param  {Object} format The format to check in its range.
 * @param  {boolean=} matchType Whether to check for type match.
 * @return {Array.<Object>} List of formats that overlap the format.
 */
Paragraph.prototype.getFormattedRanges = function(format, matchType) {
  var matchingFormats = [];
  var matchingFormatsWithType = [];
  for (var i = 0; i < this.formats.length; i++) {
    // Out of range so no simialr format.
    if (this.formats[i].from > format.to) {
      continue;
    }
    if (
        // Range inside or on the border of already formatted area.
        (this.formats[i].from < format.from &&
         this.formats[i].to >= format.to) ||

        // Range contains an already format area.
        (this.formats[i].from >= format.from &&
         this.formats[i].to <= format.to) ||

        // Range is partially formatted to the left.
        (this.formats[i].to > format.from &&
         this.formats[i].to <= format.to &&
         this.formats[i].from < format.from) ||

        // Range is partially formatted to the right.
        (this.formats[i].from >= format.from &&
         this.formats[i].from < format.to &&
         this.formats[i].to > format.to)) {

      matchingFormats.push(this.formats[i]);

      if (this.formats[i].type === format.type) {
        matchingFormatsWithType.push(this.formats[i]);
      }
    }
  }

  if (matchType) {
    if (matchingFormatsWithType.length === matchingFormats.length) {
      return matchingFormatsWithType;
    }
  } else {
    return matchingFormats;
  }
};


/**
 * Adds and sorts the formatting to be in the correct order.
 * @param {Object} format The new formatter to add.
 */
Paragraph.prototype.addNewFormatting = function(format) {
  this.formats.push(format);
  this.formats.sort(function(formatA, formatB) {
    var result = formatA.from - formatB.from;
    if (!result) {
      if (formatA.type > formatB.type) {
        result = 1;
      } else if (formatA.type < formatB.type) {
        result = -1;
      } else {
        result = 0;
      }
    }
    return result;
  });
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this paragraph.
 */
Paragraph.prototype.getJSONModel = function() {
  var paragraph = {
    component: Paragraph.CLASS_NAME,
    name: this.name,
    text: this.text,
    paragraphType: this.paragraphType
  };

  if (this.formats && this.formats.length) {
    paragraph.formats = this.formats;
  }

  return paragraph;
};


/**
 * Returns the operations to execute a deletion of the paragraph component.
 *   For partial deletion pass optFrom and optTo.
 * @param  {number=} optIndexOffset Optional offset to add to the index of the
 * component for insertion point for the undo.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
Paragraph.prototype.getDeleteOps = function(optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Paragraph',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        text: this.text,
        placeholderText: this.placeholderText,
        paragraphType: this.paragraphType,
        formats: this.formats
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a paragarph.
 * @param {number} index Index to insert the paragarph at.
 * @return {Array.<Object>} Operations for inserting the paragraph.
 */
Paragraph.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'Paragraph',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        text: this.text,
        formats: this.formats,
        paragraphType: this.paragraphType
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the operations to execute inserting characters in a paragraph.
 * @param {string} chars The characters to insert in a paragraph.
 * @param  {number=} index Index to insert the characters at.
 * @return {Array.<Object>} Operations for inserting characters in paragraph.
 */
Paragraph.prototype.getInsertCharsOps = function(chars, index) {
  return [{
    do: {
      op: 'insertChars',
      component: this.name,
      cursorOffset: index + chars.length,
      value: chars,
      index: index
    },
    undo: {
      op: 'removeChars',
      component: this.name,
      cursorOffset: index,
      index: index,
      count: chars.length
    }
  }];
};


/**
 * Returns the operations to execute removing characters in a paragraph.
 * @param {string} chars The characters to remove in a paragraph.
 * @param  {number=} index Index to remove the characters starting at.
 * @param {number=} optDirection The directions to remove chars at.
 * @return {Array.<Object>} Operations for removing characters in paragraph.
 */
Paragraph.prototype.getRemoveCharsOps = function(chars, index, optDirection) {
  return [{
    do: {
      op: 'removeChars',
      component: this.name,
      cursorOffset: index,
      index: index,
      count: chars.length
    },
    undo: {
      op: 'insertChars',
      component: this.name,
      cursorOffset: index - (optDirection || 0),
      value: chars,
      index: index
    }
  }];
};


/**
 * Returns the operations to execute updating a paragraph attributes.
 * @param  {Object} attrs Attributes to update for the paragraph.
 * @param  {number=} optCursorOffset Optional cursor offset.
 * @param  {number=} optSelectRange Optional selecting range.
 * @return {Array.<Object>} Operations for updating a paragraph attributes.
 */
Paragraph.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange) {
  return [{
    do: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      formats: attrs.formats
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      formats: attrs.formats
    }
  }];
};


/**
 * Returns the length of the paragraph content.
 * @return {number} Length of the paragraph content.
 */
Paragraph.prototype.getLength = function () {
  return this.text.length;
};

},{"./component":2,"./loader":15,"./utils":23}],18:[function(require,module,exports){
'use strict';

var Selection = require('./selection');
var Utils = require('./utils');
var Component = require('./component');
var Loader = require('./loader');


/**
 * Section main.
 * @param {Object} optParams Optional params to initialize the Section object.
 * Default:
 *   {
 *     components: [],
 *     backgorund: {},
 *     name: Utils.getUID()
 *   }
 */
var Section = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    tagName: Section.TAG_NAME,
    // The components that is in this section.
    components: [],
    // The background of this section.
    background: {}
  }, optParams);

  Component.call(this, params);

  /**
   * Tag to use for the dom element for the section.
   * @type {string}
   */
  this.tagName = params.tagName;

  /**
   * Background settings
   * @type {Object}
   */
  this.background = params.background;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(this.tagName);
  this.dom.setAttribute('name', this.name);

  /**
   * The section components.
   * @type {Array.<Component>}
   */
  this.components = [];
  for (var i = 0; i < params.components.length; i++) {
    this.insertComponentAt(params.components[i], i);
  }

};
Section.prototype = Object.create(Component.prototype);
module.exports = Section;


/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Section.TAG_NAME = 'section';


/**
 * String name for the component class.
 * @type {string}
 */
Section.CLASS_NAME = 'Section';
Loader.register(Section.CLASS_NAME, Section);


/**
 * Create and initiate an Article object from JSON.
 * @param  {Object} json JSON representation of the article.
 * @return {Section} Section object representing the JSON data.
 */
Section.fromJSON = function (json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new Section({
    name: json.name,
    components: components
  });
};


/**
 * Inserts a component in the section.
 * @param  {Component} component Component to insert.
 * @param  {number} index Where to insert the component.
 * @return {Component} The inserted component.
 */
Section.prototype.insertComponentAt = function(component, index) {
  // Update component section reference to point to this section.
  component.section = this;

  // Get current component and its index in the section.
  var nextComponent = this.components[index];

  if (!nextComponent) {
    // If the last component in the section append it to the section.
    this.dom.appendChild(component.dom);
  } else {
    // Otherwise insert it before the next component.
    this.dom.insertBefore(component.dom, nextComponent.dom);
  }

  this.components.splice(index, 0, component);

  // Set the cursor to the new component.
  Selection.getInstance().setCursor({
    component: component,
    offset: 0
  });

  return component;
};

/**
 * Removes a component from a section.
 * @param  {Component} component To remove from section.
 * @return {Component} Removed component.
 */
Section.prototype.removeComponent = function(component) {
  var index = this.components.indexOf(component);
  var removedComponent = this.components.splice(index, 1)[0];
  try {
    this.dom.removeChild(removedComponent.dom);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      console.warn('The browser might have already handle removing the DOM ' +
        ' element (e.g. When handling cut).');
    } else {
      throw e;
    }
  }
  return removedComponent;
};


/**
 * Returns first component in the section.
 * @return {Component} Returns first component.
 */
Section.prototype.getFirstComponent = function() {
  return this.components[0];
};


/**
 * Returns last component in the section.
 * @return {Component} Returns last component.
 */
Section.prototype.getLastComponent = function() {
  return this.components[this.components.length - 1];
};


/**
 * Returns components from a section between two components (exclusive).
 * @param  {Component} startComponent Starting component.
 * @param  {Component} endComponent Ending component.
 */
Section.prototype.getComponentsBetween = function(
    startComponent, endComponent) {
  var components = [];
  var startIndex = this.components.indexOf(startComponent) + 1;
  var endIndex = this.components.indexOf(endComponent);
  for (var i = startIndex; i < endIndex; i++) {
    components.push(this.components[i]);
  }
  return components;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    component: Section.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};


/**
 * Returns the length of the section.
 * @return {number} Length of section.
 */
Section.prototype.getLength = function() {
  var length = 0;
  for (var i = 0; i < this.components.length; i++) {
    length += this.components[i].getLength();
  }
  return length;
};


/**
 * Returns the first header paragraph in the article.
 * @return {string} First header of the article.
 */
Section.prototype.getTitle = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].isHeader && this.components[i].isHeader()) {
      return this.components[i].text;
    }
  }
  return null;
};


/**
 * Returns the first non-header paragraph in the article.
 * @return {string} First non-header paragraph of the article.
 */
Section.prototype.getSnippet = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].isHeader && !this.components[i].isHeader()) {
      return this.components[i].text;
    }
  }
  return null;
};


/**
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Section.onInstall = function (editor) {
  // jshint unused: false
};

},{"./component":2,"./loader":15,"./selection":19,"./utils":23}],19:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Paragraph = require('./paragraph');


/**
 * Selection singletone class.
 */
var Selection = (function() {

    var SELECTED_CLASS = 'editor-selected';

    /** Singletone Constructor. */
    var Selection = function() {

      /**
       * Selection start point.
       * @type {Object}
       */
      this.start = {
        component: null,
        offset: null
      };

      /**
       * Selection end point.
       * @type {Object}
       */
      this.end = {
        component: null,
        offset: null
      };
    };

    Selection.prototype = new Utils.CustomEventTarget();

    /**
     * Differet types of selection events.
     * @type {Enum}
     */
    Selection.Events = {
      SELECTION_CHANGED: 'selection-changed'
    };

    /**
     * Resets selection start and end point.
     */
    Selection.prototype.reset = function() {
      this.start = {
        component: null,
        offset: null
      };

      this.end = {
        component: null,
        offset: null
      };
    };

    /**
     * Returns the component object at the start of the selection.
     * @return {Component} The component object at the start of selection.
     */
    Selection.prototype.getComponentAtStart = function() {
      if (this.start) {
        return this.start.component;
      }
    };


    /**
     * Returns the component object at the end of the selection.
     * @return {Component} The component object at the end of selection.
     */
    Selection.prototype.getComponentAtEnd = function() {
      if (this.end) {
        return this.end.component;
      }
    };


    /**
     * Returns the list of components in the selection.
     * @return {Array.<Component>} List of components selected.
     */
    Selection.prototype.getSelectedComponents = function() {
      var startComponent = this.start.component;
      var endComponent = this.end.component;
      var inBetweenComponents = this.getSectionAtStart().getComponentsBetween(
          startComponent, endComponent);
      var selectedComponents = [startComponent];
      Utils.arrays.extend(selectedComponents, inBetweenComponents);
      if (startComponent !== endComponent) {
        selectedComponents.push(endComponent);
      }
      return selectedComponents;
    };


    /**
     * Returns the section object at the start of the selection.
     * @return {Section} The section object at the start of selection.
     */
    Selection.prototype.getSectionAtStart = function() {
      if (this.getComponentAtStart()) {
        return this.getComponentAtStart().section;
      }
    };


    /**
     * Returns the section object at the end of the selection.
     * @return {Section} The section object at the end of selection.
     */
    Selection.prototype.getSectionAtEnd = function() {
      if (this.getComponentAtEnd()) {
        return this.getComponentAtEnd().section;
      }
    };


    /**
     * Selects a range.
     * @param {Object} start An object with `component` and `offset`.
     * @param {Object} end An object with `component` and `offset`.
     */
    Selection.prototype.select = function(start, end) {
      // Update start and end points to the cursor value.
      this.start = {
        component: start.component,
        offset: start.offset
      };

      this.end = {
        component: end.component,
        offset: end.offset
      };

      // Reflect the update to the cursor to the browser selection.
      this.updateWindowSelectionFromModel();
    };


    /**
     * Sets the cursor on the selection.
     * @param {Object} cursor An object with `component` and `offset`.
     */
    Selection.prototype.setCursor = function(cursor) {
      // Remove selected class from the already selected component.
      if (this.start.component) {
        this.start.component.dom.classList.remove(SELECTED_CLASS);
      }

      // Update start and end points to the cursor value.
      this.start = {
        component: cursor.component,
        offset: cursor.offset
      };

      this.end = {
        component: cursor.component,
        offset: cursor.offset
      };

      if (this.start.component) {
        this.start.component.dom.classList.add(SELECTED_CLASS);
      }

      // Reflect the update to the cursor to the browser selection.
      this.updateWindowSelectionFromModel();
    };


    /**
     * Calculates the offset from node starts instead of parents.
     * @param  {HTMLElement} parent Parent HTML element.
     * @param  {number} parentOffset Offset relative to the parent element.
     * @param  {HTMLElement} node Offset to calculate offset relative to.
     * @return {number} The offset relative to the node.
     */
    Selection.prototype.calculateOffsetFromNode = function (
        parent, parentOffset, node) {

      var offset = 0;
      for (var i = 0; i < parent.childNodes.length; i++) {
        var currentNode = parent.childNodes[i];
        if (currentNode === node) {
          break;
        }
        offset += Utils.getTextFromElement(currentNode).length;
      }
      return offset;
    };

    /**
     * Updates the window selection from the selection model.
     */
    Selection.prototype.updateWindowSelectionFromModel = function() {
      var range = document.createRange();
      var startNode = this.start.component.dom;
      var startOffset = this.start.offset;
      var endNode = this.end.component.dom;
      var endOffset = this.end.offset;

      // Select the #text node instead of the parent element.
      if (this.start.offset > 0) {
        startNode = this.getTextNodeAtOffset_(
            this.start.component.dom, startOffset);

        // TODO(mkhatib): FIGURE OUT WHY start.offset sometimes larger than
        // the current length of the content. This is a hack to fix not finding
        // the startNode when this happens.
        if (!startNode) {
          startNode = this.getTextNodeAtOffset_(
              this.start.component.dom, startOffset - 1);
        }
        var startPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.start.component.dom, // Component node
            startNode); // Start node to calculate new offset from
        startOffset = this.start.offset - startPrevSiblingsOffset;
      }

      try {
        range.setStart(startNode, startOffset);
      } catch (e) {
        range.setStart(startNode, startOffset - 1);
      }

      endNode = this.end.component.dom;
      // Select the #text node instead of the parent element.
      if (this.end.offset > 0) {
        endNode = this.getTextNodeAtOffset_(
            this.end.component.dom, endOffset);
        // TODO(mkhatib): FIGURE OUT WHY end.offset sometimes larger than
        // the current length of the content. This is a hack to fix not finding
        // the endNode when this happens.
        if (!endNode) {
          endNode = this.getTextNodeAtOffset_(
              this.end.component.dom, endOffset - 1);
        }
        var endPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.end.component.dom, // Component node
            endNode); // Start node to calculate new offset from
        endOffset = this.end.offset - endPrevSiblingsOffset;
      }
      try {
        range.setEnd(endNode, endOffset);
      } catch (e) {
        range.setEnd(endNode, endOffset - 1);
      }
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Scroll the selected component into view.
      if (this.start.component.dom.scrollIntoViewIfNeeded) {
        this.start.component.dom.scrollIntoViewIfNeeded(false);
      }
      var event = new Event(Selection.Events.SELECTION_CHANGED);
      this.dispatchEvent(event);
    };


    /**
     * Returns the text node at the specified offset.
     * @param  {HTMLElement} parent Parent element.
     * @param  {number} offset Offset relative to parent.
     * @return {HTMLElement} TextNode at the offset.
     */
    Selection.prototype.getTextNodeAtOffset_ = function(parent, offset) {
      var prevOffset = 0;

      for (var i = 0; i < parent.childNodes.length; i++) {
        var currentNode = parent.childNodes[i];

        var currentOffset = Utils.getTextFromElement(currentNode).length;
        // In the wanted offset return the found node.
        if (prevOffset + currentOffset >= offset) {
          // If current node is not a text node.
          // recurse(currentNode, offset-prevOffset). If it finds a node return it.
          if (currentNode.nodeName !== '#text') {
            currentNode = this.getTextNodeAtOffset_(
                currentNode, offset - prevOffset);
          }
          return currentNode;
        }
        prevOffset += currentOffset;
      }

      // Didn't find any node at the offset.
      return null;
    };


    /**
     * Calculates start offset from the window selection. Relative to the parent
     * paragraph currently selected.
     * @param  {Selection} selection Current selection.
     * @return {number} Start offset relative to parent.
     */
    Selection.prototype.calculateStartOffsetFromWindowSelection_ = function (
        selection) {
      // offset from node.
      var startNode = selection.anchorNode;
      var startNodeOffset = selection.anchorOffset;
      var parentNode = startNode.parentNode;

      if ((startNode.getAttribute && startNode.getAttribute('name')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute('name') &&
           parentNode.childNodes.length < 2)) {
        return startNodeOffset;
      }

      // Get the real component.
      var node = this.getStartComponentFromWindowSelection_(selection);
      startNodeOffset += this.calculatePreviousSiblingsOffset_(
          node, startNode);
      return startNodeOffset;
    };


    /**
     * Calculates end offset from the window selection. Relative to the parent
     * paragraph currently selected.
     * @param  {Selection} selection Current selection.
     * @return {number} End offset relative to parent.
     */
    Selection.prototype.calculateEndOffsetFromWindowSelection_ = function (
        selection) {
      var startNode = selection.focusNode;
      var startNodeOffset = selection.focusOffset;
      var parentNode = startNode.parentNode;
      if ((startNode.getAttribute && startNode.getAttribute('name')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute('name') &&
           parentNode.childNodes.length < 2)) {
        return startNodeOffset;
      }

      // Get the real component.
      var node = this.getEndComponentFromWindowSelection_(selection);
      startNodeOffset += this.calculatePreviousSiblingsOffset_(node, startNode);
      return startNodeOffset;
    };


    /**
     * Calculates previous siblings offsets sum until a node.
     * @param  {HTMLElement} parent Parent component element.
     * @param  {HTMLElement} node Node to stop at.
     * @return {number} Offset of the previous siblings.
     */
    Selection.prototype.calculatePreviousSiblingsOffset_ = function (
        parent, node) {

      var offset = 0;
      for (var i = 0; i < parent.childNodes.length; i++) {
        var currentNode = parent.childNodes[i];

        // If found the node break and return the calculated offset.
        if (currentNode === node) {
          break;
        }

        // If not a text node recurse to calculate the offset from there.
        if (currentNode.nodeName !== '#text') {
          var currentOffset = (currentNode.textContent ||
              Utils.getTextFromElement(currentNode)).length;

          var childOffset = this.calculatePreviousSiblingsOffset_(
              currentNode, node);

          // If childOffset is smaller than the whole node offset then the node
          // needed is inside the currentNode. Add childOffset to the offset so
          // far and break;
          if (childOffset < currentOffset) {
            offset += childOffset;
            break;
          }
        }

        offset += Utils.getTextFromElement(currentNode).length;
      }
      return offset;
    };


    /**
     * Retruns the start component from window selection.
     * @param  {Selection} selection Current selection.
     * @return {HTMLElement} Start component html element.
     */
    Selection.prototype.getStartComponentFromWindowSelection_ = function (
        selection) {
        var node = selection.anchorNode;
        while (!node.getAttribute ||
               (!node.getAttribute('name') && node.parentNode)) {
          node = node.parentNode;
        }
        return node;
    };


    /**
     * Retruns the end component from window selection.
     * @param  {Selection} selection Current selection.
     * @return {HTMLElement} End component html element.
     */
    Selection.prototype.getEndComponentFromWindowSelection_ = function (
        selection) {
        var node = selection.focusNode;
        while (!node.getAttribute ||
               (!node.getAttribute('name') && node.parentNode)) {
          node = node.parentNode;
        }
        return node;
    };


    /**
     * Updates the selection start and end point from a change on the browser
     * selection.
     */
    Selection.prototype.updateSelectionFromWindow = function() {
      var selection = window.getSelection();

      // Remove selected class from the already selected component.
      if (this.start.component) {
        this.start.component.dom.classList.remove(SELECTED_CLASS);
      }

      // Update the selection start point.
      var startNode = this.getStartComponentFromWindowSelection_(selection);
      var start = {
        component: Utils.getReference(startNode.getAttribute('name')),
        offset: this.calculateStartOffsetFromWindowSelection_(selection)
      };

      // Update the selection end point.
      var endNode = this.getEndComponentFromWindowSelection_(selection);
      var end = {
        component: Utils.getReference(endNode.getAttribute('name')),
        offset: this.calculateEndOffsetFromWindowSelection_(selection)
      };

      var endIndex = end.component.getIndexInSection();
      var startIndex = start.component.getIndexInSection();
      var reversedSelection = ((end.component === start.component &&
          end.offset < start.offset) || startIndex > endIndex);

      this.end = reversedSelection ? start : end;
      this.start = reversedSelection ? end : start;

      // Remove selected class from the already selected component.
      if (this.start.component === this.end.component) {
        this.start.component.dom.classList.add(SELECTED_CLASS);
      }

      var event = new Event(Selection.Events.SELECTION_CHANGED);
      this.dispatchEvent(event);
    };


    /**
     * Whether the cursor is at beginning of a component.
     * @return {boolean} True if the cursor at the beginning of component.
     */
    Selection.prototype.isCursorAtBeginning = function() {
      return this.start.offset === 0 && this.end.offset === 0;
    };


    /**
     * Whether the cursor is at ending of a component.
     * @return {boolean} True if the cursor at the ending of component.
     */
    Selection.prototype.isCursorAtEnding = function() {
      return (!(this.start.component instanceof Paragraph) ||
              this.start.offset === this.start.component.getLength() &&
              this.end.offset === this.end.component.getLength());
    };


    /**
     * Whether the selection is a range.
     * @return {boolean} True if a range is selected.
     */
    Selection.prototype.isRange = function() {
      return (this.start.component != this.end.component ||
              this.start.offset != this.end.offset);
    };


    /**
     * Initialize selection listeners to the element.
     * @param  {HTMLElement} element The html element to listen for selection
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
      },
      Events: Selection.Events
    };

})();
module.exports = Selection;

},{"./paragraph":17,"./utils":23}],20:[function(require,module,exports){
'use strict';

var Utils = require('../utils');


/**
 * Button component to add to toolbars.
 * @param {Object=} optParams Optional parameters.
 */
var Button = function (optParams) {
  var params = Utils.extend({
    label: 'New Button',
    name: Utils.getUID(),
    fields: [],
    data: {}
  }, optParams);

  Utils.CustomEventTarget.call(this);

  /**
   * Name of the button.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Extra data to attach to the button.
   * @type {Object}
   */
  this.data = params.data;

  /**
   * Fields for the button.
   * @type {Array.<TextField>}
   */
  this.fields = [];

  /**
   * Button container element.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Button.CONTAINER_TAG_NAME);
  this.dom.className = Button.CONTAINER_CLASS_NAME;

  /**
   * Button element.
   * @type {HTMLElement}
   */
  this.buttonDom = document.createElement(Button.TAG_NAME);
  this.buttonDom.setAttribute('name', this.name);
  Utils.setTextForElement(this.buttonDom, params.label);
  this.buttonDom.addEventListener('click', this.handleClick.bind(this));
  this.dom.appendChild(this.buttonDom);

  /**
   * Fields container element.
   * @type {HTMLElement}
   */
  this.fieldsDom = document.createElement(Button.FIELDS_CONTAINER_TAG_NAME);
  this.fieldsDom.className = Button.FIELDS_CONTAINER_CLASS_NAME;
  for (var i = 0; i < params.fields.length; i++) {
    this.addField(params.fields[i]);
  }
};
Button.prototype = Object.create(Utils.CustomEventTarget.prototype);
module.exports = Button;


/**
 * Button container element tag name.
 * @type {string}
 */
Button.CONTAINER_TAG_NAME = 'div';


/**
 * Button container element class name.
 * @type {string}
 */
Button.CONTAINER_CLASS_NAME = 'button-container';


/**
 * Button element tag name.
 * @type {string}
 */
Button.TAG_NAME = 'button';


/**
 * Button fields container tag name.
 * @type {string}
 */
Button.FIELDS_CONTAINER_TAG_NAME = 'div';


/**
 * Button fields container class name.
 * @type {string}
 */
Button.FIELDS_CONTAINER_CLASS_NAME = 'extra-fields';


/**
 * Active button class name.
 * @type {string}
 */
Button.ACTIVE_CLASS_NAME = 'active';


/**
 * Hidden class name.
 * @type {string}
 */
Button.HIDDEN_CLASS_NAME = 'hidden';


/**
 * Handles a click on the button.
 * @param {Function} handler Callback to call when the button is clicked.
 */
Button.prototype.handleClick = function() {
  var newEvent = new CustomEvent('click', {
      detail: { target: this }
  });
  this.dispatchEvent(newEvent);
};


/**
 * Adds a field to the button.
 * @param {TextField} field A field to add to the button.
 */
Button.prototype.addField = function(field) {
  field.parentButton = this;
  this.fields.push(field);
  this.fieldsDom.appendChild(field.dom);
};


/**
 * Sets the button as active.
 * @param {boolean} isActive Whether the button is active or not.
 */
Button.prototype.setActive = function (isActive) {
  this.isActive = isActive;
  if (this.isActive) {
    this.dom.classList.add(Button.ACTIVE_CLASS_NAME);
    this.fieldsDom.classList.add(Button.ACTIVE_CLASS_NAME);
    if (this.hasExtraFields()) {
      this.fields[0].dom.focus();
    }
  } else {
    this.dom.classList.remove(Button.ACTIVE_CLASS_NAME);
    this.fieldsDom.classList.remove(Button.ACTIVE_CLASS_NAME);
  }
};


/**
 * Sets the button as visible or not.
 * @param {boolean} isVisible Whether the button should be visible or not.
 */
Button.prototype.setVisible = function (isVisible) {
  this.isVisible = isVisible;
  if (this.isVisible) {
    this.dom.classList.remove(Button.HIDDEN_CLASS_NAME);
  } else {
    this.dom.classList.add(Button.HIDDEN_CLASS_NAME);
  }
};


/**
 * Returns true if the button has extra fields.
 * @return {boolean} True if the button has extra fields.
 */
Button.prototype.hasExtraFields = function() {
  return this.fields && this.fields.length;
};


/**
 * Returns a field with the specified name.
 * @param {string} name Field name.
 * @return {TextField|null} Returns a field with the name.
 */
Button.prototype.getFieldByName = function (name) {
  for (var i = 0; i < this.fields.length; i++) {
    if (this.fields[i].name === name) {
      return this.fields[i];
    }
  }
  return null;
};


/**
 * Resets the value of all fields for the button.
 */
Button.prototype.resetFields = function () {
  for (var i = 0; i < this.fields.length; i++) {
    this.fields[i].setValue('');
  }
};

},{"../utils":23}],21:[function(require,module,exports){
'use strict';

var Utils = require('../utils');


/**
 * TextField component to add to toolbars.
 * @param {Object=} optParams Optional params.
 */
var TextField = function (optParams) {
  var params = Utils.extend({
    placeholder: 'New field',
    name: Utils.getUID(),
    required: true,
    data: {},
    value: '',
  }, optParams);

  Utils.CustomEventTarget.call(this);

  /**
   * Field name.
   * @type {string}
   */
  this.name = params.name;

  /**
   * Extra data on the field.
   * @type {Object}
   */
  this.data = params.data;

  /**
   * Field placeholder.
   * @type {string}
   */
  this.placeholder = params.placeholder;

  /**
   * Whether the field is required.
   * @type {boolean}
   */
  this.required = params.required;

  /**
   * The parent button of the field.
   * @type {Button}
   */
  this.parentButton = null;

  /**
   * Value entered in the field.
   * @type {string}
   */
  this.value = params.value;

  /**
   * Input field element.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(TextField.TAG_NAME);
  this.dom.setAttribute('placeholder', this.placeholder);
  this.dom.setAttribute('name', this.name);
  this.dom.setAttribute('required', this.required);
  this.dom.addEventListener('keyup', this.handleKeyUp.bind(this));
};
TextField.prototype = Object.create(Utils.CustomEventTarget.prototype);
module.exports = TextField;


/**
 * Input field element tag name.
 * @type {string}
 */
TextField.TAG_NAME = 'input';


/**
 * Handles key up event and update the value of the field.
 * @param {Function} handler Callback to call when the button is clicked.
 */
TextField.prototype.handleKeyUp = function(event) {
  this.value = this.dom.value;
  var newEvent = new CustomEvent('keyup', {
      detail: { target: this }
  });
  newEvent.keyCode = event.keyCode;
  this.dispatchEvent(newEvent);
};


/**
 * Sets the value of the field.
 * @param {string} value Value to set to the field.
 */
TextField.prototype.setValue = function (value) {
  this.value = value;
  this.dom.value = value;
};

},{"../utils":23}],22:[function(require,module,exports){
'use strict';

var Utils = require('../utils');


/**
 * Toolbar component for adding controls to the editor.
 * @param {Object=} optParams Optional Params.
 */
var Toolbar = function (optParams) {
  Utils.CustomEventTarget.call(this);

  var params = Utils.extend({
    buttons: [],
    classNames: [],
    name: Utils.getUID()
  }, optParams);

  /**
   * Toolbar name.
   * @type {string}
   */
  this.name = params.name;

  /**
   * CSS class names to add to the toolbar.
   * @type {Array.<string>}
   */
  this.classNames = params.classNames;
  this.classNames.push(Toolbar.TOOLBAR_CLASS_NAME);

  /**
   * If the toolbar is added to a right to left editor.
   * @type {boolean}
   */
  this.rtl = false;

  /**
   * List of buttons on the toolbar.
   * @type {Array.<Button>}
   */
  this.buttons = [];

  /**
   * The current active button on the toolbar.
   * @type {Button}
   */
  this.activeButton = null;

  /**
   * Whether the toolbar is visible or not.
   * @type {boolean}
   */
  this.isVisible = false;

  /**
   * Element for rendering the toolbar.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Toolbar.TAG_NAME);
  this.dom.id = Toolbar.DOM_ID_PREFIX + this.name;
  this.dom.className = this.classNames.join(' ');

  /**
   * Element for containing both the buttons and fields.
   * @type {HTMLElement}
   */
  this.containerDom = document.createElement(
      Toolbar.BUTTONS_CONTAINER_TAG_NAME);
  this.containerDom.className = Toolbar.BUTTONS_FIELDS_CONTAINER_CLASS_NAME;
  this.dom.appendChild(this.containerDom);


  /**
   * Element for containing buttons of the toolbar.
   * @type {HTMLElement}
   */
  this.buttonsContainer = document.createElement(
      Toolbar.BUTTONS_CONTAINER_TAG_NAME);
  this.buttonsContainer.className = Toolbar.BUTTONS_CONTAINER_CLASS_NAME;
  this.containerDom.appendChild(this.buttonsContainer);

  /**
   * Element for containing fields of the toolbar.
   * @type {HTMLElement}
   */
  this.fieldsContainer = document.createElement(
      Toolbar.FIELDS_CONTAINER_TAG_NAME);
  this.fieldsContainer.className = Toolbar.FIELDS_CONTAINER_CLASS_NAME;
  this.containerDom.appendChild(this.fieldsContainer);

  for (var i = 0; i < params.buttons.length; i++) {
    this.addButton(params.buttons[i]);
  }

  document.body.appendChild(this.dom);
};
Toolbar.prototype = Object.create(Utils.CustomEventTarget.prototype);
module.exports = Toolbar;


/**
 * Toolbar container tag name.
 * @type {string}
 */
Toolbar.TAG_NAME = 'div';


/**
 * Fields container tag name.
 * @type {string}
 */
Toolbar.FIELDS_CONTAINER_TAG_NAME = 'div';


/**
 * Buttons container tag name.
 * @type {string}
 */
Toolbar.BUTTONS_CONTAINER_TAG_NAME = 'div';


/**
 * Element ID prefix.
 * @type {string}
 */
Toolbar.DOM_ID_PREFIX = 'editor-inline-toolbar-';


/**
 * Toolbar css class name.
 * @type {string}
 */
Toolbar.TOOLBAR_CLASS_NAME = 'editor-toolbar';


/**
 * Class added when the toolbar is visible..
 * @type {string}
 */
Toolbar.VISIBLE_CLASS_NAME = 'toolbar-visible';


/**
 * Toolbar buttons container class name.
 * @type {string}
 */
Toolbar.BUTTONS_CONTAINER_CLASS_NAME = 'editor-toolbar-buttons';


/**
 * Toolbar fields container class name.
 * @type {string}
 */
Toolbar.FIELDS_CONTAINER_CLASS_NAME = 'extra-fields-container';


/**
 * Toolbar buttons container class name.
 * @type {string}
 */
Toolbar.BUTTONS_FIELDS_CONTAINER_CLASS_NAME = 'buttons-fields-container';


/**
 * Used to position the toolbars outside the user view.
 * @type {number}
 */
Toolbar.EDGE = -999999;


/**
 * Adds a button to the toolbar.
 * @param {Button} button The button to add to the toolbar.
 */
Toolbar.prototype.addButton = function (button) {
  var event = new CustomEvent('button-added', {
    detail: { target: this }
  });

  this.buttons.push(button);
  this.buttonsContainer.appendChild(button.dom);
  this.fieldsContainer.appendChild(button.fieldsDom);

  this.dispatchEvent(event);
};


/**
 * Sets the toolbar to be visible or hidden.
 * @param {boolean} isVisible Whether to be visible or not.
 */
Toolbar.prototype.setVisible = function (isVisible) {
  this.isVisible = isVisible;
  if (this.isVisible) {
    this.dom.classList.add(Toolbar.VISIBLE_CLASS_NAME);
  } else {
    this.dom.classList.remove(Toolbar.VISIBLE_CLASS_NAME);
    this.dom.style.top = Toolbar.EDGE + 'px';
    this.dom.style.left = Toolbar.EDGE + 'px';
  }
};


/**
 * Sets the toolbar position relative to start top position of an element.
 * @param {HTMLElement} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToStartTopOf = function (element) {
  var bounds = element.getBoundingClientRect();

  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset;
  var start = bounds.left;
  if (this.rtl) {
    var toolbarBounds = this.dom.getBoundingClientRect();
    start = bounds.right - toolbarBounds.width;
  }

  this.dom.style.top = top + 'px';
  this.dom.style.left = start + 'px';
};


/**
 * Sets the toolbar position relative to start bottom position of an element.
 * @param {HTMLElement} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToStartBottomOf = function (element) {
  var bounds = element.getBoundingClientRect();

  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.bottom + window.pageYOffset;
  var start = bounds.left;
  if (this.rtl) {
    var toolbarBounds = this.dom.getBoundingClientRect();
    start = bounds.right - toolbarBounds.width;
  }
  this.dom.style.top = top + 'px';
  this.dom.style.left = start + 'px';
};


/**
 * Sets the toolbar position relative to top of window selection.
 */
Toolbar.prototype.setPositionTopOfSelection = function () {
  var wSelection = window.getSelection();
  var range = wSelection.getRangeAt(0);
  var bounds = range.getBoundingClientRect();
  var windowRect = document.body.getBoundingClientRect();

  // Calculate the left edge of the inline toolbar.
  var clientRect = this.dom.getClientRects()[0];
  var toolbarHeight = clientRect.height;
  var toolbarWidth = clientRect.width;
  var left = ((bounds.left + bounds.right) / 2) - toolbarWidth / 2;
  left = Math.max(10, left);
  left = Math.min(left, windowRect.width - toolbarWidth - 10);
  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset - toolbarHeight - 10;
  this.dom.style.top = top + 'px';
  this.dom.style.left = left + 'px';
};


/**
 * Returns the button with the passed name.
 * @param  {string} name Name of the button to find.
 * @return {Button|null} Button with the specified name.
 */
Toolbar.prototype.getButtonByName = function (name) {
  for (var i = 0; i < this.buttons.length; i++) {
    if (this.buttons[i].name === name) {
      return this.buttons[i];
    }
  }
  return null;
};


/**
 * Sets the toolbar active button.
 * @param {Button} button To set active.
 */
Toolbar.prototype.setActiveButton = function (button) {
  if (this.activeButton) {
    this.activeButton.setActive(false);
    this.activeButton = null;
  }

  if (button) {
    button.setActive(true);
    this.activeButton = button;
  }
};


/**
 * Resets the status and the values of the fields.
 */
Toolbar.prototype.resetFields = function () {
  for (var i = 0; i < this.buttons.length; i++) {
    this.buttons[i].resetFields();
  }
};

},{"../utils":23}],23:[function(require,module,exports){
'use strict';

var Utils = {};
Utils.arrays = {};
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
 * Extends first array with second array.
 *
 * Example:
 * var a = [1, 2, 3];
 * Utils.arrays.extend(a, [4, 5, 6]);
 *   // a is now [1, 2, 3, 4, 5, 6]
 * @param  {Array} firstArray
 * @param  {Array} secondArray
 * @return {Array} firstArray with second array elements added to it.
 */
Utils.arrays.extend = function(firstArray, secondArray) {
  for (var i in secondArray) {
    firstArray.push(secondArray[i]);
  }

  return firstArray;
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
 * Checks if the event is select all shortcut.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is select all.
 */
Utils.isSelectAll = function(event) {
  return !!((event.ctrlKey || event.metaKey) &&
          event.keyCode === 65 && !event.shiftKey);
};

Utils.isFirefox = function () {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

Utils.getTextProperty = function (element) {
  var textProp;
  if (element.nodeType === Node.TEXT_NODE) {
    textProp = 'data';
  } else if (Utils.isFirefox()) {
    textProp = 'textContent';
  } else {
    textProp = 'innerText';
  }
  return textProp;
};


Utils.setTextForElement = function(element, value) {
  element[Utils.getTextProperty(element)] = value;
};

Utils.getTextFromElement = function(element) {
  return element[Utils.getTextProperty(element)];
};


/**
 * Makes a copy of the passed object.
 *   Reference: http://stackoverflow.com/a/728694/646979
 * @param  {Object} obj Object to clone.
 * @return {Object} cloned object.
 */
Utils.clone = function(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || 'object' !== typeof obj) {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = Utils.clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = Utils.clone(obj[attr]);
      }
    }
    return copy;
  }

  throw new Error('Unable to copy object! Its type is not supported.');
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
Utils.CustomEventTarget.prototype.addEventListener = function(
    type, listener, useCapture) {
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
Utils.CustomEventTarget.prototype.removeEventListener = function(
    type, listener, useCapture) {
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

},{}]},{},[16])(16)
});