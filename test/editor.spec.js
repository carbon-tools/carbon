var Editor = require('../src/editor');
var Selection = require('../src/selection');

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

    expect(div.className.indexOf('manshar-editor') !== -1).toBe(true);
    expect(div.getAttribute('contenteditable')).toBe('true');
  });

  describe('Editor.handleKeyDownEvent', function() {
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];

      // When at the end of a paragraph, test it'll create and add
      // new paragraph.
      selection.setCursor({
        paragraph: paragraph,
        offset: paragraph.text.length
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph + 1);
      expect(selection.getParagraphAtStart()).
        toBe(section.paragraphs[numOfParagraph]);

      // When at the middle of a paragraph, test it'll split paragraph
      // into two.
      paragraph.setText('Hello world');
      selection.setCursor({
        paragraph: paragraph,
        offset: 5
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph + 2);
      expect(paragraph.text).toBe('Hello');
      expect(paragraph.getNextParagraph().text).toBe(' world');
      expect(selection.getParagraphAtStart()).
        toBe(paragraph.getNextParagraph());
      expect(selection.start.offset).toBe(0);

      // Test no paragraphs are created when placeholder is after the
      // current paragraph.
      selection.setCursor({
        paragraph: section.paragraphs[0],
        offset: 0
      });
      editor.handleKeyDownEvent(event);
      expect(section.paragraphs.length).toBe(numOfParagraph + 2);

      expect(event.preventDefault.calls.count()).toBe(3);
      expect(event.stopPropagation.calls.count()).toBe(3);
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];
      var prevParagraph = paragraph.getPreviousParagraph();
      paragraph.setText('Hello world');
      prevParagraph.setText('Goodbye ');

      // When cursor at beginning of paragraph.
      selection.setCursor({
        paragraph: paragraph,
        offset: 0
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
      expect(selection.getParagraphAtStart()).toBe(prevParagraph);
      expect(prevParagraph.text).toBe('Goodbye Hello world');

      // When cursor not at beginning.
      selection.setCursor({
        paragraph: prevParagraph,
        offset: 5
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];
      var prevParagraph = paragraph.getPreviousParagraph();
      paragraph.setText('Hello world');
      prevParagraph.setText('Goodbye ');

      // When cursor at end of paragraph.
      selection.setCursor({
        paragraph: prevParagraph,
        offset: prevParagraph.text.length
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
      expect(selection.getParagraphAtStart()).toBe(prevParagraph);
      expect(prevParagraph.text).toBe('Goodbye Hello world');

      // When cursor not at end.
      selection.setCursor({
        paragraph: prevParagraph,
        offset: 5
      });
      editor.handleKeyDownEvent(event);

      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];
      var prevParagraph = paragraph.getPreviousParagraph();
      prevParagraph.setText('Goodbye ');
      paragraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        paragraph: prevParagraph,
        offset: 4
      };
      selection.end = {
        paragraph: paragraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
      expect(selection.getParagraphAtStart().text).toBe('Good world');
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];
      var prevParagraph = paragraph.getPreviousParagraph();
      prevParagraph.setText('Goodbye ');
      paragraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        paragraph: prevParagraph,
        offset: 4
      };
      selection.end = {
        paragraph: paragraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.paragraphs.length).toBe(numOfParagraph - 1);
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
      var numOfParagraph = section.paragraphs.length;
      var paragraph = section.paragraphs[numOfParagraph - 1];
      var prevParagraph = paragraph.getPreviousParagraph();
      prevParagraph.setText('Goodbye ');
      paragraph.setText('Hello world');

      // When cursor at beginning of paragraph.
      selection.start = {
        paragraph: prevParagraph,
        offset: 4
      };
      selection.end = {
        paragraph: paragraph,
        offset: 5
      };
      editor.handleKeyDownEvent(event);
      expect(section.paragraphs.length).toBe(numOfParagraph);
      expect(selection.getParagraphAtStart().text).toBe('Goodbye ');
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should undo/redo', function() {
      var div = document.createElement('div');
      var event = document.createEvent('CustomEvent');
      event.keyCode = 90;
      event.metaKey = true;

      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      var editor = new Editor(div);
      spyOn(editor.article, 'undo');
      spyOn(editor.article, 'redo');

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

      var el = document.createElement('div');
      el.innerHTML = 'Hello World';
      var ops = editor.processPastedContent(el);

      expect(ops.length).toBe(1);
      expect(ops[0].do.op).toBe('updateParagraph');
    });

    // TODO(mkhatib): Add more tests to test paste handling like when the cursor
    // in the middle of the paragraph or so.
    it('should generate proper operations when pasting multi-line', function() {
      var div = document.createElement('div');
      var editor = new Editor(div);

      var el = document.createElement('div');
      el.innerHTML = '<p style="color:red;">Hello <b>World</b></p>'+
          '<h4 class="header">Why are we here?</h4>'+
          '<div><h2>Subheader</h2><p class="hello">Sweet</p></div>';
      var ops = editor.processPastedContent(el);

      expect(ops.length).toBe(8);
      expect(ops[0].do.op).toBe('insertParagraph');
      expect(ops[1].do.op).toBe('updateParagraph');
    });
  });
});
