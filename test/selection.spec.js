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

  it('should initialize event listeners', function() {
    var selection = Selection.getInstance();
    var div = document.createElement('div');
    spyOn(div, 'addEventListener');
    selection.initSelectionListener(div);

    expect(div.addEventListener).toHaveBeenCalledWith(
        'mouseup', jasmine.any(Function));
    expect(div.addEventListener).toHaveBeenCalledWith(
        'keyup', jasmine.any(Function));
  });

  it('should return paragraphs and sections at selection', function() {
    var section = new Section({
      components: [
        new Paragraph({
          placeholderText: 'Hello',
          paragraphType: Paragraph.Types.MainHeader,
        }),
        new Paragraph({
          placeholderText: 'World',
          paragraphType: Paragraph.Types.ThirdHeader,
        }),
        new Paragraph({
          placeholderText: '!',
        }),
      ],
    });

    var selection = Selection.getInstance();

    selection.start = {
      component: section.components[0],
      offset: 1,
    };

    selection.end = {
      component: section.components[2],
      offset: 1,
    };

    expect(selection.getComponentAtStart()).toEqual(section.components[0]);
    expect(selection.getComponentAtEnd()).toEqual(section.components[2]);
    expect(selection.getSectionAtStart()).toEqual(section);
    expect(selection.getSectionAtEnd()).toEqual(section);
  });

  it('should update the start and end and window selection', function() {
    var section = new Section();
    var paragraph = new Paragraph({
      text: 'Hello World',
    });
    section.insertComponentAt(paragraph, 0);

    var selection = Selection.getInstance();
    selection.setCursor({
      component: paragraph,
      offset: 5,
    });

    expect(selection.start.component).toBe(paragraph);
    expect(selection.end.component).toBe(paragraph);
    expect(selection.start.offset).toBe(5);
    expect(selection.end.offset).toBe(5);
  });

  it('should check if cursor at beginning or end', function() {
    var section = new Section();
    var paragraph = new Paragraph({
      text: 'Hello World',
    });
    section.insertComponentAt(paragraph, 0);

    var selection = Selection.getInstance();

    selection.setCursor({
      component: paragraph,
      offset: 5,
    });

    expect(selection.isCursorAtBeginning()).toBe(false);
    expect(selection.isCursorAtEnding()).toBe(false);
    expect(selection.isRange()).toBe(false);

    selection.setCursor({
      component: paragraph,
      offset: 11,
    });
    expect(selection.isCursorAtBeginning()).toBe(false);
    expect(selection.isCursorAtEnding()).toBe(true);
    expect(selection.isRange()).toBe(false);

    selection.setCursor({
      component: paragraph,
      offset: 0,
    });
    expect(selection.isCursorAtBeginning()).toBe(true);
    expect(selection.isCursorAtEnding()).toBe(false);
    expect(selection.isRange()).toBe(false);

    selection.end = {
      component: paragraph,
      offset: 5,
    };
    expect(selection.isRange()).toBe(true);
  });

});
