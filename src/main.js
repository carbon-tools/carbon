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

// Embedding extension.
module.exports.EmbeddedComponent = require('./extensions/embedding/embeddedComponent');
module.exports.AbstractEmbedProvider = require('./extensions/embedding/abstractEmbedProvider');
module.exports.EmbedlyProvider = require('./extensions/embedding/embedlyProvider');
module.exports.CarbonEmbedProvider = require('./extensions/embedding/carbonEmbedProvider');
module.exports.EmbeddingExtension = require('./extensions/embedding/embeddingExtension');

module.exports.SelfieExtension = require('./extensions/selfieExtension');

module.exports.LayoutingExtension = require('./extensions/layoutingExtension');


// Upload-related Extensions.
module.exports.UploadManager = require('./extensions/uploading/upload-manager');
module.exports.CarbonUpUploader = require('./extensions/uploading/carbon-up-uploader/carbon-up-uploader');
module.exports.FilePicker = require('./extensions/file-picker/file-picker');
