'use strict';

var Utils = require('../../../../utils');
var Component = require('../../../../component');
var Paragraph = require('../../../../paragraph');
var Loader = require('../../../../loader');
var loadScript = require('../../../../utils/scripts').loadScript;


/**
 * Component wrapping Monaco Editor.
 * @param {*} opt_params
 */
var MonacoEditor = function(opt_params) {
  var params = /** @type {MonacoEditorParamsDef} */ (Utils.extend({
    value: 'function hello() {\n\talert(\'Hello world!\');\n}',
    language: 'javascript',
    scriptPath: MonacoEditor.scriptPath,
  }, opt_params));

  Component.call(this, params);

  /**
   * Programming language to render the editor in.
   * @type {string}
   */
  this.language = params.language;

  /**
   * The editor code string value.
   * @type {string}
   */
  this.value = params.value;

  /**
   * The path to load the monaco scripts from.
   * @type {string}
   */
  this.scriptPath = MonacoEditor.FORCE_SCRIPT_PATH || params.scriptPath;

  /**
   * An instance of the Monaco editor.
   */
  this.codeEditor_ = null;

  /**
   * @type {HTMLElement}
   */
  this.dom = document.createElement('div');
  this.dom.classList.add('carbon-code');
  this.dom.classList.add('carbon-monaco-editor');
  this.dom.setAttribute('name', this.name);
  this.dom.setAttribute('contenteditable', false);


  /**
   * Wrapper to contain everything.
   * @type {?HTMLElement}
   */
  this.containerDom = null;

  /**
   * Overlay to allow selecting the component.
   * @type {?HTMLElement}
   */
  this.overlayDom = null;

  /**
   * The code editor dom.
   * @type {?HTMLElement}
   */
  this.embedDom = null;

  /**
   * The placeholder pre code before the editor code has been loaded.
   * @type {?HTMLElement}
   */
  this.preDom = null;

  // TODO(mk): Once we have better mobile responsiveness for these
  // enable drag-drop for layouting next each other.
  // this.dom.setAttribute('draggable', true);
  // this.responsive = true;
  // this.isDropTarget = true;
};
MonacoEditor.prototype = Object.create(Component.prototype);
module.exports = MonacoEditor;



/**
 * String name for the component class.
 * @type {string}
 */
MonacoEditor.CLASS_NAME = 'MonacoEditor';
Loader.register(MonacoEditor.CLASS_NAME, MonacoEditor);


/**
 * MonacoEditor component element tag name.
 * @type {string}
 */
MonacoEditor.TAG_NAME = 'div';


/**
 * MonacoEditor element tag name.
 * @type {string}
 */
MonacoEditor.COMPONENT_CLASS_NAME = 'monaco-editor';


/**
 * MonacoEditor component inner container element tag name.
 * @type {string}
 */
MonacoEditor.CONTAINER_TAG_NAME = 'div';


/**
 * MonacoEditor component inner container element class name.
 * @type {string}
 */
MonacoEditor.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
MonacoEditor.OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
MonacoEditor.EMBED_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
MonacoEditor.OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * Languages supported by Monaco Editor.
 * @type {Array<string>}
 */
MonacoEditor.LANGUAGES = [
  'bat',
  'c',
  'coffeescript',
  'cpp',
  'csharp',
  'css',
  'dockerfile',
  'fsharp',
  'go',
  'handlebars',
  'html',
  'ini',
  'jade',
  'java',
  'javascript',
  'json',
  'less',
  'lua',
  'markdown',
  'objective-c',
  'php',
  'plaintext',
  'postiats',
  'powershell',
  'python',
  'r',
  'razor',
  'ruby',
  'scss',
  'sql',
  'swift',
  'typescript',
  'vb',
  'xml',
  'yaml',
];


/**
 * Default script path to use to load monaco editor from.
 * @type {string}
 */
MonacoEditor.SCRIPT_PATH = 'monaco-editor/min/vs';


/**
 * Forcing a specific path to load the monaco editor from.
 * @type {?string}
 */
MonacoEditor.FORCE_SCRIPT_PATH = null;


/**
 * Set a specific script path to load the scripts from.
 * @export
 */
MonacoEditor.setScriptPath = function(path, opt_force) {
  MonacoEditor.SCRIPT_PATH = path;

  if (opt_force) {
    MonacoEditor.FORCE_SCRIPT_PATH = path;
  }
};


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
MonacoEditor.prototype.getComponentClassName = function() {
  return MonacoEditor.CLASS_NAME;
};


/**
 * Create and initiate an embedded component from JSON.
 * @param  {MonacoEditorParamsDef} json JSON representation of the embedded component.
 * @return {MonacoEditor} MonacoEditor object representing JSON data.
 */
MonacoEditor.fromJSON = function(json) {
  return new MonacoEditor(json);
};


/**
 * Cache loaded modules.
 * @private
 */
MonacoEditor.__objects__ = {
  loaderListeners_: [],
  loader: null,
  modules: {},
};


/**
 * Load Monaco Loader if not already loaded.
 * @param {Function} callback Callback to call when the module is loaded.
 * @private
 */
MonacoEditor.prototype.maybeLoadLoader_ = function(callback) {
  if (!MonacoEditor.__objects__.loader) {
    if (MonacoEditor.__objects__.loaderListeners_.length < 1) {
      loadScript(this.scriptPath + '/loader.js', function() {
        MonacoEditor.__objects__.loader = window.require;
        window.require.config({
          paths: {'vs': this.scriptPath},
        });

        // This is needed if the vs script is loaded from cross domain.
        // window.MonacoEnvironment = {
        //   getWorkerUrl: function(unusedWorkerId, unusedLabel) {
        //     return 'monaco-editor-worker-loader-proxy.js';
        //   },
        // };
        var listeners = MonacoEditor.__objects__.loaderListeners_;
        for (var i = 0; i < listeners.length; i++) {
          listeners[i]();
        }
      }.bind(this));
    }
    MonacoEditor.__objects__.loaderListeners_.push(callback);
  } else {
    callback();
  }
};


/**
 * Loads modules from monaco.
 *
 * (I apologize for the following code... I feel terrible...)
 *
 * @param {Array<string>} modules Array of module paths.
 * @param {Function} callback Function to call when modules are loaded.
 */
MonacoEditor.prototype.maybeLoadModules_ = function(modules, callback) {
  var i, j, w;
  var GMODULES = MonacoEditor.__objects__.modules;
  var shouldLoadModules = [];
  var shouldListenToModules = [];
  for (i = 0; i < modules.length; i++) {
    var cachedModule = GMODULES[modules[i]];
    if (!cachedModule) {
      shouldLoadModules.push(modules[i]);
      GMODULES[modules[i]] = {
        listeners: [],
        loaded: false,
      };
    } else if (!cachedModule.loaded) {
      shouldListenToModules.push(modules[i]);
    }
  }

  if (shouldLoadModules.length > 0) {
    MonacoEditor.__objects__.loader(shouldLoadModules, function() {
      for (i = 0; i < shouldLoadModules.length; i++) {
        GMODULES[shouldLoadModules[i]].loaded = true;
      }

      for (i = 0; i < shouldLoadModules.length; i++) {
        var loadedModuleData = GMODULES[shouldLoadModules[i]];
        var listeners = loadedModuleData.listeners;
        for (j = 0; j < listeners.length; j++) {
          if (listeners[j].called) {
            continue;
          }
          var listeningTo = listeners[j].modules;
          var readyToBeCalled = true;
          for (w = 0; w < listeningTo.length; w++) {
            if (!GMODULES[listeningTo[w]].loaded) {
              readyToBeCalled = false;
            }
          }
          if (readyToBeCalled) {
            listeners[j].callback();
            listeners[j].called = true;
          }
        }
      }

    });
    for (i = 0; i < shouldLoadModules.length; i++) {
      GMODULES[shouldLoadModules[i]].listeners.push({
        callback: callback,
        modules: modules,
        called: false,
      });
    }
  }

  if (shouldListenToModules.length > 0) {
    for (i = 0; i < shouldListenToModules.length; i++) {
      var data = GMODULES[shouldListenToModules[i]];
      data.listeners.push({
        callback: callback,
        modules: shouldListenToModules,
        called: false,
      });
    }
  }

  if (shouldListenToModules.length < 1 && shouldLoadModules.length < 1) {
    callback();
  }
};


/**
 * Renders the editor.
 * @param {HTMLElement} element
 * @param {*} options
 */
MonacoEditor.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    this.containerDom = document.createElement(MonacoEditor.CONTAINER_TAG_NAME);
    this.containerDom.className = MonacoEditor.CONTAINER_CLASS_NAME;

    this.embedDom = document.createElement(MonacoEditor.EMBED_TAG_NAME);
    this.embedDom.classList.add('embed-container');
    this.containerDom.appendChild(this.embedDom);

    this.preDom = document.createElement('pre');
    this.preDom.classList.add('carbon-code-read');
    this.preDom.setAttribute('data-lang', this.language);
    this.preDom.innerHTML = this.value;
    this.embedDom.appendChild(this.preDom);

    if (this.editMode) {
      this.overlayDom = document.createElement(MonacoEditor.OVERLAY_TAG_NAME);
      this.overlayDom.className = MonacoEditor.OVERLAY_CLASS_NAME;
      this.containerDom.appendChild(this.overlayDom);
      this.overlayDom.addEventListener('click', this.handleClick.bind(this));

      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener(
          'focus', this.handleClick.bind(this));
      this.containerDom.appendChild(this.selectionDom);
    }
    this.dom.appendChild(this.containerDom);
    this.dom.style.height = (this.preDom.offsetHeight + 30) + 'px';
    this.preDom.style.position = 'absolute';

    this.maybeLoadLoader_(function() {
      this.maybeLoadModules_(['vs/editor/editor.main'], function() {
        this.embedEditor_();
      }.bind(this));
    }.bind(this));
  }
};


/**
 * Create the instance of the Monacho editor.
 * @private
 */
MonacoEditor.prototype.embedEditor_ = function() {
  var monaco = window.monaco;
  this.codeEditor_ = monaco.editor.create(this.embedDom, {
    value: this.value,
    language: this.language,
    // lineNumbers: false,
    // roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: !this.editMode,
    contextmenu: !this.editMode,
    theme: 'vs-dark',
    automaticLayout: true,
    autoSize: true,
  });

  this.dom.style.height = (this.codeEditor_.getScrollHeight() + 30) + 'px';

  if (!this.editMode) {
    return;
  }

  this.initConfigUI_();
  var that = this;
  this.codeEditor_.onDidChangeModelContent(function() {
    that.value = that.codeEditor_.getModel().getValue();
    that.article.editor.dispatchEvent(new Event('change'));
  });

  var lastLine = this.codeEditor_.createContextKey('lastLine', false);
  var firstLine = this.codeEditor_.createContextKey('firstLine', false);
  this.codeEditor_.onDidChangeCursorPosition(function(e) {
    var pos = e.position;
    var totalLines = that.codeEditor_.getModel().getLineCount();
    lastLine.set(pos.lineNumber >= totalLines);
    firstLine.set(pos.lineNumber <= 1);
    that.dom.style.height = that.codeEditor_.getScrollHeight() + 'px';
  });

  this.codeEditor_.addCommand(monaco.KeyCode.DownArrow, function() {
    var nextComponent = that.selection.getComponentAtStart()
      .getNextComponent();
    nextComponent.select();
  }, 'lastLine');

  this.codeEditor_.addCommand(monaco.KeyCode.UpArrow, function() {
    var prevComponent = that.selection.getComponentAtStart()
      .getPreviousComponent();
    prevComponent.select();
  }, 'firstLine');


  this.codeEditor_.addAction({
    // An unique identifier of the contributed action.
    id: 'ctrl-enter-to-exit',
    // A label of the action that will be presented to the user.
    label: 'Exit Code Editor',
    // An optional array of keybindings for the action.
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    // Method that will be executed when the action is triggered.
    // @param editor The editor instance is passed in as a convinience
    run: function(unusedEditor) {
      console.log('User action Cmd/Ctrl + Enter');
      var newP = new Paragraph({
        section: that.selection.getSectionAtStart(),
      });
      var index = that.selection.getComponentAtStart()
        .getIndexInSection();
      that.article.transaction(newP.getInsertOps(index + 1));
      return null;
    },
  });
};


/**
 * Creates and initiates editor config UI like language selector.
 * @private
 */
MonacoEditor.prototype.initConfigUI_ = function() {
  this.editorConfigUI_ = document.createElement('div');
  this.editorConfigUI_.classList.add('component-config-controls');
  this.languageSelect_ = document.createElement('select');
  for (var i = 0; i < MonacoEditor.LANGUAGES.length; i++) {
    var option = document.createElement('option');
    option.value = MonacoEditor.LANGUAGES[i];
    option.innerText = MonacoEditor.LANGUAGES[i];
    if (this.language === MonacoEditor.LANGUAGES[i]) {
      option.selected = true;
    }
    this.languageSelect_.appendChild(option);
  }
  this.editorConfigUI_.appendChild(this.languageSelect_);
  this.dom.appendChild(this.editorConfigUI_);
  this.languageSelect_.addEventListener('change', function() {
    this.language = this.languageSelect_.value;
    window.monaco.editor.setModelLanguage(
        this.codeEditor_.getModel(), this.language);
    this.article.editor.dispatchEvent(new Event('change'));
  }.bind(this));
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this MonacoEditor.
 */
MonacoEditor.prototype.getJSONModel = function() {
  var editor = {
    component: this.getComponentClassName(),
    name: this.name,
    value: this.value,
    language: this.language,
    scriptPath: this.scriptPath,
  };

  return editor;
};



/**
 * Handles clicking on the embedded component to update the selection.
 */
MonacoEditor.prototype.handleClick = function() {
  // var isSelected = this === this.selection.getComponentAtStart();
  this.select();
  if (this.codeEditor_) {
    this.codeEditor_.focus();
  }
  return false;
};


/**
 * Returns the operations to execute a deletion of the editor component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<../../defs.OperationDef>} List of operations needed to be executed.
 */
MonacoEditor.prototype.getDeleteOps = function(
    opt_indexOffset, opt_cursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        value: this.value,
        language: this.language,
      },
    },
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
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<../../defs.OperationDef>} Operations for inserting the embedded component.
 */
MonacoEditor.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        value: this.value,
        language: this.language,
      },
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorBeforeOp,
    },
  }];
};


/**
 * @override
 */
MonacoEditor.prototype.getLength = function() {
  return 1;
};


/**
 * @override
 */
MonacoEditor.prototype.canBeLaidOut = function() {
  return true;
};

/**
 * @override
 */
MonacoEditor.prototype.hasOwnSelection = function() {
  return true;
};
