'use strict';

var INLINE_ELEMENTS = [
  'B', 'BR', 'BIG', 'I', 'SMALL', 'ABBR', 'ACRONYM',
  'CITE', 'EM', 'STRONG', 'A', 'BDO', 'STRIKE', 'S', 'SPAN', 'SUB', 'SUP',
  '#text', 'META'];


/**
 * Checks whether the passed element only has inline child nodes.
 * @param {!Element} elem
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
 * @param {Array<!Element>} elements
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


module.exports.hasOnlyInlineChildNodes = hasOnlyInlineChildNodes;
module.exports.isInlineElements = isInlineElements;
module.exports.INLINE_ELEMENTS = INLINE_ELEMENTS;
