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

  it('should insert components', function() {
    var section = new Section({
      components: [new Paragraph(), new Paragraph()],
    });

    var p1 = new Paragraph({text: 'Hello p1'});
    section.insertComponentAt(p1, 2);
    expect(section.components.length).toBe(3);
    expect(section.components[2]).toBe(p1);

    var p2 = new Paragraph({text: 'Hello p2'});
    section.insertComponentAt(p2, 2);
    expect(section.components.length).toBe(4);
    expect(section.components[2]).toBe(p2);
  });

  it('should remove paragraph from section', function() {
    var section = new Section({
      components: [new Paragraph(), new Paragraph()],
    });

    var p1 = new Paragraph({text: 'Hello p1'});
    section.insertComponentAt(p1, 0);

    section.render(document.createElement('div'), {editMode: true});

    expect(section.components.length).toBe(3);
    expect(section.dom.childNodes.length).toBe(3);
    section.removeComponent(p1);
    expect(section.components.length).toBe(2);
    expect(section.dom.childNodes.length).toBe(2);
  });

  it('should return a json model', function() {
    var p1Opts = {
      name: '12',
    };

    var p2Opts = {
      text: 'Hello p1',
      name: '23',
    };

    var section = new Section({
      name: 'section',
      components: [new Paragraph(p1Opts), new Paragraph(p2Opts)],
    });

    expect(section.getJSONModel()).toEqual({
      name: 'section',
      component: Section.CLASS_NAME,
      components: [{
        text: '',
        name: p1Opts.name,
        paragraphType: Paragraph.Types.Paragraph,
        placeholderText: null,
        component: Paragraph.CLASS_NAME,
      }, {
        text: p2Opts.text,
        name: p2Opts.name,
        paragraphType: Paragraph.Types.Paragraph,
        placeholderText: null,
        component: Paragraph.CLASS_NAME,
      }],
    });
  });

  it('should return components between two others', function() {
    var section = new Section({
      components: [new Paragraph({
        name: '12',
      }), new Paragraph({
        text: 'Hello p2',
        name: '213',
      }), new Paragraph({
        text: 'Hello p3',
        name: '234',
      }), new Paragraph({
        text: 'Hello p4',
        name: '231',
      })],
    });

    var components = section.getComponentsBetween(
        section.components[0], section.components[3]);
    expect(components.length).toBe(2);
    expect(components[0].name).toBe('213');
    expect(components[1].name).toBe('234');
  });

});
