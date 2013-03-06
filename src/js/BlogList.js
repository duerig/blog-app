// BlogList.js
//
// List of blogs

/*global define: true */
define(['jquery', 'appnet', 'text!template/BlogItem.html'],
function ($, appnet, blogString) {
  'use strict';

  function BlogList(root, resetCallback)
  {
    this.root = root;
    this.blogTemplate = $(blogString);
    this.timer = null;
    this.resetCallback = resetCallback;
    root.html('<h1>Loading</h1>');
    this.refresh();
  }

  BlogList.prototype.cleanup = function ()
  {
    clearTimeout(this.timer);
  };

  BlogList.prototype.refresh = function ()
  {
    clearTimeout(this.timer);
    this.timer = setTimeout($.proxy(this.refresh, this), 30 * 1000);

    var options = {
      include_annotations: 1,
      channel_types: 'net.blog-app.blog'
    };
    appnet.api.getAllSubscriptions(options, $.proxy(this.processBlogs, this),
                                   $.proxy(this.failBlogs, this));
  };

  BlogList.prototype.processBlogs = function (response)
  {
    var list = $('<ul class="nav nav-pills nav-stacked"/>');
    var i = 0;
    for (i = 0; i < response.data.length; i += 1)
    {
      var item = this.blogTemplate.clone();
      var name = appnet.note.findBlogName(response.data[i]);
      if (! name)
      {
        name = 'Your Blog';
      }
      var link = item.find('#blog-link');
      var context = {
        that: this,
        id: response.data[i].id
      };
      link.attr('href', '#' + response.data[i].id);
      link.click($.proxy(clickBlog, context));
      link.html(name);
      list.append(item);
    }
    this.root.html(list);
  };

  var clickBlog = function (event)
  {
    event.preventDefault();
    window.location.hash = '#' + this.id;
    this.that.resetCallback();
    return false;
  };

  BlogList.prototype.failBlogs = function (meta)
  {
    this.root.html('<h1>Failed:</h1> ' + JSON.stringify(meta));
  };

  return BlogList;

});
