'use strict';

var Utils = require('./utils');


/**
 * Selection singletone class.
 */
var Selection = (function() {


    /** Singletone Constructor. */
    var Selection = function() {

      /**
       * Selection start point.
       * @type {Object}
       */
      this.start = {
        paragraph: null,
        offset: null
      };

      /**
       * Selection end point.
       * @type {Object}
       */
      this.end = {
        paragraph: null,
        offset: null
      };
    };


    /**
     * Resets selection start and end point.
     */
    Selection.prototype.reset = function() {
      this.start = {
        paragraph: null,
        offset: null
      };

      this.end = {
        paragraph: null,
        offset: null
      };
    };

    /**
     * Returns the paragraph object at the start of the selection.
     * @return {Paragraph} The paragraph object at the start of selection.
     */
    Selection.prototype.getParagraphAtStart = function() {
      if (this.start) {
        return this.start.paragraph;
      }
    };


    /**
     * Returns the paragraph object at the end of the selection.
     * @return {Paragraph} The paragraph object at the end of selection.
     */
    Selection.prototype.getParagraphAtEnd = function() {
      if (this.end) {
        return this.end.paragraph;
      }
    };


    /**
     * Returns the section object at the start of the selection.
     * @return {Section} The section object at the start of selection.
     */
    Selection.prototype.getSectionAtStart = function() {
      if (this.getParagraphAtStart()) {
        return this.getParagraphAtStart().section;
      }
    };


    /**
     * Returns the section object at the end of the selection.
     * @return {Section} The section object at the end of selection.
     */
    Selection.prototype.getSectionAtEnd = function() {
      if (this.getParagraphAtEnd()) {
        return this.getParagraphAtEnd().section;
      }
    };


    /**
     * Sets the cursor on the selection.
     * @param {Object} cursor An object with `paragraph` and `offset`.
     */
    Selection.prototype.setCursor = function(cursor) {
      // Update start and end points to the cursor value.
      this.start = {
        paragraph: cursor.paragraph,
        offset: cursor.offset
      };

      this.end = {
        paragraph: cursor.paragraph,
        offset: cursor.offset
      };

      // Reflect the update to the cursor to the browser selection.
      this.updateWindowSelectionFromModel();
    };


    /**
     * Updates the window selection from the selection model.
     */
    Selection.prototype.updateWindowSelectionFromModel = function() {
      var range = document.createRange();
      var startNode = this.start.paragraph.dom;
      // Select the #text node instead of the parent element.
      if (this.start.offset > 0) {
        startNode = startNode.firstChild;
      }
      range.setStart(startNode, this.start.offset);

      var endNode = this.end.paragraph.dom;
      // Select the #text node instead of the parent element.
      if (this.end.offset > 0) {
        endNode = endNode.firstChild;
      }
      range.setEnd(endNode, this.end.offset);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };


    /**
     * Updates the selection start and end point from a change on the browser
     * selection.
     */
    Selection.prototype.updateSelectionFromWindow = function() {
      var selection = window.getSelection();

      // Update the selection start point.
      var startNode = selection.anchorNode;
      var start = {
        offset: selection.anchorOffset
      };
      // TODO(mkhatib): Better logic is needed here to get to the node we're
      // interested in. When we start formatting text, there will be multiple
      // levels of nodes that we need to account for.
      if (startNode.nodeName === '#text') {
        startNode = startNode.parentNode;
      }
      start.paragraph = Utils.getReference(startNode.getAttribute('name'));

      // Update the selection end point.
      var endNode = selection.extentNode;
      var end = {
        offset: selection.extentOffset
      };
      if (endNode.nodeName === '#text') {
        endNode = endNode.parentNode;
      }
      end.paragraph = Utils.getReference(endNode.getAttribute('name'));

      var endIndex = end.paragraph.section.paragraphs.indexOf(end.paragraph);
      var startIndex = start.paragraph.section.paragraphs.indexOf(
          start.paragraph);
      var reversedSelection = ((end.paragraph === start.paragraph &&
          end.offset < start.offset) || startIndex > endIndex);

      this.end = reversedSelection ? start : end;
      this.start = reversedSelection ? end : start;
    };


    /**
     * Whether the cursor is at beginning of a paragraph.
     * @return {boolean} True if the cursor at the beginning of paragraph.
     */
    Selection.prototype.isCursorAtBeginning = function() {
      return this.start.offset === 0 && this.end.offset === 0;
    };


    /**
     * Whether the cursor is at ending of a paragraph.
     * @return {boolean} True if the cursor at the ending of paragraph.
     */
    Selection.prototype.isCursorAtEnding = function() {
      return (this.start.offset === this.start.paragraph.text.length &&
              this.end.offset === this.end.paragraph.text.length);
    };


    /**
     * Whether the selection is a range.
     * @return {boolean} True if a range is selected.
     */
    Selection.prototype.isRange = function() {
      return (this.start.paragraph != this.end.paragraph ||
              this.start.offset != this.end.offset);
    };


    /**
     * Removes selected text.
     */
    Selection.prototype.removeSelectedText = function() {
      // Removes all paragraphs in between the start and end of selection
      // paragraphs.
      var section = this.getSectionAtStart();
      section.removeParagraphsBetween(this.start.paragraph, this.end.paragraph);

      // Calculate the new text after deletion of selected.
      var newOffset = this.start.offset;
      var newText = this.start.paragraph.text.substring(0, this.start.offset);
      newText += this.end.paragraph.text.substring(
          this.end.offset, this.end.paragraph.text.length);
      if (this.start.paragraph != this.end.paragraph) {
        this.start.paragraph.mergeWith(this.end.paragraph);
      }
      this.start.paragraph.setText(newText);
      this.setCursor({
        paragraph: this.start.paragraph,
        offset: newOffset
      });
    };


    /**
     * Initialize selection listeners to the element.
     * @param  {HTMLElement} element The html element to listen for slection
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
      }
    };

})();
module.exports = Selection;
