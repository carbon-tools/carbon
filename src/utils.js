'use strict';


/**
 * A List of keycodes that types an accent with alt.
 * TODO(mkhatib): Make sure these are all the possible accents.
 * @type {!Object<string, string>}
 */
var KEYCODE_ACCENT_MAP = {
  /* ALT + E = ´*/
  /*E*/ '69': '´',
  /*e*/ '101': '´',

  /* ALT + I = ˆ */
  /*I*/ '73': 'ˆ',
  /*i*/ '105': 'ˆ',

  /* ALT + U = ¨ */
  /*U*/ '85': '¨',
  /*u*/ '117': '¨',

  /* ALT + N = ˜ */
  /*N*/ '78': '˜',
  /*n*/ '110': '˜',

  /* ALT + ` = ` */
  /*`*/ '192': '`',
};


/**
 * Maps accents and followed characters with their accented character.
 * @type {Object<string, Object<string, string>>}
 */
var ACCENTS_CHARACTERS_MAP = {
  '`': {
    'a': 'à',
    'A': 'À',
    'e': 'è',
    'E': 'È',
    'i': 'ì',
    'I': 'Ì',
    'o': 'ò',
    'O': 'Ò',
    'u': 'ù',
    'U': 'Ò',
  },
  '´': {
    'a': 'á',
    'A': 'Á',
    'e': 'é',
    'E': 'É',
    'i': 'í',
    'I': 'Í',
    'o': 'ó',
    'O': 'Ó',
    'u': 'ú',
    'U': 'Ú',
  },
  '¨': {
    'a': 'ä',
    'A': 'Ä',
    'e': 'ë',
    'E': 'Ë',
    'i': 'ï',
    'I': 'Ï',
    'o': 'ö',
    'O': 'Ö',
    'u': 'ü',
    'U': 'Ü',
  },
  'ˆ': {
    'a': 'â',
    'A': 'Â',
    'e': 'ê',
    'E': 'Ê',
    'i': 'î',
    'I': 'Î',
    'o': 'ô',
    'O': 'Ô',
    'u': 'û',
    'U': 'Û',
  },
  '˜': {
    'a': 'ã',
    'A': 'Ã',
    'o': 'õ',
    'O': 'Õ',
    'n': 'ñ',
    'N': 'Ñ',
  },
};


var Utils = {};
Utils.arrays = {};
module.exports = Utils;

/**
 * Stores global references for retreival.
 * @type {Object}
 */
Utils.GLOBAL_REFERENCE = {};


/**
 * Extends first object with second object and overrides its
 * attributes and returns a new object.
 *
 * Example:
 *
 *   var newObj = Utils.extend({name: 'mk', age: 14}, {name: 'rasha'});
 *   // newObj is now {name: 'rasha', age: 14}
 * @param  {Object} targetObj
 * @param  {Object=} opt_srcObj
 * @return {Object} Combined new object.
 */
Utils.extend = function(targetObj, opt_srcObj) {
  var tmpObj = {}, attr;

  for (attr in targetObj) {
    tmpObj[attr] = targetObj[attr];
  }

  for (attr in opt_srcObj) {
    tmpObj[attr] = opt_srcObj[attr];
  }

  return tmpObj;
};


/**
 * Checks whether the object is an array.
 * @param {*} obj
 * @return {boolean}
 */
Utils.isArray = function(obj) {
  return Object.prototype.toString.call(obj) == '[object Array]';
};


/**
 * Checks if the object is empty.
 * @param  {Object|Array} obj
 * @return {boolean}
 */
Utils.isEmpty = function(obj) {
  if (obj === null || obj === undefined) {
    return true;
  }

  if (Utils.isArray(obj)) {
    return /** @type {!Array} */ (obj).length !== 0;
  }

  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false;
    }
  }

  return true;
};


/**
 * Extends first array with second array.
 *
 * Example:
 * var a = [1, 2, 3];
 * Utils.arrays.extend(a, [4, 5, 6]);
 *   // a is now [1, 2, 3, 4, 5, 6]
 * @param  {Array} firstArray
 * @param  {Array} secondArray
 * @return {Array} firstArray with second array elements added to it.
 */
Utils.arrays.extend = function(firstArray, secondArray) {
  for (var i = 0; i < secondArray.length; i++) {
    firstArray.push(secondArray[i]);
  }

  return firstArray;
};


/**
 * Store a global reference for an object.
 * @param {string} key Key to store the object at.
 * @param {Object|string|number} value Any value you'd like to store at key.
 */
Utils.setReference = function(key, value) {
  Utils.GLOBAL_REFERENCE[key] = value;
};


/**
 * Get a global reference for an object.
 * @param {string} key Key to get the object at.
 */
Utils.getReference = function(key) {
  return Utils.GLOBAL_REFERENCE[key];
};


/**
 * Generates a random alphanumeric ID.
 * @param  {number=} opt_length Length of the ID to generate.
 * @return {string} Random alphanumeric ID.
 */
Utils.getUID = function(opt_length) {
  var length = opt_length || 8;
  var chars = [];
  var sourceSet = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    chars.push(sourceSet.charAt(Math.floor(Math.random() * sourceSet.length)));
  }

  return chars.join('');
};


/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `opt_immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * Ref: http://stackoverflow.com/a/24004942/646979
 *
 * @param {!function()} func
 * @param {number} wait
 * @param {boolean=} opt_immediate
 * @return {!function()}
 */
Utils.debounce = function(func, wait, opt_immediate) {
  // The returned function will be able to reference this due to closure.
  // Each call to the returned function will share this common timer.
  var timeout;

  // Calling debounce returns a new anonymous function.
  return function() {
    // Reference the context and args for the setTimeout function.
    var context = this,
      args = arguments;

    // Should the function be called now? If opt_immediate is true
    // and not already in a timeout then the answer is: Yes.
    var callNow = opt_immediate && !timeout;

    // This is the basic debounce behaviour where you can call this
    // function several times, but it will only execute once
    // [before or after imposing a delay].
    // Each time the returned function is called, the timer starts over.
    clearTimeout(timeout);

    // Set the new timeout.
    timeout = setTimeout(function() {
      // Inside the timeout function, clear the timeout variable
      // which will let the next execution run when in 'opt_immediate' mode.
      timeout = null;

      // Check if the function already ran with the opt_immediate flag.
      if (!opt_immediate) {
       // Call the original function with apply
       // apply lets you define the 'this' object as well as the arguments.
       // (both captured before setTimeout).
        func.apply(context, args);
      }
    }, wait);

    // Immediate mode and no wait timer? Execute the function.
    if (callNow) {
      func.apply(context, args);
    }
  };
};



/**
 * Whether an event will produce a character or move the cursor.
 * @param  {Event} event Keypress event.
 * @return {boolean}
 */
Utils.willTypeOrMoveCursor = function(event) {
  var NO_CHANGE_KEYS = [
    // Command keys.
    16, 17, 18, 19, 20, 27,
    // Other keys.
    45, 91, 92, 93,
    // Funcion Keys F1-F12
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    // Locks
    144, 145,
  ];

  return NO_CHANGE_KEYS.indexOf(event.keyCode) === -1;
};


/**
 * Whether an event will produce a character or not.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if the key will produce a change.
 */
Utils.willTypeCharacter = function(event) {
  var NO_CHANGE_KEYS = [
    // Command keys.
    16, 17, 18, 19, 20, 27,
    // Pages keys.
    33, 34, 35, 36,
    // Arrow keys.
    37, 38, 39, 40,
    // Other keys.
    45, 91, 92, 93,
    // Funcion Keys F1-F12
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    // Locks
    144, 145,
  ];

  return (NO_CHANGE_KEYS.indexOf(event.keyCode) === -1 &&
          !event.ctrlKey && !event.metaKey);
};


/**
 * Checks if the event is undo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is undo.
 */
Utils.isUndo = function(event) {
  return !!((event.ctrlKey || (Utils.isMac() && event.metaKey)) &&
          event.keyCode === 90 && !event.shiftKey);
};


/**
 * Checks if the event is redo.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is redo.
 */
Utils.isRedo = function(event) {
  return !!((event.ctrlKey || (Utils.isMac() && event.metaKey)) &&
          (event.keyCode === 89 ||
           (event.shiftKey && event.keyCode === 90)));
};


/**
 * Checks if the event is select all shortcut.
 * @param  {Event} event Keypress event.
 * @return {boolean} True if it is select all.
 */
Utils.isSelectAll = function(event) {
  return !!((event.ctrlKey || (Utils.isMac() && event.metaKey)) &&
          event.keyCode === 65 && !event.shiftKey);
};


/**
 * Checks if the event is to type an accent.
 * @param  {Event} event
 * @return {boolean}
 */
Utils.isAccent = function(event) {
  var accentsKeycodes = Object.keys(KEYCODE_ACCENT_MAP);
  return !!(event.altKey &&
    accentsKeycodes.indexOf(event.keyCode.toString()) !== -1);
};


/**
 * Returns the accent from the event keycode.
 * @param  {Event} event
 * @return {string}
 */
Utils.getAccent = function(event) {
  return KEYCODE_ACCENT_MAP[event.keyCode.toString()];
};


/**
 * Returns the accented character for the given accent and character.
 *   For example: getAccentedCharacter('`', 'a') => á
 * @param  {string} accent
 * @param  {string} char
 * @return {?string}
 */
Utils.getAccentedCharacter = function(accent, char) {
  try {
    return ACCENTS_CHARACTERS_MAP[accent][char];
  } catch (unusedE) {
    return null;
  }
};


/**
 * Returns true if the user is on a mobile device.
 * @return {boolean}
 */
Utils.isMobile = function() {
  return !!(/Mobi|iPhone|iPod|iPad|BlackBerry|Android/i.test(
                navigator.userAgent));
};


/**
 * Returns true if user is on firefox.
 * @return {boolean}
 */
Utils.isFirefox = function() {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};


/**
 * Returns true if the user is on a mac device.
 * @return {boolean}
 */
Utils.isMac = function() {
  return !!(/Mac/i.test(navigator.platform));
};


/**
 * Returns the text property name of the element.
 * @param  {!Element|!Node} element
 * @return {string}
 */
Utils.getTextProperty = function(element) {
  var textProp;
  if (element.nodeType === Node.TEXT_NODE) {
    textProp = 'data';
  } else if (element.textContent !== undefined) {
    textProp = 'textContent';
  } else {
    textProp = 'innerText';
  }
  return textProp;
};


/**
 * Sets the text property for the element.
 * @param {!Element|!Node} element
 * @param {string} value Value to set.
 */
Utils.setTextForElement = function(element, value) {
  element[Utils.getTextProperty(element)] = value;
};


/**
 * Gets the text inside the element.
 * @param  {!Element|!Node} element
 * @return {string}
 */
Utils.getTextFromElement = function(element) {
  return element[Utils.getTextProperty(element)];
};


/**
 * Makes a copy of the passed object.
 *   Reference: http://stackoverflow.com/a/728694/646979
 * @param  {Object} obj Object to clone.
 * @return {Object} cloned object.
 */
Utils.clone = function(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || 'object' !== typeof obj) {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = Utils.clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = Utils.clone(obj[attr]);
      }
    }
    return copy;
  }

  throw new Error('Unable to copy object! Its type is not supported.');
};


/**
 * Makes a jsonp request by inserting a script tag to the document body
 * and cleans up after the callback has been called.
 * @param  {string} url The URL to request.
 * @param  {Function} callback Callback function after the url loads.
 */
Utils.jsonp = function(url, callback) {
  var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.body.removeChild(script);
    callback(data);
  };

  var script = document.createElement('script');
  if (url.indexOf('?') >= 0) {
    script.src = url + '&callback=' + callbackName;
  } else {
    script.src = url + '?callback=' + callbackName;
  }
  document.body.appendChild(script);
};


/**
 * Makes an XHR request to the URL.
 * @param  {string} url to make the request to.
 * @param {boolean=} optJsonpOnFail Whether to try to make a JSONP request after
 * the XHR request fails.
 * @param  {Function} callback Callback function.
 */
Utils.ajax = function(url, callback, optJsonpOnFail) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      if (xhttp.status == 200) {
        var json = JSON.parse(xhttp.responseText);
        callback(json);
      } else if (optJsonpOnFail) {
        Utils.jsonp(url, callback);
      }
    }
  };
  xhttp.open('GET', url, true);
  xhttp.send();
};


/**
 * Listens to a message event.
 * @param {HTMLIFrameElement} iframe to listen to.
 * @param {string} type Message name to listen to.
 * @param {Function} callback
 */
Utils.listen = function(iframe, type, callback) {
  window.addEventListener('message', function(event) {
    if (event.source != iframe.contentWindow) {
      return;
    }

    if (event.data.type != type) {
      return;
    }

    callback(event.data);
  });
};


/**
 * Returns a string of the size with the unit.
 * @param {string|number} size
 * @param {string=} opt_unit
 * @return {string}
 */
Utils.getSizeWithUnit = function(size, opt_unit) {
  var unit = opt_unit || 'px';
  var result = String(parseFloat(size));
  return result + unit;
};


/**
 * Adds Utils.addResizeListener and Utils.removeResizeListener to allow
 * listening to resizing dom elements.
 *
 * REF: http://goo.gl/VJHtSQ
 */
(function() {
  var attachEvent = document.attachEvent;
  var isIE = navigator.userAgent.match(/Trident/);

  var setTimeoutWrapper = function(fn) {
    return window.setTimeout(fn, 20);
  };

  var requestFrame = (function() {
    var raf = (
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        setTimeoutWrapper);
    return function(fn) {
      return raf(fn);
    };
  })();

  var cancelFrame = (function() {
    var cancel = (
        window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.clearTimeout);
    return function(id) {
      return cancel(id);
    };
  })();

  function resizeListener(e) {
    var win = e.target || e.srcElement;
    if (win.__resizeRAF__) {
      cancelFrame(win.__resizeRAF__);
    }
    win.__resizeRAF__ = requestFrame(function() {
      var trigger = win.__resizeTrigger__;
      trigger.__resizeListeners__.forEach(function(fn) {
        fn.call(trigger, e);
      });
    });
  }

  function objectLoad(event) {
    event.target.contentDocument.defaultView.__resizeTrigger__ =
        event.target.__resizeElement__;
    event.target.contentDocument.defaultView.addEventListener(
        'resize', resizeListener);
  }

  /**
   * Adds a resize listener to the element.
   * @param {Element} element Element to listen to.
   * @param {Function} fn Callback function.
   */
  Utils.addResizeListener = function(element, fn) {
    if (!element.__resizeListeners__) {
      element.__resizeListeners__ = [];
      if (attachEvent) {
        element.__resizeTrigger__ = element;
        element.attachEvent('onresize', resizeListener);
      }
      else {
        if (getComputedStyle(element).position == 'static') {
          element.style.position = 'relative';
        }
        var obj = element.__resizeTrigger__ = document.createElement('object');
        obj.setAttribute(
            'style',
            'display: block; position: absolute; top: 0;' +
            'left: 0; height: 100%; width: 100%; overflow: hidden;' +
            'pointer-events: none; z-index: -1;');
        obj.__resizeElement__ = element;
        obj.onload = objectLoad;
        obj.type = 'text/html';
        if (isIE) {
          element.appendChild(obj);
        }
        obj.data = 'about:blank';
        if (!isIE) {
          element.appendChild(obj);
        }
      }
    }
    element.__resizeListeners__.push(fn);
  };

  /**
   * Removes resize listener from element.
   * @param  {Element} element Element to remove resize event from.
   * @param  {Function} fn Callback function.
   */
  Utils.removeResizeListener = function(element, fn) {
    element.__resizeListeners__.splice(
        element.__resizeListeners__.indexOf(fn), 1);

    if (!element.__resizeListeners__.length) {
      if (attachEvent) {
        element.detachEvent('onresize', resizeListener);
      } else {
        var contentDocument = element.__resizeTrigger__.contentDocument;
        contentDocument.defaultView.removeEventListener(
            'resize', resizeListener);
        element.__resizeTrigger__ = !element.removeChild(
            element.__resizeTrigger__);
      }
    }
  };

})();
