'use strict';

var Selection = require('./selection');
var Paragraph = require('./paragraph');
var Utils = require('./utils');


/**
 * Article main.
 * @param {Object} optParams Optional params to initialize the Article object.
 * Default:
 *   {
 *     sections: []
 *   }
 */
var Article = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    // The sections that is in this article.
    sections: []
  }, optParams);

  /**
   * Selection object.
   * @type {Selection}
   */
  this.selection = Selection.getInstance();

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(Article.TAG_NAME);

  /**
   * The article sections.
   * @type {Array.<Section>}
   */
  this.sections = [];
  for (var i = 0; i < params.sections.length; i++) {
    this.insertSection(params.sections[i]);
  }

  /**
   * Operations history on the article.
   * @type {Array.<Object>}
   */
  this.history = [];

  /**
   * Currently at history point.
   * @type {number}
   */
  this.historyAt = 0;

};
module.exports = Article;

/**
 * Element Tag name when creating the associated DOM element.
 * @type {String}
 */
Article.TAG_NAME = 'article';


/**
 * Inserts a new section in article.
 * @param  {Section} section Section object.
 * @return {Section} The inserted section.
 */
Article.prototype.insertSection = function(section) {
  // Section should always have a paragraph when inserted into article.
  if (!section.paragraphs || !section.paragraphs.length) {
    section.insertParagraphAt(new Paragraph(), 0);
  }

  this.sections.push(section);
  this.dom.appendChild(section.dom);
  return section;
};


/**
 * Removes a section from article.
 * @param  {Section} section Section to remove.
 * @return {Section} Removed section.
 */
Article.prototype.removeSection = function(section) {
  var index = this.sections.indexOf(section);
  this.sections.splice(index, 1);
  return section;
};


// TODO: Implement.
Article.prototype.updateSection = function(section) {
  return section;
};


/**
 * Inserts a new paragraph in article.
 * @param  {Paragraph} paragraph Paragraph object.
 * @return {Paragraph} The inserted paragraph.
 */
Article.prototype.insertParagraph = function(paragraph) {
  var section = this.selection.getSectionAtEnd().
      insertParagraph(paragraph);
  return section;
};


/**
 * Removes a paragraph from article.
 * @param  {Paragraph} paragraph Paragraph to remove.
 * @return {Paragraph} Removed paragraph.
 */
Article.prototype.removeParagraph = function(paragraph) {
  var index = this.sections.indexOf(paragraph);
  this.paragraphs.splice(index, 1);
  return paragraph;
};


// TODO: Implement.
Article.prototype.updateParagraph = function(paragraph) {
  return paragraph;
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this section.
 */
Article.prototype.getJSONModel = function() {
  var article = {
    sections: []
  };

  for (var i = 0; i < this.sections.length; i++) {
    article.sections.push(this.sections[i].getJSONModel());
  }

  return article;
};


/**
 * Apply list of operations to the article model.
 * @param  {Array.<Object>} ops List of operations to apply.
 */
Article.prototype.transaction = function(ops) {
  if (this.historyAt < this.history.length) {
    this.history.splice(
        this.historyAt, this.history.length - this.historyAt);
  }
  this.history.push(ops);
  this.do();
};


/**
 * Executes the next available operation in the article history.
 */
Article.prototype.do = function() {
  var ops = this.history[this.historyAt++];

  for (var i = 0; i < ops.length; i++) {
    this.exec(ops[i], 'do');
  }
};


/**
 * Executes an operation in the history only if there were any.
 */
Article.prototype.redo = function() {
  if (this.historyAt < this.history.length) {
    this.do();
  }
};


/**
 * Executes the reverse (undo) part of an operation.
 */
Article.prototype.undo = function() {
  if (this.historyAt > 0) {
    var ops = this.history[--this.historyAt];

    for (var i = ops.length - 1; i >= 0; i--) {
      this.exec(ops[i], 'undo');
    }
  }
};


/**
 * Executes an operation with the passed action.
 * @param  {Object} operation An operation object to execute.
 * @param  {string} action Can be 'do' or 'undo'.
 */
Article.prototype.exec = function(operation, action) {
  var op = operation[action].op;
  var paragraph;
  if (op === 'updateParagraph') {
    var paragraphName = operation[action].paragraph;
    var value = operation[action].value;
    paragraph = this.getParagraphByName(paragraphName);

    if (value !== undefined) {
      paragraph.setText(value);
    }
    var selection = this.selection;
    selection.setCursor({
      paragraph: paragraph,
      offset: operation[action].cursorOffset
    });

  } else if (op === 'deleteParagraph') {
    paragraph = this.getParagraphByName(operation[action].paragraph);
    paragraph.section.removeParagraph(paragraph);
  } else if (op === 'insertParagraph') {
    var section = this.getSectionByName(operation[action].section);
    var pType = operation[action].paragraphType || Paragraph.Types.Paragraph;
    section.insertParagraphAt(new Paragraph({
      name: operation[action].paragraph,
      paragraphType: pType
    }), operation[action].index);
  }
};


/**
 * Returns the section that has the specific name.
 * @param  {string} name Name of the section.
 * @return {Section} Section with the passed name.
 */
Article.prototype.getSectionByName = function(name) {
  for (var i = 0; i < this.sections.length; i++) {
    if (this.sections[i].name === name) {
      return this.sections[i];
    }
  }
};


/**
 * Returns the paragraph that has the specific name.
 * @param  {string} name Name of the paragraph.
 * @return {Paragraph} Paragraph with the passed name.
 */
Article.prototype.getParagraphByName = function(name) {
  for (var i = 0; i < this.sections.length; i++) {
    for (var j = 0; j < this.sections[i].paragraphs.length; j++) {
      if (this.sections[i].paragraphs[j].name === name) {
        return this.sections[i].paragraphs[j];
      }
    }
  }
};
