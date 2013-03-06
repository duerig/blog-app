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
    var channelId = parseHash(window.location.hash);
    if (channelId)
    {
      view = new BlogView($('#main-content'), channelId, true);
    }
    else
    {
      $('#main-content').html('<h1>Failed to parse hash</h1>');
    }
  }

  function parseHash(hash)
  {
    var result = null;
    var regex = /^#([0-9]+)/;
    var match = regex.exec(hash);
    if (match)
    {
      result = match[1];
    }
    return result;
  }

  $(document).ready(initialize);

});
