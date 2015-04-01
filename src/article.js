'use strict';

var Selection = require('./selection');
var Section = require('./section');


/**
 * Article main.
 */
var Article = function() {
  this.sections = [];

  this.selection = null;


  if (!this.sections || !this.sections.length) {
    var section = this.insertSection(new Section());

    this.selection = new Selection({
      paragraph: section.paragraphs[0],
      offset: 0
    }, {
      paragraph: section.paragraphs[0],
      offset: 0
    });
  }
};
module.exports = Article;


Article.TAG_NAME = 'article';


Article.prototype.insertSection = function(section) {
  this.sections.push(section);
  return section;
};


Article.prototype.removeSection = function(section) {
  var index = this.sections.indexOf(section);
  this.sections.splice(index, 1);
  return section;
};


// TODO: Implement.
Article.prototype.updateSection = function(section) {
  return section;
};


Article.prototype.insertParagraph = function(paragraph) {
  return this.selection.getSectionAtEnd().insertParagraph(paragraph);
};


Article.prototype.removeParagraph = function(paragraph) {
  var index = this.sections.indexOf(paragraph);
  this.paragraphs.splice(index, 1);
  return paragraph;
};


// TODO: Implement.
Article.prototype.updateParagraph = function(paragraph) {
  return paragraph;
};


Article.prototype.dom = function() {
  var articleElement = document.createElement(Article.TAG_NAME);
  for(var i = 0; i < this.sections.length ; i++) {
    articleElement.appendChild(this.sections[i].dom());
  }
  return articleElement;
};
