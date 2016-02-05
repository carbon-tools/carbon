var Article = require('../src/article');
var Selection = require('../src/selection');
var Paragraph = require('../src/paragraph');
var Section = require('../src/section');

describe('Article', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  it('should expose Article constructor', function() {
    expect(Article).not.toBe(undefined);
  });

  it('should initialize Article with sections', function() {
    var article = new Article();

    expect(article.dom.nodeName).toBe('ARTICLE');
  });

  it('should return the json model', function() {
    var paragraphOpts = {
      name: 'paragraph-name',
      text: 'paragraph text'
    };

    var sectionOpts = {
      name: 'section-name',
      components: [new Paragraph(paragraphOpts)]
    };

    var article = new Article({
      sections: [new Section(sectionOpts)]
    });

    expect(article.getJSONModel()).toEqual({
      sections: [{
        component: Section.CLASS_NAME,
        components: [{
          component: Paragraph.CLASS_NAME,
          text: paragraphOpts.text,
          placeholderText: null,
          paragraphType: Paragraph.Types.Paragraph,
          name: paragraphOpts.name
        }],
        name: sectionOpts.name
      }]
    });

  });

  it('should insert section into article', function() {
    var article = new Article();
    article.insertSection(new Section());
    expect(article.sections.length).toBe(1);
    expect(article.sections[0].components.length).toBe(1);
  });

  it('should do a transaction', function() {
    var article = new Article();
    spyOn(article, 'do');
    article.transaction([{op: 'hello'}]);

    expect(article.history.length).toBe(1);
    expect(article.do).toHaveBeenCalled();
  });

  it('should call exec with do and undo', function() {
    var article = new Article();
    spyOn(article, 'exec');
    article.transaction([{op: 'hello'}]);

    expect(article.exec).toHaveBeenCalledWith({op: 'hello'}, 'do');
    expect(article.historyAt).toBe(1);

    article.undo();
    expect(article.exec).toHaveBeenCalledWith({op: 'hello'}, 'undo');
    expect(article.historyAt).toBe(0);
    article.exec.calls.reset();

    article.undo();
    expect(article.exec).not.toHaveBeenCalled();
    expect(article.historyAt).toBe(0);

    article.redo();
    expect(article.exec).toHaveBeenCalledWith({op: 'hello'}, 'do');
    expect(article.historyAt).toBe(1);

    article.exec.calls.reset();
    article.redo();
    expect(article.exec).not.toHaveBeenCalled();
    expect(article.historyAt).toBe(1);
  });

  it('should execute the proper operation', function() {
    var section = new Section({
      components: [new Paragraph()]
    });

    var article = new Article({
      sections: [section]
    });

    article.render(document.createElement('div'), { editMode: true });

    var op = {
      do: {
        op: 'insertComponent',
        section: article.sections[0].name,
        componentClass: Paragraph.CLASS_NAME,
        component: '1234',
        index: 1
      },
      undo: {
        op: 'deleteComponent',
        component: '1234'
      }
    };

    article.exec(op, 'do');
    expect(section.components.length).toBe(2);
    article.exec(op, 'undo');
    expect(section.components.length).toBe(1);

    op = {
      do: {
        op: 'updateComponent',
        component: section.components[0].name,
        value: 'Hello World',
        cursorOffset: 11
      },
      undo: {
        op: 'updateComponent',
        component: section.components[0].name,
        value: '',
        cursorOffset: 0
      }
    };

    article.exec(op, 'do');
    expect(section.components[0].text).toBe('Hello World');
    article.exec(op, 'undo');
    expect(section.components[0].text).toBe('');
  });
});
