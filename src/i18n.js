'use strict';

var I18n = {};
module.exports = I18n;

/**
 * Stores locales strings.
 * @type {Object}
 */
I18n.LANG_STRING_MAP = {};


/**
 * Stores the fallback locale if there wasn't a string for the requested
 * locale.
 * @type {string}
 */
I18n.fallbackLocale = 'en';


/**
 * Stores the default locale for Carbon.
 * @type {string}
 */
I18n.currentLocale = 'en';


/**
 * Returns the current locale.
 * @return {string}
 */
I18n.getCurrentLocale = function() {
  return I18n.currentLocale;
};


/**
 * Sets the current locale.
 * @param {string} locale
 */
I18n.setCurrentLocale = function(locale) {
  I18n.currentLocale = locale;
};


/**
 * Returns the fallback locale.
 * @return {string}
 */
I18n.getFallbackLocale = function() {
  return I18n.fallbackLocale;
};


/**
 * Sets the fallback locale.
 * @param {string} locale
 */
I18n.setFallbackLocale = function(locale) {
  I18n.fallbackLocale = locale;
};


/**
 * Sets a string for a specific locale.
 * @param {string} locale Locale to store this string for.
 * @param {string} id String ID.
 * @param {string} string The string to store for that string ID.
 */
I18n.set = function(locale, id, string) {
  if (!I18n.LANG_STRING_MAP[locale]) {
    I18n.LANG_STRING_MAP[locale] = {};
  }

  I18n.LANG_STRING_MAP[locale][id] = string;
};


/**
 * Returns the string for the specific ID.
 * @param  {string} id String ID.
 * @param  {string=} opt_locale Optional Locale - default to currentLocale.
 * @return {string|undefined} The string for that locale if found.
 */
I18n.get = function(id, opt_locale) {
  var locale = opt_locale || I18n.currentLocale;
  if (!I18n.LANG_STRING_MAP[locale] ||
      !I18n.LANG_STRING_MAP[locale][id]) {
    locale = I18n.getFallbackLocale();
  }
  try {
    return I18n.LANG_STRING_MAP[locale][id];
  } catch (e) {
    console.error(e);
    return;
  }
};
