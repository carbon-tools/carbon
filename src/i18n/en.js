'use strict';

var I18n = require('../i18n');

/* eslint max-len: 0 */

// Caption placeholders.
I18n.set('en', 'placeholder.figure' , 'Enter caption for image (optional)');
I18n.set('en', 'placeholder.embed' , 'Enter caption for embed (optional)');
I18n.set('en', 'placeholder.href' , 'What is the URL?');
I18n.set('en', 'placeholder.video' , 'Paste a link for YouTube, Vine, FB Video, SoundCloud and others.');
I18n.set('en', 'placeholder.photo' , 'Paste a link for a photo, FB photo, Instagram and others.');
I18n.set('en', 'placeholder.post' , 'Paste a link for a Facebook post, Tweet, Github Gist and others.');
I18n.set('en', 'placeholder.gif' , 'Type /giphy <search-term> (enter) or paste a link to giphy or gif image url.');
I18n.set('en', 'placeholder.quiz' , 'Paste a link to qzzr.com or slideshare or others.');

// Toolbelt Buttons.
I18n.set('en', 'button.upload' , 'Upload Photo');
I18n.set('en', 'button.video' , 'Insert Video');
I18n.set('en', 'button.photo' , 'Insert Photo by URL');
I18n.set('en', 'button.post' , 'Embed Post');
I18n.set('en', 'button.gif' , 'Insert GIF');
I18n.set('en', 'button.quiz' , 'Insert Quiz or Slides');
I18n.set('en', 'button.selfie' , 'Selfie!');
I18n.set('en', 'button.code' , 'Code');
I18n.set('en', 'button.attachment.retry' , 'Retry Upload');

I18n.set('en', 'button.icon.upload' , 'fa fa-upload');
I18n.set('en', 'button.icon.video' , 'fa fa-youtube-play');
I18n.set('en', 'button.icon.photo' , 'fa fa-picture-o');
I18n.set('en', 'button.icon.post' , 'fa fa-twitter');
I18n.set('en', 'button.icon.gif' , 'fa fa-child');
I18n.set('en', 'button.icon.quiz' , 'fa fa-question');
I18n.set('en', 'button.icon.selfie' , 'fa fa-camera');
I18n.set('en', 'button.icon.code' , 'fa fa-code');

// Layouting Toolbar Buttons.
I18n.set('en', 'button.layout.single' , 'Column');
I18n.set('en', 'button.layout.bleed' , 'Shelf');
I18n.set('en', 'button.layout.staged' , 'Stage');
I18n.set('en', 'button.layout.left' , 'Left');
I18n.set('en', 'button.layout.right' , 'Right');
I18n.set('en', 'button.layout.grid' , 'Grid');
I18n.set('en', 'button.layout.delete' , 'Delete');

I18n.set('en', 'button.layout.icon.single' , 'fa fa-align-justify');
I18n.set('en', 'button.layout.icon.bleed' , 'fa fa-arrows-h');
I18n.set('en', 'button.layout.icon.staged' , 'fa fa-desktop');
I18n.set('en', 'button.layout.icon.left' , 'fa fa-align-left');
I18n.set('en', 'button.layout.icon.right' , 'fa fa-align-right');
I18n.set('en', 'button.layout.icon.grid' , 'fa fa-th');
I18n.set('en', 'button.layout.icon.delete' , 'fa fa-trash-o');

I18n.set('en', 'regex.giphy', '^\\+giphy\\s(.+[a-zA-Z])$');
I18n.set('en', 'regex.selfie', '^\\+selfie$');

I18n.set('en', 'label.attachment.pending', 'Pending...');
I18n.set('en', 'label.attachment.error', 'Upload Failed!');

I18n.set('en', 'label.embeddedLink.titlePending', 'Loading title...');
I18n.set('en', 'label.embeddedLink.descriptionPending', 'Loading description...');
