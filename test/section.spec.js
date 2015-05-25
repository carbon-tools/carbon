var Section = require('../src/section');
var Selection = require('../src/selection');
var Paragraph = require('../src/paragraph');


describe('Section', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  afterEach(function() {
    Selection.getInstance().reset();
  });

  it('should expose Section constructor', function() {
    expect(Section).not.toBe(undefined);
    expect(new Section()).not.toBe(undefined);
  });

  it('should insert paragraphs', function() {
    var section = new Section({
      paragraphs: [new Paragraph(), new Paragraph()]
    });

    var p1 = new Paragraph({ text: 'Hello p1' });
    section.insertParagraphAt(p1, 2);
    expect(section.paragraphs.length).toBe(3);
    expect(section.paragraphs[2]).toBe(p1);

    var p2 = new Paragraph({ text: 'Hello p2' });
    section.insertParagraphAt(p2, 2);
    expect(section.paragraphs.length).toBe(4);
    expect(section.paragraphs[2]).toBe(p2);
  });

  it('should remove paragraph from section', function() {
    var section = new Section({
      paragraphs: [new Paragraph(), new Paragraph()]
    });

    var p1 = new Paragraph({ text: 'Hello p1' });
    section.insertParagraphAt(p1, 0);

    expect(section.paragraphs.length).toBe(3);
    expect(section.dom.childNodes.length).toBe(3);
    section.removeParagraph(p1);
    expect(section.paragraphs.length).toBe(2);
    expect(section.dom.childNodes.length).toBe(2);
  });

  it('should return a json model', function() {
    var section = new Section({
      paragraphs: [new Paragraph({
        name: '12'
      }), new Paragraph({
        text: 'Hello p1',
        name: '23'
      })]
    });

    expect(section.getJSONModel()).toEqual({
      paragraphs: [{
        text: '',
        name: '12',
        paragraphType: 'p'
      }, {
        text: 'Hello p1',
        name: '23',
        paragraphType: 'p'
      }]
    });
  });

  it('should return paragraphs between two others', function() {
    var section = new Section({
      paragraphs: [new Paragraph({
        name: '12'
      }), new Paragraph({
        text: 'Hello p2',
        name: '213'
      }), new Paragraph({
        text: 'Hello p3',
        name: '234'
      }), new Paragraph({
        text: 'Hello p4',
        name: '231'
      })]
    });

    var paragraphs = section.getParagraphsBetween(
        section.paragraphs[0], section.paragraphs[3]);
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].name).toBe('213');
    expect(paragraphs[1].name).toBe('234');
  });

});
