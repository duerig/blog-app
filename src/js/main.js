// main.js
//
// Viewing and editing blogs

/*global require: true */
require(['jquery', 'util', 'appnet', 'js/MainView', 'js/BlogView', 'bootstrap'],
function ($, util, appnet, MainView, BlogView) {
  'use strict';

  var view;

  function initialize()
  {
    $('#logout-button').click(clickLogout);
    $('#main-content').html('<h1>Loading</h1>');
    appnet.init('blogToken', 'blogPrevUrl');
    if (appnet.isLogged())
    {
      appnet.updateUser(reset, failUser);
    }
    else
    {
      $('#logout-button').html('Login');
      reset();
    }
  }

  function failUser()
  {
    console.log('FailUser');
    window.alert('Failed to find user. Please reload.');
  }

  function reset()
  {
    if (view)
    {
      view.cleanup();
      view = null;
    }
    var channelId = parseHash(window.location.hash);
    if (channelId)
    {
      view = new BlogView($('#main-content'), channelId, false);
    }
    else
    {
      if (appnet.isLogged())
      {
        view = new MainView($('#main-content'), reset);
      }
      else
      {
        appnet.api.authorize();
      }
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

  function clickLogout(event)
  {
    event.preventDefault();
    if (appnet.isLogged())
    {
      delete localStorage.blogToken;
      window.location.reload(true);
    }
    else
    {
      appnet.api.authorize();
    }
    return false;
  }

  $(document).ready(initialize);

});
