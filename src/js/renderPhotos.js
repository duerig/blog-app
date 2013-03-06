// renderPhotos.js
//
// Render many images into a single mosaic

/*global define: true */
define(['jquery', 'text!template/BlogPhoto.html'],
function ($, photoString) {
  'use strict';

  var photoTemplate = $(photoString);

  function renderPhotos(minX, unit, photos)
  {
    var result = $('<div/>');
    var maxY = 0;
    result.addClass('static-photoset');
    var i = 0;
    for (i = 0; i < photos.length; i += 1)
    {
      if (photos[i].y + photos[i].height > maxY)
      {
        maxY = photos[i].y + photos[i].height;
      }
      var link = $('<a target=_blank/>');
      link.attr('href', photos[i].info.url);
      var tag = $('<div/>');
      tag.css('background-image', 'url("' + photos[i].info.url + '")');
      tag.css('background-position', 'center');
      tag.css('background-size', 'cover');
      tag.css('position', 'absolute');
      tag.css('left', findPos(photos[i].x - minX, unit) + 'px');
      tag.css('top', findPos(photos[i].y - 1, unit) + 'px');
      tag.css('width', (findPos(photos[i].width, unit) - 10) + 'px');
      tag.css('height', (findPos(photos[i].height, unit) - 10) + 'px');
      link.append(tag);
      result.append(link);
    }
    result.css('height', (findPos(maxY - 1, unit) - 10) + 'px');
    return result;
  }

  function findPos(dim, unit)
  {
    var result = 0;
    if (dim > 0)
    {
      result = dim * unit + dim * 10;
    }
    return result;
  }

  return renderPhotos;
});
