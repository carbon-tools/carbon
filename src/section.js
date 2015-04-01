'use strict';

var Paragraph = require('./paragraph');


/**
 * Section main.
 */
var Section = function() {

  this.paragraphs = [];

  this.background = {};

  if (!this.paragraphs || !this.paragraphs.length) {
    this.insertParagraph(new Paragraph());
  }
};

Section.TAG_NAME = 'section';

module.exports = Section;


Section.prototype.insertParagraph = function(paragraph) {
  paragraph.section = this;
  this.paragraphs.push(paragraph);
  return paragraph;
};



Section.prototype.dom = function() {
  var sectionElement = document.createElement(Section.TAG_NAME);
  for (var i = 0; i < this.paragraphs.length; i++) {
    sectionElement.appendChild(this.paragraphs[i].dom());
  }
  return sectionElement;
};
