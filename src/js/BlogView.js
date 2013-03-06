// BlogView.js
//
// Main window for viewing a single blog stream

/*global define: true */
define(['jquery', 'marked', 'util', 'appnet', 'js/PostForm', 'js/renderPhotos',
        'text!template/BlogView.html',
        'text!template/BlogStatus.html',
        'text!template/BlogUpdate.html',
        'text!template/BlogPost.html',
        'text!template/BlogPhotoset.html'],
function ($, marked, util, appnet, PostForm, renderPhotos, viewString,
          statusString, updateString, postString, photosetString) {
  'use strict';

  function BlogView(root, channelId, isEmbedded)
  {
    marked.setOptions({ sanitize: true });
    this.root = root;
    this.root.html($(viewString).contents());
    if (! isEmbedded)
    {
      this.root.find('#blog-body').html('<h1>Loading Channel</h1>');
    }
    else
    {
      this.root.find('#blog-header').remove();
      this.root.find('#blog-body')
        .removeClass('span4')
        .removeClass('offset4');
      this.root.find('#post-hr').remove();
    }
    this.channelId = channelId;
    this.isEmbedded = isEmbedded;
    this.timer = null;
    this.statusTemplate = $(statusString);
    this.updateTemplate = $(updateString);
    this.postTemplate = $(postString);
    this.photosetTemplate = $(photosetString);
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
      this.addHeader();
    }
    this.refresh();
  };

  BlogView.prototype.refresh = function ()
  {
    clearTimeout(this.timer);
//    this.timer = setTimeout($.proxy(this.refresh, this), 60 * 1000);
    var options = {
      include_annotations: 1,
      include_deleted: 0,
      include_machine: 1,
      count: 200
    };
    appnet.api.getMessages(this.channelId, options,
                           $.proxy(this.processMessages, this),
                           $.proxy(this.failInit, this));
  };

  BlogView.prototype.processMessages = function (response)
  {
    var wrapper = $('<div/>');
    var i = 0;
    for (i = 0; i < response.data.length; i += 1)
    {
      wrapper.append(this.renderMessage(response.data[i]));
    }
    this.root.find('#blog-body').html(wrapper.contents());
  };

  BlogView.prototype.failInit = function (meta)
  {
    this.root.html('<h1>Failed</h1>');
  };

  BlogView.prototype.renderMessage = function (message)
  {
    var result = $('<div/>');
    var status = appnet.note.findBlogStatus(message);
    var blog = appnet.note.findBlogPost(message);
    var photoset = appnet.note.findBlogPhotoset(message);
    if (status)
    {
      result = this.renderStatus(status);
    }
    else if (blog)
    {
      result = this.renderBlog(message, blog);
    }
    else if (photoset)
    {
      result = this.renderPhotoset(photoset);
    }
    else
    {
      result = this.renderUpdate(message);
    }
    var deleteButton = result.find('#delete-button');
    if (! this.isEmbedded && this.isOwner())
    {
      deleteButton.attr('data-id', message.id);
      deleteButton.click($.proxy(this.clickDelete, this));
    }
    else
    {
      deleteButton.remove();
    }
    return result;
  };

  BlogView.prototype.renderStatus = function (status)
  {
    var result = this.statusTemplate.clone();
    if (status.text)
    {
      var text = result.find('#status-text');
      text.html(util.htmlEncode(status.text));
    }
    var regex = /^#[0-9a-fA-F]+$/;
    result.css('width', '100%');
    result.css('text-align', 'center');
    if (status.color && regex.test(status.color))
    {
      result.css('background-color', status.color);
    }
    return result;
  };

  BlogView.prototype.renderUpdate = function (message)
  {
    var result = this.updateTemplate.clone();
    result.find('#post-wrapper').html(message.html);
    result.find('#time-wrapper').html(new Date(message.created_at).toDateString());
    return result;
  };

  BlogView.prototype.renderBlog = function (message, blog)
  {
    var result = this.postTemplate.clone();
    var title = 'Untitled';
    if (blog.title)
    {
      title = util.htmlEncode(blog.title);
    }
    var body = '';
    if (blog.body)
    {
      if (blog.format && blog.format === 'markdown')
      {
        body = marked(blog.body);
      }
      else
      {
        body = util.htmlEncode(blog.body);
      }
    }
    result.find('#time-wrapper').html(new Date(message.created_at).toDateString());
    result.find('#title-wrapper').html(title);
    if (blog.summary)
    {
      result.find('#summary-wrapper').html(util.htmlEncode(blog.summary));
    }
    else
    {
      result.find('#summary-wrapper').remove();
    }
    result.find('#body-wrapper').html(body);
    return result;
  };

  BlogView.prototype.renderPhotoset = function (photoset)
  {
    var title = 'Untitled';
    if (photoset.title)
    {
      title = util.htmlEncode(photoset.title);
    }
    var caption = '';
    if (photoset.caption)
    {
      caption = util.htmlEncode(photoset.caption);
    }
    var minX = 100;
    var maxX = 0;
    var i = 0;
    if (photoset.photos)
    {
      for (i = 0; i < photoset.photos.length; i += 1)
      {
        if (photoset.photos[i].x < minX)
        {
          minX = photoset.photos[i].x;
        }
        if (photoset.photos[i].x + photoset.photos[i].width > maxX)
        {
          maxX = photoset.photos[i].x + photoset.photos[i].width;
        }
      }
    }
    var width = maxX - minX;
    var result = this.photosetTemplate.clone();
    result.find('#title-wrapper').html(title);
    result.find('#caption-wrapper').html(caption);
    if (width > 0)
    {
      var base = (this.root.find('#blog-body').width() - (width - 1) * 10) /  width;
      result.find('.photogrid').append(renderPhotos(minX, base, photoset.photos));
    }
    return result;
  };

  BlogView.prototype.addHeader = function ()
  {
    var wrapper = $('<div/>');
    var title = util.htmlEncode(appnet.note.findBlogName(this.channel));
    var owner = '<small>@' + this.channel.owner.username + '</small>';
    this.root.find('#blog-title').html(title + ' ' + owner);
    this.root.find('#embed-link').attr('href',
                                       'http://blog-app.net/embed.html#' +
                                       this.channelId);
    this.root.find('#rss-link').attr('href',
                                     'http://jonathonduerig.com/my-rss-stream/rss.php?channel=' +
                                     this.channelId);
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

  BlogView.prototype.isOwner = function ()
  {
    return appnet.user && appnet.user.id === this.channel.owner.id;
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
