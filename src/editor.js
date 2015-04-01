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
