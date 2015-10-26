'use strict';

var Selection = require('./selection');
var Utils = require('./utils');
var Component = require('./component');

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

  if (!nextComponent) {
    // If the last component in the section append it to the section.
    this.dom.appendChild(component.dom);
  } else {
    // Otherwise insert it before the next component.
    this.dom.insertBefore(component.dom, nextComponent.dom);
  }

  this.components.splice(index, 0, component);

  // Set the cursor to the new component.
  Selection.getInstance().setCursor({
    component: component,
    offset: 0
  });

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
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    components: []
  };

  for (var i = 0; i < this.components.length; i++) {
    section.components.push(this.components[i].getJSONModel());
  }

  return section;
};
