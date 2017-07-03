'use strict';

var Utils = require('./utils');
var CustomEventTarget = require('./customEventTarget');


/**
 * Selection singletone class.
 */
var SelectionSingletonAccessor = (function() {

  var SELECTED_CLASS = 'editor-selected';

    /**
     * Singletone Constructor.
     * @extends {./customEventTarget}
     * @constructor
     */
  var EditorSelection = function() {

      /**
       * Selection start point.
       * @type {?./defs.SelectionPointDef}
       */
    this.start = null;

      /**
       * Selection end point.
       * @type {?./defs.SelectionPointDef}
       */
    this.end = null;
  };

  EditorSelection.prototype = new CustomEventTarget();

    /**
     * Differet types of selection events.
     * @enum {string}
     */
  EditorSelection.Events = {
    SELECTION_CHANGED: 'selection-changed',
  };

    /**
     * Resets selection start and end point.
     */
  EditorSelection.prototype.reset = function() {
    this.start = null;
    this.end = null;
  };

    /**
     * Returns the component object at the start of the selection.
     * @return {?./component} The component object at the start of selection.
     */
  EditorSelection.prototype.getComponentAtStart = function() {
    if (this.start) {
      return this.start.component;
    }
    return null;
  };


    /**
     * Returns the component object at the end of the selection.
     * @return {?./component} The component object at the end of selection.
     */
  EditorSelection.prototype.getComponentAtEnd = function() {
    if (this.end) {
      return this.end.component;
    }
    return null;
  };


    /**
     * Returns the list of components in the selection.
     * @return {Array<./component>} List of components selected.
     */
  EditorSelection.prototype.getSelectedComponents = function() {
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
     * @return {?./section} The section object at the start of selection.
     */
  EditorSelection.prototype.getSectionAtStart = function() {
    if (this.getComponentAtStart()) {
      return this.getComponentAtStart().section;
    }
    return null;
  };


    /**
     * Returns the section object at the end of the selection.
     * @return {?./section} The section object at the end of selection.
     */
  EditorSelection.prototype.getSectionAtEnd = function() {
    if (this.getComponentAtEnd()) {
      return this.getComponentAtEnd().section;
    }
    return null;
  };


    /**
     * Selects a range.
     * @param {!./defs.SelectionPointDef} start An object with `component` and `offset`.
     * @param {!./defs.SelectionPointDef} end An object with `component` and `offset`.
     */
  EditorSelection.prototype.select = function(start, end) {
      // Update start and end points to the cursor value.
    this.start = {
      component: start.component,
      offset: start.offset,
    };

    this.end = {
      component: end.component,
      offset: end.offset,
    };

      // Reflect the update to the cursor to the browser selection.
    this.updateWindowSelectionFromModel();
  };


    /**
     * Sets the cursor on the selection.
     * @param {!./defs.SelectionPointDef} cursor An object with `component` and `offset`.
     */
  EditorSelection.prototype.setCursor = function(cursor) {
      // Remove selected class from the already selected component.
    if (this.start && this.start.component) {
      this.start.component.dom.classList.remove(SELECTED_CLASS);
    }

      // Update start and end points to the cursor value.
    this.start = {
      component: cursor.component,
      offset: cursor.offset,
    };

    this.end = {
      component: cursor.component,
      offset: cursor.offset,
    };

    if (this.start.component) {
      this.start.component.dom.classList.add(SELECTED_CLASS);
    }

      // Reflect the update to the cursor to the browser selection.
    this.updateWindowSelectionFromModel();
  };


    /**
     * Calculates the offset from node starts instead of parents.
     * @param  {!Element} parent Parent HTML element.
     * @param  {number} parentOffset Offset relative to the parent element.
     * @param  {!Element} node Offset to calculate offset relative to.
     * @return {number} The offset relative to the node.
     */
  EditorSelection.prototype.calculateOffsetFromNode = function(
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
  EditorSelection.prototype.updateWindowSelectionFromModel = function() {
    var range = document.createRange();
    var startNode = this.start.component.dom;
    var startOffset = this.start.offset;
    var endNode = this.end.component.dom;
    var endOffset = this.end.offset;

      // Select the #text node instead of the parent element.
    if (this.start.offset > 0) {
      startNode = this.getTextNodeAtOffset_(startNode, startOffset);
      var startPrevSiblingsOffset = this.calculatePreviousSiblingsOffset_(
            this.start.component.dom, // Component node
            startNode); // Start node to calculate new offset from
      startOffset = this.start.offset - startPrevSiblingsOffset;
    }

    try {
      range.setStart(startNode, startOffset);
    } catch (e) {
      if (e.code === e.INDEX_SIZE_ERR) {
        range.setStart(startNode, startNode.textContent.length);
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
        range.setEnd(endNode, endNode.textContent.length);
      }
    }
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

      // Scroll the selected component into view.
    if (this.start.component.dom.scrollIntoViewIfNeeded) {
      var scrollBefore = document.body.scrollTop;
      this.start.component.dom.scrollIntoViewIfNeeded(false);
      if (scrollBefore !== document.body.scrollTop) {
        window.scroll(0, document.body.scrollTop - 70);
      }
    }
    var event = new Event(EditorSelection.Events.SELECTION_CHANGED);
    this.dispatchEvent(event);
  };


    /**
     * Returns the text node at the specified offset.
     * @param  {Element|Node} parent Parent element.
     * @param  {number} offset Offset relative to parent.
     * @return {!Node} TextNode at the offset.
     */
  EditorSelection.prototype.getTextNodeAtOffset_ = function(parent, offset) {
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
     * @private
     */
  EditorSelection.prototype.calculateStartOffsetFromWindowSelection_ = function(
        selection) {
      // offset from node.
    var startNode = selection.anchorNode;
    var startNodeOffset = selection.anchorOffset;
    var parentNode = startNode.parentNode;

    if ((startNode.getAttribute && startNode.getAttribute('carbon')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute && parentNode.getAttribute('carbon') &&
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
  EditorSelection.prototype.calculateEndOffsetFromWindowSelection_ = function(
        selection) {
    var startNode = selection.focusNode;
    var startNodeOffset = selection.focusOffset;
    var parentNode = startNode.parentNode;
    if ((startNode.getAttribute && startNode.getAttribute('carbon')) ||
          (startNode.nodeName === '#text' &&
           parentNode.getAttribute && parentNode.getAttribute('carbon') &&
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
     * @param  {Element|Node} parent Parent component element.
     * @param  {Element|Node} node Node to stop at.
     * @return {number} Offset of the previous siblings.
     */
  EditorSelection.prototype.calculatePreviousSiblingsOffset_ = function(
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
     * @return {!Element} Start component html element.
     */
  EditorSelection.prototype.getStartComponentFromWindowSelection_ = function(
        selection) {
    var node = selection.anchorNode;
    while (node &&
               (!node.getAttribute ||
                (!node.getAttribute('carbon') && node.parentNode))) {
      node = node.parentNode;
    }
    return /** @type {!Element} */ (node);
  };


    /**
     * Retruns the end component from window selection.
     * @param  {Selection} selection Current selection.
     * @return {!Element} End component html element.
     */
  EditorSelection.prototype.getEndComponentFromWindowSelection_ = function(
        selection) {
    var node = selection.focusNode;
    while (node &&
               (!node.getAttribute ||
                (!node.getAttribute('carbon') && node.parentNode))) {
      node = node.parentNode;
    }
    return /** @type {!Element} */ (node);
  };


    /**
     * Updates the selection start and end point from a change on the browser
     * selection.
     */
  EditorSelection.prototype.updateSelectionFromWindow = function() {
    var selection = window.getSelection();
    var shouldReupdateWindowSelection = false;
    // Update the selection start point.
    var startNode = this.getStartComponentFromWindowSelection_(selection);
    var startComponent = Utils.getReference(startNode.getAttribute('name'));
    // For components that can handle their own selection don't update selection
    // from window when it has focus.
    if (this.getComponentAtStart().hasOwnSelection() &&
        startComponent == this.getComponentAtStart()) {
      return;
    }

    // Remove selected class from the already selected component.
    if (this.start.component) {
      this.start.component.dom.classList.remove(SELECTED_CLASS);
    }

    if (!startNode) {
      // This happen for example when clicking on elements margins and a node
      // is not discovered and instead the click target is the editor itself.
      // Need to research if there's a way to override this behavior
      // otherwise we'll have to be careful with non-contenteditable regions
      // margins. For example, for a non-contenteditable figure, margine should probably be
      // applied to a contenteditable-div that encapsulate it.
      console.info('[Selection] Did not update selection from window.');
      return;
    }
    var startOffset = this.calculateStartOffsetFromWindowSelection_(
          selection);
    if (startComponent.components) {
      shouldReupdateWindowSelection = true;
      startComponent = startComponent.getFirstComponent();
      if (startOffset === 0 && startComponent.getPreviousComponent()) {
        startComponent = startComponent.getPreviousComponent();
        startOffset = startComponent.getLength();
      }
    }
    var start = {
      component: startComponent,
      offset: startOffset,
    };

      // Update the selection end point.
    var endNode = this.getEndComponentFromWindowSelection_(selection);
    var endComponent = Utils.getReference(endNode.getAttribute('name'));
    var endOffset = this.calculateEndOffsetFromWindowSelection_(selection);
    if (endComponent.components) {
      shouldReupdateWindowSelection = true;
      endComponent = endComponent.getFirstComponent();
      if (endOffset === 0 && endComponent.getPreviousComponent()) {
        endComponent = endComponent.getPreviousComponent();
        endOffset = endComponent.getLength();
      }
    }
    var end = {
      component: endComponent,
      offset: endOffset,
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

    var event = new Event(EditorSelection.Events.SELECTION_CHANGED);
    this.dispatchEvent(event);

    // We need to remove the actual window cursor to new place
    // when the cursor was first found in the wrong container.
    if (shouldReupdateWindowSelection) {
      this.updateWindowSelectionFromModel();
    }
  };


    /**
     * Whether the cursor is at beginning of a component.
     * @return {boolean} True if the cursor at the beginning of component.
     */
  EditorSelection.prototype.isCursorAtBeginning = function() {
    return this.start.offset === 0 && this.end.offset === 0;
  };


    /**
     * Whether the cursor is at ending of a component.
     * @return {boolean} True if the cursor at the ending of component.
     */
  EditorSelection.prototype.isCursorAtEnding = function() {
    return (!(this.start.component.text) ||
              this.start.offset === this.start.component.getDomLength() &&
              this.end.offset === this.end.component.getDomLength());
  };


    /**
     * Whether the selection is a range.
     * @return {boolean} True if a range is selected.
     */
  EditorSelection.prototype.isRange = function() {
    return (this.start.component != this.end.component ||
              this.start.offset != this.end.offset);
  };


  /**
   * Generates the operations needed to delete current selection.
   * @return {Array<./defs.OperationDef>} List of operations to delete selection.
   */
  EditorSelection.prototype.getDeleteSelectionOps = function() {
    var ops = [];
    var count;
    var section = this.getSectionAtStart();
    var inBetweenComponents = [];
    if (section) {
      inBetweenComponents = section.getComponentsBetween(
        this.getComponentAtStart(), this.getComponentAtEnd());
    }

    for (var i = 0; i < inBetweenComponents.length; i++) {
      Utils.arrays.extend(ops, inBetweenComponents[i].getDeleteOps(-i));
    }

    if (this.getComponentAtEnd() !== this.getComponentAtStart()) {
      var lastComponent = this.getComponentAtEnd();
      // TODO(mkhatib): This checks if the component is a paragraph,
      // to avoid require(./paragraph). Find a better way to do this.
      if (lastComponent.paragraphType || this.end.offset > 0) {
        Utils.arrays.extend(ops, lastComponent.getDeleteOps(
            -inBetweenComponents.length));
      }

      if (lastComponent.paragraphType) {
        var lastParagraphOldText = lastComponent.text;
        var lastParagraphText = lastParagraphOldText.substring(
            this.end.offset, lastParagraphOldText.length);

        var firstParagraphOldText = this.getComponentAtStart().text;
        var firstParagraphText = firstParagraphOldText.substring(
            this.start.offset, firstParagraphOldText.length);

        var startParagraph = this.getComponentAtStart();
        var startParagraphFormats = startParagraph.getFormatsForRange(
            this.start.offset, firstParagraphOldText.length);

        var selectRange = firstParagraphOldText.length - this.start.offset;
        if ((startParagraphFormats && startParagraphFormats.length) ||
            selectRange) {
          Utils.arrays.extend(ops, startParagraph.getUpdateOps({
            formats: startParagraphFormats,
          }, this.start.offset, selectRange));
        }

        if (firstParagraphText && firstParagraphText.length) {
          Utils.arrays.extend(ops, startParagraph.getRemoveCharsOps(
              firstParagraphText, this.start.offset));
        }

        var lastCount = lastParagraphOldText.length - lastParagraphText.length;
        Utils.arrays.extend(ops, startParagraph.getInsertCharsOps(
            lastParagraphText, this.start.offset));

        var endParagraphFormatting = lastComponent.getFormatsForRange(
            this.end.offset, lastParagraphOldText.length);
        var formatShift = -lastCount + this.start.offset;
        for (var k = 0; k < endParagraphFormatting.length; k++) {
          endParagraphFormatting[k].from += formatShift;
          endParagraphFormatting[k].to += formatShift;
        }

        Utils.arrays.extend(ops, startParagraph.getUpdateOps({
          formats: endParagraphFormatting,
        }, firstParagraphOldText.length - firstParagraphText.length));
      }
    } else {
      var currentComponent = this.getComponentAtStart();
      var selectedText = currentComponent.text.substring(
          this.start.offset, this.end.offset);
      count = this.end.offset - this.start.offset;
      var currentComponentFormats = currentComponent.getFormatsForRange(
          this.start.offset, this.end.offset);

      Utils.arrays.extend(ops, currentComponent.getUpdateOps({
        formats: currentComponentFormats,
      }, this.start.offset, count));

      Utils.arrays.extend(ops, currentComponent.getRemoveCharsOps(
          selectedText, this.start.offset));
    }

    return ops;
  };


  /**
   * Initialize selection listeners to the element.
   * @param  {!Element} element The html element to listen for selection
   * changes on.
   */
  EditorSelection.prototype.initSelectionListener = function(element) {
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
       * @return {!EditorSelection} The selection instance.
       */
    getInstance: function() {
      if (!instance) {
        instance = new EditorSelection();
          // Hide the constructor so the returned object can't be new'd.
        instance.constructor = null;
      }
      return instance;
    },
    Events: EditorSelection.Events,
  };

})();
module.exports = SelectionSingletonAccessor;
