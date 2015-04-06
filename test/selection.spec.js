var Section = require('../src/section');
var Paragraph = require('../src/paragraph');
var Selection = require('../src/selection');


describe('Selection', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  afterEach(function() {
    Selection.getInstance().reset();
  });

  it('should expose Selection singletone', function() {
    expect(Selection).not.toBe(undefined);
    expect(Selection.getInstance).not.toBe(undefined);
    expect(Selection.getInstance()).not.toBe(undefined);

    var selection1 = Selection.getInstance();
    var selection2 = Selection.getInstance();
    expect(selection1).toEqual(selection2);
  });

  it('should not allow instantiation of new objects', function() {
    expect(function() { new Selection(); }).toThrowError(TypeError);
  });

  it('should return paragraphs and sections at selection', function() {
    var section = new Section({
      paragraphs: [
        new Paragraph({
          placeholderText: 'Hello',
          paragraphType: Paragraph.Types.MainHeader
        }),
        new Paragraph({
          placeholderText: 'World',
          paragraphType: Paragraph.Types.ThirdHeader
        }),
        new Paragraph({
          placeholderText: '!'
        })
      ]
    });

    var selection = Selection.getInstance();
    expect(selection.getParagraphAtStart()).toEqual(section.paragraphs[2]);
    expect(selection.getParagraphAtEnd()).toEqual(section.paragraphs[2]);
    expect(selection.getSectionAtStart()).toEqual(section);
    expect(selection.getSectionAtEnd()).toEqual(section);
  });

  it('should update the start and end and window selection', function() {
    var section = new Section();
    var paragraph = new Paragraph({
      text: 'Hello World'
    });
    section.insertParagraph(paragraph);

    var selection = Selection.getInstance();
    selection.setCursor({
      paragraph: paragraph,
      offset: 5
    });

    expect(selection.start.paragraph).toBe(paragraph);
    expect(selection.end.paragraph).toBe(paragraph);
    expect(selection.start.offset).toBe(5);
    expect(selection.end.offset).toBe(5);
  });
});
