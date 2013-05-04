// embed.js
//
// Viewer for blogs intended to be embedded in an iframe

/*global require: true */
require(['jquery', 'js/BlogView', 'bootstrap'],
function ($, BlogView) {
  'use strict';

  var view;

  function initialize()
  {
    $('#main-content').html('');
    var ids;
    if (window.blogapp_id) {
      if (window.blogapp_post) {
        ids = [window.blogapp_id, window.blogapp_post];
      } else {
        ids = [window.blogapp_id];
      }
    } else {
      ids = parseHash(window.location.hash);
    }
    if (ids.length > 0)
    {
      view = new BlogView($('#main-content'), ids[0], ids[1], true);
    }
    else
    {
      $('#main-content').html('<h1>Failed to parse hash</h1>');
    }
  }

  function parseHash(hash)
  {
    var result = [];
    var regex = /^#([0-9]+)\/([0-9]+)/;
    var match = regex.exec(hash);
    if (match)
    {
      result = [match[1], match[2]];
    }
    else
    {
      regex = /^#([0-9]+)/;
      match = regex.exec(hash);
      if (match)
      {
        result = [match[1]];
      }
    }
    return result;
  }

  $(document).ready(initialize);

});
