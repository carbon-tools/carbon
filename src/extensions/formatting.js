'use strict';

var Paragraph = require('../paragraph');
var Selection = require('../selection');
var Utils = require('../utils');


// TODO: Refactor this to make toolbar its own module and separate
// the logic of formatting from the UI components.
// Also encompass toolbar into an object with a .dom property on it
// to access its HTMLElement.

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
 * Used to position the toolbars outside the user view.
 * @type {number}
 */
Formatting.EDGE = -999999;


/**
 * Actions allowed on the toolbars.
 * @type {Object}
 */
Formatting.Actions = {

  // Block formatting.
  // TODO: Implement Ordered and Unordered lists.
  Block: [{
    label: 'h1',
    value: Paragraph.Types.MainHeader
  }, {
    label: 'h2',
    value: Paragraph.Types.SecondaryHeader
  }, {
    label: 'h3',
    value: Paragraph.Types.ThirdHeader
  }, {
    label: '”',
    value: Paragraph.Types.Quote
  }, {
    label: '{}',
    value: Paragraph.Types.Code
  }],

  // TODO: Implement inline formatting. This is just placeholder
  // to show the toolbar. The formatting functionality is still not
  // implemeneted.
  Inline: [{
    label: 'B',
    value: 'strong'
  }, {
    label: 'I',
    value: 'em'
  }, {
    label: 'U',
    value: 'u'
  }, {
    label: 'S',
    value: 's'
  }, {
    label: 'a',
    value: 'a'
  }]
};


/**
 * Initializes the formatting extension.
 * @param  {Editor} editor The parent editor for the extension.
 */
Formatting.prototype.init = function(editor) {
  this.editor = editor;

  // Inline toolbar used for formatting inline elements (bold, italic...).
  this.inlineToolbar = this.createInlineToolbar();
  document.body.appendChild(this.inlineToolbar);

  // Block toolbar used for formatting block elements (h1, h2, pre...).
  this.blockToolbar = this.createBlockToolbar();
  document.body.appendChild(this.blockToolbar);

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
Formatting.prototype.createInlineToolbar = function() {
  var toolbar = document.createElement('div');
  toolbar.id = 'editor-inline-toolbar-' + this.editor.name;
  toolbar.className = 'editor-toolbar editor-inline-toolbar';

  toolbar.appendChild(this.createToolbarButtons(
      Formatting.Actions.Inline, Formatting.Types.INLINE));
  return toolbar;
};


/**
 * Creates block formatting toolbar.
 * @return {HTMLElement} Toolbar Element.
 */
Formatting.prototype.createBlockToolbar = function() {
  var toolbar = document.createElement('div');
  toolbar.id = 'editor-block-toolbar-' + this.editor.name;
  toolbar.className = 'editor-toolbar editor-block-toolbar';

  toolbar.appendChild(this.createToolbarButtons(
      Formatting.Actions.Block, Formatting.Types.BLOCK));
  return toolbar;
};


/**
 * Creates toolbar buttons from passed actions.
 * @param  {Array.<Object>} actions Actions to create buttons for.
 * @param  {string} type Can be 'block' or 'inline'.
 * @return {HTMLElement} Element that holds the list of created buttons.
 */
Formatting.prototype.createToolbarButtons = function(actions, type) {
  var ul = document.createElement('ul');
  ul.className = 'editor-toolbar-buttons';

  for (var i = 0; i < actions.length; i++) {
    ul.appendChild(this.createButton(actions[i], type));
  }
  return ul;
};


/**
 * Creates a single action button.
 * @param  {Object} action Action to create the button for.
 * @param  {string} type Can be 'block' or 'inline'.
 * @return {HTMLElement} Button element.
 */
Formatting.prototype.createButton = function(action, type) {
  var button = document.createElement('button');
  button.innerHTML = action.label;
  button.value = action.value;
  button.type = type;

  // Add Event Listener to take action when clicking the button.
  button.addEventListener('click', this.handleButtonClicked.bind(this));
  return button;
};


/**
 * Handles clicking a formatting bar action button.
 * @param  {Event} event Click event.
 */
Formatting.prototype.handleButtonClicked = function(event) {
  if (event.target.getAttribute('type') == Formatting.Types.BLOCK) {
    this.handleBlockFormatting(event);
    this.reloadBlockToolbarStatus();
  } else {
    this.handleInlineFormatting(event);
    this.reloadInlineToolbarStatus();
  }
};


/**
 * Handles changing in selection or cursor.
 */
Formatting.prototype.handleSelectionChangedEvent = function() {
  var wSelection = window.getSelection();

  if (wSelection.isCollapsed) {
    // If there's no selection, show the block toolbar.
    this.repositionBlockToolbar();
  } else {
    // Otherwise, show the inline toolbar.
    this.repositionInlineToolbar();
  }
};


/**
 * Reposition inline formatting toolbar and hides block toolbar.
 */
Formatting.prototype.repositionInlineToolbar = function() {
  var wSelection = window.getSelection();
  var range = wSelection.getRangeAt(0);
  var bounds = range.getBoundingClientRect();

  // Hide the block formatting toolbar.
  this.setToolbarPosition(
      this.blockToolbar, Formatting.EDGE, Formatting.EDGE);

  // Calculate the left edge of the inline toolbar.
  var toolbarWidth = this.inlineToolbar.getClientRects()[0].width;
  var left = ((bounds.left + bounds.right) / 2) - toolbarWidth / 2;

  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset;

  this.setToolbarPosition(this.inlineToolbar, top, left);
  this.reloadInlineToolbarStatus();
};


/**
 * Reposition block formatting toolbar and hides inline toolbar.
 */
Formatting.prototype.repositionBlockToolbar = function() {
  var selection = this.editor.article.selection;
  var paragraph = selection.getParagraphAtStart();
  var bounds = paragraph.dom.getBoundingClientRect();

  // Hide inline formatting toolbar.
  this.setToolbarPosition(
      this.inlineToolbar, Formatting.EDGE, Formatting.EDGE);

  // Offset the top bound with the scrolled amount of the page.
  var top = bounds.top + window.pageYOffset;

  this.setToolbarPosition(this.blockToolbar, top, bounds.left);

  // Update the active buttons on block toolbar.
  this.reloadBlockToolbarStatus(this.blockToolbar);
};


Formatting.prototype.reloadBlockToolbarStatus = function() {
  var selection = this.editor.article.selection;
  var paragraph = selection.getParagraphAtStart();
  var activeAction = paragraph.paragraphType;
  this.setToolbarActiveAction(this.blockToolbar, activeAction);
};


/**
 * Reloads the status of the inline toolbar and selects the active action.
 */
Formatting.prototype.reloadInlineToolbarStatus = function() {
  var selection = this.editor.article.selection;
  var paragraph = selection.getParagraphAtStart();
  var activeAction = paragraph.getSelectedFormatter(selection);
  activeAction = activeAction ? activeAction.type : null;
  this.setToolbarActiveAction(this.inlineToolbar, activeAction);
};


/**
 * Reloads the status of the block toolbar buttons.
 * @param {HTMLElement} toolbar Toolbar to reload its status.
 */
Formatting.prototype.setToolbarActiveAction = function(toolbar, active) {
  // Reset the old activated button to deactivate it.
  var oldActive = toolbar.querySelector('button.active');
  if (oldActive) {
    oldActive.className = '';
  }

  if (active) {
    // Activate the current paragraph block formatted button.
    var activeButton = toolbar.querySelector(
        '[value=' + active + ']');
    if (activeButton) {
      activeButton.className = Formatting.ACTIVE_ACTION_CLASS;
    }
  }
};


/**
 * Positions a toolbar to a specific location.
 * @param {HTMLElement} toolbar The toolbar to position.
 * @param {number} top Top offset of the toolbar.
 * @param {number} left Left offset of the toolbar.
 */
Formatting.prototype.setToolbarPosition = function(toolbar, top, left) {
  toolbar.style.top = top + 'px';
  toolbar.style.left = left + 'px';
};


/**
 * Creates the actual operations needed to execute block formatting.
 * @param  {Event} event Click event.
 */
Formatting.prototype.handleBlockFormatting = function(event) {
  var clickedParagraphType = event.target.getAttribute('value');
  var selection = this.editor.article.selection;
  var paragraphs = selection.getSelectedParagraphs();
  var ops = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var toType = clickedParagraphType;
    if (paragraphs[i].paragraphType === clickedParagraphType) {
      toType = Paragraph.Types.Paragraph;
    }

    // Step 0: updateParagraph to remove content the old one.
    var index = paragraphs[i].section.paragraphs.indexOf(paragraphs[i]) + i;
    ops.push({
      do: {
        op: 'updateParagraph',
        paragraph: paragraphs[i].name,
        value: '',
        cursorOffset: 0
      },
      undo: {
        op: 'updateParagraph',
        paragraph: paragraphs[i].name,
        value: paragraphs[i].text,
        cursorOffset: selection.end.offset
      }
    });

    // Step 1: deleteParagraph to remove current Paragraph.
    ops.push({
      do: {
        op: 'deleteParagraph',
        paragraph: paragraphs[i].name
      },
      undo: {
        op: 'insertParagraph',
        section: paragraphs[i].section.name,
        index: index,
        paragraph: paragraphs[i].name,
        paragraphType: paragraphs[i].paragraphType
      }
    });

    // Step 2: insertParagraph to Insert a new Paragraph in its place with the
    // new paragraph type. Make sure to keep the name of the paragraph.
    ops.push({
      do: {
        op: 'insertParagraph',
        section: paragraphs[i].section.name,
        paragraph: paragraphs[i].name,
        index: index,
        paragraphType: toType
      },
      undo: {
        op: 'deleteParagraph',
        paragraph: paragraphs[i].name,
      }
    });

    // Step 3: updateParagraph to update with the content of the old one.
    ops.push({
      do: {
        op: 'updateParagraph',
        paragraph: paragraphs[i].name,
        value: paragraphs[i].text,
        cursorOffset: selection.end.offset
      },
      undo: {
        op: 'updateParagraph',
        paragraph: paragraphs[i].name,
        value: '',
        cursorOffset: 0
      }
    });
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
  var defaultDo = {
    op: 'updateParagraph',
    paragraph: paragraph.name,
    cursorOffset: selection.start.offset,
    selectRange: selection.end.offset - selection.start.offset,
    formats: []
  };

  // See the range already formatted in a similar type.
  var existingFormats = paragraph.getFormattedRanges(format, true);
  if (existingFormats && existingFormats.length) {

    for (var i = 0; i < existingFormats.length; i++) {
      var existingFormat = existingFormats[i];
      // If the format is re-applied to the same range remove the format.
      if (format.to === existingFormat.to &&
          format.from === existingFormat.from) {

        newDo = Utils.clone(defaultDo);
        newDo.formats.push(existingFormat);

        newOp = {
          do: newDo,
          undo: newDo
        };
        ops.push(newOp);

      } else if (format.to === existingFormat.to) {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(format);

        newOp = {
          do: newDo,
          undo: newDo
        };
        ops.push(newOp);
      } else if (format.from === existingFormat.from) {
        newDo = Utils.clone(defaultDo);
        newDo.formats.push(format);

        newOp = {
          do: newDo,
          undo: newDo
        };
        ops.push(newOp);
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
          to: format.from
        });
        newDo.formats.push({
          type: existingFormat.type,
          from: format.to,
          to: existingFormat.to
        });

        newUndo = Utils.clone(newDo);
        newUndo.formats.reverse();

        newOp = {
          do: newDo,
          undo: newUndo
        };
        ops.push(newOp);

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

        newOp = {
          do: newDo,
          undo: newUndo
        };
        ops.push(newOp);
      }
    }
  } else {
    var formattedRanges = paragraph.getFormattedRanges(format, false);

    // Clear all formats touching the range and apply the new format.
    var unformatRanges = Utils.clone(formattedRanges);
    for (var j = 0; j < unformatRanges.length; j++) {
      if (unformatRanges[j].from < format.from &&
          unformatRanges[j].to > format.from) {
        unformatRanges[j].from = format.from;
      }

      if (unformatRanges[j].to > format.to &&
          unformatRanges[j].from < format.to) {
        unformatRanges[j].to = format.to;
      }
    }
    newDo = Utils.clone(defaultDo);
    Array.prototype.push.apply(newDo.formats, unformatRanges);
    // Apply the requested format.
    newDo.formats.push(format);

    newUndo = Utils.clone(newDo);
    newUndo.formats.reverse();

    newOp = {
      do: newDo,
      undo: newUndo
    };
    ops.push(newOp);
  }

  return ops;
};


/**
 * Creates the actual operations needed to execute inline formatting.
 * @param  {Event} event Click event.
 */
Formatting.prototype.handleInlineFormatting = function(event) {

  // TODO(mkhatib): Highlight the appropriate formatter button when something
  // formatted selected.

  var clickedFormatter = event.target.getAttribute('value');
  var selection = this.editor.article.selection;
  var currentParagraph = selection.getParagraphAtStart();
  var format = {
    type: clickedFormatter,
    from: selection.start.offset,
    to: selection.end.offset
  };

  var ops = this.format(currentParagraph, selection, format);
  this.editor.article.transaction(ops);

  // Tell listeners that there was a change in the editor.
  this.editor.dispatchEvent(new Event('change'));

  event.preventDefault();
  event.stopPropagation();
};
