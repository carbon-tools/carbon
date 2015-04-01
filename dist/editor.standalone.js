(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.manshar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./section":5,"./selection":6}],2:[function(require,module,exports){
'use strict';

var Article = require('./article');
var Paragraph = require('./paragraph');

/**
 * Editor main.
 */
var Editor = function(element) {
  this.element = element;

  this.article = new Article();

  this.init();
};
module.exports = Editor;


Editor.prototype.init = function() {
  // This is just to render and test the initial dom creation.
  // This will probably change dramatically as we go forward.
  // TODO(mkhatib): Drop these.

  var title = new Paragraph();
  title.text = 'Manshar Document Editor Demo';
  title.paragraphType = Paragraph.Types.MainHeader;
  this.article.insertParagraph(title);

  var paragraph = new Paragraph();
  paragraph.text = ('This is just to kick off the development of a new,' +
    ' better rich document editor.');
  this.article.insertParagraph(paragraph);

  var subHeader = new Paragraph();
  subHeader.text = ('Under Development...');
  subHeader.paragraphType = Paragraph.Types.SecondaryHeader;
  this.article.insertParagraph(subHeader);

  this.element.contentEditable = true;
  this.element.appendChild(this.dom());
};


Editor.prototype.dom = function() {
  return this.article.dom();
};


Editor.prototype.addText = function(text) {
  var paragraph = this.article.selection.getParagraphAtStart();
  paragraph.text = text;
};

},{"./article":1,"./paragraph":4}],3:[function(require,module,exports){
'use strict';

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.Section = require('./section');
module.exports.Selection = require('./selection');

},{"./article":1,"./editor":2,"./paragraph":4,"./section":5,"./selection":6}],4:[function(require,module,exports){
'use strict';


/**
 * Paragraph main.
 */
var Paragraph = function() {
  this.text = '';

  this.markups = [];

  this.metadata = {};

  this.layout = {};

  this.section = null;

  this.paragraphType = Paragraph.Types.Paragraph;
};
module.exports = Paragraph;

// TODO(mkhatib): Maybe define each type as a new function
// instead of putting all the logic for rendering all of these
// under Paragraph.
Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Media: 'figure',
  Embed: 'embed',
  Iframe: 'iframe'
};


Paragraph.prototype.dom = function() {
  var paragraphElement = document.createElement(this.paragraphType);
  paragraphElement.innerText = this.text;
  return paragraphElement;
};

},{}],5:[function(require,module,exports){
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

},{"./paragraph":4}],6:[function(require,module,exports){
'use strict';


/**
 * Selection main.
 */
var Selection = function(start, end) {

  this.start = start;

  this.end = end;

  this.selectionType = Selection.SelectionType.TEXT;
};
module.exports = Selection;


Selection.SelectionType = {
  TEXT: 'text',
  MEDIA: 'media',
  SECTION: 'section'
};


Selection.prototype.getParagraphAtStart = function() {
  if (this.start) {
    return this.start.paragraph;
  }
};


Selection.prototype.getParagraphAtEnd = function() {
  if (this.end) {
    return this.end.paragraph;
  }
};


Selection.prototype.getSectionAtStart = function() {
  if (this.start) {
    return this.start.paragraph.section;
  }
};


Selection.prototype.getSectionAtEnd = function() {
  if (this.end) {
    return this.end.paragraph.section;
  }
};


},{}]},{},[3])(3)
});