var Section = require('../src/section');

describe('Section', function() {
  'use strict';

  it('should expose Section constructor', function() {
    expect(Section).not.toBe(undefined);
    expect(new Section()).not.toBe(undefined);
  });

  it('should initialize with one paragraph', function() {
    var section = new Section();
    expect(section.paragraphs.length).toBe(1);
  });
});
