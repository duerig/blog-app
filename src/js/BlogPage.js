// BlogPage.js
//
// All the information needed to render a single page of the blog

/*global define: true */
define(['jquery', 'marked', 'util', 'appnet', 'js/renderPhotos',
        'text!template/BlogPage.html',
        'text!template/BlogStatus.html',
        'text!template/BlogUpdate.html',
        'text!template/BlogPost.html',
        'text!template/BlogPhotoset.html'],
function ($, marked, util, appnet, renderPhotos,
          pageString, statusString, updateString, postString, photosetString) {
  'use strict';

  function BlogPage(root, blog, isEmbedded, isOwner,
                    olderCallback, newerCallback, permalinkCallback)
  {
    marked.setOptions({ sanitize: true });
    this.root = root;
    this.root.html($(pageString).contents());
    this.statusTemplate = $(statusString);
    this.updateTemplate = $(updateString);
    this.postTemplate = $(postString);
    this.photosetTemplate = $(photosetString);

    this.blog = blog;
    this.isEmbedded = isEmbedded;
    this.isOwner = isOwner;
    this.hasOlder = false;
    this.hasNewer = false;
    this.messages = [];
    this.permalinkCallback = permalinkCallback;
    this.addHeader();
    this.root.find('.older-link').click(function (event) {
      event.preventDefault();
      olderCallback();
      return false;
    });
    this.root.find('.newer-link').click(function (event) {
      event.preventDefault();
      newerCallback();
      return false;
    });
  }

  BlogPage.prototype.render = function ()
  {
    var wrapper = $('<div/>');
    var i = 0;
    for (i = 0; i < this.messages.length; i += 1)
    {
      wrapper.append(this.renderMessage(this.messages[i]));
    }
    this.root.find('#blog-body').html(wrapper.contents());
    if (this.hasOlder)
    {
      this.root.find('.older-link').show();
    }
    else
    {
      this.root.find('.older-link').hide();
    }
    if (this.hasNewer)
    {
      this.root.find('.newer-link').show();
    }
    else
    {
      this.root.find('.newer-link').hide();
    }
    if (this.hasOlder || this.hasNewer)
    {
      this.root.find('.page-wrapper').show();
    }
    else
    {
      this.root.find('.page-wrapper').hide();
    }
  };

  BlogPage.prototype.renderMessage = function (message)
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
    result.find('#time-wrapper').html(new Date(message.created_at).toDateString());
    if (this.permalinkCallback)
    {
      result.find('#permalink').attr('href', '#' + this.blog.id + '/' +
                                     message.id);
      var that = this;
      var id = message.id;
      result.find('#permalink').click(function (event) {
        that.permalinkCallback(id);
      });
    }
    else
    {
      result.find('#permalink').hide();
    }
    var deleteButton = result.find('#delete-button');
    if (! this.isEmbedded && this.isOwner)
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

  BlogPage.prototype.renderStatus = function (status)
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

  BlogPage.prototype.renderUpdate = function (message)
  {
    var result = this.updateTemplate.clone();
    result.find('#post-wrapper').html(message.html);
    return result;
  };

  BlogPage.prototype.renderBlog = function (message, blog)
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

  BlogPage.prototype.renderPhotoset = function (photoset)
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

  BlogPage.prototype.addHeader = function ()
  {
    if (! this.isEmbedded)
    {
      var wrapper = $('<div/>');
      var title = util.htmlEncode(this.blog.title);
      var owner = '';
      if (this.blog.owner)
      {
        owner = '<small>@' + this.blog.owner + '</small>';
      }
      this.root.find('#blog-title').html(title + ' ' + owner);
      this.root.find('#embed-link').attr('href',
                                         'http://blog-app.net/embed.html#' +
                                         this.blog.id);
      var rss = 'http://jonathonduerig.com/my-rss-stream/rss.php?channel=' +
            this.blog.id;
      this.root.find('#rss-link').attr('href', rss);
    }
    else
    {
      this.root.find('#blog-header').remove();
      this.root.find('#blog-body')
        .removeClass('span4')
        .removeClass('offset4');
      this.root.find('#post-hr').remove();
    }
  };

  return BlogPage;
});
