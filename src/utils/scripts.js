'use strict';


/**
 * Inserts an element after another reference element.
 * @param {!Element} element
 * @param {!Element} referenceEl
 */
function loadScript(scriptUrl, callback) {
  var script = document.createElement('script');
  script.async = true;
  script.src = scriptUrl;
  script.onload = callback;
  document.body.appendChild(script);
}

module.exports.loadScript = loadScript;
