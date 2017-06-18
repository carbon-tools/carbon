/**
 * @fileoverview
 *
 * Provides helper methods to convert HTML to operations to insert the HTML
 * into the article model.
 *
 * Usage:

 * opsFromHtml(html) -> Array<Operations>
 */

var Utils = require('../../utils');
var Paragraph = require('../../paragraph');
var Figure = require('../../figure');
var List = require('../../list');
var dom = require('../../utils/dom');
var Selection = require('../../selection');


/**
 * Sanitizes and generates list of operations to properly insert pasted
 * content into the article.
 *
 * TODO(mkhatib): Probably move this to its own module and
 * make it easier for people to customize or override this with
 * their own sanitizer.
 *
 * @param  {string} html HTML string to sanitize and create ops for.
 * @param {number=} opt_indexOffset
 * @return {Array<../../defs.OperationDef>} List of operations objects that represents the
 * the pasted content.
*/
function opsFromHtml(html, opt_indexOffset) {
  // TODO(mkhatib): MUST sanitize HTML input before doing this to avoid executing
  // scripts or loading external resources. This would include removing scripts,
  // styles and such and rename attributes like src/href to avoid loading resources.
  var tempEl = document.createElement('div');
  tempEl.innerHTML = html || '';
  return opsFromElement_(tempEl, opt_indexOffset);
}
module.exports = opsFromHtml;


/**
 * Sanitizes and generates list of operations to properly insert pasted
 * content into the article.
 *
 * TODO(mkhatib): Probably move this to its own module and
 * make it easier for people to customize or override this with
 * their own sanitizer.
 *
 * @param  {!Element} element HTML Element to sanitize and create ops for.
 * @param {number=} opt_indexOffset
 * @return {Array<../../defs.OperationDef>} List of operations objects that represents the
 * the pasted content.
 */
function opsFromElement_(element, opt_indexOffset) {
  var ops = [];
  var text, paragraphType, appendOperations, newP;
  var textPasted = Utils.getTextFromElement(element);
  var children = element.childNodes;
  var component;
  var selection = Selection.getInstance();
  var currentComponent = selection.getComponentAtStart();
  var section = selection.getSectionAtStart();
  var startParagraphIndex = currentComponent.getIndexInSection();
  var currentIndex = /** @type {number} */ (
      opt_indexOffset || startParagraphIndex);
  var cursor = {
    component: currentComponent.name,
    offset: selection.end.offset,
  };


  if (!children || !children.length ||
      (dom.isInlineElements(children) &&
       dom.hasOnlyInlineChildNodes(element))) {
    textPasted = textPasted.replace(/StartFragment/gi, '')
        .replace(/EndFragment/gi, '');
    var lines = textPasted.split('\n');
    if (lines.length < 2) {
      // Text before and after pasting.
      var textStart = currentComponent.text.substring(
          0, selection.start.offset);

      // Calculate cursor offset before pasting.
      var offsetBeforeOperation = textStart.length;

      Utils.arrays.extend(ops, currentComponent.getInsertCharsOps(
          textPasted, offsetBeforeOperation));
    } else {
      // TODO(mkhatib): Maybe allow pasting new lined paragraphs once we
      // have better support for it.
      for (var lineNum = 0; lineNum < lines.length; lineNum++) {
        if (lines[lineNum].trim().length > 0) {
          newP = new Paragraph({
            section: section,
            text: lines[lineNum],
          });
          Utils.arrays.extend(
              ops, newP.getInsertOps(currentIndex++, cursor));
        }
      }
    }
  } else if (dom.hasOnlyInlineChildNodes(element)) {
    text = Utils.getTextFromElement(element);
    text = text.replace(/StartFragment/gi, '')
        .replace(/EndFragment/gi, '');

    newP = new Paragraph({
      section: section,
      text: text,
      // TODO(mkhatib): How to do this without coupling on formatting extension.
      // formats: FormattingExtension.generateFormatsForNode(element),
    });
    Utils.arrays.extend(
        ops, newP.getInsertOps(currentIndex++, cursor));
  } else {
    // When pasting multi-line, split the current paragraph if pasting
    // mid-paragraph.
    if (!selection.isCursorAtEnding()) {
      Utils.arrays.extend(ops, currentComponent.getSplitOpsAt(selection, 0));
      currentIndex++;
    }
    for (var i = 0; i < children.length; i++) {
      var el = /** @type {Element} */ (children[i]);
      var tag = el.nodeName && el.nodeName.toLowerCase();
      switch (tag) {
        // These tags are currently unsupported for paste and are stripped out.
        case 'undefined':
        case 'meta':
        case 'script':
        case 'style':
        case 'embed':
        case 'br':
        case 'hr':
          continue;
        case 'figure':
          var allImgs = el.getElementsByTagName('img');
          if (!allImgs || !allImgs.length) {
            continue;
          }
          for (var j = 0; j < allImgs.length; j++) {
            component = new Figure({
              src: allImgs[j].getAttribute('src'),
            });
            component.section = selection.getSectionAtEnd();
            Utils.arrays.extend(
                ops, component.getInsertOps(currentIndex++, cursor));
          }
          paragraphType = null;
          break;
        case 'img':
          component = new Figure({
            src: el.getAttribute('src'),
          });
          component.section = selection.getSectionAtEnd();
          Utils.arrays.extend(
              ops, component.getInsertOps(currentIndex++, cursor));
          paragraphType = null;
          break;
        case 'ul':
        case 'ol':
          var tagName = List.UNORDERED_LIST_TAG;
          if (tag === 'ol') {
            tagName = List.ORDERED_LIST_TAG;
          }
          var lis = el.getElementsByTagName('li');
          if (!lis || !lis.length) {
            continue;
          }
          component = new List({
            tagName: tagName,
            components: [],
          });
          component.section = selection.getSectionAtEnd();
          Utils.arrays.extend(
              ops, component.getInsertOps(currentIndex++, cursor));
          for (j = 0; j < lis.length; j++) {
            var liText = Utils.getTextFromElement(lis[j]);
            liText = liText.replace(/StartFragment/gi, '')
                .replace(/EndFragment/gi, '');
            newP = new Paragraph({
              paragraphType: Paragraph.Types.ListItem,
              text: liText,
              // TODO(mkhatib): How to do this without coupling on formatting extension.
              // formats: FormattingExtension.generateFormatsForNode(lis[j]),
            });
            newP.section = component;
            Utils.arrays.extend(
                ops, newP.getInsertOps(j, cursor));
          }
          paragraphType = null;
          break;
        case 'p':
        case '#text':
          paragraphType = Paragraph.Types.Paragraph;
          break;
        case 'blockquote':
          paragraphType = Paragraph.Types.Quote;
          break;
        case 'h1':
          paragraphType = Paragraph.Types.MainHeader;
          break;
        case 'h2':
          paragraphType = Paragraph.Types.SecondaryHeader;
          break;
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          paragraphType = Paragraph.Types.ThirdHeader;
          break;
        case 'pre':
          paragraphType = Paragraph.Types.Code;
          break;
        default:
          // To preserve inline styling.
          if (dom.hasOnlyInlineChildNodes(el)) {
            // TODO(mkhatib): This is here to preserve inline styling, which
            // is currently unsupported by the editor. Once this is added
            // change this to reflect that. Currently just add a non-styled
            // paragraph.
            paragraphType = Paragraph.Types.Paragraph;
          } else {
            // In case there are still more block elements, recursively get
            // their operations and add them to the operations list.

            // TODO(mkhatib): This is very clumsy and not very readable, move
            // the recursive process to its own helper method and make it more
            // readable.
            appendOperations = opsFromElement_(el, currentIndex);

            // Increase the currentIndex by the amount of paragraphs we've added
            // which is the amount of operations.
            currentIndex += appendOperations.length;
          }
      }

      if (appendOperations) {
        Utils.arrays.extend(ops, appendOperations);
        appendOperations = null;
      } else if (paragraphType) {
        // Add an operation to insert new paragraph and update its text.
        text = Utils.getTextFromElement(el);
        text = text.replace(/StartFragment/gi, '')
            .replace(/EndFragment/gi, '');
        if (!text || text.trim().length < 1) {
          continue;
        }
        newP = new Paragraph({
          section: section,
          text: text,
          paragraphType: paragraphType,
          // TODO(mkhatib): How to do this without coupling on formatting extension.
          // formats: FormattingExtension.generateFormatsForNode(el),
        });
        Utils.arrays.extend(
            ops, newP.getInsertOps(currentIndex++, cursor));
      }
    }
  }
  return ops;
};
