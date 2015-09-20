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

  /**
   * Inline formats for the paragraph.
   * @type {Array.<Object>}
   */
  this.formats = [];

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
  Quote: 'blockquote',
  Code: 'pre'
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
  for (var i = 0; i < this.formats.length; i++) {
    if (this.formats[i].from >= startIndex) {
      this.formats[i].from += shift;
    }
    if (this.formats[i].to >= startIndex) {
      this.formats[i].to += shift;
    }
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
    formatEl.innerText = this.text.substring(formatOpen, formatClose);
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
      // If the format is re-applied to the same range remove the format.
      if (format.to === existingFormat.to &&
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
        // this.updateFormatting(existingFormat, fromat);
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
    name: this.name,
    text: this.text,
    paragraphType: this.paragraphType
  };

  if (this.formats) {
    paragraph.formats = this.formats;
  }

  return paragraph;
};
