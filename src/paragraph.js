'use strict';


/**
 * Paragraph main.
 */
var Paragraph = function() {
  this.text = '';

  this.markups = [];

  this.metadata = {};

  this.layout = {};

  this.section = null;

  this.paragraphType = Paragraph.Types.Paragraph;
};
module.exports = Paragraph;

// TODO(mkhatib): Maybe define each type as a new function
// instead of putting all the logic for rendering all of these
// under Paragraph.
Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Media: 'figure',
  Embed: 'embed',
  Iframe: 'iframe'
};


Paragraph.prototype.dom = function() {
  var paragraphElement = document.createElement(this.paragraphType);
  paragraphElement.innerText = this.text;
  return paragraphElement;
};
