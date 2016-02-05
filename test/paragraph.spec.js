var Section = require('../src/section');
var Paragraph = require('../src/paragraph');
var Selection = require('../src/selection');

describe('Paragraph', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  afterEach(function() {
    Selection.getInstance().reset();
  });

  it('should expose Paragraph constructor', function() {
    expect(Paragraph).not.toBe(undefined);

    var paragraph = new Paragraph({
      placeholderText: 'This is a Placeholder',
      text: 'What is a placeholder?'
    });

    paragraph.render(document.createElement('div'), { editMode: true });

    expect(paragraph.dom.getAttribute('placeholder')).
      toBe('This is a Placeholder');

    expect(paragraph.dom.innerText).
      toBe('What is a placeholder?');
  });

  it('should check if it is a placeholder', function() {
    var paragraph = new Paragraph();
    expect(paragraph.isPlaceholder()).toBe(false);

    paragraph = new Paragraph({
      placeholderText: 'Hello'
    });
    expect(paragraph.isPlaceholder()).toBe(true);

    paragraph = new Paragraph({
      placeholderText: 'Hello',
      text: 'What'
    });
    expect(paragraph.isPlaceholder()).toBe(false);
  });

  it('should return next paragraph', function() {
    var section = new Section();
    var p1 = new Paragraph();
    var p2 = new Paragraph();
    section.insertComponentAt(p1, 0);
    section.insertComponentAt(p2, 1);

    section.render(document.createElement('div'), { editMode: true });

    expect(p1.getNextComponent()).toBe(p2);
    expect(p2.getNextComponent()).toBe(undefined);
  });

  it('should return the json model', function() {
    var paragraph = new Paragraph({
      text: 'hello',
      name: '1234'
    });

    expect(paragraph.getJSONModel()).toEqual({
      component: 'Paragraph',
      name: '1234',
      text: 'hello',
      paragraphType: 'p',
      placeholderText: null
    });
  });

});
