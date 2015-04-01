var Section = require('../src/section');
var Paragraph = require('../src/paragraph');
var Selection = require('../src/selection');

describe('Selection', function() {
  'use strict';

  it('should expose Selection constructor', function() {
    expect(Selection).not.toBe(undefined);
    expect(new Selection()).not.toBe(undefined);
  });

  it('should initialize with TEXT type', function() {
    var selection = new Selection();
    expect(selection.selectionType).toBe(Selection.SelectionType.TEXT);
  });

  it('should return return correct paragraphs and sections', function() {
    var section = new Section();
    var paragraph = new Paragraph();
    paragraph.text = 'Hello World';
    section.insertParagraph(paragraph);
    var selection = new Selection({
      paragraph: paragraph,
      offset: 2
    }, {
      paragraph: paragraph,
      offset: 8
    });

    expect(selection.getSectionAtStart()).toBe(section);
    expect(selection.getSectionAtEnd()).toBe(section);
    expect(selection.getParagraphAtStart()).toBe(paragraph);
    expect(selection.getParagraphAtEnd()).toBe(paragraph);
  });
});
