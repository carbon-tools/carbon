'use strict';

var Selection = require('./selection');
var Utils = require('./utils');
var Component = require('./component');
var Loader = require('./loader');


/**
 * Section main.
 * @param {Object} optParams Optional params to initialize the Section object.
 * Default:
 *   {
 *     components: [],
 *     backgorund: {},
 *     name: Utils.getUID()
 *   }
 */
var Section = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    tagName: Section.TAG_NAME,
    // The components that is in this section.
    components: [],
    // The background of this section.
    background: {}
  }, optParams);

  Component.call(this, params);

  /**
   * Tag to use for the dom element for the section.
   * @type {string}
   */
  this.tagName = params.tagName;

  /**
   * Background settings
   * @type {Object}
   */
  this.background = params.background;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(this.tagName);
  this.dom.setAttribute('name', this.name);

  /**
   * The section components.
   * @type {Array.<Component>}
   */
  this.components = [];
  for (var i = 0; i < params.components.length; i++) {
    this.insertComponentAt(params.components[i], i);
  }
};
Section.prototype = Object.create(Component.prototype);
module.exports = Section;


/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Section.TAG_NAME = 'section';


/**
 * String name for the component class.
 * @type {string}
 */
Section.CLASS_NAME = 'Section';
Loader.register(Section.CLASS_NAME, Section);


/**
 * Create and initiate an Article object from JSON.
 * @param  {Object} json JSON representation of the article.
 * @return {Section} Section object representing the JSON data.
 */
Section.fromJSON = function (json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    components.push(ComponentClass.fromJSON(json.components[i]));
  }

  return new Section({
    name: json.name,
    components: components
  });
};


/**
 * Returns the class name of this component.
 * @return {string}
 */
Section.prototype.getComponentClassName = function() {
  return Section.CLASS_NAME;
};


/**
 * Inserts a component in the section.
 * @param  {Component} component Component to insert.
 * @param  {number} index Where to insert the component.
 * @return {Component} The inserted component.
 */
Section.prototype.insertComponentAt = function(component, index) {
  // Update component section reference to point to this section.
  component.section = this;

  // Get current component and its index in the section.
  var nextComponent = this.components[index];

  if (this.isRendered) {
    if (!nextComponent) {
      // If the last component in the section append it to the section.
      component.render(this.dom, {editMode: this.editMode});
    } else {
      // Otherwise insert it before the next component.
      component.render(this.dom, {
        insertBefore: nextComponent.dom,
        editMode: this.editMode
      });
      // this.dom.insertBefore(component.dom, nextComponent.dom);
    }
    // Set the cursor to the new component.
    Selection.getInstance().setCursor({
      component: component,
      offset: 0
    });
  }

  this.components.splice(index, 0, component);
  return component;
};

/**
 * Removes a component from a section.
 * @param  {Component} component To remove from section.
 * @return {Component} Removed component.
 */
Section.prototype.removeComponent = function(component) {
  var index = this.components.indexOf(component);
  var removedComponent = this.components.splice(index, 1)[0];
  try {
    this.dom.removeChild(removedComponent.dom);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      console.warn('The browser might have already handle removing the DOM ' +
        ' element (e.g. When handling cut).');
    } else {
      throw e;
    }
  }
  return removedComponent;
};


/**
 * Returns first component in the section.
 * @return {Component} Returns first component.
 */
Section.prototype.getFirstComponent = function() {
  return this.components[0];
};


/**
 * Returns last component in the section.
 * @return {Component} Returns last component.
 */
Section.prototype.getLastComponent = function() {
  return this.components[this.components.length - 1];
};


/**
 * Returns components from a section between two components (exclusive).
 * @param  {Component} startComponent Starting component.
 * @param  {Component} endComponent Ending component.
 */
Section.prototype.getComponentsBetween = function(
    startComponent, endComponent) {
  var components = [];
  var startIndex = this.components.indexOf(startComponent) + 1;
  var endIndex = this.components.indexOf(endComponent);
  for (var i = startIndex; i < endIndex; i++) {
    components.push(this.components[i]);
  }
  return components;
};


/**
 * Renders the section inside the element.
 */
Section.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);
    for (var i = 0; i < this.components.length; i++) {
      this.components[i].render(this.dom, {editMode: this.editMode});
    }
  } else {
    console.warn('Attempted to render an already rendered component.');
  }
};


/**
 * @override
 */
Section.prototype.rerender = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].shouldRerender()) {
      this.components[i].rerender();
    }
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    name: this.name,
    component: Section.CLASS_NAME,
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};


/**
 * Returns the length of the section.
 * @return {number} Length of section.
 */
Section.prototype.getLength = function() {
  var length = 0;
  for (var i = 0; i < this.components.length; i++) {
    length += this.components[i].getLength();
  }
  return length;
};


/**
 * Returns the first header paragraph in the article.
 * @return {string} First header of the article.
 */
Section.prototype.getTitle = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].isHeader && this.components[i].isHeader()) {
      return this.components[i].text;
    }
  }
  return null;
};


/**
 * Returns the first non-header paragraph in the article.
 * @return {string} First non-header paragraph of the article.
 */
Section.prototype.getSnippet = function() {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].isHeader && !this.components[i].isHeader()) {
      return this.components[i].text;
    }
  }
  return null;
};


/**
 * Called when the module is installed on in an editor.
 * @param  {Editor} editor Editor instance which installed the module.
 */
Section.onInstall = function (editor) {
  // jshint unused: false
};


/**
 * Gets the component with the passed name.
 * @param  {string} name Name of the component.
 * @return {Component}
 */
Section.prototype.getComponentByName = function(name) {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].name === name) {
      return this.components[i];
    }
  }
};
