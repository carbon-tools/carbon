'use strict';

/**
 * @fileoverview
 * This is an entry point for a closure-compiler compiled binary.
 * This is still work in progress and will break when compiled in ADVANCED
 * mode because @export annotations are not working as expected for static
 * methods and variables (e.g. Paragraph.Types).
 *
 * We might be forced to drop CommonJS modules syntax all together and just
 * stick to using goog.require and goog.provide to get this to work without
 * having this exportSymbol module and maintaining this manually.
 *
 * ./compile.sh > dist/closure/compiled.js 2> warn.log
 */

// Explicitly require this so closure-compiler doesn't ignore the file because
// of --dependency_mode=STRICT option.
require('./defs');
require('./i18n/en');
require('./i18n/ar');

/* eslint no-unused-vars: 0 */
/* eslint max-len: 0 */

var Component = require('./component');
goog.exportSymbol('carbon.Component', Component);
goog.exportSymbol('carbon.Component.onInstall', Component.onInstall);

goog.exportSymbol('carbon.Article', require('./article'));
goog.exportSymbol('carbon.Editor', require('./editor'));
goog.exportSymbol('carbon.Figure', require('./figure'));
goog.exportSymbol('carbon.I18n', require('./i18n'));
goog.exportSymbol('carbon.Layout', require('./layout'));
goog.exportSymbol('carbon.List', require('./list'));
goog.exportSymbol('carbon.Loader', require('./loader'));

var Paragraph = require('./paragraph');
goog.exportSymbol('carbon.Paragraph', Paragraph);
goog.exportSymbol('carbon.Paragraph.Types', Paragraph.Types);

goog.exportSymbol('carbon.Paragraph', require('./paragraph'));


goog.exportSymbol('carbon.Section', require('./section'));
goog.exportSymbol('carbon.Selection', require('./selection'));


// TODO(mkhatib): Split the following components/extensions to their own modules.
goog.exportSymbol('carbon.GiphySearch', require('./extensions/giphy-search/giphy-search'));
goog.exportSymbol('carbon.LayoutingExtension', require('./extensions/layoutingExtension'));

// Embedding Modules.
goog.exportSymbol('carbon.EmbeddedComponent', require('./extensions/embedding/embeddedComponent'));
goog.exportSymbol('carbon.EmbeddingExtension', require('./extensions/embedding/embeddingExtension'));

// Embedding Providers.
goog.exportSymbol('carbon.AbstractEmbedProvider', require('./extensions/embedding/abstractEmbedProvider'));
goog.exportSymbol('carbon.CarbonEmbedProvider', require('./extensions/embedding/carbonEmbedProvider'));
goog.exportSymbol('carbon.EmbedlyProvider', require('./extensions/embedding/embedlyProvider'));

goog.exportSymbol('carbon.SelfieExtension', require('./extensions/selfieExtension'));
