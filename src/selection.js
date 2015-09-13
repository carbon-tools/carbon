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

    Selection.prototype = new Utils.CustomEventTarget();

    /**
     * Differet types of selection events.
     * @type {Enum}
     */
    Selection.Events = {
      SELECTION_CHANGED: 'selectionchanged'
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
     * Returns the list of paragraphs in the selection.
     * @return {Array.<Paragraph>} List of paragraphs selected.
     */
    Selection.prototype.getSelectedParagraphs = function() {
      var startParagraph = this.start.paragraph;
      var endParagraph = this.end.paragraph;
      var inBetweenParagraphs = this.getSectionAtStart().getParagraphsBetween(
          startParagraph, endParagraph);
      var selectedParagraphs = [startParagraph];
      Array.prototype.push.apply(selectedParagraphs, inBetweenParagraphs);
      if (startParagraph !== endParagraph) {
        selectedParagraphs.push(endParagraph);
      }
      return selectedParagraphs;
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
     * Selects a range.
     * @param {Object} start An object with `paragraph` and `offset`.
     * @param {Object} end An object with `paragraph` and `offset`.
     */
    Selection.prototype.select = function(start, end) {
      // Update start and end points to the cursor value.
      this.start = {
        paragraph: start.paragraph,
        offset: start.offset
      };

      this.end = {
        paragraph: end.paragraph,
        offset: end.offset
      };

      // Reflect the update to the cursor to the browser selection.
      this.updateWindowSelectionFromModel();
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
        offset += (currentNode.textContent || currentNode.innerText).length;
      }
      return offset;
    };

    /**
     * Updates the window selection from the selection model.
     */
    Selection.prototype.updateWindowSelectionFromModel = function() {
      var range = document.createRange();
      var startNode = this.start.paragraph.dom;
      var startOffset = this.start.offset;
      var endNode = this.end.paragraph.dom;
      var endOffset = this.end.offset;

      // Select the #text node instead of the parent element.
      if (this.start.offset > 0) {
        startNode = this.getTextNodeAtOffset_(
            this.start.paragraph.dom, startOffset);

        // TODO(mkhatib): FIGURE OUT WHY start.offset sometimes larger than
        // the current length of the content. This is a hack to fix not finding
        // the startNode when this happens.
        if (!startNode) {
          startNode = this.getTextNodeAtOffset_(
              this.start.paragraph.dom, startOffset - 1);
        }
        var startPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.start.paragraph.dom, // Paragraph node
            startNode); // Start node to calculate new offset from
        startOffset = this.start.offset - startPrevSiblingsOffset;
      }

      try {
        range.setStart(startNode, startOffset);
      } catch (e) {
        range.setStart(startNode, startOffset - 1);
      }

      endNode = this.end.paragraph.dom;
      // Select the #text node instead of the parent element.
      if (this.end.offset > 0) {
        endNode = this.getTextNodeAtOffset_(
            this.end.paragraph.dom, endOffset);
        // TODO(mkhatib): FIGURE OUT WHY end.offset sometimes larger than
        // the current length of the content. This is a hack to fix not finding
        // the endNode when this happens.
        if (!endNode) {
          endNode = this.getTextNodeAtOffset_(
              this.end.paragraph.dom, endOffset - 1);
        }
        var endPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.end.paragraph.dom, // Paragraph node
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

        var currentOffset = (currentNode.textContent || currentNode.innerText).length;
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
     * paragaraph currently selected.
     * @param  {Selection} selection Current selection.
     * @return {number} Start offset relative to parent.
     */
    Selection.prototype.calculateStartOffsetFromWindowSelection_ = function (
        selection) {
          // offset from node.
        var startNode = selection.anchorNode;
        var startNodeOffset = selection.anchorOffset;

        if (startNode.getAttribute && startNode.getAttribute('name')) {
          return startNodeOffset;
        }

        // Get the real paragraph.
        var node = this.getStartParagraphFromWindowSelection_(selection);
        startNodeOffset += this.calculatePreviousSiblingsOffset_(
            node, startNode);
        return startNodeOffset;
    };


    /**
     * Calculates end offset from the window selection. Relative to the parent
     * paragaraph currently selected.
     * @param  {Selection} selection Current selection.
     * @return {number} End offset relative to parent.
     */
    Selection.prototype.calculateEndOffsetFromWindowSelection_ = function (
        selection) {
      var startNode = selection.focusNode;
      var startNodeOffset = selection.focusOffset;

      if (startNode.getAttribute && startNode.getAttribute('name')) {
        return startNodeOffset;
      }

      // Get the real paragraph.
      var node = this.getStartParagraphFromWindowSelection_(selection);
      startNodeOffset += this.calculatePreviousSiblingsOffset_(node, startNode);
      return startNodeOffset;
    };


    /**
     * Calculates previous siblings offsets sum until a node.
     * @param  {HTMLElement} parent Parent paragraph element.
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
              currentNode.innerText).length;

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

        offset += (currentNode.textContent || currentNode.innerText).length;
      }
      return offset;
    };


    /**
     * Retruns the start paragraph from window selection.
     * @param  {Selection} selection Current selection.
     * @return {HTMLElement} Start paragraph html element.
     */
    Selection.prototype.getStartParagraphFromWindowSelection_ = function (
        selection) {
        var node = selection.anchorNode;
        while (!node.getAttribute ||
               (!node.getAttribute('name') && node.parentNode)) {
          node = node.parentNode;
        }
        return node;
    };


    /**
     * Retruns the end paragraph from window selection.
     * @param  {Selection} selection Current selection.
     * @return {HTMLElement} End paragraph html element.
     */
    Selection.prototype.getEndParagraphFromWindowSelection_ = function (
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

      // Update the selection start point.
      var startNode = this.getStartParagraphFromWindowSelection_(selection);
      var start = {
        paragraph: Utils.getReference(startNode.getAttribute('name')),
        offset: this.calculateStartOffsetFromWindowSelection_(selection)
      };

      // Update the selection end point.
      var endNode = this.getEndParagraphFromWindowSelection_(selection);
      var end = {
        paragraph: Utils.getReference(endNode.getAttribute('name')),
        offset: this.calculateEndOffsetFromWindowSelection_(selection)
      };

      var endIndex = end.paragraph.section.paragraphs.indexOf(end.paragraph);
      var startIndex = start.paragraph.section.paragraphs.indexOf(
          start.paragraph);
      var reversedSelection = ((end.paragraph === start.paragraph &&
          end.offset < start.offset) || startIndex > endIndex);

      this.end = reversedSelection ? start : end;
      this.start = reversedSelection ? end : start;

      var event = new Event(Selection.Events.SELECTION_CHANGED);
      this.dispatchEvent(event);
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
