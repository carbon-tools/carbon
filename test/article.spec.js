var Article = require('../src/article');
var Selection = require('../src/selection');
var Paragraph = require('../src/paragraph');
var Section = require('../src/section');
var Editor = require('../src/editor');
var List = require('../src/list');
var Layout = require('../src/layout');

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
      text: 'paragraph text',
    };

    var sectionOpts = {
      name: 'section-name',
      components: [new Paragraph(paragraphOpts)],
    };

    var article = new Article({
      sections: [new Section(sectionOpts)],
    });

    expect(article.getJSONModel()).toEqual({
      sections: [{
        component: Section.CLASS_NAME,
        components: [{
          component: Paragraph.CLASS_NAME,
          text: paragraphOpts.text,
          placeholderText: null,
          paragraphType: Paragraph.Types.Paragraph,
          name: paragraphOpts.name,
        }],
        name: sectionOpts.name,
      }],
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
      components: [new Paragraph()],
    });

    var article = new Article({
      sections: [section],
    });

    article.render(document.createElement('div'), {editMode: true});

    var op = {
      do: {
        op: 'insertComponent',
        section: article.sections[0].name,
        componentClass: Paragraph.CLASS_NAME,
        component: '1234',
        index: 1,
      },
      undo: {
        op: 'deleteComponent',
        component: '1234',
      },
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
        cursorOffset: 11,
      },
      undo: {
        op: 'updateComponent',
        component: section.components[0].name,
        value: '',
        cursorOffset: 0,
      },
    };

    article.exec(op, 'do');
    expect(section.components[0].text).toBe('Hello World');
    article.exec(op, 'undo');
    expect(section.components[0].text).toBe('');
  });

  describe('Article.trim()', function() {
    var editor, article, section, firstLayout, lastLayout;

    beforeEach(function() {
      editor = new Editor(document.createElement('div'));
      article = editor.article;
      section = article.sections[0];
      var lastP = new Paragraph();

      section.insertComponentAt(new Layout({components: lastP}), 1);

      firstLayout = section.components[0];
      lastLayout = section.components[1];

      lastP.render(document.createElement('div'), {editMode: true});
      article.render(document.createElement('div'), {editMode: true});
    });

    it('should trim empty paragraphs', function() {
      expect(firstLayout.components.length).toBe(1);
      article.trim();
      expect(firstLayout.components.length).toBe(0);
    });

    it('should trim empty paragraphs from start to end', function() {
      var testText1 = 'testText 1';
      var testText2 = 'testText 2';
      var p1 = new Paragraph({text: '&nbsp;&nbsp;\n'});
      var p2 = new Paragraph({text: testText1});
      var p3 = new Paragraph({text: testText2});
      var p4 = new Paragraph({text: '  &nbsp; '});
      var p5 = new Paragraph({text: null});
      var p6 = new Paragraph({text: '&#8203; \n', name: 'lastComponent'});

      firstLayout.insertComponentAt(p1, 0);
      firstLayout.insertComponentAt(p2, 1);
      firstLayout.insertComponentAt(new List(), 2);
      lastLayout.insertComponentAt(p3, 0);
      lastLayout.insertComponentAt(p4, 1);
      lastLayout.insertComponentAt(p5, 2);
      lastLayout.insertComponentAt(p6, 3);
      p1.render(document.createElement('div'), {editMode: true});
      p2.render(document.createElement('div'), {editMode: true});
      p3.render(document.createElement('div'), {editMode: true});
      p4.render(document.createElement('div'), {editMode: true});
      p5.render(document.createElement('div'), {editMode: true});
      p6.render(document.createElement('div'), {editMode: true});

      article.trim();

      expect(firstLayout.getFirstComponent().text).toBe(testText1);
      expect(lastLayout.getLastComponent().text).toBe(testText2);
    });

    it('should not trim empty non-paragraph components', function() {
      var listOpt1 = {tagName: 'ol'};
      var listOpt2 = {tagName: 'ul'};

      firstLayout.insertComponentAt(new List(listOpt1), 0);
      firstLayout.insertComponentAt(new Paragraph({text: ''}), 1);
      firstLayout.insertComponentAt(new Paragraph({text: null}), 2);
      firstLayout.insertComponentAt(new Paragraph({text: '   \n'}), 3);
      lastLayout.insertComponentAt(new List(listOpt2), 0);

      article.trim();

      expect(firstLayout.getFirstComponent().tagName).toBe(listOpt1.tagName);
      expect(lastLayout.getLastComponent().tagName).toBe(listOpt2.tagName);
    });
  });
});
