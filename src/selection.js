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

