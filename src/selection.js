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
