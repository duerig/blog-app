// MainView.js
//
// Main window for viewing blog list

/*global define: true */
define(['jquery', 'appnet', 'js/BlogList', 'js/BlogInfo', 'js/BlogPage',
        'text!template/MainView.html'],
function ($, appnet, BlogList, BlogInfo, BlogPage, mainString) {
  'use strict';

  function MainView(root, resetCallback)
  {
    this.root = root;
    root.html(mainString);
    this.blogList = new BlogList(root.find('#blog-list'), resetCallback);
    root.find('#create-blog').submit($.proxy(this.createBlog, this));
    var info = new BlogInfo(null);
    info.reset('8093', null, 'Recent Broadcasts');
    this.page = new BlogPage(this.root.find('#blog-recent'),
                             info, true, false, null, null, null);
    var options = {
      include_annotations: 1,
      include_deleted: 0,
      include_machine: 1,
      count: 20
    };
    appnet.api.getMessages(info.id, options,
                           $.proxy(this.recentMessages, this),
                           null);
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

  MainView.prototype.recentMessages = function (response)
  {
    this.page.messages = response.data;
    this.page.render();
  };

  return MainView;

});
