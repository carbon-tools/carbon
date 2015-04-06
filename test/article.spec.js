var Article = require('../src/article');
var Selection = require('../src/selection');


describe('Article', function() {
  'use strict';

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  it('should expose Article constructor', function() {
    expect(Article).not.toBe(undefined);
  });

});
