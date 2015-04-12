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
    var section = new Section({
      paragraphs: [new Paragraph(), new Paragraph()]
    });

    var article = new Article({
      sections: [section]
    });

    expect(article.dom.nodeName).toBe('ARTICLE');
  });

  it('should return the json model', function() {
    var section = new Section({
      paragraphs: [new Paragraph({
        name: '12'
      })]
    });

    var article = new Article({
      sections: [section]
    });

    expect(article.getJSONModel()).toEqual({
      sections: [{
        paragraphs: [{
          text: '',
          name: '12',
          paragraphType: 'p'
        }]
      }]
    });

  });

  it('should insert section into article', function() {
    var article = new Article();
    article.insertSection(new Section());
    expect(article.sections.length).toBe(1);
    expect(article.sections[0].paragraphs.length).toBe(1);
  });

});
