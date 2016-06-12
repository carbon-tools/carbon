(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.carbon = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Selection = require('./selection');
var Paragraph = require('./paragraph');
var Section = require('./section');
var Utils = require('./utils');
var Loader = require('./loader');
var Layout = require('./layout');
var Figure = require('./figure');
var EmbeddedComponent = require('./extensions/embeddedComponent');


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
    sections: [],
    editor: null
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
  this.dom.className = Article.ELEMENT_CLASS_NAME;

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

  /**
   * Whether the article is already rendered.
   * @type {boolean}
   */
  this.isRendered = false;

  /**
   * Whether the article is rendered in edit mode or not.
   * @type {boolean}
   */
  this.editMode = false;

};
module.exports = Article;


/**
 * Element Tag name when creating the associated DOM element.
 * @type {string}
 */
Article.TAG_NAME = 'article';


/**
 * Element class name.
 * @type {string}
 */
Article.ELEMENT_CLASS_NAME = 'carbon';


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
  if (this.isRendered) {
    section.render(this.dom, {editMode: this.editMode});
  }
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
 * Returns true if the first component in the article is an image inside
 * a bleed or staged layouts.
 * @return {boolean}
 */
Article.prototype.hasCover = function() {
  var coverLayouts = [Layout.Types.Staged, Layout.Types.Bleed];
  var layout = this.getFirstComponent();
  while (!layout.getLength() && layout.getNextComponent()) {
    layout = layout.getNextComponent();
  }
  if (layout instanceof Layout) {
    var firstComponent = layout.getFirstComponent();
    return ((firstComponent instanceof Figure ||
             firstComponent instanceof EmbeddedComponent) &&
            coverLayouts.indexOf(layout.type) !== -1);
  }
};


/**
 * Renders the article inside the element.
 */
Article.prototype.render = function(element, options) {
  this.editMode = !!(options && options.editMode);
  element.appendChild(this.dom);

  // TODO(mkhatib): This is only enabled in non-edit mode because otherwise
  // the tool will add an object to the root of the article and the cursor
  // would be moving to that object. We need to find a better way to do
  // resize listener instead of this.
  if (!this.editMode) {
    Utils.addResizeListener(this.dom, this.handleResize_.bind(this));
  }

  this.isRendered = true;
  for (var i = 0; i < this.sections.length; i++) {
    this.sections[i].render(this.dom, {editMode: this.editMode});
  }
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
 * Returns first paragraph component if it is a header.
 * @return {string} First header of the article.
 */
Article.prototype.getFirstTextComponent = function() {
  var firstLayout = this.sections[0].components[0];
  var firstComponent = firstLayout.getFirstComponent();
  var next = firstComponent;
  while (next && !(next instanceof Paragraph)) {
    next = next.getNextComponent();
  }

  if (next) {
    return next;
  }
};


/**
 * Returns first paragraph text if it is a header.
 * @return {string}
 */
Article.prototype.getTitle = function() {
  var component = this.getFirstTextComponent();
  if (component && component.isHeader()) {
    return component.text;
  }
};


/**
 * Computes a snippet of text from the paragraphs of the article. Skipping the
 * title (if any).
 * @param {number=} optWordCount Number of words to return in the snippet.
 * @return {string}
 */
Article.prototype.getSnippet = function(optWordCount) {
  var component = this.getFirstTextComponent();
  if (component && component.isHeader()) {
    component = component.getNextComponent();
  }

  var wordCount = optWordCount || 35;
  var count = 0;
  var strings = [];
  while (component) {
    if (component instanceof Paragraph) {
      var text = component.text.replace(/\s/, '');
      if (text.length) {
        strings.push(component.text);
        count += component.text.split(/\s/).length;
      }
    }

    if (count >= wordCount) {
      break;
    }
    component = component.getNextComponent();
  }

  var words = strings.join(' ').split(' ');
  words = words.slice(0, wordCount);
  if (words && words.length) {
    return words.join(' ') + '...';
  }
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

    if (operation[action].cursor) {
      var selectedComponent = Utils.getReference(
          operation[action].cursor.component);
      selectedComponent.select(operation[action].cursor.offset);
    }
  } else if (op === 'insertComponent') {
    // TODO(mkhatib): Insert components inside a component.
    var section = Utils.getReference(operation[action].section);
    var options = Utils.extend({
      name: operation[action].component,
    }, operation[action].attrs || {});

    var constructorName = operation[action].componentClass;
    var ComponentClass = Loader.load(constructorName);
    component = new ComponentClass(options);
    component.section = section;
    section.insertComponentAt(component, operation[action].index);
  }
};


/**
 * Handles the article container size changing.
 */
Article.prototype.handleResize_ = function() {
  for (var i = 0; i < this.sections.length; i++) {
    this.sections[i].rerender();
  }
};

/**
 * Removes blank paragraphs components from direction start/end
 * @param {object} `component` specifiy the start from component.
 * @param {boolean} `end` detrimines if direction is end.
 * @private
 */
Article.prototype.trimDirection_ = function _trimDirection(component, end) {
  var recursionComponent;

  if (component instanceof Paragraph && component.isBlank()) {
    if (end) {
      recursionComponent = component.getPreviousComponent();
    } else {
      recursionComponent = component.getNextComponent();
    }

    component.section.removeComponent(component);

    if (recursionComponent) {
      _trimDirection(recursionComponent, end);
    }
  }
};

/**
 * Removes blank paragraphs components at the start and the end of the article
 */
Article.prototype.trim = function() {
  var firstLayout = this.getFirstComponent();
  var lastLayout = this.getLastComponent();
  var firstComponent = firstLayout.getFirstComponent();
  var lastComponent =  lastLayout.getLastComponent();

  this.trimDirection_(firstComponent);

  if (firstComponent !== lastComponent) {
    this.trimDirection_(lastComponent, true);
  }
};

},{"./extensions/embeddedComponent":9,"./figure":19,"./layout":23,"./loader":25,"./paragraph":27,"./section":28,"./selection":29,"./utils":33}],2:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Errors = require('./errors');
var Loader = require('./loader');
var Selection = require('./selection');

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

  /**
   * Section this Component belongs to.
   * @type {Section}
   */
  this.section = params.section;

  /**
   * Component DOM.
   * @type {HTMLElement}
   */
  this.dom = null;

  /**
   * Whether the component is already rendered.
   * @type {boolean}
   */
  this.isRendered = false;

  /**
   * Whether the article is rendered in edit mode or not.
   * @type {boolean}
   */
  this.editMode = false;


  /**
   * Used to focus non-focusable elements (e.g. figure);
   * @type {HTMLElement}
   */
  this.selectionDom = null;

};
module.exports = Component;


/**
 * String name for the component class.
 * @type {string}
 */
Component.CLASS_NAME = 'Component';
Loader.register(Component.CLASS_NAME, Component);


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
      component = this.section.getNextComponent();
      if (component && component.components) {
        return component.getFirstComponent();
      }
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
      component = this.section.getPreviousComponent();
      if (component && component.components) {
        return component.getLastComponent();
      }
    }
    return component;
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this Component.
 */
Component.prototype.getJSONModel = function() {
  var component = {
    component: Component.CLASS_NAME,
    name: this.name,
  };

  if (this.formats) {
    component.formats = this.formats;
  }

  return component;
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
 * Renders a component in an element.
 * @param  {HTMLElement} element Element to render component in.
 * @param  {Object} options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 */
Component.prototype.render = function(element, options) {
  this.editMode = !!(options && options.editMode);
  if (!this.isRendered && this.dom) {
    this.dom.setAttribute('carbon', '1');
    Utils.setReference(this.name, this);
    this.isRendered = true;
    if (options && options.insertBefore) {
      element.insertBefore(this.dom, options.insertBefore);
    } else {
      element.appendChild(this.dom);
    }
  }
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
 * Selects the component.
 * @param  {number} offset Selection offset.
 */
Component.prototype.select = function(offset) {
  if (this.selectionDom) {
    this.selectionDom.focus();
  }
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: offset
  });
};


/**
 * Returns the length of the component content.
 * @return {number} Length of the component content.
 */
Component.prototype.getLength = function () {
  return 1;
};


/**
 * Returns the length of the component content in the DOM instead in the model.
 * This is useful in cases where the model hasn't been updated yet to reflect
 * pending changes that has already been made to the DOM. For example, applying
 * input changes after a user keep their finger on a keyboard to insert/delete
 * multiple characters.
 *
 * @return {number} Length of the component content in the DOM.
 */
Component.prototype.getDomLength = function () {
  return this.getLength();
};


/**
 * Whether the component should re-render itself or not.
 * @return {boolean}
 */
Component.prototype.shouldRerender = function () {
  return false;
};


/**
 * Ask the component to rerender itself.
 */
Component.prototype.rerender = function () {
  // pass.
};

},{"./errors":4,"./loader":25,"./selection":29,"./utils":33}],3:[function(require,module,exports){
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
var Layout = require('./layout');


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
        components: [new Layout({
          components: [new Paragraph({
            placeholder: 'Editor'
          })]
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
   * Flag used to disable handleInputEvent
   */
  this.disableInputHandler = false;

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
  this.element.addEventListener('keyup', this.handleKeyUpEvent.bind(this));

  this.element.addEventListener('input', Utils.debounce(
      this.handleInputEvent.bind(this), 200).bind(this));

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
  this.selection.setCursor({
    component: this.article.sections[0].getFirstComponent().getFirstComponent(),
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
  // Short circuit the function if handling input is disabled
  if (this.disableInputHandler === true) {
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
  this.disableInputHandler = false;
  this.handleInputEvent();
};


/**
 * Handels `keyup` events.
 */
Editor.prototype.handleKeyUpEvent = function() {
  // User removed his finger from the key re-enable input handler.
  this.disableInputHandler = false;
};


/**
 * Handels `keydown` events.
 * @param  {Event} event Event object.
 */
Editor.prototype.handleKeyDownEvent = function(event) {
  this.disableInputHandler = true;
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

  /*
   * Map direction arrows between rtl and ltr
   */
  var leftKey = 37;
  var rightKey = 39;
  var nextArrow = this.rtl ? leftKey : rightKey;
  var previousArrow = this.rtl ? rightKey : leftKey;

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
      offset: 0
    }, {
      component: lastLayout.getLastComponent(),
      offset: lastLayout.getLastComponent().getLength()
    });
    preventDefault = true;
  }

  // If selected text and key pressed will produce a change. Remove selected.
  // i.e. Enter, characters, space, backspace...etc
  else if (selection.isRange() && Utils.willTypeCharacter(event)) {
    var section = selection.getSectionAtStart();
    if(section) {
      inBetweenComponents = section.getComponentsBetween(
          selection.getComponentAtStart(), selection.getComponentAtEnd());
    }
    Utils.arrays.extend(ops, this.getDeleteSelectionOps());

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
            offset: 0
          });
        } else {
          var insertType = currentComponent.paragraphType;
          var insertInSection = selection.getSectionAtEnd();
          var atIndex = currentIndex - inBetweenComponents.length + 1;
          cursor = {
            component: currentComponent.name,
            offset: selection.end.offset
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
          if (currentComponent.section instanceof Layout &&
              currentComponent.section.type !== Layout.Types.SingleColumn) {
            insertInSection = currentComponent.section.getNextComponent();
            atIndex = 0;

            // If next layout is not single-column create one and insert the new
            // paragraph into.
            if (!insertInSection ||
                insertInSection.type !== Layout.Types.SingleColumn) {
              insertInSection = new Layout({
                type: Layout.Types.SingleColumn,
                section: currentComponent.section.section,
                components: []
              });
              Utils.arrays.extend(
                  ops, insertInSection.getInsertOps(
                      currentComponent.section.getIndexInSection() + 1));
            }
          }

          newP = new Paragraph({
            section: insertInSection,
            paragraphType: insertType
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
        cursor = null;
        if (prevComponent) {
          cursor = { offset: 0 };
          if (prevIsParagraph) {
            cursor.offset = prevComponent.getLength();
          }
          cursor.component = prevComponent.name;
        } else if (nextComponent) {
          cursor = {
            offset: 0,
            component: nextComponent.name
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
          offset: offsetAfterOperation
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
        cursor = null;
        if (prevComponent) {
          cursor = {
            component: prevComponent.name,
            offset: prevComponent.getLength()
          };
        } else if (nextComponent) {
          cursor = {
            component: nextComponent.name,
            offset: 0
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
            offset: offsetAfterOperation
          });
        } else {
          this.handlePendingInputIfAny_();
          selection.setCursor({
            component: nextComponent,
            offset: 0
          });
        }
        preventDefault = true;
      }
      break;

    // Left.
    case previousArrow:
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
    case nextArrow:
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
        }
        offset = Math.min(nextComponent.getLength(), currentOffset);
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
 * Generates the operations needed to delete current selection.
 * @return {Array.<Object>} List of operations to delete selection.
 */
Editor.prototype.getDeleteSelectionOps = function() {
  var ops = [];
  var count;
  var selection = this.article.selection;
  var section = selection.getSectionAtStart();
  var inBetweenComponents = [];
  if(section) {
    inBetweenComponents = section.getComponentsBetween(
      selection.getComponentAtStart(), selection.getComponentAtEnd());
  }

  for (var i = 0; i < inBetweenComponents.length; i++) {
    Utils.arrays.extend(ops, inBetweenComponents[i].getDeleteOps(-i));
  }

  if (selection.getComponentAtEnd() !== selection.getComponentAtStart()) {
    var lastComponent = selection.getComponentAtEnd();
    if (lastComponent instanceof Paragraph || selection.end.offset > 0) {
      Utils.arrays.extend(ops, lastComponent.getDeleteOps(
          -inBetweenComponents.length));
    }

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
      if ((startParagraphFormats && startParagraphFormats.length) ||
          selectRange) {
        Utils.arrays.extend(ops, startParagraph.getUpdateOps({
          formats: startParagraphFormats
        }, selection.start.offset, selectRange));
      }

      if (firstParagraphText && firstParagraphText.length) {
        Utils.arrays.extend(ops, startParagraph.getRemoveCharsOps(
            firstParagraphText, selection.start.offset));
      }

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
  // Execute any debounced input handler right away to apply any
  // unupdated content before moving to other operations.
  this.handlePendingInputIfAny_();

  var startComponent = this.selection.getComponentAtEnd();
  var pastedContent;
  if (window.clipboardData && window.clipboardData.getData) { // IE
    pastedContent = window.clipboardData.getData('Text');
  } else if (event.clipboardData && event.clipboardData.getData) {
    var cbData = event.clipboardData;
    // Enforce inline paste when pasting in an inline component
    // (e.g. figcaption).
    if (startComponent.inline) {
      pastedContent = cbData.getData('text/plain');
      pastedContent = pastedContent.split('\n').join(' ');
    } else {
      pastedContent = (
          cbData.getData('text/html') || cbData.getData('text/plain'));
    }
  }

  var tempEl = document.createElement('div');
  tempEl.innerHTML = pastedContent;

  if (startComponent.getPreviousComponent()) {
    startComponent = startComponent.getPreviousComponent();
  }

  var ops = this.getDeleteSelectionOps();
  this.article.transaction(ops);
  var pasteOps = this.processPastedContent(tempEl);
  this.article.transaction(pasteOps);

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

  while (currentComponent && currentComponent !== endComponent) {
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

  this.selection.updateSelectionFromWindow();
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
  var cursor = {
    component: currentComponent.name,
    offset: selection.end.offset
  };

  var INLINE_ELEMENTS = ['B', 'BR', 'BIG', 'I', 'SMALL', 'ABBR', 'ACRONYM',
      'CITE', 'EM', 'STRONG', 'A', 'BDO', 'STRIKE', 'S', 'SPAN', 'SUB', 'SUP',
      '#text', 'META'];

  function hasOnlyInlineChildNodes(elem) {
    var children = elem.childNodes;
    for (var i = 0; i < children.length ; i++) {
      if (INLINE_ELEMENTS.indexOf(children[i].nodeName) === -1) {
        return false;
      } else if (children[i].childNodes) {
        var subChilds = children[i].childNodes;
        for (var k = 0; k < subChilds.length; k++) {
          if (!isInlinePaste(subChilds) || !hasOnlyInlineChildNodes(subChilds[k])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function isInlinePaste(children) {
    var metaNodes = 0;
    for (var i = 0; i < children.length; i++) {
      if (children[i] && children[i].nodeName.toLowerCase() === 'meta') {
        metaNodes++;
      } else if (INLINE_ELEMENTS.indexOf(children[i].nodeName) === -1) {
        return false;
      }
    }

    if (children.length - metaNodes < 2) {
      return true;
    }
  }

  if (!children || !children.length ||
      (isInlinePaste(children) && hasOnlyInlineChildNodes(element))) {
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
              ops, newP.getInsertOps(currentIndex++, cursor));
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
        ops, newP.getInsertOps(currentIndex++, cursor));
  } else {
    // When pasting multi-line, split the current paragraph if pasting
    // mid-paragraph.
    if (!selection.isCursorAtEnding()) {
      Utils.arrays.extend(ops, this.getSplitParagraphOps(0));
      currentIndex++;
    }
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
                ops, component.getInsertOps(currentIndex++), cursor);
          }
          paragraphType = null;
          break;
        case 'img':
          component = new Figure({
            src: el.getAttribute('src')
          });
          component.section = selection.getSectionAtEnd();
          Utils.arrays.extend(
              ops, component.getInsertOps(currentIndex++, cursor));
          paragraphType = null;
          break;
        case 'ul':
        case 'ol':
          var tagName = List.UNORDERED_LIST_TAG;
          if (tag === 'ol') {
            tagName = List.ORDERED_LIST_TAG;
          }
          var lis = el.getElementsByTagName('li');
          if (!lis || !lis.length) {
            continue;
          }
          component = new List({
            tagName: tagName,
            components: []
          });
          component.section = selection.getSectionAtEnd();
          Utils.arrays.extend(
              ops, component.getInsertOps(currentIndex++, cursor));
          for (j = 0; j < lis.length; j++) {
            newP = new Paragraph({
              paragraphType: Paragraph.Types.ListItem,
              text: Utils.getTextFromElement(lis[j])
            });
            newP.section = component;
            Utils.arrays.extend(
                ops, newP.getInsertOps(j, cursor));
          }
          paragraphType = null;
          break;
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
            // which is the amount of operations.
            currentIndex += appendOperations.length;
          }
      }

      if (appendOperations) {
        Utils.arrays.extend(ops, appendOperations);
        appendOperations = null;
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
            ops, newP.getInsertOps(currentIndex++, cursor));
      }
    }
  }
  return ops;
};


/**
 * Handles cut event for the editor.
 */
Editor.prototype.handleCut = function() {
  // Execute any debounced input handler right away to apply any
  // unupdated content before moving to other operations.
  this.handlePendingInputIfAny_();

  this.disableInputHandler = true;
  var ops = this.getDeleteSelectionOps();
  var article = this.article;
  var dispatchEvent = this.dispatchEvent.bind(this);
  setTimeout(function() {
    article.transaction(ops);
    this.disableInputHandler = false;
    dispatchEvent(new Event('change'));
  }, 20);
};

},{"./article":1,"./extensions/componentFactory":8,"./extensions/formattingExtension":12,"./extensions/shortcutsManager":16,"./extensions/toolbeltExtension":17,"./extensions/uploadExtension":18,"./figure":19,"./i18n":20,"./layout":23,"./list":24,"./paragraph":27,"./section":28,"./selection":29,"./toolbars/toolbar":32,"./utils":33}],4:[function(require,module,exports){
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


Errors.ConfigrationError = function (message) {
  this.name = 'ConfigrationError';
  this.message = (message || '');
};
Errors.ConfigrationError.prototype = Error.prototype;

},{}],5:[function(require,module,exports){
'use strict';

var Errors = require('../errors');

/**
 * An abstract class for embed providers to subclass and implement its methods.
 */
var AbstractEmbedProvider = function() {
};
module.exports = AbstractEmbedProvider;


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} optArgs Optional arguments to pass with the URL.
 */
AbstractEmbedProvider.prototype.getEmbedForUrl = function(
    url, callback, optArgs) {
  // jshint unused: false
  throw Errors.NotImplementedError(
      'AbstractEmbedProvider need to implement getEmbedForUrl');
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @return {string}
 */
AbstractEmbedProvider.prototype.getUrlsRegex = function() {
  // jshint unused: false
  throw Errors.NotImplementedError(
      'AbstractEmbedProvider need to implement getUrlsRegexStr');
};

},{"../errors":4}],6:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Selection = require('../selection');


/**
 * Allow for updating attributes in history and in the component for
 * uploading files and media.
 * @param {Object=} optParams Optional Parameters.
 */
var Attachment = function (optParams) {
  var params = Utils.extend({
    file: null,
    dataUri: null,
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
   * Data URI of the attachment. This might be set when the attachment
   * came from a non-input file (e.g. webcam).
   * @type {string}
   */
  this.dataUri = params.dataUri;

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

  // If the figure finished uploading and it's still selected,
  // reselect to show the toolbar.
  var selection = Selection.getInstance();
  var selectedComponent = selection.getComponentAtStart();
  if (selectedComponent === this.figure) {
    this.figure.select();
  }
};

},{"../selection":29,"../utils":33}],7:[function(require,module,exports){
'use strict';

var AbstractEmbedProvider = require('./abstractEmbedProvider');
var Utils = require('../utils');

/**
 * Carbon embed provider uses different providers to provide support for
 * differnet URLs - uses the offical service when possible
 * (e.g. supports CORS or jsonp) and uses noembed as alternative.
 * @param {Object=} optParams Optional params to configure the provider with.
 */
var CarbonEmbedProvider = function (optParams) {
  var params = Utils.extend({
    servicesConfig: {
      facebookNotes: true,
      twitter: true,
      instagram: true,
      github: false,
      soundcloud: false,
      youtube: false,
      vimeo: false,
      vine: false,
      slideshare: false,
      facebookPosts: true,
      facebookVideos: false,
    }
  }, optParams);

  AbstractEmbedProvider.call(this, params);

  /**
   * The different services enabled or disabled configuration.
   * @type {Object}
   */
  this.servicesConfig = params.servicesConfig;

};
CarbonEmbedProvider.prototype = Object.create(AbstractEmbedProvider.prototype);
module.exports = CarbonEmbedProvider;


/**
 * Mapping Providers URL RegExes and their matching oEmbed endpoints.
 * @type {Object}
 */
CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP = {
  // Ref: https://developers.facebook.com/docs/plugins/oembed-endpoints
  facebookVideos: {
    // Matches Facebook Video URLs.
    '^(https?://(?:www\.)facebook\.com/(?:video\.php\?v=\\d+|.*?/videos/\\d+))$':
        // oEmbed endpoint for facebook videos.
        'https://apps.facebook.com/plugins/video/oembed.json/',
        // 'https://noembed.com/embed',
  },
  facebookPosts: {
    // Matches Facebook Posts URLs. (incl. posts, photos, story...etc)
    '^(https?:\/\/www\.facebook\.com\/(?:photo\.php\?.+|photos\/\\d+|[a-zA-Z0-9\-.]+\/(posts|photos|activity)\/.+|permalink\.php\?story_fbid=\\\d+|media\/set\?set=\\d+|questions\/\\d+))':
        // oEmbed endpoint for facebook posts.
        'https://apps.facebook.com/plugins/post/oembed.json/'
        // 'https://noembed.com/embed'
  },
  facebookNotes: {
    // Matches Facebook Notes URLs.
    '^(https?:\/\/www\.facebook\.com\/notes\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+\/\\d+)':
        // oEmbed endpoint for facebook posts.
        'https://apps.facebook.com/plugins/post/oembed.json/'
        // 'https://noembed.com/embed'
  },
  soundcloud: {
    '^https?://soundcloud.com/.*/.*$':
        'https://soundcloud.com/oembed?format=js'
  },
  youtube: {
    '^(?:https?://(?:www\.)?youtube\.com/(?:[^\/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})$':
        'https://www.youtube.com/oembed?format=json'
  },
  vimeo: {
    '^http(?:s?)://(?:www\.)?vimeo\.com/(([0-9]+)|channels/.+/.+|groups/.+/videos/.+)':
        'https://vimeo.com/api/oembed.json'
  },
  vine: {
    '^http(?:s?)://(?:www\.)?vine\.co/v/([a-zA-Z0-9]{1,13})$':
        'https://vine.co/oembed.json'
  },
  twitter: {
    // Moments - doesn't seem to support jsonp!
    // '^https?://(?:www\.)?twitter\.com/i/moments/[a-zA-Z0-9_]+/?$':
        // 'https://publish.twitter.com/oembed.json',

    // Statuses.
    '^https?://(?:www\.)?twitter\.com/[a-zA-Z0-9_]+/status/\\d+$':
        'https://api.twitter.com/1/statuses/oembed.json'
  },
  instagram: {
    '^https?://(?:www\.)?instagr\.?am(?:\.com)?/p/[a-zA-Z0-9_\-]+/?':
        'https://www.instagram.com/publicapi/oembed/'
  },
  slideshare: {
    '^https?://(?:www\.)?slideshare\.net/[a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+':
        'https://www.slideshare.net/api/oembed/2?format=jsonp'
  },
  github: {
    '^https?://gist\.github\.com/.*':
        'https://noembed.com/embed?format=json'
  }
};


/**
 * Returns the URL to call for oembed response.
 * @param {string} url URL to create the url for.
 * @param {Object} optArgs Arguments to pass with the URL.
 * @return {string}
 */
CarbonEmbedProvider.prototype.getOEmbedEndpointForUrl = function(url, optArgs) {
  var urlParams = Utils.extend({
    url: url
  }, optArgs);

  var queryParts = [];
  for (var name in urlParams) {
    queryParts.push([name, urlParams[name]].join('='));
  }

  var endpoint = this.getOEmbedBaseForUrl_(url);
  if (!endpoint) {
    console.error('Could not find oembed endpoint for url: ', url);
    return;
  }
  var separator = endpoint.indexOf('?') === -1 ? '?' : '&';
  return [endpoint, queryParts.join('&')].join(separator);
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @return {string}
 */
CarbonEmbedProvider.prototype.getUrlsRegex = function() {
  var Services = CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP;
  var regexStringParts = [];
  for (var service in Services) {
    // If the service is enabled.
    if (this.servicesConfig[service]) {
      // Add its regexes to the global regex match.
      for (var regexStr in Services[service]) {
        regexStringParts.push(regexStr);
      }
    }
  }
  return regexStringParts.join('|');
};



/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} optArgs Optional arguments to pass with the URL.
 */
CarbonEmbedProvider.prototype.getEmbedForUrl = function(url, callback, optArgs) {
  var oEmbedEndpoint = this.getOEmbedEndpointForUrl(url, optArgs);
  // jshint unused: false
  function jsonp(url, jsonpCallback) {
    var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(data) {
      delete window[callbackName];
      document.body.removeChild(script);
      jsonpCallback(data);
    };

    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    document.body.appendChild(script);
  }

  jsonp(oEmbedEndpoint, callback);
};


/**
 * Matches URL to the service and its oembed endpoint.
 * @param  {string} url URL.
 * @return {string} OEmbed endpoint for the url service.
 * @private
 */
CarbonEmbedProvider.prototype.getOEmbedBaseForUrl_ = function(url) {
  var Services = CarbonEmbedProvider.PROVIDERS_OEMBED_REGEX_MAP;
  for (var service in Services) {
    // If the service is enabled.
    if (this.servicesConfig[service]) {
      // Add its regexes to the global regex match.
      for (var regexStr in Services[service]) {
        var regex = new RegExp(regexStr, 'i');
        var match = regex.exec(url);
        if (match) {
          return Services[service][regexStr];
        }
      }
    }
  }
  return null;
};

},{"../utils":33,"./abstractEmbedProvider":5}],8:[function(require,module,exports){
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


/**
 * Clears all registerations.
 */
ComponentFactory.prototype.onDestroy = function () {
  this.regexToFactories = {};
};

},{"../errors":4}],9:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Component = require('../component');
var Paragrarph = require('../paragraph');
var Loader = require('../loader');
var I18n = require('../i18n');


/**
 * EmbeddedComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     name: Utils.getUID()
 *   }
 */
var EmbeddedComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    url: null,
    provider: null,
    caption: null,
    sizes: {},
    type: EmbeddedComponent.Types.Rich,
    serviceName: null
  }, optParams);

  Component.call(this, params);

  /**
   * URL to embed.
   * @type {string}
   */
  this.url = params.url;

  /**
   * Embed provider name.
   * @type {string}
   */
  this.provider = params.provider;

  /**
   * Embed service name (e.g. twitter).
   * @type {string}
   */
  this.service = params.service;

  /**
   * Embed type.
   * @type {string}
   */
  this.type = params.type || EmbeddedComponent.Types.Rich;

  /**
   * Sizes of the embedded component in different container sizes.
   * @type {object}
   */
  this.sizes = params.sizes || {};

  /**
   * Placeholder text to show if the EmbeddedComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: I18n.get('placeholder.embed'),
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true
  });

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(EmbeddedComponent.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  this.dom.className = EmbeddedComponent.COMPONENT_CLASS_NAME;

};
EmbeddedComponent.prototype = Object.create(Component.prototype);
module.exports = EmbeddedComponent;

/**
 * String name for the component class.
 * @type {string}
 */
EmbeddedComponent.CLASS_NAME = 'EmbeddedComponent';
Loader.register(EmbeddedComponent.CLASS_NAME, EmbeddedComponent);


/**
 * EmbeddedComponent component element tag name.
 * @type {string}
 */
EmbeddedComponent.TAG_NAME = 'figure';


/**
 * EmbeddedComponent element tag name.
 * @type {string}
 */
EmbeddedComponent.COMPONENT_CLASS_NAME = 'embedded';


/**
 * EmbeddedComponent component inner container element tag name.
 * @type {string}
 */
EmbeddedComponent.CONTAINER_TAG_NAME = 'div';


/**
 * EmbeddedComponent component inner container element class name.
 * @type {string}
 */
EmbeddedComponent.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.EMBED_TAG_NAME = 'div';


/**
 * Caption element tag name.
 * @type {string}
 */
EmbeddedComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedComponent.OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * The screen sizes to render the component for.
 * @type {Array.<number>}
 */
EmbeddedComponent.RENDER_FOR_SCREEN_SIZES = [300, 450, 600, 900, 1200];


/**
 * Embed types.
 * @type {Object.<string>}
 */
EmbeddedComponent.Types = {
  Rich: 'rich',
  Video: 'video',
  Link: 'link',
  Image: 'image'
};


/**
 * Iframe URL to load third party embeds in (production).
 * @type {string}
 */
EmbeddedComponent.IFRAME_URL = 'https://cdn.carbon.tools/iframe.html';


/**
 * Iframe URL to load third party embeds in (for development).
 * @type {string}
 */
EmbeddedComponent.DEV_IFRAME_URL = (
    'http://iframe.localhost:8000/dist/iframe.html');


/**
 * Container to render offscreen.
 * @type {string}
 */
EmbeddedComponent.OFFSCREEN_CONTAINER_ID = 'carbon-off-screen';


/**
 * CLass name for temp rendering container.
 * @type {string}
 */
EmbeddedComponent.TEMP_RENDER_CONTAINER_CLASSNAME = 'temp-render';


/**
 * Name of the message to listen to for embed size.
 * @type {string}
 */
EmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE = 'embed-size';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
EmbeddedComponent.prototype.getComponentClassName = function() {
  return EmbeddedComponent.CLASS_NAME;
};

/**
 * Create and initiate an embedded component from JSON.
 * @param  {Object} json JSON representation of the embedded component.
 * @return {EmbeddedComponent} EmbeddedComponent object representing JSON data.
 */
EmbeddedComponent.fromJSON = function (json) {
  return new EmbeddedComponent(json);
};


/**
 * Handles onInstall when the EmbeddedComponent module installed in an editor.
 * @param  {Editor} editor Instance of the editor that installed the module.
 */
EmbeddedComponent.onInstall = function() {
  var offScreen = document.getElementById(
      EmbeddedComponent.OFFSCREEN_CONTAINER_ID);
  if (!offScreen) {
    offScreen = document.createElement('div');
    offScreen.id = EmbeddedComponent.OFFSCREEN_CONTAINER_ID;
    offScreen.style.width = '3000px';
    document.body.appendChild(offScreen);
  }
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
EmbeddedComponent.prototype.getComponentClassName = function() {
  return EmbeddedComponent.CLASS_NAME;
};


/**
 * Sets the loaded HTML data on the embedded component.
 * @param  {Object} oembedData Data returned from oEmbed API.
 */
EmbeddedComponent.prototype.oEmbedDataLoaded_ = function(oembedData) {
  if (!oembedData) {
    console.warn('Cound not find oembed for URL: ', this.url);
    return;
  }

  /**
   * Removes the temp rendering dom from document.
   * @param  {HTMLElement} embedDom Element to remove.
   */
  function cleanupRenderingDom_(embedDom) {
    return function() {
      try {
        embedDom.parentNode.removeChild(embedDom);
      } catch (e) {
        console.warn(e);
      }
    };
  }

  // TODO(mkhatib): Provide a lite mode load to allow loading a placeholder
  // and only load the scripts and iframes on click.
  if (oembedData.html) {

    // Render the main embedded component.
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width);
    var screen = (
        this.getClosestSupportedScreenSize_(containerWidth) || containerWidth);
    this.renderForScreen_(screen, this.embedDom);


    // In edit mode. Try to render the component in for different screen sizes
    // to allow us to pre-calculate the width and height it will take in
    // that screen size.
    // Do this only for Rich embeds since they don't maintain a fixed aspect
    // ratio - unlike video and image embeds.
    if (this.editMode && this.type === EmbeddedComponent.Types.Rich) {
      var offScreen = document.getElementById(
          EmbeddedComponent.OFFSCREEN_CONTAINER_ID);
      var screenSizes = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES;

      for (var j = 0; j < screenSizes.length; j++) {
        if (!this.sizes || !this.sizes[screenSizes[j]]) {
          var embedDom = document.createElement('div');
          embedDom.className = (
              EmbeddedComponent.TEMP_RENDER_CONTAINER_CLASSNAME);
          embedDom.style.width = screenSizes[j] + 'px';
          offScreen.appendChild(embedDom);
          this.renderForScreen_(screenSizes[j], embedDom);
          setTimeout(cleanupRenderingDom_(embedDom), 10000);
        }
      }

    }
  } else {
    // TODO(mkhatib): Figure out a way to embed (link, image, embed) types.
    console.error('Embedding non-rich component is not supported yet.');
  }
};


/**
 * Renders the embedded component for specific screen to store the different
 * sizes for different screents.
 * @param  {number} screen Screen width to render it for.
 * @param  {HTMLElement} embedDom Element to embed in.
 * @private
 */
EmbeddedComponent.prototype.renderForScreen_ = function(screen, embedDom) {
  var baseUrl = EmbeddedComponent.IFRAME_URL;
  // If running on localhost for development?
  if (document.location.host.match(/localhost/)) {
    baseUrl = EmbeddedComponent.DEV_IFRAME_URL;
  }

  // Get oembed URL for the URL.
  var embedProvider = Loader.load('embedProviders')[this.provider];
  var oEmbedUrl = embedProvider.getOEmbedEndpointForUrl(this.url, {
    width: screen
  });

  // Add data to the hash of the iframe URL to pass it to the child iframe.
  var fullUrl = baseUrl + '#' + encodeURIComponent(JSON.stringify({
    width: screen,
    oEmbedUrl: oEmbedUrl,
    origin: document.location.origin
  }));

  var iframe = document.createElement('iframe');
  iframe.src = fullUrl;
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('width', '100%');

  // Set initial height of 50% of the width for visual improvement. This would
  // be updated as the iframe renders.
  iframe.setAttribute('height', (screen/2) + 'px');

  Utils.listen(iframe, EmbeddedComponent.EMBED_SIZE_MESSAGE_TYPE,
      function(data) {
    this.sizes[screen] = {
      width: parseFloat(data.width),
      height: parseFloat(data.height)
    };
    this.updateSize_();
    iframe.setAttribute('height', data.height);
  }.bind(this));
  embedDom.appendChild(iframe);
};


/**
 * Returns the closest screen size to the width.
 * @param  {number} width
 * @return {number}
 */
EmbeddedComponent.prototype.getClosestSupportedScreenSize_ = function(width) {
  var screenSizes = [];
  for (var size in this.sizes) {
    screenSizes.push(parseInt(size));
  }

  for (var i = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES.length; i > 0; i--) {
    var standardScreenSize = EmbeddedComponent.RENDER_FOR_SCREEN_SIZES[i];
    if (standardScreenSize && screenSizes.indexOf(standardScreenSize) === -1) {
      screenSizes.push(standardScreenSize);
    }
  }
  screenSizes.sort(function (a, b) {
    return a - b;
  });

  for (var j = screenSizes.length; j > 0; j--) {
    if (screenSizes[j] <= width) {
      return screenSizes[j];
    }
  }
  return screenSizes[0];
};


/**
 * Calculates and returns the ration for the closest screen size for rendering
 * in the required width.
 * @param  {number} width Width of the container to render the component in.
 * @return {string} Height to Width Ration in percentage.
 */
EmbeddedComponent.prototype.getRatioFor_ = function (width) {
  var screen = this.getClosestSupportedScreenSize_(width);
  var size = this.sizes[screen];
  return size && (size.height/size.width * 100) + '%';
};


/**
 * Whether the embedded component should render or not.
 * @return {boolean} true if the supported screen size has changed.
 */
EmbeddedComponent.prototype.shouldRerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var currentWidth = parseInt(this.containerDom.style.width);
  return screen !== currentWidth;
};


/**
 * Rerenders the embedded component. This allows for responsive embeds.
 * The article will tell the embed to rerender when its size change.
 */
EmbeddedComponent.prototype.rerender = function() {
  var styles = window.getComputedStyle(this.dom);
  var containerWidth = parseInt(styles.width);
  var screen = this.getClosestSupportedScreenSize_(containerWidth);
  var ratio = this.getRatioFor_(containerWidth);

  this.containerDom.style.width = screen + 'px';
  this.embedDom.className = 'embed-container';
  this.embedDom.style.paddingBottom = ratio;

  setTimeout(function() {
    this.loadEmbed_(this.oEmbedDataLoaded_.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth)
    });
  }.bind(this), 200);
};


/**
 * Updates the size of the embed.
 * @private
 */
EmbeddedComponent.prototype.updateSize_ = function() {
  if (!Utils.isEmpty(this.sizes)) {
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width);
    // Only add the ratio padding-bottom trick for fixed-ratio embeds.
    if (this.type === EmbeddedComponent.Types.Video ||
        this.type === EmbeddedComponent.Types.Image) {
      this.embedDom.classList.add('ratio-container');
      var ratio = this.getRatioFor_(containerWidth);
      this.embedDom.style.paddingBottom = ratio;
      this.embedDom.style.width = 'auto';
      this.embedDom.style.height = 'auto';
    } else if (containerWidth) {
      var screen = this.getClosestSupportedScreenSize_(containerWidth);
      if (screen && this.sizes[screen]) {
        this.embedDom.style.paddingBottom = 0;
        this.embedDom.style.width = this.sizes[screen].width + 'px';
        this.embedDom.style.height = this.sizes[screen].height + 'px';
      }
    }
  } else {
    this.embedDom.style.paddingBottom = '56.25%';
  }
};


/**
 * @override
 */
EmbeddedComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    var styles = window.getComputedStyle(this.dom);
    var containerWidth = parseInt(styles.width);

    this.containerDom = document.createElement(
        EmbeddedComponent.CONTAINER_TAG_NAME);
    this.containerDom.className = EmbeddedComponent.CONTAINER_CLASS_NAME;

    if (this.url) {
      this.embedDom = document.createElement(
          EmbeddedComponent.EMBED_TAG_NAME);
      this.embedDom.classList.add('embed-container');
      this.updateSize_();
      this.containerDom.appendChild(this.embedDom);
      this.dom.appendChild(this.containerDom);
    }
    this.captionParagraph.render(this.dom, {editMode: this.editMode});

    this.loadEmbed_(function (oembedData) {
      this.type = oembedData.type;
      /* jshint camelcase: false */
      this.serviceName = oembedData.provider || oembedData.provider_name;
      if (this.serviceName) {
        this.dom.classList.add(this.serviceName);
      }

      // TODO(mkhatib): Render a nice placeholder until the data has been
      // loaded.
      if (this.url) {
        this.updateSize_();
      }

      if (this.editMode) {
        this.overlayDom = document.createElement(
            EmbeddedComponent.OVERLAY_TAG_NAME);
        this.overlayDom.className = EmbeddedComponent.OVERLAY_CLASS_NAME;
        this.containerDom.appendChild(this.overlayDom);
        this.overlayDom.addEventListener('click', this.select.bind(this));

        this.selectionDom = document.createElement('div');
        this.selectionDom.innerHTML = '&nbsp;';
        this.selectionDom.className = 'selection-pointer';
        this.selectionDom.setAttribute('contenteditable', true);
        this.selectionDom.addEventListener('focus', this.select.bind(this));
        this.containerDom.appendChild(this.selectionDom);

        this.captionParagraph.dom.setAttribute('contenteditable', true);

        if (!this.sizes) {
          this.containerDom.style.width = this.getClosestSupportedScreenSize_(
              containerWidth) + 'px';
        }
      }

      this.oEmbedDataLoaded_(oembedData);
    }.bind(this), {
      width: this.getClosestSupportedScreenSize_(containerWidth)
    });

  }
};


/**
 * Loads the embed from the embed provider.
 * @private
 */
EmbeddedComponent.prototype.loadEmbed_ = function(callback, optArgs) {
  var embedProvider = Loader.load('embedProviders')[this.provider];
  embedProvider.getEmbedForUrl(this.url, callback, optArgs);
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this EmbeddedComponent.
 */
EmbeddedComponent.prototype.getJSONModel = function() {
  var embed = {
    component: this.getComponentClassName(),
    name: this.name,
    url: this.url,
    provider: this.provider,
    sizes: this.sizes,
    caption: this.captionParagraph.text,
    type: this.type,
    serviceName: this.serviceName
  };

  return embed;
};


/**
 * Handles clicking on the embedded component to update the selection.
 */
EmbeddedComponent.prototype.select = function (offset) {
  Component.prototype.select.call(this, offset);

  // TODO(mkhatib): Unselect the component when the embed plays to allow the
  // user to select it again and delete it.
  return false;
};



/**
 * Returns the operations to execute a deletion of the embedded component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {Object} optCursorAfterOp Where to move cursor to after deletion.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
EmbeddedComponent.prototype.getDeleteOps = function (
    optIndexOffset, optCursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        url: this.url,
        provider: this.provider,
        caption: this.caption,
        sizes: this.sizes,
        type: this.type,
        serviceName: this.serviceName
      }
    }
  }];

  // If this is the only child of the layout delete the layout as well.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a embedded component.
 * @param {number} index Index to insert the embedded component at.
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the embedded component.
 */
EmbeddedComponent.prototype.getInsertOps = function (index, optCursorBeforeOp) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        url: this.url,
        provider: this.provider,
        sizes: this.sizes,
        caption: this.caption,
        type: this.type,
        serviceName: this.serviceName
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorBeforeOp
    }
  }];
};


/**
 * Returns the length of the embedded component content.
 * @return {number} Length of the embedded component content.
 */
EmbeddedComponent.prototype.getLength = function () {
  return 1;
};

},{"../component":2,"../i18n":20,"../loader":25,"../paragraph":27,"../utils":33}],10:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Errors = require('../errors');
var Loader = require('../loader');
var Button = require('../toolbars/button');
var Paragraph = require('../paragraph');
var I18n = require('../i18n');

/**
 * EmbeddingExtension allows embedding different kind of components using
 * different providers.
 * @param {Object} optParams Config params.
 * @constructor
 */
var EmbeddingExtension = function (optParams) {
  var params = Utils.extend({
    editor: null,
    embedProviders: null,
    ComponentClass: null
  }, optParams);

  /**
   * A reference to the editor this extension is enabled in.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * Maps the different providers with their instances.
   * @type {Object}
   */
  this.embedProviders = params.embedProviders;

  /**
   * The component class to use for embedding.
   * @type {Component}
   */
  this.ComponentClass = params.ComponentClass;
};
module.exports = EmbeddingExtension;


/**
 * Extension class name.
 * @type {string}
 */
EmbeddingExtension.CLASS_NAME = 'EmbeddingExtension';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
EmbeddingExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Instantiate an instance of the extension and configure it.
 * @param  {Editor} editor Instance of the editor installing this extension.
 * @param  {Object} config Configuration for the extension.
 * @static
 */
EmbeddingExtension.onInstall = function (editor, config) {
  if (!config.embedProviders || ! config.ComponentClass) {
    throw Errors.ConfigrationError(
        'EmbeddingExtension needs "embedProviders" and "ComponentClass"');
  }

  var extension = new EmbeddingExtension({
    embedProviders: config.embedProviders,
    ComponentClass: config.ComponentClass,
    editor: editor
  });

  // Register the embedProviders with the loader to allow components to
  // access them. Force this?
  Loader.register('embedProviders', config.embedProviders, true);
  extension.init();
};


/**
 * Registers the different regexes for each provider.
 */
EmbeddingExtension.prototype.init = function() {
  var self = this;

  /**
   * Callback wrapper to allow passing provider for the callback.
   * @param  {string} provider Provider name.
   * @return {Function} Regex match handler.
   */
  var handleRegexMatchProvider = function(provider) {
    return function(matchedComponent, opsCallback) {
      self.handleRegexMatch(matchedComponent, opsCallback, provider);
    };
  };

  // Register regexes in each provider.
  for (var provider in this.embedProviders) {
    var regexStr = this.embedProviders[provider].getUrlsRegex();
    this.editor.registerRegex(regexStr, handleRegexMatchProvider(provider));
  }

  this.toolbelt = this.editor.getToolbar(
      EmbeddingExtension.TOOLBELT_TOOLBAR_NAME);

  // Add embedding buttons to the toolbelt.
  var toolbeltButtons = [{
    label: I18n.get('button.video'),
    icon: I18n.get('button.icon.video'),
    placeholder: I18n.get('placeholder.video')
  }, {
    label: I18n.get('button.photo'),
    icon: I18n.get('button.icon.photo'),
    placeholder: I18n.get('placeholder.photo')
  }, {
    label: I18n.get('button.post'),
    icon: I18n.get('button.icon.post'),
    placeholder: I18n.get('placeholder.post')
  }, {
    label: I18n.get('button.gif'),
    icon: I18n.get('button.icon.gif'),
    placeholder: I18n.get('placeholder.gif')
  }, {
    label: I18n.get('button.quiz'),
    icon: I18n.get('button.icon.quiz'),
    placeholder: I18n.get('placeholder.quiz')
  }];

  for (var i = 0; i < toolbeltButtons.length; i++) {
    var insertVideoButton = new Button({
      label: toolbeltButtons[i].label,
      icon: toolbeltButtons[i].icon,
      data: { placeholder: toolbeltButtons[i].placeholder }
    });
    insertVideoButton.addEventListener(
        'click', this.handleInsertClicked.bind(this));
    this.toolbelt.addButton(insertVideoButton);
  }
};


EmbeddingExtension.prototype.handleInsertClicked = function(event) {
  var button = event.detail.target;
  var placeholder = button.data.placeholder;
  var newP = new Paragraph({
    placeholderText: placeholder,
    section: this.editor.selection.getSectionAtStart()
  });

  var index = this.editor.selection.getComponentAtStart().getIndexInSection();
  this.editor.article.transaction(newP.getInsertOps(index));
};



/**
 * Handles regex match by instantiating a component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 * @param  {string} provider Embed provider name.
 */
EmbeddingExtension.prototype.handleRegexMatch = function(
    matchedComponent, opsCallback, provider) {
  var atIndex = matchedComponent.getIndexInSection();
  var ops = [];
  var embeddedComponent = new this.ComponentClass({
    url: matchedComponent.text,
    provider: provider
  });
  embeddedComponent.section = matchedComponent.section;

  // Delete current matched component with its text.
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  // Add the new component created from the text.
  Utils.arrays.extend(ops, embeddedComponent.getInsertOps(atIndex));

  opsCallback(ops);
};

},{"../errors":4,"../i18n":20,"../loader":25,"../paragraph":27,"../toolbars/button":30,"../utils":33}],11:[function(require,module,exports){
'use strict';

var AbstractEmbedProvider = require('./abstractEmbedProvider');
var Utils = require('../utils');


/**
 * Provides an Embed Provider using Embedly APIs.
 * @param {Object=} optParams Config params.
 *   required: apiKey
 * @constructor
 */
var EmbedlyProvider = function (optParams) {
  var params = Utils.extend({
    endpoint: 'https://api.embed.ly/1/oembed',
    apiKey: null,
  }, optParams);

  /**
   * Embedly oembed endpoint.
   * @type {string}
   */
  this.endpoint = params.endpoint;

  /**
   * API Key for embedly app.
   * @type {string}
   */
  this.apiKey = params.apiKey;

  AbstractEmbedProvider.call(this, params);
};
EmbedlyProvider.prototype = Object.create(AbstractEmbedProvider.prototype);
module.exports = EmbedlyProvider;


/**
 * Regex string for all URLs embedly provider can handle.
 * @constant
 */
EmbedlyProvider.SUPPORTED_URLS_REGEX_STRING = '^((https?://(www\.flickr\.com/photos/.*|flic\.kr/.*|.*imgur\.com/.*|.*dribbble\.com/shots/.*|drbl\.in/.*|giphy\.com/gifs/.*|gph\.is/.*|vid\.me/.*|www\.slideshare\.net/.*/.*|www\.slideshare\.net/mobile/.*/.*|.*\.slideshare\.net/.*/.*|slidesha\.re/.*|www\.kickstarter\.com/projects/.*/.*|linkedin\.com/in/.*|linkedin\.com/pub/.*|.*\.linkedin\.com/in/.*|.*\.linkedin\.com/pub/.*|linkedin\.com/in/.*|linkedin\.com/company/.*|.*\.linkedin\.com/company/.*|www\.sliderocket\.com/.*|sliderocket\.com/.*|app\.sliderocket\.com/.*|portal\.sliderocket\.com/.*|beta-sliderocket\.com/.*|maps\.google\.com/maps\?.*|maps\.google\.com/\?.*|maps\.google\.com/maps/ms\?.*|www\.google\..*/maps/.*|google\..*/maps/.*|tumblr\.com/.*|.*\.tumblr\.com/post/.*|pastebin\.com/.*|storify\.com/.*/.*|prezi\.com/.*/.*|www\.wikipedia\.org/wiki/.*|.*\.wikipedia\.org/wiki/.*|www\.behance\.net/gallery/.*|behance\.net/gallery/.*|jsfiddle\.net/.*|www\.gettyimages\.com/detail/photo/.*|gty\.im/.*|jsbin\.com/.*/.*|jsbin\.com/.*|codepen\.io/.*/pen/.*|codepen\.io/.*/pen/.*|quora\.com/.*/answer/.*|www\.quora\.com/.*/answer/.*|www\.qzzr\.com/quiz/.*|.*amazon\..*/gp/product/.*|.*amazon\..*/.*/dp/.*|.*amazon\..*/dp/.*|.*amazon\..*/o/ASIN/.*|.*amazon\..*/gp/offer-listing/.*|.*amazon\..*/.*/ASIN/.*|.*amazon\..*/gp/product/images/.*|.*amazon\..*/gp/aw/d/.*|www\.amzn\.com/.*|amzn\.com/.*|fiverr\.com/.*/.*|www\.fiverr\.com/.*/.*|.*youtube\.com/watch.*|.*\.youtube\.com/v/.*|youtu\.be/.*|.*\.youtube\.com/user/.*|.*\.youtube\.com/.*#.*/.*|m\.youtube\.com/watch.*|m\.youtube\.com/index.*|.*\.youtube\.com/profile.*|.*\.youtube\.com/view_play_list.*|.*\.youtube\.com/playlist.*|www\.youtube\.com/embed/.*|youtube\.com/gif.*|www\.youtube\.com/gif.*|www\.youtube\.com/attribution_link.*|youtube\.com/attribution_link.*|youtube\.ca/.*|youtube\.jp/.*|youtube\.com\.br/.*|youtube\.co\.uk/.*|youtube\.nl/.*|youtube\.pl/.*|youtube\.es/.*|youtube\.ie/.*|it\.youtube\.com/.*|youtube\.fr/.*|.*twitch\.tv/.*|.*twitch\.tv/.*/b/.*|www\.ustream\.tv/recorded/.*|www\.ustream\.tv/channel/.*|www\.ustream\.tv/.*|ustre\.am/.*|.*\.dailymotion\.com/video/.*|.*\.dailymotion\.com/.*/video/.*|www\.livestream\.com/.*|new\.livestream\.com/.*|coub\.com/view/.*|coub\.com/embed/.*|vine\.co/v/.*|www\.vine\.co/v/.*|www\.vimeo\.com/groups/.*/videos/.*|www\.vimeo\.com/.*|vimeo\.com/groups/.*/videos/.*|vimeo\.com/.*|vimeo\.com/m/#/.*|player\.vimeo\.com/.*|www\.ted\.com/talks/.*\.html.*|www\.ted\.com/talks/lang/.*/.*\.html.*|www\.ted\.com/index\.php/talks/.*\.html.*|www\.ted\.com/index\.php/talks/lang/.*/.*\.html.*|www\.ted\.com/talks/|khanacademy\.org/.*|www\.khanacademy\.org/.*|www\.facebook\.com/video\.php.*|www\.facebook\.com/.*/posts/.*|fb\.me/.*|www\.facebook\.com/.*/videos/.*|fb\.com|plus\.google\.com/.*|www\.google\.com/profiles/.*|google\.com/profiles/.*|soundcloud\.com/.*|soundcloud\.com/.*/.*|soundcloud\.com/.*/sets/.*|soundcloud\.com/groups/.*|snd\.sc/.*))|(https://(vidd\.me/.*|vid\.me/.*|maps\.google\.com/maps\?.*|maps\.google\.com/\?.*|maps\.google\.com/maps/ms\?.*|www\.google\..*/maps/.*|google\..*/maps/.*|storify\.com/.*/.*|medium\.com/.*|medium\.com/.*/.*|quora\.com/.*/answer/.*|www\.quora\.com/.*/answer/.*|www\.qzzr\.com/quiz/.*|.*youtube\.com/watch.*|.*\.youtube\.com/v/.*|youtu\.be/.*|.*\.youtube\.com/playlist.*|www\.youtube\.com/embed/.*|youtube\.com/gif.*|www\.youtube\.com/gif.*|www\.youtube\.com/attribution_link.*|youtube\.com/attribution_link.*|youtube\.ca/.*|youtube\.jp/.*|youtube\.com\.br/.*|youtube\.co\.uk/.*|youtube\.nl/.*|youtube\.pl/.*|youtube\.es/.*|youtube\.ie/.*|it\.youtube\.com/.*|youtube\.fr/.*|coub\.com/view/.*|coub\.com/embed/.*|vine\.co/v/.*|www\.vine\.co/v/.*|gifs\.com/gif/.*|www\.gifs\.com/gif/.*|gifs\.com/.*|www\.gifs\.com/.*|www\.vimeo\.com/.*|vimeo\.com/.*|player\.vimeo\.com/.*|khanacademy\.org/.*|www\.khanacademy\.org/.*|www\.facebook\.com/video\.php.*|www\.facebook\.com/.*/posts/.*|fb\.me/.*|www\.facebook\.com/.*/videos/.*|plus\.google\.com/.*|soundcloud\.com/.*|soundcloud\.com/.*/.*|soundcloud\.com/.*/sets/.*|soundcloud\.com/groups/.*)))';


/**
 * Call the proper endpoint for the passed URL and send the response back
 * by passing it to a callabck.
 * @param {string} url Url to get the oembed response for.
 * @param {Function} callback A callback function to call with the result.
 * @param {Object=} optArgs Optional arguments to pass with the URL.
 */
EmbedlyProvider.prototype.getEmbedForUrl = function(
    url, callback, optArgs) {
  var endpoint = this.getOEmbedEndpointForUrl(url, optArgs);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      var json = JSON.parse(xhttp.responseText);
      callback(json);
    }
  };
  xhttp.open('GET', endpoint, true);
  xhttp.send();
};


/**
 * Returns the URL to call for oembed response.
 * @param {string} url URL to create the url for.
 * @param {Object} optArgs Arguments to pass with the URL.
 * @return {string}
 */
EmbedlyProvider.prototype.getOEmbedEndpointForUrl = function(url, optArgs) {
  var urlParams = Utils.extend({
    key: this.apiKey,
    // luxe: 1,
    url: url
  }, optArgs);
  var queryParts = [];
  for (var name in urlParams) {
    queryParts.push([name, urlParams[name]].join('='));
  }
  return [this.endpoint, queryParts.join('&')].join('?');
};


/**
 * Returns the regex string this provider want to provide the embed for.
 * @return {string}
 */
EmbedlyProvider.prototype.getUrlsRegex = function() {
  return EmbedlyProvider.SUPPORTED_URLS_REGEX_STRING;
};

},{"../utils":33,"./abstractEmbedProvider":5}],12:[function(require,module,exports){
'use strict';

var Paragraph = require('../paragraph');
var Selection = require('../selection');
var Utils = require('../utils');
var Button = require('../toolbars/button');
var TextField = require('../toolbars/textField');
var I18n = require('../i18n');


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
  // Ugly hack because we can't load I18n strings on load time.
  // TODO(mkhatib): Figure out a better way to handle this.
  var a = Formatting.getActionForTagName('a');
  a.attrs.href.placeholder = I18n.get('placeholder.href');

  var formattingExtension = new Formatting();
  formattingExtension.init(editor);
};


/**
 * Call to destroy instance and cleanup dom and event listeners.
 */
Formatting.onDestroy = function() {
  // pass
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
 * Checks if this is a selection change due to change of formatting.
 * @return {boolean}
 * @private
 */
Formatting.prototype.didSelectionActuallyChanged_ = function() {
  var selection = Selection.getInstance();
  if (this.lastSelection_ &&
      this.lastSelection_.start.component === selection.start.component &&
      this.lastSelection_.end.component === selection.end.component &&
      this.lastSelection_.start.offset === selection.start.offset &&
      this.lastSelection_.end.offset === selection.end.offset) {
    return false;
  }

  this.lastSelection_ = {
    start: {
      component: selection.start.component,
      offset: selection.start.offset
    },
    end: {
      component: selection.end.component,
      offset: selection.end.offset
    }
  };
  return true;
};


/**
 * Handles changing in selection or cursor.
 */
Formatting.prototype.handleSelectionChangedEvent = function() {
  if (!this.didSelectionActuallyChanged_()) {
    return;
  }
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
    setTimeout(function(){
      var wSelection = window.getSelection();
      if (wSelection.isCollapsed) {
        return;
      }
      this.inlineToolbar.setPositionTopOfSelection();
      this.inlineToolbar.setVisible(true);
      this.reloadInlineToolbarStatus();
    }.bind(this), 150);
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

  var section = selection.getSectionAtStart();
  var prevCursorOffset = selection.start.offset;
  var prevCompIndex = selection.getComponentAtStart().getIndexInSection();
  for (var i = 0; i < paragraphs.length; i++) {
    var toType = clickedFormatter;
    if (paragraphs[i].paragraphType === clickedFormatter) {
      toType = Paragraph.Types.Paragraph;
    }

    var index = paragraphs[i].getIndexInSection() + i;
    // Step 1: deleteComponent to remove current Paragraph.
    Utils.arrays.extend(ops, paragraphs[i].getDeleteOps(
        null, null, true));
    // Step 2: insertComponent to Insert a new Paragraph in its place with the
    // new paragraph type. Make sure to keep the name of the paragraph.
    paragraphs[i].paragraphType = toType;
    Utils.arrays.extend(ops, paragraphs[i].getInsertOps(index));
  }

  // Execute the transaction.
  this.editor.article.transaction(ops);

  // Tell listeners that there was a change in the editor.
  this.editor.dispatchEvent(new Event('change'));

  selection.setCursor({
    offset: prevCursorOffset,
    component: section.components[prevCompIndex]
  });
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

},{"../i18n":20,"../paragraph":27,"../selection":29,"../toolbars/button":30,"../toolbars/textField":31,"../utils":33}],13:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Component = require('../component');
var Loader = require('../loader');
var I18n = require('../i18n');


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
  }, optParams);

  Component.call(this, params);

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

};
GiphyComponent.prototype = Object.create(Component.prototype);
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
GiphyComponent.GIPHY_SEARCH_REGEX = '^\\+giphy\\s(.+[a-zA-Z])$';


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
  editor.registerRegex(
      I18n.get('regex.giphy') || GiphyComponent.GIPHY_SEARCH_REGEX,
      GiphyComponent.handleMatchedRegex);
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
 * Returns the class name of this component.
 * @return {string}
 */
GiphyComponent.prototype.getComponentClassName = function() {
  return GiphyComponent.CLASS_NAME;
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
 * @override
 */
GiphyComponent.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    this.imgDom = document.createElement(GiphyComponent.IMAGE_TAG_NAME);

    if (this.src) {
      this.imgDom.setAttribute('src', this.src);
      if (this.width) {
        this.imgDom.setAttribute('width', this.width);
      }
      this.dom.appendChild(this.imgDom);
    }

    if (this.editMode) {
      this.dom.addEventListener('click', this.select.bind(this));
      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener('focus', this.select.bind(this));
      this.dom.appendChild(this.selectionDom);
    }
  }
};


/**
 * Returns the operations to execute a deletion of the giphy component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {Object} optCursorAfterOp Where to move cursor to after deletion.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
GiphyComponent.prototype.getDeleteOps = function (
    optIndexOffset, optCursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
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

  // If this is the only child of the layout delete the layout as well
  // only if there are other layouts.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a GiphyComponent.
 * @param {number} index Index to insert the GiphyComponent at.
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the GiphyComponent.
 */
GiphyComponent.prototype.getInsertOps = function (index, optCursorBeforeOp) {
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
      component: this.name,
      cursor: optCursorBeforeOp
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

},{"../component":2,"../i18n":20,"../loader":25,"../utils":33}],14:[function(require,module,exports){
'use strict';

var Selection = require('../selection');
var Toolbar = require('../toolbars/toolbar');
var Button = require('../toolbars/button');
var I18n = require('../i18n');
var Figure = require('../figure');
var Layout = require('../layout');
var Utils = require('../utils');
var Loader = require('../loader');
var EmbeddedComponent = require('./embeddedComponent');
var GiphyComponent = require('./giphyComponent');


/**
 * LayoutingExtension extension for the editor.
 *   Adds an extendable toolbar for components to add buttons to.
 */
var LayoutingExtension = function () {

  /**
   * The editor this toolbelt belongs to.
   * @type {Editor}
   */
  this.editor = null;

  /**
   * The layouting toolbar.
   * @type {Toolbar}
   */
  this.toolbar = null;

};
module.exports = LayoutingExtension;


/**
 * Extension class name.
 * @type {string}
 */
LayoutingExtension.CLASS_NAME = 'LayoutingExtension';


/**
 * Initializes the toolbelt extensions.
 * @param  {Editor} editor Editor instance this installed on.
 */
LayoutingExtension.onInstall = function(editor) {
  var toolbeltExtension = new LayoutingExtension();
  toolbeltExtension.init(editor);
};


/**
 * Call to destroy instance and cleanup dom and event listeners.
 */
LayoutingExtension.onDestroy = function() {
  // pass
};


/**
 * Initiates the toolbelt extension.
 * @param  {Editor} editor The editor to initialize the extension for.
 */
LayoutingExtension.prototype.init = function(editor) {
  this.editor = editor;

  // Create a new toolbar for the toolbelt.
  this.toolbar = new Toolbar({
    name: LayoutingExtension.TOOLBAR_NAME,
    classNames: [LayoutingExtension.TOOLBAR_CLASS_NAME],
    rtl: this.editor.rtl
  });

  // TODO(mkhatib): Use Icons for buttons here.
  // Add layouting buttons to the toolbar.
  var buttons = [{
    label: I18n.get('button.layout.single'),
    icon: I18n.get('button.layout.icon.single'),
    name: 'layout-single-column'
  }, {
    label: I18n.get('button.layout.bleed'),
    icon: I18n.get('button.layout.icon.bleed'),
    name: 'layout-bleed'
  }, {
    label: I18n.get('button.layout.staged'),
    icon: I18n.get('button.layout.icon.staged'),
    name: 'layout-staged'
  }, {
    label: I18n.get('button.layout.left'),
    icon: I18n.get('button.layout.icon.left'),
    name: 'layout-float-left'
  }, {
    label: I18n.get('button.layout.right'),
    icon: I18n.get('button.layout.icon.right'),
    name: 'layout-float-right'
  }];

  for (var i = 0; i < buttons.length; i++) {
    var button = new Button({
      label: buttons[i].label,
      name: buttons[i].name,
      icon: buttons[i].icon,
      data: { name: buttons[i].name }
    });
    button.addEventListener(
        'click', this.handleLayoutButtonClick.bind(this));
    this.toolbar.addButton(button);
  }

  // Register the toolbelt toolbar with the editor.
  this.editor.registerToolbar(LayoutingExtension.TOOLBAR_NAME, this.toolbar);

  // Listen to selection changes.
  this.editor.article.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.handleSelectionChangedEvent.bind(this));
};


/**
 * LayoutingExtension toolbar name.
 * @type {string}
 */
LayoutingExtension.TOOLBAR_NAME = 'layouting-toolbar';


/**
 * LayoutingExtension toolbar class name.
 * @type {string}
 */
LayoutingExtension.TOOLBAR_CLASS_NAME = 'layouting-toolbar';


/**
 * Handles clicking the insert button to expand the toolbelt.
 */
LayoutingExtension.prototype.handleLayoutButtonClick = function(e) {
  var ops = [];
  var insertLayoutAtIndex;
  var selectedComponent = this.editor.selection.getComponentAtStart();
  var componentClassName = selectedComponent.getComponentClassName();
  var ComponentClass = Loader.load(componentClassName);
  var component;
  var newLayout;

  if (selectedComponent instanceof Figure ||
      selectedComponent instanceof EmbeddedComponent ||
      selectedComponent instanceof GiphyComponent) {
    this.toolbar.setActiveButton(e.detail.target);
    var currentLayout = selectedComponent.section;
    var clickedLayout = e.detail.target.name;
    var componentIndexInLayout = selectedComponent.getIndexInSection();
    var isComponentAtStartOfLayout = componentIndexInLayout === 0;
    var isComponentAtEndOfLayout = (
        componentIndexInLayout === currentLayout.getLength() - 1);
    if (currentLayout.type !== clickedLayout) {
      // If figure is the only element in the layout, just change
      // the layout type.
      if (currentLayout.getLength() === 1) {
        Utils.arrays.extend(ops, currentLayout.getUpdateOps({
          type: clickedLayout
        }));
      }

      // If figure is the first/last element in the layout, create a new
      // layout and append it to the section before/after the current layout
      // with the figure in it.
      else if (isComponentAtStartOfLayout || isComponentAtEndOfLayout) {
        insertLayoutAtIndex = currentLayout.getIndexInSection();
        if (isComponentAtEndOfLayout) {
          insertLayoutAtIndex++;
        }
        newLayout = new Layout({
          type: clickedLayout,
          section: currentLayout.section,
          components: []
        });
        Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));
        Utils.arrays.extend(ops, selectedComponent.getDeleteOps());

        component = ComponentClass.fromJSON(selectedComponent.getJSONModel());
        component.section = newLayout;
        Utils.arrays.extend(ops, component.getInsertOps(0));
      }

      // If figure is in the middle of a layout. Split layout in that index.
      // Create a new layout and insert it in the middle.
      else {
        insertLayoutAtIndex = currentLayout.getIndexInSection() + 1;
        newLayout = new Layout({
          type: clickedLayout,
          section: currentLayout.section,
          components: []
        });

        Utils.arrays.extend(
            ops, currentLayout.getSplitOps(componentIndexInLayout));
        Utils.arrays.extend(ops, selectedComponent.getDeleteOps());
        Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));

        component = ComponentClass.fromJSON(selectedComponent.getJSONModel());
        component.section = newLayout;
        Utils.arrays.extend(ops, component.getInsertOps(0));
      }

      this.editor.article.transaction(ops);
      this.editor.dispatchEvent(new Event('change'));
    }
  }

  this.handleSelectionChangedEvent();
};


/**
 * Handles selection change event on the editor to hide the toolbelt.
 */
LayoutingExtension.prototype.handleSelectionChangedEvent = function() {
  var selectedComponent = this.editor.selection.getComponentAtStart();
  if ((selectedComponent instanceof Figure && !selectedComponent.isDataUrl) ||
      selectedComponent instanceof EmbeddedComponent ||
      selectedComponent instanceof GiphyComponent) {
    var activeLayout = selectedComponent.section.type;
    var activeLayoutButton = this.toolbar.getButtonByName(activeLayout);
    this.toolbar.setActiveButton(activeLayoutButton);

    this.toolbar.setPositionToTopOf(selectedComponent.dom);
    this.toolbar.setVisible(true);
  } else {
    this.toolbar.setVisible(false);
  }
};


/**
 * Handles new button added to toolbelt to show the insert button.
 */
LayoutingExtension.prototype.handleButtonAdded = function () {
  this.insertButton.setVisible(true);
};

},{"../figure":19,"../i18n":20,"../layout":23,"../loader":25,"../selection":29,"../toolbars/button":30,"../toolbars/toolbar":32,"../utils":33,"./embeddedComponent":9,"./giphyComponent":13}],15:[function(require,module,exports){
'use strict';

var Utils = require('../utils');
var Attachment = require('./attachment');
var Figure = require('../figure');
var Button = require('../toolbars/button');
var I18n = require('../i18n');


/**
 * Allows users to take selfies and insert them into the article.
 * @param {Object=} optParams Optional parameters.
 */
var SelfieExtension = function(optParams) {

  var params = Utils.extend({
    // TODO(mkhatib): Add config params for size and shutter sound.
    editor: null,
  }, optParams);

  // Create offscreen canvas to use as video buffer from the webcam.
  // TODO(mkhatib): Maybe actually insert it as a Figure when /selfie
  // is typed to see live view of it and then the picture is taken!
  this.camDom = document.getElementById(SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
  if (!this.camDom) {
    this.camDom = document.createElement('div');
    this.camDom.style.position = 'absolute';
    this.camDom.style.top = '-9999px';
    this.camDom.style.left = '-9999px';
    this.camDom.setAttribute('id', SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
    document.body.appendChild(this.camDom);
  }

  /* jshint ignore:start */
  Webcam.set({
    width: 320,
    height: 240,
    dest_width: 1280,
    dest_height: 720,
    crop_width: 1280,
    crop_height: 720,
    image_format: 'jpeg',
    jpeg_quality: 90
  });
  /* jshint ignore:end */

  /**
   * Editor instance this extension was installed on.
   * @type {Editor}
   */
  this.editor = params.editor;

  /**
   * Toolbelt toolbar instance.
   * @type {Toolbar}
   */
  this.toolbelt = this.editor.getToolbar(SelfieExtension.TOOLBELT_TOOLBAR_NAME);

};
module.exports = SelfieExtension;


/**
 * Extension class name.
 * @type {string}
 */
SelfieExtension.CLASS_NAME = 'SelfieExtension';


/**
 * The preview element id.
 * @type {string}
 */
SelfieExtension.CAM_PREVIEW_ELEMENT_ID = 'carbon-camera';


/**
 * Command regex to take a selfie.
 * @type {string}
 */
SelfieExtension.COMMAND_REGEX = '^\\+selfie$';


/**
 * Event to fire when the selfie is taken.
 * @type {String}
 */
SelfieExtension.ATTACHMENT_ADDED_EVENT_NAME = 'attachment-added';


/**
 * Toolbar name for the toolbelt toolbar.
 * @type {string}
 */
SelfieExtension.TOOLBELT_TOOLBAR_NAME = 'toolbelt-toolbar';


/**
 * Initiate an extension instance.
 * @param  {Editor} editor Editor installing this extension.
 */
SelfieExtension.onInstall = function (editor) {
  if (!Webcam) {
    console.error('SelfieExtension depends on Webcam.js being loaded. Make' +
      ' sure to include it in your app.');
    return;
  }

  var extension = new SelfieExtension({
    editor: editor
  });
  extension.init();
};


/**
 * Registers the regex with the editor.
 */
SelfieExtension.prototype.init = function() {
  this.editor.registerRegex(
      I18n.get('regex.selfie') || SelfieExtension.COMMAND_REGEX,
      this.handleMatchedRegex.bind(this));

  var selfieButton = new Button({
    label: I18n.get('button.selfie'),
    icon: I18n.get('button.icon.selfie')
  });
  selfieButton.addEventListener('click', this.handleInsertClicked.bind(this));
  this.toolbelt.addButton(selfieButton);
};


/**
 * Takes a selfie from the webcam and make a callback with the operations
 * to execute to insert it.
 * @param  {Function} opsCallback Callback to call with the operations to insert
 * the selfie.
 */
SelfieExtension.prototype.letMeTakeASelfie = function(opsCallback) {
  var that = this;
  var ops = [];
  Webcam.attach('#' + SelfieExtension.CAM_PREVIEW_ELEMENT_ID);
  Webcam.on('live', function () {
    setTimeout(function() {
      Webcam.snap(function(dataUri) {
        var selection = that.editor.article.selection;
        var component = selection.getComponentAtStart();
        var atIndex = component.getIndexInSection();
        // Create a figure with the file Data URL and insert it.
        var figure = new Figure({src: dataUri});
        figure.section = selection.getSectionAtStart();
        var insertFigureOps = figure.getInsertOps(atIndex);

        // Add the new component created from the text.
        Utils.arrays.extend(ops, figure.getInsertOps(atIndex));

        if (opsCallback) {
          opsCallback(ops);
        }

        // Create an attachment to track the figure and insertion operations.
        var attachment = new Attachment({
          dataUri: dataUri,
          figure: selection.getSectionAtStart().getComponentByName(figure.name),
          editor: that.editor,
          insertedOps: insertFigureOps
        });

        // Dispatch an attachment added event to allow clients to upload the
        // file.
        var newEvent = new CustomEvent(
          SelfieExtension.ATTACHMENT_ADDED_EVENT_NAME, {
            detail: { attachment: attachment }
        });
        that.editor.dispatchEvent(newEvent);
      });

      Webcam.off('live');
      Webcam.reset();
    }, 1000);
  });
};


/**
 * Handles regex match by instantiating a component.
 * @param {Component} matchedComponent Component that matched registered regex.
 * @param {Function} opsCallback Callback to send list of operations to exectue.
 */
SelfieExtension.prototype.handleMatchedRegex = function(
    matchedComponent, opsCallback) {
  var ops = [];
  var atIndex = matchedComponent.getIndexInSection();
  Utils.arrays.extend(ops, matchedComponent.getDeleteOps(atIndex));

  this.letMeTakeASelfie(function(newOps) {
    Utils.arrays.extend(ops, newOps);
    opsCallback(ops);
  });
};


/**
 * Handles clicking take a selfie button.
 */
SelfieExtension.prototype.handleInsertClicked = function() {
  var that = this;
  this.letMeTakeASelfie(function(ops) {
    that.editor.article.transaction(ops);
    that.editor.dispatchEvent(new Event('change'));
  });
};

},{"../figure":19,"../i18n":20,"../toolbars/button":30,"../utils":33,"./attachment":6}],16:[function(require,module,exports){
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


/**
 * Clears all registerations.
 */
ShortcutsManager.prototype.onDestroy = function() {
  this.registery = {};
};

},{}],17:[function(require,module,exports){
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
 * Call to destroy instance and cleanup dom and event listeners.
 */
Toolbelt.onDestroy = function() {
  // pass
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
    classNames: [Toolbelt.TOOLBELT_TOOLBAR_CLASS_NAME],
    rtl: this.editor.rtl
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

},{"../selection":29,"../toolbars/button":30,"../toolbars/toolbar":32}],18:[function(require,module,exports){
'use strict';

var Button = require('../toolbars/button');
var Utils = require('../utils');
var Figure = require('../figure');
var Attachment = require('./attachment');
var I18n = require('../i18n');


/**
 * An upload button that extends Button to style the upload button.
 * @param {Object=} optParams Optional parameters.
 */
var UploadButton = function (optParams) {
  var params = Utils.extend({
    label: 'Upload',
    icon: '',
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
  this.uploadButtonDom.setAttribute('multiple', true);
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
 * Call to destroy instance and cleanup dom and event listeners.
 */
UploadExtension.onDestroy = function() {
  // pass
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
    label: I18n.get('button.upload'),
    icon: I18n.get('button.icon.upload')
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
  var files = event.detail.files;

  var fileLoaded = function(dataUrl, file) {
    var selection = that.editor.article.selection;
    var component = selection.getComponentAtStart();

    // Create a figure with the file Data URL and insert it.
    var figure = new Figure({src: dataUrl});
    figure.section = selection.getSectionAtStart();
    var insertFigureOps = figure.getInsertOps(component.getIndexInSection());
    that.editor.article.transaction(insertFigureOps);
    that.editor.dispatchEvent(new Event('change'));

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
  };

  for (var i = 0; i < files.length; i++) {
    // Read the file as Data URL.
    this.readFileAsDataUrl_(files[i], fileLoaded);
  }
};


/**
 * Read file data URL.
 * @param  {File} file File picked by the user.
 * @param  {Function} callback Callback function when the reading is complete.
 */
UploadExtension.prototype.readFileAsDataUrl_ = function(file, callback) {
  var reader = new FileReader();
  reader.onload = (function(f) {
    return function(e) {
      callback(e.target.result, f);
    };
  }(file));
  reader.readAsDataURL(file);
};

},{"../figure":19,"../i18n":20,"../toolbars/button":30,"../utils":33,"./attachment":6}],19:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Component = require('./component');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');
var I18n = require('./i18n');


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
    captionPlaceholder: I18n.get('placeholder.figure'),
    width: '100%',
    height: null,
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
   * Height of the figure.
   * @type {string}
   */
  this.height = params.height;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * Text to place as placeholder for caption.
   * @type {string}
   */
  this.captionPlaceholder = params.captionPlaceholder;

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {string}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: params.captionPlaceholder,
    name: this.name + '-caption',
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
 * Container element tag name to allow responsive images.
 * @type {string}
 */
Figure.IMAGE_CONTAINER_TAG_NAME = 'div';


/**
 * Container element class name to allow responsive images.
 * @type {string}
 */
Figure.IMAGE_CONTAINER_CLASS_NAME = 'image-container';


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
 * Returns the class name of this component.
 * @return {string}
 */
Figure.prototype.getComponentClassName = function() {
  return Figure.CLASS_NAME;
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
    height: this.height,
    caption: this.captionParagraph.text
  };

  if (!this.isDataUrl) {
    image.src = this.src;
  }

  return image;
};


/**
 * Renders a component in an element.
 * @param  {HTMLElement} element Element to render component in.
 * @param  {Object} options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 * @override
 */
Figure.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);

    if (this.src) {
      this.imgDom = document.createElement(Figure.IMAGE_TAG_NAME);
      this.imgDom.setAttribute('src', this.src);

      this.imgContainerDom = document.createElement(
          Figure.IMAGE_CONTAINER_TAG_NAME);
      if (this.width && this.height) {
        this.imgContainerDom.className = Figure.IMAGE_CONTAINER_CLASS_NAME;
        this.imgContainerDom.style.paddingBottom = (
            (parseInt(this.height)/parseInt(this.width) * 100) + '%');
      }
      this.imgContainerDom.appendChild(this.imgDom);
      this.dom.appendChild(this.imgContainerDom);
    }

    this.captionParagraph.render(this.dom, {editMode: this.editMode});

    if (this.editMode) {
      if (this.src) {
        this.imgDom.addEventListener('click', this.select.bind(this));
        this.selectionDom = document.createElement('div');
        this.selectionDom.innerHTML = '&nbsp;';
        this.selectionDom.className = 'selection-pointer';
        this.selectionDom.setAttribute('contenteditable', true);
        this.selectionDom.addEventListener('focus', this.select.bind(this));
        this.dom.appendChild(this.selectionDom);
      }

      this.captionParagraph.dom.setAttribute('contenteditable', true);

      if (this.imgDom && (!this.width || !this.height)) {
        this.imgDom.addEventListener('load', function () {
          if (this.editMode) {
            var styles = window.getComputedStyle(this.imgDom);
            this.width = styles.width;
            this.height = styles.height;
          }
        }.bind(this));
      }
    }
  }
};


/**
 * Returns the operations to execute a deletion of the image component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {Object} optCursorAfterOp Where to move cursor to after deletion.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
Figure.prototype.getDeleteOps = function (optIndexOffset, optCursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Figure',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.captionParagraph.text,
        width: this.width
      }
    }
  }];

  // If this is the only child of the layout delete the layout as well.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a figure.
 * @param {number} index Index to insert the figure at.
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the figure.
 */
Figure.prototype.getInsertOps = function (index, optCursorBeforeOp) {
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
        caption: this.captionParagraph.text
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorBeforeOp
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

},{"./component":2,"./i18n":20,"./loader":25,"./paragraph":27,"./utils":33}],20:[function(require,module,exports){
'use strict';

var I18n = {};
module.exports = I18n;

/**
 * Stores locales strings.
 * @type {Object}
 */
I18n.LANG_STRING_MAP = {};


/**
 * Stores the fallback locale if there wasn't a string for the requested
 * locale.
 * @type {string}
 */
I18n.fallbackLocale = 'en';


/**
 * Stores the default locale for Carbon.
 * @type {string}
 */
I18n.currentLocale = 'en';


/**
 * Returns the current locale.
 * @return {string}
 */
I18n.getCurrentLocale = function() {
  return I18n.currentLocale;
};


/**
 * Sets the current locale.
 * @param {string} locale
 */
I18n.setCurrentLocale = function(locale) {
  I18n.currentLocale = locale;
};


/**
 * Returns the fallback locale.
 * @return {string}
 */
I18n.getFallbackLocale = function() {
  return I18n.fallbackLocale;
};


/**
 * Sets the fallback locale.
 * @param {string} locale
 */
I18n.setFallbackLocale = function(locale) {
  I18n.fallbackLocale = locale;
};


/**
 * Sets a string for a specific locale.
 * @param {string} locale Locale to store this string for.
 * @param {string} id String ID.
 * @param {string} string The string to store for that string ID.
 */
I18n.set = function(locale, id, string) {
  if (!I18n.LANG_STRING_MAP[locale]) {
    I18n.LANG_STRING_MAP[locale] = {};
  }

  I18n.LANG_STRING_MAP[locale][id] = string;
};


/**
 * Returns the string for the specific ID.
 * @param  {string} id String ID.
 * @param  {string} optLocale Optional Locale - default to currentLocale.
 * @return {string|null} The string for that locale if found.
 */
I18n.get = function(id, optLocale) {
  var locale = optLocale || I18n.currentLocale;
  if (!I18n.LANG_STRING_MAP[locale] ||
      !I18n.LANG_STRING_MAP[locale][id]) {
    locale = I18n.getFallbackLocale();
  }
  return I18n.LANG_STRING_MAP[locale][id];
};

},{}],21:[function(require,module,exports){
'use strict';

var I18n = require('../i18n');

// Caption placeholders.
I18n.set('ar', 'placeholder.figure'  , 'اكتب وصف للصورة (اختياري)');
I18n.set('ar', 'placeholder.embed'   , 'اكتب وصف للتضمين (اختياري)');
I18n.set('ar', 'placeholder.href'    , 'ما هو الرابط؟');
I18n.set('ar', 'placeholder.video'   , 'ألصق رابط يوتيوب، فاين، فيديو فيسبوك، ساوند كلاود أو غيرها...');
I18n.set('ar', 'placeholder.photo'   , 'ألصق رابط لصورة، صورة فيسبوك، إنستغرام أو غيرها...');
I18n.set('ar', 'placeholder.post'    , 'ألصق رابط لفيسبوك، تويتر، جيتهاب جيست أو غيرها...');
I18n.set('ar', 'placeholder.gif'     , 'اكتب +جيفي <نص إنجليزي للبحث> واضغط زر الإدخال أو ألصق رابط من جيفي...');
I18n.set('ar', 'placeholder.quiz'    , 'ألصق رابط من qzzr.com أو slideshare أو غيرها...');

// Toolbelt Buttons.
I18n.set('ar', 'button.upload' , 'تحميل صورة');
I18n.set('ar', 'button.video'  , 'أدخل فيديو');
I18n.set('ar', 'button.photo'  , 'أدخل صورة برابط');
I18n.set('ar', 'button.post'   , 'تضمين منشور');
I18n.set('ar', 'button.gif'    , 'أدخل GIF');
I18n.set('ar', 'button.quiz'   , 'أدخل عرض');
I18n.set('ar', 'button.selfie' , 'نفصورة!');

// Layouting Toolbar Buttons.
I18n.set('ar', 'button.layout.single'   , 'خانة');
I18n.set('ar', 'button.layout.bleed'    , 'رف');
I18n.set('ar', 'button.layout.staged'   , 'مسرح');
I18n.set('ar', 'button.layout.left'     , 'شمال');
I18n.set('ar', 'button.layout.right'    , 'يمين');

I18n.set('ar', 'regex.giphy', '^\\+جيفي\\s(.+[a-zA-Z])$');
I18n.set('ar', 'regex.selfie', '^\\+(?:نفصور[ة|ه]|سي?لفي)$');

},{"../i18n":20}],22:[function(require,module,exports){
'use strict';

var I18n = require('../i18n');

// Caption placeholders.
I18n.set('en', 'placeholder.figure'  , 'Enter caption for image (optional)');
I18n.set('en', 'placeholder.embed'   , 'Enter caption for embed (optional)');
I18n.set('en', 'placeholder.href'    , 'What is the URL?');
I18n.set('en', 'placeholder.video'   , 'Paste a link for YouTube, Vine, FB Video, SoundCloud and others.');
I18n.set('en', 'placeholder.photo'   , 'Paste a link for a photo, FB photo, Instagram and others.');
I18n.set('en', 'placeholder.post'    , 'Paste a link for a Facebook post, Tweet, Github Gist and others.');
I18n.set('en', 'placeholder.gif'     , 'Type /giphy <search-term> (enter) or paste a link to giphy or gif image url.');
I18n.set('en', 'placeholder.quiz'    , 'Paste a link to qzzr.com or slideshare or others.');

// Toolbelt Buttons.
I18n.set('en', 'button.upload' , 'Upload Photo');
I18n.set('en', 'button.video'  , 'Insert Video');
I18n.set('en', 'button.photo'  , 'Insert Photo by URL');
I18n.set('en', 'button.post'   , 'Embed Post');
I18n.set('en', 'button.gif'    , 'Insert GIF');
I18n.set('en', 'button.quiz'   , 'Insert Quiz or Slides');
I18n.set('en', 'button.selfie' , 'Selfie!');

I18n.set('en', 'button.icon.upload' , 'fa fa-upload');
I18n.set('en', 'button.icon.video'  , 'fa fa-youtube-play');
I18n.set('en', 'button.icon.photo'  , 'fa fa-picture-o');
I18n.set('en', 'button.icon.post'   , 'fa fa-twitter');
I18n.set('en', 'button.icon.gif'    , 'fa fa-child');
I18n.set('en', 'button.icon.quiz'   , 'fa fa-question');
I18n.set('en', 'button.icon.selfie' , 'fa fa-camera');

// Layouting Toolbar Buttons.
I18n.set('en', 'button.layout.single'   , 'Column');
I18n.set('en', 'button.layout.bleed'    , 'Shelf');
I18n.set('en', 'button.layout.staged'   , 'Stage');
I18n.set('en', 'button.layout.left'     , 'Left');
I18n.set('en', 'button.layout.right'    , 'Right');

I18n.set('en', 'button.layout.icon.single'   , 'fa fa-align-justify');
I18n.set('en', 'button.layout.icon.bleed'    , 'fa fa-arrows-h');
I18n.set('en', 'button.layout.icon.staged'   , 'fa fa-desktop');
I18n.set('en', 'button.layout.icon.left'     , 'fa fa-align-left');
I18n.set('en', 'button.layout.icon.right'    , 'fa fa-align-right');

I18n.set('en', 'regex.giphy', '^\\+giphy\\s(.+[a-zA-Z])$');
I18n.set('en', 'regex.selfie', '^\\+selfie$');


},{"../i18n":20}],23:[function(require,module,exports){
'use strict';

var Utils = require('./utils');
var Section = require('./section');
var Paragrarph = require('./paragraph');
var Loader = require('./loader');

/**
 * Layout main.
 * @param {Object} optParams Optional params to initialize the Layout object.
 * Default:
 *   {
 *     components: [Paragraph],
 *     tagName: 'div',
 *     type: 'layout-single-column'
 *   }
 */
var Layout = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    tagName: Layout.LAYOUT_TAG_NAME,
    type: Layout.Types.SingleColumn,
    components: [new Paragrarph({
      paragraphType: Paragrarph.Types.Paragraph
    })]
  }, optParams);

  Section.call(this, params);

  this.type = params.type;
  this.dom.setAttribute('contenteditable', false);
  this.dom.classList.add('carbon-layout');
  this.dom.classList.add(this.type);
};
Layout.prototype = Object.create(Section.prototype);
module.exports = Layout;


/**
 * String name for the component class.
 * @type {string}
 */
Layout.CLASS_NAME = 'Layout';
Loader.register(Layout.CLASS_NAME, Layout);


/**
 * Unordered Layout component container element tag name.
 * @type {string}
 */
Layout.LAYOUT_TAG_NAME = 'div';


/**
 * Layout types.
 * @type {Object}
 */
Layout.Types = {
  SingleColumn: 'layout-single-column',
  Bleed: 'layout-bleed',
  Staged: 'layout-staged',
  FloatLeft: 'layout-float-left',
  FloatRight: 'layout-float-right'
};


/**
 * Create and initiate a list object from JSON.
 * @param  {Object} json JSON representation of the list.
 * @return {Layout} Layout object representing the JSON data.
 */
Layout.fromJSON = function (json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new Layout({
    tagName: json.tagName,
    name: json.name,
    type: json.type,
    components: components
  });
};


/**
 * Handles onInstall when Layout module is installed in an editor.
 */
Layout.onInstall = function() {
  // pass.
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
Layout.prototype.getComponentClassName = function() {
  return Layout.CLASS_NAME;
};


/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} Layout of operations needed to be executed.
 */
Layout.prototype.getDeleteOps = function (optIndexOffset) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Layout',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        components: this.components,
        tagName: this.tagName,
        type: this.type
      }
    }
  }];

  if (this.section.getLength() < 2) {
    var newLayout = new Layout({
      name: this.name,
      components: []
    });
    newLayout.section = this.section;
    Utils.arrays.extend(ops, newLayout.getInsertOps(0));
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a list.
 * @param {number} index Index to insert the list at.
 * @return {Array.<Object>} Operations for inserting the list.
 */
Layout.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'Layout',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        components: this.components,
        tagName: this.tagName,
        type: this.type
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
Layout.prototype.getSplitOps = function (atIndex) {
  var ops = [];
  var i = atIndex;
  var indexOffset = 0;
  for (i = atIndex; i < this.components.length; i++) {
    Utils.arrays.extend(ops, this.components[i].getDeleteOps(indexOffset--));
  }

  var newLayout = new Layout({
    tagName: this.tagName,
    section: this.section,
    components: []
  });
  Utils.arrays.extend(ops, newLayout.getInsertOps(
      this.getIndexInSection() + 1));
  for (i = atIndex; i < this.components.length; i++) {
    var className = this.components[i].getComponentClassName();
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(this.components[i].getJSONModel());
    component.section = newLayout;
    Utils.arrays.extend(ops, component.getInsertOps(i - atIndex));
  }

  return ops;
};


/**
 * @override
 */
Layout.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange) {
  return [{
    do: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      attrs: {
        type: attrs.type
      }
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      attrs: {
        type: this.type
      }
    }
  }];
};


/**
 * Updates the type of the layout and reflect the changes to
 * the dom of the layout component.
 * @param  {string} type Type of the layout.
 */
Layout.prototype.updateType = function(type) {
  this.dom.classList.remove(this.type);
  this.type = type;
  this.dom.classList.add(this.type);
};


/**
 * Updates layout attributes.
 * @param  {Object} attrs Attributes to update.
 */
Layout.prototype.updateAttributes = function(attrs) {
  if (attrs.type) {
    this.updateType(attrs.type);
    // TODO(mkhatib): Update class on the layout dom.
  }
};

/**
 * Returns the length of the list content.
 * @return {number} Length of the list content.
 */
Layout.prototype.getLength = function () {
  return this.components.length;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this list.
 */
Layout.prototype.getJSONModel = function() {
  var layout = {
    name: this.name,
    tagName: this.tagName,
    type: this.type,
    component: Layout.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    layout.components.push(this.components[i].getJSONModel());
  }

  return layout;
};

},{"./loader":25,"./paragraph":27,"./section":28,"./utils":33}],24:[function(require,module,exports){
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
    tagName: json.tagName,
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
 * Returns the class name of this component.
 * @return {string}
 */
List.prototype.getComponentClassName = function() {
  return List.CLASS_NAME;
};


/**
 * Returns the operations to execute a deletion of list component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {Object} optCursorAfterOp Where to move cursor to after deletion.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
List.prototype.getDeleteOps = function (optIndexOffset, optCursorAfterOp) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
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
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the list.
 */
List.prototype.getInsertOps = function (index, optCursorBeforeOp) {
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
      component: this.name,
      cursor: optCursorBeforeOp
    }
  }];
};


/**
 * Returns the operations to execute splitting a list.
 * @param {number} atIndex Index to split the list at.
 * @return {Array.<Object>} Operations for splitting the list.
 */
List.prototype.getSplitOps = function (atIndex) {
  var ops = [];
  var i = atIndex;
  for (i = atIndex; i < this.components.length; i++) {
    Utils.arrays.extend(ops, this.components[i].getDeleteOps());
  }

  var newList = new List({
    tagName: this.tagName,
    section: this.section,
    components: []
  });
  Utils.arrays.extend(ops, newList.getInsertOps(
      this.getIndexInSection() + 1));
  for (i = atIndex; i < this.components.length; i++) {
    var className = this.components[i].getComponentClassName();
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(this.components[i].getJSONModel());
    component.section = newList;
    Utils.arrays.extend(ops, component.getInsertOps(i - atIndex));
  }

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
    name: this.name,
    tagName: this.tagName,
    component: List.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};

},{"./loader":25,"./paragraph":27,"./section":28,"./utils":33}],25:[function(require,module,exports){
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

},{"./errors":4}],26:[function(require,module,exports){
'use strict';

// TODO(mkhatib): Figure out a better way to load translations lazily.
module.exports.I18n = require('./i18n');
require('./i18n/en');
require('./i18n/ar');

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.List = require('./list');
module.exports.Figure = require('./figure');
module.exports.Section = require('./section');
module.exports.Layout = require('./layout');
module.exports.Selection = require('./selection');
module.exports.Loader = require('./loader');


/**
 * Not exporting these as part of carbon.js but available for anybody to use.
 *
 * EmbeddingExtension, EmbeddedComponent along with EmbedlyProvider provide
 * support to a much larger providers base (incl. YouTube, Vine, Vimeo).
 *
 * module.exports.YouTubeComponent = require('./extensions/youtubeComponent');
 * module.exports.VineComponent = require('./extensions/vineComponent');
 * module.exports.VimeoComponent = require('./extensions/vimeoComponent');
 *
 */

// TODO(mkhatib): Find a better way to expose the classes and without making
// them part of the whole editor Javascript.
module.exports.GiphyComponent = require('./extensions/giphyComponent');
module.exports.EmbeddedComponent = require('./extensions/embeddedComponent');
module.exports.AbstractEmbedProvider = require('./extensions/abstractEmbedProvider');
module.exports.EmbedlyProvider = require('./extensions/embedlyProvider');
module.exports.CarbonEmbedProvider = require('./extensions/carbonEmbedProvider');
module.exports.EmbeddingExtension = require('./extensions/embeddingExtension');
module.exports.SelfieExtension = require('./extensions/selfieExtension');

module.exports.LayoutingExtension = require('./extensions/layoutingExtension');

},{"./article":1,"./editor":3,"./extensions/abstractEmbedProvider":5,"./extensions/carbonEmbedProvider":7,"./extensions/embeddedComponent":9,"./extensions/embeddingExtension":10,"./extensions/embedlyProvider":11,"./extensions/giphyComponent":13,"./extensions/layoutingExtension":14,"./extensions/selfieExtension":15,"./figure":19,"./i18n":20,"./i18n/ar":21,"./i18n/en":22,"./layout":23,"./list":24,"./loader":25,"./paragraph":27,"./section":28,"./selection":29}],27:[function(require,module,exports){
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
 * Class added to an empty paragraph in non-edit mode.
 * @type {string}
 */
Paragraph.EMPTY_PARAGRAPH_CLASS = 'empty-paragraph';


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
 * Returns the class name of this component.
 * @return {string}
 */
Paragraph.prototype.getComponentClassName = function() {
  return Paragraph.CLASS_NAME;
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
  // Cleanup &nbsp; mess only between words and non-repeating spaces.
  if (text) {
    this.text = text.replace(/(\S)\s(\S)/g, '$1 $2')
        // Keep the non-breaking space at the end of the string.
        .replace(/\s$/g, '\xa0')
        // Keep the non-breaking space for multiple spaces.
        .replace(/(\s{2,})/g, function(match) {
          return new Array(match.length + 1).join('\xa0');
        });

    // Remove zero-width whitespace when there are other characters.
    if (this.text.length > 1) {
      this.text = this.text.replace('\u200B', '').
          replace(/^\s/, '\xa0');
    }
  }
  if (!this.text.replace(/\s/, '').length) {
    this.dom.innerHTML = '&#8203;';
    this.dom.classList.add('show-placeholder');
  } else {
    this.dom.classList.remove('show-placeholder');
    Utils.setTextForElement(this.dom, this.text);
  }
};


/**
 * Returns the word at the given index.
 * @param  {number} index Index to return the word at.
 * @return {string} Word at the index passed.
 */
Paragraph.prototype.getWordAt_ = function(index) {
  var start = this.getWordStart_(index);
  var end = this.getWordEnd_(index);
  if (start < end) {
    return this.text.substring(start, end);
  }
};


/**
 * Returns the start index of the start of the word.
 * @param  {number} index Index that touches a word.
 * @return {number} Start index of the word.
 */
Paragraph.prototype.getWordStart_ = function(index) {
  var start;
  for (start = index - 1; start > 0; start--) {
    if (this.text[start] && this.text[start].match(/\s/)) {
      break;
    }
  }
  return start === 0 ? 0 : start + 1;
};


/**
 * Returns the end index of the end of the word.
 * @param  {number} index Index that touches a word.
 * @return {number} End index of the word.
 */
Paragraph.prototype.getWordEnd_ = function(index) {
  var end;
  for (end = index; end < this.getLength(); end++) {
    if (this.text[end] && this.text[end].match(/\s/)) {
      break;
    }
  }
  return end === 0 ? 0 : end;
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
    placeholderText: this.placeholderText,
    paragraphType: this.paragraphType
  };

  if (this.formats && this.formats.length) {
    paragraph.formats = this.formats;
  }

  return paragraph;
};


/**
 * Renders a component in an element.
 * @param  {HTMLElement} element Element to render component in.
 * @param  {Object} options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 *   options.editMode - To render the paragraph in edit mode.
 * @override
 */
Paragraph.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);

    if (this.editMode) {
      this.dom.setAttribute('contenteditable', true);
      if (this.placeholderText) {
        this.dom.setAttribute('placeholder', this.placeholderText);
      } else if (!this.text.length) {
        // Content Editable won't be able to set the cursor for an empty element
        // so we use the zero-length character to workaround that.
        this.dom.innerHTML = '&#8203;';
      }
    } else if (!this.text.length) {
      this.dom.classList.add(Paragraph.EMPTY_PARAGRAPH_CLASS);
    }
  }
};


/**
 * Returns the operations to execute a deletion of the paragraph component.
 *   For partial deletion pass optFrom and optTo.
 * @param  {number=} optIndexOffset Optional offset to add to the index of the
 * component for insertion point for the undo.
 * @param {Object=} optCursorAfterOp Where to move cursor to after deletion.
 * @param {boolean=} optKeepEmptyContainer Whether to keep the empty container
 * or delete it.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
Paragraph.prototype.getDeleteOps = function(
    optIndexOffset, optCursorAfterOp, optKeepEmptyContainer) {
  // In case of a nested-component inside another. Let the parent
  // handle its deletion (e.g. figcaption inside a figure).
  if (!this.section) {
    return [];
  }
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorAfterOp
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

  // If this is the last element in the section/layout/list delete the container
  // as well.
  if (!optKeepEmptyContainer && this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }
  return ops;
};


/**
 * Returns the operations to execute inserting a paragarph.
 * @param {number} index Index to insert the paragarph at.
 * @param {Object} optCursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array.<Object>} Operations for inserting the paragraph.
 */
Paragraph.prototype.getInsertOps = function (index, optCursorBeforeOp) {
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
        placeholderText: this.placeholderText,
        paragraphType: this.paragraphType
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: optCursorBeforeOp
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
 * Returns operations needed to update a word at index to another.
 * @param  {string} newWord The new word to update to.
 * @param  {number} index Index of the word to update.
 * @return {Array.<Object>} Operations for updating a word.
 */
Paragraph.prototype.getUpdateWordOps = function(newWord, index) {
  var currentWord = this.getWordAt_(index);
  var wordStart = this.getWordStart_(index);
  var ops = [];
  if (currentWord) {
    Utils.arrays.extend(ops, this.getRemoveCharsOps(
        currentWord, wordStart));
  }
  Utils.arrays.extend(ops, this.getInsertCharsOps(
      newWord, wordStart));
  return ops;
};


/**
 * Returns the operations to execute updating a paragraph attributes.
 * @param  {Object} attrs Attributes to update for the paragraph.
 * @param  {number=} optCursorOffset Optional cursor offset.
 * @param  {number=} optSelectRange Optional selecting range.
 * @param  {string=} optValue Optional value to update the component with.
 * @param  {number=} optCursorOffsetBeforeOp Optional cursor offset before
 * operation execution (to correctly undo cursor offset).
 * @return {Array.<Object>} Operations for updating a paragraph attributes.
 */
Paragraph.prototype.getUpdateOps = function(
    attrs, optCursorOffset, optSelectRange, optValue, optCursorOffsetBeforeOp) {
  return [{
    do: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffset,
      selectRange: optSelectRange,
      formats: attrs.formats,
      value: optValue
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: optCursorOffsetBeforeOp,
      selectRange: optSelectRange,
      formats: attrs.formats,
      value: optValue ? this.text : undefined
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


/**
 * Returns the length of the paragraph content.
 * @return {number} Length of the paragraph content.
 */
Paragraph.prototype.getDomLength = function () {
  return this.dom.innerText.length;
};


/**
 * Test component check if text is blank
 * @return {boolean} if should/not trim.
 */
Paragraph.prototype.isBlank = function() {
  return !this.placeholderText && (
    !this.text ||
    !this.text.replace(/\s|&nbsp;|&#8203;/g, '').length
  );
};

},{"./component":2,"./loader":25,"./utils":33}],28:[function(require,module,exports){
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
 * Returns the class name of this component.
 * @return {string}
 */
Section.prototype.getComponentClassName = function() {
  return Section.CLASS_NAME;
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

  if (this.isRendered) {
    if (!nextComponent) {
      // If the last component in the section append it to the section.
      component.render(this.dom, {editMode: this.editMode});
    } else {
      // Otherwise insert it before the next component.
      component.render(this.dom, {
        insertBefore: nextComponent.dom,
        editMode: this.editMode
      });
    }
    // Set the cursor to the new component.
    Selection.getInstance().setCursor({
      component: component,
      offset: 0
    });
  }

  this.components.splice(index, 0, component);
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
  // In case of this is a nested component.
  // Get components between the parent component.
  var start = startComponent.parentComponent || startComponent;
  var end = endComponent.parentComponent || endComponent;
  if (start === end) {
    return [];
  }
  var next = start.getNextComponent();
  while (next && next !== end) {
    components.push(next);
    next = next.getNextComponent();
  }
  return components;
};


/**
 * Renders the section inside the element.
 */
Section.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    for (var i = 0; i < this.components.length; i++) {
      this.components[i].render(this.dom, {editMode: this.editMode});
    }
  } else {
    console.warn('Attempted to render an already rendered component.');
  }
};


/**
 * @override
 */
Section.prototype.rerender = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].shouldRerender()) {
      this.components[i].rerender();
    }
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    name: this.name,
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
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Section.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Gets the component with the passed name.
 * @param  {string} name Name of the component.
 * @return {Component}
 */
Section.prototype.getComponentByName = function(name) {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].name === name) {
      return this.components[i];
    }
  }
};

},{"./component":2,"./loader":25,"./selection":29,"./utils":33}],29:[function(require,module,exports){
'use strict';

var Utils = require('./utils');


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
        var startPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.start.component.dom, // Component node
            startNode); // Start node to calculate new offset from
        startOffset = this.start.offset - startPrevSiblingsOffset;
      }

      try {
        range.setStart(startNode, startOffset);
      } catch (e) {
        if (e.code === e.INDEX_SIZE_ERR) {
          range.setStart(startNode, startNode.length);
        }
      }

      endNode = this.end.component.dom;
      // Select the #text node instead of the parent element.
      if (this.end.offset > 0) {
        endNode = this.getTextNodeAtOffset_(
            this.end.component.dom, endOffset);
        var endPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.end.component.dom, // Component node
            endNode); // Start node to calculate new offset from
        endOffset = this.end.offset - endPrevSiblingsOffset;
      }
      try {
        range.setEnd(endNode, endOffset);
      } catch (e) {
        if (e.code === e.INDEX_SIZE_ERR) {
          range.setEnd(endNode, endNode.length);
        }
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

      // Didn't find any node at the offset - return at the offset - 1 until
      // offset is 0.
      if (offset > 0) {
        return this.getTextNodeAtOffset_(parent, offset - 1);
      } else {
        var textNode = document.createTextNode('');
        parent.appendChild(textNode);
        return textNode;
      }
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

      if ((startNode.getAttribute && startNode.getAttribute('carbon')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute('carbon') &&
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
      if ((startNode.getAttribute && startNode.getAttribute('carbon')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute('carbon') &&
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
        while (node &&
               (!node.getAttribute ||
                (!node.getAttribute('carbon') && node.parentNode))) {
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
        while (node &&
               (!node.getAttribute ||
                (!node.getAttribute('carbon') && node.parentNode))) {
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
      var startComponent = Utils.getReference(startNode.getAttribute('name'));
      var startOffset = this.calculateStartOffsetFromWindowSelection_(
          selection);
      if (startComponent.components) {
        startComponent = startComponent.getFirstComponent();
        if (startOffset === 0 && startComponent.getPreviousComponent()) {
          startComponent = startComponent.getPreviousComponent();
          startOffset = startComponent.getLength();
        }
      }
      var start = {
        component: startComponent,
        offset: startOffset
      };

      // Update the selection end point.
      var endNode = this.getEndComponentFromWindowSelection_(selection);
      var endComponent = Utils.getReference(endNode.getAttribute('name'));
      var endOffset = this.calculateEndOffsetFromWindowSelection_(selection);
      if (endComponent.components) {
        endComponent = endComponent.getFirstComponent();
        if (endOffset === 0 && endComponent.getPreviousComponent()) {
          endComponent = endComponent.getPreviousComponent();
          endOffset = endComponent.getLength();
        }
      }
      var end = {
        component: endComponent,
        offset: endOffset
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
      return (!(this.start.component.text) ||
              this.start.offset === this.start.component.getDomLength() &&
              this.end.offset === this.end.component.getDomLength());
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
      element.addEventListener('keydown',
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

},{"./utils":33}],30:[function(require,module,exports){
'use strict';

var Utils = require('../utils');


/**
 * Button component to add to toolbars.
 * @param {Object=} optParams Optional parameters.
 */
var Button = function (optParams) {
  var params = Utils.extend({
    label: 'New Button',
    icon: '',
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
  var icon = document.createElement('i');
  icon.className = params.icon;
  this.buttonDom.appendChild(icon);
  var span = document.createElement('span');
  Utils.setTextForElement(span, params.label);
  this.buttonDom.appendChild(span);
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

},{"../utils":33}],31:[function(require,module,exports){
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

},{"../utils":33}],32:[function(require,module,exports){
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
    name: Utils.getUID(),
    rtl: false
  }, optParams);

  /**
   * Toolbar name.
   * @type {string}
   */
  this.name = params.name;

  /**
   * If the toolbar is added to a right to left editor.
   * @type {boolean}
   */
  this.rtl = params.rtl;

  /**
   * CSS class names to add to the toolbar.
   * @type {Array.<string>}
   */
  this.classNames = params.classNames;
  this.classNames.push(Toolbar.TOOLBAR_CLASS_NAME);
  if (this.rtl) {
    this.classNames.push(Toolbar.RTL_CLASS_NAME);
  }

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
 * Toolbar css class name.
 * @type {string}
 */
Toolbar.TOOLBAR_CLASS_NAME = 'editor-toolbar';


/**
 * Classname added to RTL toolbars.
 */
Toolbar.RTL_CLASS_NAME = 'rtl';


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
 * Call to destroy instance and cleanup dom and event listeners.
 */
Toolbar.prototype.onDestroy = function() {
  document.body.removeChild(this.dom);
};


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
  var wSelection = window.getSelection();
  var oldRange = wSelection.getRangeAt(0);
  var bounds = element.getBoundingClientRect();
  var tempRange = document.createRange();
  // Set temporary selection at the element first text to allow the positioning
  // to include any floating that is happening to the element.
  try {
    var tempSelectionOn = element;
    if (element.childNodes && element.childNodes[0].length) {
      tempSelectionOn = element.childNodes[0];
    }
    tempRange.setStart(tempSelectionOn, 0);
    tempRange.setEnd(tempSelectionOn, 1);
    wSelection.removeAllRanges();
    wSelection.addRange(tempRange);
    var newBounds = tempRange.getBoundingClientRect();
    if (newBounds.left && newBounds.right) {
      bounds = newBounds;
    }
    wSelection.removeAllRanges();
    wSelection.addRange(oldRange);
  } catch (e) {
    // pass.
    console.warn(e);
  }


  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset;
  var start = bounds.left;
  if (this.rtl) {
    var toolbarBounds = this.dom.getBoundingClientRect();
    start = bounds.right - toolbarBounds.width;
  }

  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(start, 0) + 'px';
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
  this.dom.style.top = Math.max(top, 0) + 'px';
  this.dom.style.left = Math.max(start, 0) + 'px';
};


/**
 * Sets the toolbar position relative to middle top position of an element.
 * @param {HTMLElement} element Element to position the toolbar.
 */
Toolbar.prototype.setPositionToTopOf = function (element) {
  var bounds = element.getBoundingClientRect();
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
  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(left, 0) + 'px';
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
  this.dom.style.top = Math.max(top, 10) + 'px';
  this.dom.style.left = Math.max(left, 0) + 'px';
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

},{"../utils":33}],33:[function(require,module,exports){
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
 * Checks if the object is empty.
 * @param  {Object} obj
 * @return {boolean}
 */
Utils.isEmpty = function(obj) {
  if (obj === null || obj.length === 0) {
    return true;
  }

  if (obj.length > 0) {
    return false;
  }

  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false;
    }
  }

  return true;
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
  var length = optLength || 8;
  var chars = [];
  var sourceSet = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    chars.push(sourceSet.charAt(Math.floor(Math.random() * sourceSet.length)));
  }

  return chars.join('');
};


/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * Ref: http://stackoverflow.com/a/24004942/646979
 */
Utils.debounce = function(func, wait, immediate) {
  // The returned function will be able to reference this due to closure.
  // Each call to the returned function will share this common timer.
  var timeout;

  // Calling debounce returns a new anonymous function.
  return function() {
    // Reference the context and args for the setTimeout function.
    var context = this,
        args = arguments;

    // Should the function be called now? If immediate is true
    // and not already in a timeout then the answer is: Yes.
    var callNow = immediate && !timeout;

    // This is the basic debounce behaviour where you can call this
    // function several times, but it will only execute once
    // [before or after imposing a delay].
    // Each time the returned function is called, the timer starts over.
    clearTimeout(timeout);

    // Set the new timeout.
    timeout = setTimeout(function() {
      // Inside the timeout function, clear the timeout variable
      // which will let the next execution run when in 'immediate' mode.
      timeout = null;

      // Check if the function already ran with the immediate flag.
      if (!immediate) {
       // Call the original function with apply
       // apply lets you define the 'this' object as well as the arguments.
       // (both captured before setTimeout).
       func.apply(context, args);
      }
    }, wait);

    // Immediate mode and no wait timer? Execute the function.
    if (callNow) {
      func.apply(context, args);
    }
  };
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


/**
 * Returns true if the user is on a mobile device.
 * @return {boolean}
 */
Utils.isMobile = function () {
  return !!(/Mobi|iPhone|iPod|iPad|BlackBerry|Android/i.test(
                navigator.userAgent));
};


/**
 * Returns true if user is on firefox.
 * @return {boolean}
 */
Utils.isFirefox = function () {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};


/**
 * Returns the text property name of the element.
 * @param  {HTMLElement} element.
 * @return {string}
 */
Utils.getTextProperty = function (element) {
  var textProp;
  if (element.nodeType === Node.TEXT_NODE) {
    textProp = 'data';
  } else if (element.textContent !== undefined) {
    textProp = 'textContent';
  } else {
    textProp = 'innerText';
  }
  return textProp;
};


/**
 * Sets the text property for the element.
 * @param {HTMLElement} element.
 * @param {string} value Value to set.
 */
Utils.setTextForElement = function(element, value) {
  element[Utils.getTextProperty(element)] = value;
};


/**
 * Gets the text inside the element.
 * @param  {HTMLElement} element
 * @return {string}
 */
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
 * Makes a jsonp request by inserting a script tag to the document body
 * and cleans up after the callback has been called.
 * @param  {string} url The URL to request.
 * @param  {Function} callback Callback function after the url loads.
 */
Utils.jsonp = function(url, callback) {
  var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.body.removeChild(script);
    callback(data);
  };

  var script = document.createElement('script');
  if (url.indexOf('?') >= 0) {
    script.src = url + '&callback=' + callbackName;
  } else {
    script.src = url + '?callback=' + callbackName;
  }
  document.body.appendChild(script);
};


/**
 * Makes an XHR request to the URL.
 * @param  {string} url to make the request to.
 * @param {boolean=} optJsonpOnFail Whether to try to make a JSONP request after
 * the XHR request fails.
 * @param  {Function} callback Callback function.
 */
Utils.ajax = function(url, callback, optJsonpOnFail) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      if ( xhttp.status == 200 ) {
        var json = JSON.parse(xhttp.responseText);
        callback(json);
      } else if (optJsonpOnFail) {
        Utils.jsonp(url, callback);
      }
    }
  };
  xhttp.open('GET', url, true);
  xhttp.send();
};


/**
 * Listens to a message event.
 * @param {HTMLElement} iframe to listen to.
 * @param {string} type Message name to listen to.
 * @param {Function} callback.
 */
Utils.listen = function (iframe, type, callback) {
  window.addEventListener('message', function(event) {
    if (event.source != iframe.contentWindow) {
      return;
    }

    if (event.data.type != type) {
      return;
    }

    callback(event.data);
  }.bind(this));
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
 * Removes all event listeners for object.
 */
Utils.CustomEventTarget.prototype.clearEventListeners = function() {
  this._registrations = {};
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


/**
 * Adds Utils.addResizeListener and Utils.removeResizeListener to allow
 * listening to resizing dom elements.
 *
 * REF: http://goo.gl/VJHtSQ
 */
(function(){
  var attachEvent = document.attachEvent;
  var isIE = navigator.userAgent.match(/Trident/);

  var setTimeoutWrapper = function (fn) {
    return window.setTimeout(fn, 20);
  };

  var requestFrame = (function(){
    var raf = (
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        setTimeoutWrapper);
    return function (fn) {
      return raf(fn);
    };
  })();

  var cancelFrame = (function(){
    var cancel = (
        window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.clearTimeout);
    return function(id) {
      return cancel(id);
    };
  })();

  function resizeListener(e){
    var win = e.target || e.srcElement;
    if (win.__resizeRAF__) {
      cancelFrame(win.__resizeRAF__);
    }
    win.__resizeRAF__ = requestFrame(function(){
      var trigger = win.__resizeTrigger__;
      trigger.__resizeListeners__.forEach(function(fn){
        fn.call(trigger, e);
      });
    });
  }

  function objectLoad(event) {
    event.target.contentDocument.defaultView.__resizeTrigger__ =
        event.target.__resizeElement__;
    event.target.contentDocument.defaultView.addEventListener(
        'resize', resizeListener);
  }

  /**
   * Adds a resize listener to the element.
   * @param {Element} element Element to listen to.
   * @param {Function} fn Callback function.
   */
  Utils.addResizeListener = function(element, fn){
    if (!element.__resizeListeners__) {
      element.__resizeListeners__ = [];
      if (attachEvent) {
        element.__resizeTrigger__ = element;
        element.attachEvent('onresize', resizeListener);
      }
      else {
        if (getComputedStyle(element).position == 'static') {
          element.style.position = 'relative';
        }
        var obj = element.__resizeTrigger__ = document.createElement('object');
        obj.setAttribute(
            'style',
            'display: block; position: absolute; top: 0;' +
            'left: 0; height: 100%; width: 100%; overflow: hidden;' +
            'pointer-events: none; z-index: -1;');
        obj.__resizeElement__ = element;
        obj.onload = objectLoad;
        obj.type = 'text/html';
        if (isIE) {
          element.appendChild(obj);
        }
        obj.data = 'about:blank';
        if (!isIE) {
          element.appendChild(obj);
        }
      }
    }
    element.__resizeListeners__.push(fn);
  };

  /**
   * Removes resize listener from element.
   * @param  {Element} element Element to remove resize event from.
   * @param  {Function} fn Callback function.
   */
  Utils.removeResizeListener = function(element, fn){
    element.__resizeListeners__.splice(
        element.__resizeListeners__.indexOf(fn), 1);

    if (!element.__resizeListeners__.length) {
      if (attachEvent){
        element.detachEvent('onresize', resizeListener);
      } else {
        var contentDocument = element.__resizeTrigger__.contentDocument;
        contentDocument.defaultView.removeEventListener(
            'resize', resizeListener);
        element.__resizeTrigger__ = !element.removeChild(
            element.__resizeTrigger__);
      }
    }
  };

})();

},{}]},{},[26])(26)
});