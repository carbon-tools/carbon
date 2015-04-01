var Editor = require('../src/editor');

describe('Editor', function() {
  'use strict';

  it('should expose Editor constructor', function() {
    expect(Editor).not.toBe(undefined);
    var element = document.createElement('div');
    expect(new Editor(element)).not.toBe(undefined);
  });

});
