'use strict';

var Utils = require('./../src/utils');
var Selection = require('./../src/selection');

describe('Utils methods', function() {

  var selection = Selection.getInstance();
  beforeEach(function() {
    spyOn(selection, 'updateWindowSelectionFromModel');
  });

  it('should extend two objects', function() {
    var extended = Utils.extend({name: 'mk', age: 13}, {name: 'rasha'});
    expect(extended).toEqual({name: 'rasha', age: 13});
  });

  it('should set and get references', function() {
    Utils.setReference('123', {name: 'mk'});
    expect(Utils.getReference('123')).toEqual({name: 'mk'});
  });

  it('should return a UID', function() {
    expect(Utils.getUID(5).length).toBe(5);
    expect(Utils.getUID(7).length).toBe(7);
    expect(typeof(Utils.getUID(3))).toBe('string');
  });

});

describe('Utils.CustomEventTarget', function() {
  it('should add event listenres', function() {
    var et = new Utils.CustomEventTarget();
    var callback = jasmine.createSpy('callback');
    et.addEventListener('change', callback);

    var customEvent = document.createEvent('CustomEvent');
    customEvent.initCustomEvent('change', false, false, null);
    et.dispatchEvent(customEvent);
    expect(callback).toHaveBeenCalled();
  });

  it('should remove event listeners', function() {
    var et = new Utils.CustomEventTarget();
    var callback = jasmine.createSpy('callback');
    et.addEventListener('change', callback);
    et.removeEventListener('change', callback);

    var customEvent = document.createEvent('CustomEvent');
    customEvent.initCustomEvent('change', false, false, null);
    et.dispatchEvent(customEvent);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should check if the event produces change', function() {
    expect(Utils.willProduceChange({keyCode: 77})).toBe(true);
    expect(Utils.willProduceChange({keyCode: 37})).toBe(false);
    expect(Utils.willProduceChange({keyCode: 46})).toBe(true);
  });
});
