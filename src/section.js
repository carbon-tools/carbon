'use strict';

var Selection = require('./selection');
var Utils = require('./utils');


/**
 * Section main.
 * @param {Object} optParams Optional params to initialize the Section object.
 * Default:
 *   {
 *     paragraphs: [],
 *     backgorund: {},
 *     name: Utils.getUID()
 *   }
 */
var Section = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The paragraphs that is in this section.
    paragraphs: [],
    // The background of this section.
    background: {},
    // Generate a UID as a reference for this section.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this Section.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Background settings
   * @type {Object}
   */
  this.background = params.background;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Section.TAG_NAME);
  this.dom.setAttribute('name', this.name);

  /**
   * The section paragraphs.
   * @type {Array.<Paragraph>}
   */
  this.paragraphs = [];
  for (var i = 0; i < params.paragraphs.length; i++) {
    this.insertParagraph(params.paragraphs[i]);
  }

};
module.exports = Section;

/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Section.TAG_NAME = 'section';


/**
 * Inserts a paragraph in the section.
 * @param  {Paragraph} paragraph Paragraph to insert.
 * @return {Paragraph} The inserted paragraph.
 */
Section.prototype.insertParagraph = function(paragraph) {
  // Update paragraph section reference to point to this section.
  paragraph.section = this;

  // Get current paragraph and its index in the section.
  var currentParagraph = Selection.getInstance().getParagraphAtEnd();
  var currentIndex = this.paragraphs.indexOf(currentParagraph);
  var nextParagraph = currentParagraph && currentParagraph.getNextParagraph();

  if (!nextParagraph) {
    // If the last paragraph in the section append it to the section.
    this.dom.appendChild(paragraph.dom);
  } else {
    // Otherwise insert it before the next paragraph.
    this.dom.insertBefore(paragraph.dom, nextParagraph.dom);
  }

  this.paragraphs.splice(currentIndex + 1, 0, paragraph);

  // Set the cursor to the new paragraph.
  Selection.getInstance().setCursor({
    paragraph: paragraph,
    offset: 0
  });

  return paragraph;
};


/**
 * Removes a paragraph from a section.
 * @param  {Paragraph} paragraph To remove from section.
 * @return {Paragraph} Removed paragraph.
 */
Section.prototype.removeParagraph = function(paragraph) {
  var index = this.paragraphs.indexOf(paragraph);
  this.paragraphs.splice(index, 1);
  this.dom.removeChild(paragraph.dom);
  return paragraph;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Section.prototype.getJSONModel = function() {
  var section = {
    paragraphs: []
  };

  for (var i = 0; i < this.paragraphs.length; i++) {
    section.paragraphs.push(this.paragraphs[i].getJSONModel());
  }

  return section;
};
