// BlogView.js
//
// Main window for viewing a single blog stream

/*global define: true */
define(['jquery', 'util', 'appnet', 'js/PostForm', 'js/BlogPage',
        'js/BlogInfo',
        'text!template/BlogView.html'],
function ($, util, appnet, PostForm, BlogPage, BlogInfo, viewString) {
  'use strict';

  function BlogView(root, channelId, messageId, isEmbedded)
  {
    this.root = root;
    this.root.html($(viewString).contents());
    this.channelId = channelId;
    this.isEmbedded = isEmbedded;
    this.minId = null;
    this.maxId = null;
    if (messageId)
    {
      this.maxId = (parseInt(messageId, 10) + 1) + '';
    }
    this.timer = null;
    if (! this.isEmbedded)
    {
      this.root.find('#blog-page').html('<h1>Loading Channel</h1>');
    }
    appnet.api.getChannel(this.channelId, { include_annotations: 1 },
                          $.proxy(this.processChannel, this),
                          $.proxy(this.failInit, this));
  }

  BlogView.prototype.cleanup = function ()
  {
    clearTimeout(this.timer);
  };

  BlogView.prototype.processChannel = function (response)
  {
    this.channel = response.data;
    this.suffix = ' \n\n' + appnet.note.findBlogName(this.channel) + ' <=>';
    if (! this.isEmbedded)
    {
      this.initForm();
    }
    this.initPage();
    this.refresh();
  };

  BlogView.prototype.initForm = function ()
  {
    if (this.isOwner())
    {
      this.form = new PostForm({
        root: this.root.find('#post-form'),
        channelId: this.channelId,
        suffix: this.suffix,
        postStatus: $.proxy(this.postStatus, this),
        postUpdate: $.proxy(this.postUpdate, this),
        broadcastUpdate: $.proxy(this.broadcastUpdate, this),
        postBlog: $.proxy(this.postBlog, this),
        broadcastBlog: $.proxy(this.broadcastBlog, this),
        postPhoto: $.proxy(this.postPhoto, this),
        broadcastPhoto: $.proxy(this.broadcastPhoto, this)
      });
    }
    else
    {
      this.root.find('#post-form').remove();
      this.root.find('#post-hr').remove();
    }
  };

  BlogView.prototype.initPage = function ()
  {
    this.page = new BlogPage(this.root.find('#blog-page'),
                             new BlogInfo(this.channel),
                             this.isEmbedded, this.isOwner(),
                             $.proxy(this.older, this),
                             $.proxy(this.newer, this),
                             $.proxy(this.permalink, this));
  };

  BlogView.prototype.older = function ()
  {
    this.maxId = this.minId;
    this.minId = null;
    this.refresh();
  };

  BlogView.prototype.newer = function ()
  {
    this.minId = this.maxId;
    this.maxId = null;
    this.refresh();
  };

  BlogView.prototype.permalink = function (id)
  {
    this.maxId = (parseInt(id, 10) + 1) + '';
    this.minId = null;
    this.refresh();
  };

  BlogView.prototype.refresh = function ()
  {
    clearTimeout(this.timer);
    $(window).scrollTop(0);
//    this.timer = setTimeout($.proxy(this.refresh, this), 60 * 1000);
    var options = {
      include_annotations: 1,
      include_deleted: 0,
      include_machine: 1,
      count: 10
    };
    if (this.maxId)
    {
      options.count = 10;
      options.before_id = this.maxId;
    }
    else if (this.minId)
    {
      options.count = -10;
      options.since_id = this.minId;
    }
    appnet.api.getMessages(this.channelId, options,
                           $.proxy(this.processMessages, this),
                           $.proxy(this.failInit, this));
  };

  BlogView.prototype.processMessages = function (response)
  {
    if (! this.minId && ! this.maxId)
    {
      // Initial lookup
      this.page.hasNewer = false;
      this.page.hasOlder = response.meta.more;
    }
    else if (! this.minId)
    {
      // Looking Forward
      this.page.hasNewer = true;
      this.page.hasOlder = response.meta.more;
    }
    else if (! this.maxId)
    {
      // Looking Backward
      this.page.hasNewer = response.meta.more;
      this.page.hasOlder = true;
    }
    this.minId = response.meta.min_id;
    this.maxId = response.meta.max_id;
    this.page.messages = response.data;
    this.page.render();
  };

  BlogView.prototype.failInit = function (meta)
  {
    this.root.html('<h1>Failed</h1>');
  };

  BlogView.prototype.isOwner = function ()
  {
    return appnet.user && this.channel &&
      appnet.user.id === this.channel.owner.id;
  };

  BlogView.prototype.postStatus = function (text, color)
  {
    var message = {
      machine_only: true,
      annotations: [{
        type: 'net.blog-app.status',
        value: {
          text: text,
          color: htmlColor(color)
        }
      }]
    };
    appnet.api.createMessage(this.channelId, message, {},
                             $.proxy(this.refresh, this), null);
  };

  BlogView.prototype.postUpdate = function (text)
  {
    var message = {
      text: text
    };
    appnet.api.createMessage(this.channelId, message, {},
                             $.proxy(this.refresh, this), null);
  };

  BlogView.prototype.postBlog = function (title, summary, text)
  {
    this.sendBlog(title, summary, text, $.proxy(this.refresh, this));
  };

  BlogView.prototype.broadcastBlog = function (title, summary, text)
  {
    this.sendBlog(title, summary, text, $.proxy(this.broadcast, this));
  };

  BlogView.prototype.sendBlog = function (title, summary, text, success)
  {
    var note = {
      format: 'markdown',
      body: text,
      title: title
    };
    if (summary !== '')
    {
      note.summary = summary;
    }
    var message = {
      text: title + ': \n\n' + summary,
      annotations: [{
        type: 'net.jazzychad.adnblog.post',
        value: note
      }]
    };
    appnet.api.createMessage(this.channelId, message,
                             { include_annotations: 1 },
                             success, null);
  };

  BlogView.prototype.broadcastPhoto = function (title, caption, photos)
  {
    this.sendPhoto(title, caption, photos, $.proxy(this.broadcast, this));
  };

  BlogView.prototype.postPhoto = function (title, caption, photos)
  {
    this.sendPhoto(title, caption, photos, $.proxy(this.refresh, this));
  };

  BlogView.prototype.sendPhoto = function (title, caption, photos, success)
  {
    var note = {
      title: title,
      caption: caption,
      photos: photos
    };
    var message = {
      text: title + ': \n\n' + caption,
      annotations: [{
        type: 'net.blog-app.photoset',
        value: note
      }]
    };
    appnet.api.createMessage(this.channelId, message,
                             { include_annotations: 1 },
                             success, null);
  };

  BlogView.prototype.broadcastUpdate = function (text)
  {
    var message = {
      text: text
    };
    appnet.api.createMessage(this.channelId, message, {},
                             $.proxy(this.broadcast, this), null);
  };

  BlogView.prototype.broadcast = function (response)
  {
    var url = 'http://blog-app.net/#' + this.channelId + '/' +
          response.data.id;
    var links = response.data.entities.links.slice(0);
    var invite = {
      type: 'net.app.core.channel.invite',
      value: {
        channel_id: this.channelId
      }
    };
    var crosspost = {
      type: 'net.app.core.crosspost',
      value: {
        canonical_url: url
      }
    };
    var cutoff = 256 - this.suffix.length;
    var text = response.data.text;
    if (text.length > cutoff)
    {
      text = text.substr(0, cutoff - 3) + '...';
    }
    text = text + this.suffix;
    links.push({
      text: '<=>',
      url: url,
      pos: text.length - 3,
      len: 3
    });
    var post = {
      text: text,
      annotations: [invite, crosspost],
      entities: { links: links }
    };
    appnet.api.createPost(post, {}, $.proxy(this.refresh, this), null);
    appnet.api.createMessage('8093', post, {}, null, null);
  };

  BlogView.prototype.clickDelete = function (event)
  {
    event.preventDefault();
    var message = event.target.dataset.id;
    appnet.api.deleteMessage(this.channelId, message, {},
                             $.proxy(this.refresh, this),
                             $.proxy(this.refresh, this));
    return false;
  };

  var colors = {
    Blue: '#ccccff',
    White: '#ffffff',
    Grey: '#cccccc',
    Red: '#ffcccc',
    Yellow: '#ffffcc',
    Green: '#ccffcc',
    Purple: '#ffccff',
    Cyan: '#ccffff'
  };

  function htmlColor(color)
  {
    var result = null;
    if (colors[color])
    {
      result = colors[color];
    }
    return result;
  }

  return BlogView;

});
