var Paragraph = require('../src/paragraph');

describe('Paragraph', function() {
  'use strict';

  it('should expose Paragraph constructor', function() {
    expect(Paragraph).not.toBe(undefined);
    expect(new Paragraph()).not.toBe(undefined);
  });

});
