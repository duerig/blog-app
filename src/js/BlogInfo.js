// BlogInfo.js
//
// Information about a blog

/*global define: true */
define(['appnet'],
function (appnet) {
  'use strict';

  function BlogInfo(channel)
  {
    if (channel)
    {
      this.id = channel.id;
      this.owner = null;
      if (channel.owner)
      {
        this.owner = channel.owner.username;
      }
      this.title = appnet.note.findBlogName(channel);
    }
    else
    {
      this.id = null;
      this.owner = null;
      this.title = null;
    }
  }

  BlogInfo.prototype.reset = function (id, owner, title)
  {
    this.id = id;
    this.owner = owner;
    this.title = title;
  };

  return BlogInfo;
});
