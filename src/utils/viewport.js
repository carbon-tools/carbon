'use strict';

/**
 * Calls a callback if the element in viewport.
 * @param  {!Element} el
 * @return {boolean}
 */
function ifElementInViewport(el, callback) {
  requestAnimationFrame(function() {
    var rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || document.body.clientHeight) &&
        rect.left < (window.innerWidth || document.body.clientWidth)) {
      callback(el);
    }
  });
}


/**
 * Returns the absolute offset top going through the offsetParent top offset.
 * @param {!Element} el
 * @return {number}
 */
function absOffsetTop(el) {
  var top = el.offsetTop;
  var parent;
  while (parent = el.parentOffset) {
    top += parent.offsetTop;
  }
  return top;
}


module.exports.ifElementInViewport = ifElementInViewport;
module.exports.absOffsetTop = absOffsetTop;
