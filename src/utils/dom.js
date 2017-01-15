'use strict';

var Utils = require('../utils');

var INLINE_ELEMENTS = [
  'B', 'BR', 'BIG', 'I', 'SMALL', 'ABBR', 'ACRONYM',
  'CITE', 'EM', 'STRONG', 'A', 'BDO', 'STRIKE', 'S', 'SPAN', 'SUB', 'SUP',
  '#text', 'META'];


/**
 * Checks whether the passed element only has inline child nodes.
 * @param {!Element|!Node} elem
 * @return {boolean}
 */
function hasOnlyInlineChildNodes(elem) {
  var children = elem.childNodes;
  for (var i = 0; i < children.length ; i++) {
    if (INLINE_ELEMENTS.indexOf(children[i].nodeName) === -1) {
      return false;
    } else if (children[i].childNodes) {
      var subChilds = children[i].childNodes;
      for (var k = 0; k < subChilds.length; k++) {
        if (!isInlineElements(subChilds) ||
            !hasOnlyInlineChildNodes(subChilds[k])) {
          return false;
        }
      }
    }
  }
  return true;
}


/**
 * Checks if the passed elements are all inline elements.
 * @param {IArrayLike<!Element|!Node>} elements
 * @return {boolean}
 */
function isInlineElements(elements) {
  var metaNodes = 0;
  for (var i = 0; i < elements.length; i++) {
    if (elements[i] && elements[i].nodeName.toLowerCase() === 'meta') {
      metaNodes++;
    } else if (INLINE_ELEMENTS.indexOf(elements[i].nodeName) === -1) {
      return false;
    }
  }

  if (elements.length - metaNodes < 2) {
    return true;
  }

  return false;
}


/**
 * Returns the carbon component from a coordinate.
 * @param {number} x X Position.
 * @param {number} y Y Position.
 * @return {../component}
 */
function componentFromPoint(x, y) {
  var el = document.elementFromPoint(x, y);
  while (el && !el.hasAttribute('carbon') && el.parentElement) {
    el = el.parentElement;
  }
  return Utils.getReference(el.getAttribute('name'));
}


/**
 * Inserts an element after another reference element.
 * @param {!Element} element
 * @param {!Element} referenceEl
 */
function insertAfter(element, referenceEl) {
  var next = referenceEl.nextElementSibling;
  if (next) {
    next.parentElement.insertBefore(element, next);
  } else {
    referenceEl.parentElement.appendChild(element);
  }
}


module.exports.componentFromPoint = componentFromPoint;
module.exports.hasOnlyInlineChildNodes = hasOnlyInlineChildNodes;
module.exports.isInlineElements = isInlineElements;
module.exports.insertAfter = insertAfter;
module.exports.INLINE_ELEMENTS = INLINE_ELEMENTS;
