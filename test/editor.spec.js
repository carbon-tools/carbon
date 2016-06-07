require('../src/main.js');
var Editor = require('../src/editor');
var Selection = require('../src/selection');
var Paragraph = require('../src/paragraph');

describe('Editor', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
    selection.reset();
  });

  it('should expose Editor constructor', function() {
    expect(Editor).not.toBe(undefined);
  });

  it('should initialize listeners on initilaization', function() {
    var selection = Selection.getInstance();
    var div = document.createElement('div');
    spyOn(selection, 'initSelectionListener');
    spyOn(div, 'addEventListener');

    new Editor(div);

    expect(selection.initSelectionListener).toHaveBeenCalledWith(div);
    expect(div.addEventListener).toHaveBeenCalledWith(
        'keydown', jasmine.any(Function));
    expect(div.addEventListener).toHaveBeenCalledWith(
        'paste', jasmine.any(Function));

    expect(div.className.indexOf('carbon-editor') !== -1).toBe(true);
    expect(div.getAttribute('contenteditable')).toBe('true');
  });

  describe('Editor.handleKeyDownEvent', function() {

    describe('Enter', function() {
      it('should handle Enter key', function() {
        var selection = Selection.getInstance();
        var div = document.createElement('div');
        var event = document.createEvent('CustomEvent');
        event.keyCode = 13;
        spyOn(event, 'preventDefault');
        spyOn(event, 'stopPropagation');
        spyOn(selection, 'initSelectionListener');
        spyOn(div, 'addEventListener');

        var editor = new Editor(div);
        var section = editor.article.sections[0];
        var layout = section.components[0];
        var numOfParagraph = layout.components.length;
        var paragraph = layout.components[0];

        editor.render();

        // When at the end of a paragraph, test it'll create and add
        // new paragraph.
        selection.setCursor({
          component: paragraph,
          offset: paragraph.text.length
        });
        editor.handleKeyDownEvent(event);

        expect(layout.components.length).toBe(numOfParagraph + 1);
        expect(selection.getComponentAtStart()).
          toBe(layout.components[numOfParagraph]);

        // When at the middle of a paragraph, test it'll split paragraph
        // into two.
        paragraph.setText('Hello world');
        selection.setCursor({
          component: paragraph,
          offset: 5
        });
        editor.handleKeyDownEvent(event);

        expect(layout.components.length).toBe(numOfParagraph + 2);
        expect(paragraph.text).toBe('Hello');
        expect(paragraph.getNextComponent().text).toBe(' world');
        expect(selection.getComponentAtStart()).
          toBe(paragraph.getNextComponent());
        expect(selection.start.offset).toBe(0);
      });

      it('should not create components if next is placeholder', function() {
        var selection = Selection.getInstance();
        var div = document.createElement('div');
        var event = document.createEvent('CustomEvent');
        event.keyCode = 13;
        spyOn(event, 'preventDefault');
        spyOn(event, 'stopPropagation');
        spyOn(selection, 'initSelectionListener');
        spyOn(div, 'addEventListener');

        var placeholderP = new Paragraph({
          placeholderText: 'Placeholder text'
        });
        var editor = new Editor(div);
        var section = editor.article.sections[0];
        var layout = section.components[0];
        section.insertComponentAt(placeholderP, 1);
        var numOfParagraph = layout.components.length;
        var paragraph = layout.components[0];

        editor.render();

        selection.setCursor({
          component: paragraph,
          offset: 0
        });
        editor.handleKeyDownEvent(event);
        expect(layout.components.length).toBe(numOfParagraph);
        expect(selection.start.offset).toBe(0);
        expect(selection.start.component).toBe(placeholderP);

        expect(event.preventDefault.calls.count()).toBe(1);
        expect(event.stopPropagation.calls.count()).toBe(1);
      });
    });

    it('should handle backspace key', function() {
      var selection = Selection.getInstance();
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 8;
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(selection, 'initSelectionListener');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      var section = editor.article.sections[0];
      var layout = section.components[0];
      var paragraph = layout.components[0];
      var secondParagraph = new Paragraph();
      layout.insertComponentAt(secondParagraph, 1);
      var numOfParagraph = layout.components.length;
      editor.render();

      paragraph.setText('Goodbye ');
      secondParagraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.setCursor({
        component: secondParagraph,
        offset: 0
      });
      editor.handleKeyDownEvent(event);

      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(selection.getComponentAtStart()).toBe(paragraph);
      expect(paragraph.text).toBe('Goodbye Hello world');

      // When cursor not at beginning.
      selection.setCursor({
        component: paragraph,
        offset: 5
      });
      editor.handleKeyDownEvent(event);

      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(event.preventDefault.calls.count()).toBe(1);
      expect(event.stopPropagation.calls.count()).toBe(1);
    });

    it('should handle delete key', function() {
      var selection = Selection.getInstance();
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 46;
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(selection, 'initSelectionListener');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      var section = editor.article.sections[0];
      var layout = section.components[0];
      var paragraph = layout.components[0];
      var secondParagraph = new Paragraph();
      layout.insertComponentAt(secondParagraph, 1);
      var numOfParagraph = layout.components.length;
      editor.render();

      paragraph.setText('Goodbye ');
      secondParagraph.setText('Hello world');

      // When cursor at end of paragraph.
      selection.setCursor({
        component: paragraph,
        offset: paragraph.text.length
      });
      editor.handleKeyDownEvent(event);

      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(selection.getComponentAtStart()).toBe(paragraph);
      expect(paragraph.text).toBe('Goodbye Hello world');

      // When cursor not at end.
      selection.setCursor({
        component: paragraph,
        offset: 5
      });
      editor.handleKeyDownEvent(event);

      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(event.preventDefault.calls.count()).toBe(1);
      expect(event.stopPropagation.calls.count()).toBe(1);
    });

    it('should remove selected text when backspace', function() {
      var selection = Selection.getInstance();
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 8;
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(selection, 'initSelectionListener');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      var section = editor.article.sections[0];
      var layout = section.components[0];
      var paragraph = layout.components[0];
      var secondParagraph = new Paragraph();
      layout.insertComponentAt(secondParagraph, 1);
      var numOfParagraph = layout.components.length;
      editor.render();

      paragraph.setText('Goodbye ');
      secondParagraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        component: paragraph,
        offset: 4
      };
      selection.end = {
        component: secondParagraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(selection.getComponentAtStart().text).toBe('Good world');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should remove selected text when typing character', function() {
      var selection = Selection.getInstance();
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 77;
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(selection, 'initSelectionListener');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      var section = editor.article.sections[0];
      var layout = section.components[0];
      var paragraph = layout.components[0];
      var secondParagraph = new Paragraph();
      layout.insertComponentAt(secondParagraph, 1);
      var numOfParagraph = layout.components.length;
      editor.render();

      paragraph.setText('Goodbye ');
      secondParagraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        component: paragraph,
        offset: 4
      };
      selection.end = {
        component: secondParagraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not remove selected text when non-changing key', function() {
      var selection = Selection.getInstance();
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 17;
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(selection, 'initSelectionListener');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      var section = editor.article.sections[0];
      var layout = section.components[0];
      var paragraph = layout.components[0];
      var secondParagraph = new Paragraph();
      layout.insertComponentAt(secondParagraph, 1);
      var numOfParagraph = layout.components.length;
      editor.render();

      paragraph.setText('Goodbye ');
      secondParagraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        component: paragraph,
        offset: 4
      };
      selection.end = {
        component: secondParagraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.components.length).toBe(numOfParagraph - 1);
      expect(selection.getComponentAtStart().text).toBe('Goodbye ');
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should undo/redo', function() {
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.metaKey = true;

      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      var editor = new Editor(div);
      editor.render();

      editor.article.selection.updateSelectionFromWindow = function() {};

      spyOn(editor.article, 'undo');
      spyOn(editor.article, 'redo');

      event.keyCode = 90;
      editor.handleKeyDownEvent(event);
      expect(editor.article.undo).toHaveBeenCalled();

      event.keyCode = 89;
      editor.handleKeyDownEvent(event);
      expect(editor.article.redo).toHaveBeenCalled();
    });
  });

  describe('Editor.handlePaste', function() {
    it('should call processPastedContent', function() {
      var div = document.createElement('div');
      var event = {
        preventDefault: function(){},
        clipboardData: {
          getData: function(){}
        }
      };

      spyOn(event.clipboardData, 'getData').and.returnValue('Hello World');
      spyOn(event, 'preventDefault');
      spyOn(div, 'addEventListener');

      var editor = new Editor(div);
      editor.render();
      spyOn(editor, 'processPastedContent').and.returnValue([]);

      var el = document.createElement('div');
      el.innerHTML = 'Hello World';
      editor.handlePaste(event);
      expect(editor.processPastedContent).toHaveBeenCalledWith(el);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Editor.processPastedContent', function() {
    it('should generate single operation for inline content', function() {
      var div = document.createElement('div');
      var editor = new Editor(div);
      editor.render();

      var el = document.createElement('div');
      el.innerHTML = 'Hello World';
      var ops = editor.processPastedContent(el);

      expect(ops.length).toBe(1);
      expect(ops[0].do.op).toBe('insertChars');
    });

    // TODO(mkhatib): Add more tests to test paste handling like when the cursor
    // in the middle of the paragraph or so.
    it('should generate proper operations when pasting multi-line', function() {
      var div = document.createElement('div');
      var editor = new Editor(div);
      editor.render();

      var el = document.createElement('div');
      el.innerHTML = '<p style="color:red;">Hello <b>World</b></p>'+
          '<h4 class="header">Why are we here?</h4>'+
          '<div><h2>Subheader</h2><p class="hello">Sweet</p></div>';
      var ops = editor.processPastedContent(el);

      expect(ops.length).toBe(4);
      expect(ops[0].do.op).toBe('insertComponent');
      expect(ops[1].do.op).toBe('insertComponent');
    });
  });
});
