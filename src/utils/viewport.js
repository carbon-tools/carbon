'use strict';

/**
 * Calls a callback if the element in viewport.
 * @param  {Node} el
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

module.exports.ifElementInViewport = ifElementInViewport;
