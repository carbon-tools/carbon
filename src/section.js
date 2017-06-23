'use strict';

var Utils = require('./utils');
var Component = require('./component');
var Loader = require('./loader');


/**
 * @typedef {{
 *   tagName: (string|undefined),
 *   components: (Array<!./component>|undefined),
 * }}
 */
var SectionParamsDef;


/**
 * Section main.
 * @param {SectionParamsDef=} opt_params Optional params to initialize the Section object.
 * Default:
 *   {
 *     components: [],
 *     backgorund: {},
 *     name: Utils.getUID()
 *   }
 * @extends {./component}
 * @constructor
 */
var Section = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {SectionParamsDef} */ (Utils.extend({
    tagName: Section.TAG_NAME,
    // The components that is in this section.
    components: [],
  }, opt_params));

  Component.call(this, params);

  /**
   * Tag to use for the dom element for the section.
   * @type {string}
   */
  this.tagName = /** @type {string} */ (params.tagName);

  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(this.tagName);
  this.dom.setAttribute('name', this.name);

  /**
   * The section components.
   * @type {Array<Component>}
   */
  this.components = [];
  for (var i = 0; i < (params.components || []).length; i++) {
    this.insertComponentAt(params.components[i], i);
  }
};
Section.prototype = Object.create(Component.prototype);
module.exports = Section;


/**
 * Element Tag name when creating the associated DOM element.
 * @type {string}
 * @const
 */
Section.TAG_NAME = 'section';


/**
 * String name for the component class.
 * @type {string}
 * @const
 */
Section.CLASS_NAME = 'Section';
Loader.register(Section.CLASS_NAME, Section);


/**
 * Create and initiate an Article object from JSON.
 * @param  {./defs.ArticleJsonDef} json JSON representation of the article.
 * @return {Section} Section object representing the JSON data.
 */
Section.fromJSON = function(json) {
  var components = [];
  for (var i = 0; i < json.components.length; i++) {
    var className = json.components[i].component;
    var ComponentClass = Loader.load(className);
    var component = ComponentClass.fromJSON(Utils.extend({
      article: json.article,
    }, json.components[i]));
    components.push(component);
  }

  return new Section({
    name: json.name,
    article: json.article,
    components: components,
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
 * @param  {./component} component Component to insert.
 * @param  {number} index Where to insert the component.
 * @return {./component} The inserted component.
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
        editMode: this.editMode,
      });
    }

    // Set the cursor to the new component.
    component.select();
  }

  this.components.splice(index, 0, component);
  return component;
};


/**
 * Removes a component from a section.
 * @param  {!./component} component To remove from section.
 * @return {!./component} Removed component.
 */
Section.prototype.removeComponent = function(component) {
  var index = this.components.indexOf(component);
  var removedComponent = /** @type {./component} */ (
      this.components.splice(index, 1)[0]);
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
 * Returns first layout in the section.
 * @return {./layout} Returns first layout.
 */
Section.prototype.getFirstComponent = function() {
  // TODO(mkhatib): This probably needs refactoring and we shouldn't hardcode
  // the fact that sections need layouts inside of them. Maybe. Think some more
  // about this.
  return /** @type {./layout} */ (this.components[0]);
};


/**
 * Returns last layout in the section.
 * @return {./layout} Returns last layout.
 */
Section.prototype.getLastComponent = function() {
  return /** @type {./layout} */ (this.components[this.components.length - 1]);
};


/**
 * Returns components from a section between two components (exclusive).
 * @param  {./component} startComponent Starting component.
 * @param  {./component} endComponent Ending component.
 */
Section.prototype.getComponentsBetween = function(
    startComponent, endComponent) {
  var components = [];
  // In case of this is a nested component.
  // Get components between the parent component.
  var start = startComponent.parentComponent || startComponent;
  var end = endComponent.parentComponent || endComponent;
  if (start === end) {
    return [];
  }
  var next = start.getNextComponent();
  while (next && next !== end) {
    components.push(next);
    next = next.getNextComponent();
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
    components: [],
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
 * Called when the module is installed on in an editor.
 * @param  {./editor} unusedEditor Editor instance which installed the module.
 */
Section.onInstall = function(unusedEditor) {
  // jshint unused: false
};


/**
 * Gets the component with the passed name.
 * @param  {string} name Name of the component.
 * @return {?Component}
 */
Section.prototype.getComponentByName = function(name) {
  for (var i = 0; i < this.components.length; i++) {
    if (this.components[i].name === name) {
      return this.components[i];
    }
  }
  return null;
};
