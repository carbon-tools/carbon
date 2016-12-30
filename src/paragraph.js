'use strict';

var Utils = require('./utils');
var Component = require('./component');
var Loader = require('./loader');


/**
 * @typedef {{
 *    text: (string|undefined),
 *    placeholderText: (string|undefined),
 *    paragraphType: (string|undefined),
 *    formats: (?Array<./defs.InlineFormattingDef>|undefined),
 *    name: (string|undefined),
 *    parentComponent: (./component|undefined),
 *    inline: (boolean|undefined),
 *    section: (?./section|undefined),
 * }}
 */
var ParagraphParamsDef;


/**
 * Paragraph main.
 * @param {ParagraphParamsDef=} opt_params Optional params to initialize the Paragraph object.
 * Default:
 *   {
 *     text: '',
 *     placeholderText: null,
 *     paragraphType: Paragraph.Types.Paragraph,
 *     formats: [],
 *     name: Utils.getUID()
 *   }
 * @extends {./component}
 * @constructor
 */
var Paragraph = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {ParagraphParamsDef} */ (Utils.extend({
    // Text rendered in this paragraph.
    text: '',
    // If you want to show a placeholder if there was no text.
    placeholderText: null,
    // Paragraph Type one of Paragraph.Types string.
    paragraphType: Paragraph.Types.Paragraph,
    // List of inline formats for the paragraph.
    formats: [],
  }, opt_params));

  Component.call(this, params);

  /**
   * Internal model text in this paragraph.
   * @type {string}
   */
  this.text = params.text || '';

  /**
   * Placeholder text to show if the paragraph is empty.
   * @type {string}
   */
  this.placeholderText = params.placeholderText || '';

  /**
   * Inline formats for the paragraph.
   * @type {Array<./defs.InlineFormattingDef>}
   */
  this.formats = params.formats || [];

  /**
   * Paragraph type.
   * @type {string}
   */
  this.paragraphType = params.paragraphType || Paragraph.Types.Paragraph;


  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(this.paragraphType);
  this.dom.setAttribute('name', this.name);

  this.setText(this.text);

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
 * @enum {string}
 */
Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Quote: 'blockquote',
  Code: 'pre',
  Caption: 'figcaption',
  ListItem: 'li',
};


/**
 * Create and initiate a paragraph object from JSON.
 * @param  {ParagraphParamsDef} json JSON representation of the paragraph.
 * @return {Paragraph} Paragraph object representing the JSON data.
 */
Paragraph.fromJSON = function(json) {
  return new Paragraph(json);
};


/**
 * Called when the module is installed on in an editor.
 * @param  {./editor} unusedEditor Editor instance which installed the module.
 */
Paragraph.onInstall = function(unusedEditor) {
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
    Paragraph.Types.ThirdHeader,
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
      this.text = this.text.replace('\u200B', '')
          .replace(/^\s/, '\xa0');
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
  return '';
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
  var texts = [
    this.text.substring(0, index),
    this.text.substring(index + count),
  ];
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
Paragraph.prototype.updateInnerDom_ = function() {
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
    var type = /** @type {string} */ (this.formats[i].type);
    var formatEl = document.createElement(type);
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
 * @param  {Array<./defs.InlineFormattingDef>} formats A list of format objects to apply.
 */
Paragraph.prototype.applyFormats = function(formats) {
  for (var i = 0; i < formats.length; i++) {
    this.format(formats[i]);
  }
};


/**
 * Returns the currently selected formatter in the range.
 * @param {./selection} selection Selection to get formatter at.
 * @return {./defs.InlineFormattingDef|null} Currently selected formatter.
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
 * @param {./defs.InlineFormattingDef} format A format objects to apply.
 * @param {boolean=} opt_clear Whether to force clear format.
 */
Paragraph.prototype.format = function(format, opt_clear) {
  // See the range already formatted in a similar type.
  format = /** @type {./defs.InlineFormattingDef} */ (Utils.clone(format));
  var originalExistingFormats = this.getFormattedRanges(format, !opt_clear);
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
          format.from < existingFormat.to && opt_clear)) {
        existingFormat.to = format.from;
        this.formats[index] = existingFormat;
      } else if (format.from === existingFormat.from || (
          format.from < existingFormat.from &&
          format.to > existingFormat.from && opt_clear)) {
        existingFormat.from = format.to;
        this.formats[index] = existingFormat;
      }
      // If the selected range is already formatted and is in the middle split
      // the old format to unformat the selected range.
      else if (format.to < existingFormat.to &&
               format.from > existingFormat.from) {

        this.formats.splice(index, 1);

        this.addNewFormatting({
          type: existingFormat.type,
          from: existingFormat.from,
          to: format.from,
        });

        this.addNewFormatting({
          type: existingFormat.type, from: format.to, to: existingFormat.to});
      } else {
        if (!opt_clear) {
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
      if (!opt_clear) {
        this.format(format, true);
        this.format(format);
      }
    }
  }

  if (!opt_clear) {
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
 * @return {Array<./defs.InlineFormattingDef>} List of formats representing that range formats.
 */
Paragraph.prototype.getFormatsForRange = function(from, to) {
  var finalFormats = [];
  var rangeFormats = this.getFormattedRanges({
    from: from,
    to: to,
    type: null,
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
 * @param  {./defs.InlineFormattingDef} format The format to check in its range.
 * @param  {boolean=} matchType Whether to check for type match.
 * @return {Array<./defs.InlineFormattingDef>} List of formats that overlap the format.
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
  return matchingFormats;
};


/**
 * Adds and sorts the formatting to be in the correct order.
 * @param {./defs.InlineFormattingDef} format The new formatter to add.
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
 * @return {./defs.ParagraphJsonDef} JSON representation of this paragraph.
 */
Paragraph.prototype.getJSONModel = function() {
  var paragraph = {
    component: Paragraph.CLASS_NAME,
    name: this.name,
    text: this.text,
    placeholderText: this.placeholderText,
    paragraphType: this.paragraphType,
  };

  if (this.formats && this.formats.length) {
    paragraph.formats = this.formats;
  }

  return paragraph;
};


/**
 * Renders a component in an element.
 * @param  {!Element} element Element to render component in.
 * @param  {Object=} opt_options Options for rendering.
 *   options.insertBefore - To render the component before another element.
 *   options.editMode - To render the paragraph in edit mode.
 * @override
 */
Paragraph.prototype.render = function(element, opt_options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, opt_options);

    if (this.editMode) {
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
 * @param  {number=} opt_indexOffset Optional offset to add to the index of the
 * component for insertion point for the undo.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @param {boolean=} opt_keepEmptyContainer Whether to keep the empty container
 * or delete it.
 * @return {Array<./defs.OperationDef>} List of operations needed to be executed.
 */
Paragraph.prototype.getDeleteOps = function(
    opt_indexOffset, opt_cursorAfterOp, opt_keepEmptyContainer) {
  // In case of a nested-component inside another. Let the parent
  // handle its deletion (e.g. figcaption inside a figure).
  if (!this.section) {
    return [];
  }
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'Paragraph',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        text: this.text,
        placeholderText: this.placeholderText,
        paragraphType: this.paragraphType,
        formats: this.formats,
      },
    },
  }];

  // If this is the last element in the section/layout/list delete the container
  // as well.
  if (!opt_keepEmptyContainer && this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }
  return ops;
};


/**
 * Returns the operations to execute inserting a paragarph.
 * @param {number} index Index to insert the paragarph at.
 * @param {./defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<./defs.OperationDef>} Operations for inserting the paragraph.
 */
Paragraph.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
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
        paragraphType: this.paragraphType,
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
 * Returns the operations to execute inserting characters in a paragraph.
 * @param {string} chars The characters to insert in a paragraph.
 * @param {number} index Index to insert the characters at.
 * @return {Array<./defs.OperationDef>} Operations for inserting characters in paragraph.
 */
Paragraph.prototype.getInsertCharsOps = function(chars, index) {
  return [{
    do: {
      op: 'insertChars',
      component: this.name,
      cursorOffset: index + chars.length,
      value: chars,
      index: index,
    },
    undo: {
      op: 'removeChars',
      component: this.name,
      cursorOffset: index,
      index: index,
      count: chars.length,
    },
  }];
};


/**
 * Returns the operations to execute removing characters in a paragraph.
 * @param {string} chars The characters to remove in a paragraph.
 * @param  {number} index Index to remove the characters starting at.
 * @param {number=} opt_direction The directions to remove chars at.
 * @return {Array<./defs.OperationDef>} Operations for removing characters in paragraph.
 */
Paragraph.prototype.getRemoveCharsOps = function(chars, index, opt_direction) {
  return [{
    do: {
      op: 'removeChars',
      component: this.name,
      cursorOffset: index,
      index: index,
      count: chars.length,
    },
    undo: {
      op: 'insertChars',
      component: this.name,
      cursorOffset: index - (opt_direction || 0),
      value: chars,
      index: index,
    },
  }];
};


/**
 * Returns operations needed to update a word at index to another.
 * @param  {string} newWord The new word to update to.
 * @param  {number} index Index of the word to update.
 * @return {Array<./defs.OperationDef>} Operations for updating a word.
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
 * @param  {number=} opt_cursorOffset Optional cursor offset.
 * @param  {number=} opt_selectRange Optional selecting range.
 * @param  {string=} opt_value Optional value to update the component with.
 * @param  {number=} opt_cursorOffsetBeforeOp Optional cursor offset before
 * operation execution (to correctly undo cursor offset).
 * @return {Array<./defs.OperationDef>} Operations for updating a paragraph attributes.
 */
Paragraph.prototype.getUpdateOps = function(
    attrs, opt_cursorOffset, opt_selectRange, opt_value,
    opt_cursorOffsetBeforeOp) {
  return [{
    do: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: opt_cursorOffset,
      selectRange: opt_selectRange,
      formats: attrs.formats,
      value: opt_value,
    },
    undo: {
      op: 'updateComponent',
      component: this.name,
      cursorOffset: opt_cursorOffsetBeforeOp,
      selectRange: opt_selectRange,
      formats: attrs.formats,
      value: opt_value ? this.text : undefined,
    },
  }];
};


/**
 * Generates the operations needed to split a paragraph into two at the selection.
 * @param {./selection} selection Selection to get formatter at.
 * @param  {number} opt_indexOffset Offset to add to paragraphs index.
 * @return {Array<./defs.OperationDef>} List of operations to split the paragraph.
 */
Paragraph.prototype.getSplitOpsAt = function(selection, opt_indexOffset) {
  var ops = [];
  var currentComponent = selection.getComponentAtEnd();
  var currentIndex = currentComponent.getIndexInSection();
  var afterCursorText = currentComponent.text.substring(
      selection.end.offset, currentComponent.text.length);

  var afterCursorFormats = currentComponent.getFormatsForRange(
      selection.start.offset, currentComponent.text.length);

  Utils.arrays.extend(ops, currentComponent.getUpdateOps({
    formats: afterCursorFormats,
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
    section: /** @type {./section} */ (selection.getSectionAtEnd()),
    text: /** @type {string} */ (afterCursorText),
    formats: /** @type {Array<./defs.FormattingActionDef>} */ (
        afterCursorShiftedFormats),
    paragraphType: /** @type {string} */ (currentComponent.paragraphType),
  });
  Utils.arrays.extend(
      ops, newP.getInsertOps(currentIndex + (opt_indexOffset || 0) + 1));

  return ops;
};


/**
 * Returns the length of the paragraph content.
 * @return {number} Length of the paragraph content.
 */
Paragraph.prototype.getLength = function() {
  return this.text.length;
};


/**
 * Returns the length of the paragraph content.
 * @return {number} Length of the paragraph content.
 */
Paragraph.prototype.getDomLength = function() {
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
