'use strict';

/* eslint max-len: 0 */
// Explicitly require this so closure-compiler doesn't ignore the file because
// of --dependency_mode=STRICT option.
// This is only needed if using Closure Compiler.
// require('./defs');

// TODO(mkhatib): Figure out a better way to load translations lazily.
module.exports.I18n = require('./i18n');
require('./i18n/en');
require('./i18n/ar');

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.List = require('./list');
module.exports.Figure = require('./figure');
module.exports.Section = require('./section');
module.exports.Layout = require('./layout');
module.exports.Selection = require('./selection');
module.exports.Loader = require('./loader');

module.exports.AbstractExtension = require('./core/abstract-extension');

module.exports.ui = {
  toolbars: require('./toolbars'),
};

/**
 * Not exporting these as part of carbon.js but available for anybody to use.
 *
 * EmbeddingExtension, EmbeddedComponent along with EmbedlyProvider provide
 * support to a much larger providers base (incl. YouTube, Vine, Vimeo).
 *
 * module.exports.YouTubeComponent = require('./extensions/youtubeComponent');
 * module.exports.VineComponent = require('./extensions/vineComponent');
 * module.exports.VimeoComponent = require('./extensions/vimeoComponent');
 *
 */

// TODO(mkhatib): Find a better way to expose the classes and without making
// them part of the whole editor Javascript.
module.exports.GiphySearch = require('./extensions/giphy-search/giphy-search');

module.exports.FormattingExtension = require('./extensions/formattingExtension');
module.exports.ToolbeltExtension = require('./extensions/toolbeltExtension');

// Embedding extension.
// The old EmbeddedComponent is messy with calculating the width/height magic.
// For now switching to noMagicEmbeddedComponent.
// module.exports.EmbeddedComponent = require('./extensions/embedding/embeddedComponent');
module.exports.EmbeddedComponent = require('./extensions/embedding/noMagicEmbeddedComponent');
module.exports.AbstractEmbedProvider = require('./extensions/embedding/abstractEmbedProvider');
module.exports.EmbedlyProvider = require('./extensions/embedding/embedlyProvider');
module.exports.NoembedProvider = require('./extensions/embedding/noembedProvider');
module.exports.CarbonEmbedProvider = require('./extensions/embedding/carbonEmbedProvider');
module.exports.EmbeddingExtension = require('./extensions/embedding/embeddingExtension');

module.exports.CarbonParser = require('./extensions/link-embedding/carbon-parser/carbon-parser');
module.exports.EmbeddedLinkComponent = require('./extensions/link-embedding/embedded-link-component');
module.exports.LinkEmbeddingExtension = require('./extensions/link-embedding/link-embedding');

module.exports.SelfieExtension = require('./extensions/selfieExtension');

module.exports.LayoutingExtension = require('./extensions/layoutingExtension');


// Upload-related Extensions.
module.exports.UploadManager = require('./extensions/uploading/upload-manager');
module.exports.CarbonUpUploader = require('./extensions/uploading/carbon-up-uploader/carbon-up-uploader');
module.exports.FilePicker = require('./extensions/file-picker/file-picker');
module.exports.DragDropFiles = require('./extensions/drag-drop-files/drag-drop-files');


module.exports.CodeEditingExtension = require('./extensions/code-editing/code-editing');
module.exports.MonacoEditor = require('./extensions/code-editing/editors/monaco-editor/monaco-editor');
