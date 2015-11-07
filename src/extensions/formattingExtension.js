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
