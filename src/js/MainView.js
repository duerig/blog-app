// MainView.js
//
// Main window for viewing blog list

/*global define: true */
define(['jquery', 'appnet', 'js/BlogList', 'text!template/MainView.html'],
function ($, appnet, BlogList, mainString) {
  'use strict';

  function MainView(root, resetCallback)
  {
    this.root = root;
    root.html(mainString);
    this.blogList = new BlogList(root.find('#blog-list'), resetCallback);
    root.find('#create-blog').submit($.proxy(this.createBlog, this));
  }

  MainView.prototype.cleanup = function ()
  {
    this.blogList.cleanup();
  };

  MainView.prototype.createBlog = function (event)
  {
    event.preventDefault();
    var nameField = this.root.find('#create-name');
    if (nameField.val() !== '')
    {
      var newChannel = {
        auto_subscribe: true,
        type: 'net.blog-app.blog',
        readers: { 'public': true },
        annotations: [{
          type: 'net.blog-app.settings',
          value: { name: nameField.val() }
        }]
      };
      appnet.api.createChannel(newChannel, { include_annotations: 1 },
                               $.proxy(this.completeCreateBlog, this),
                               failCreateBlog);
      nameField.val('');
    }
    return false;
  };

  MainView.prototype.completeCreateBlog = function (response)
  {
    this.blogList.refresh();
  };

  function failCreateBlog(meta)
  {
  }

  return MainView;

});
