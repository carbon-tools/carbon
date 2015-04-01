var Article = require('../src/article');

describe('Article', function() {
  'use strict';

  it('should expose Article constructor', function() {
    expect(Article).not.toBe(undefined);
    expect(new Article()).not.toBe(undefined);
  });

  it('should initialize with one section and one paragraph', function() {
    var article = new Article();
    expect(article.sections.length).toBe(1);
    expect(article.sections[0].paragraphs.length).toBe(1);
  });
});
