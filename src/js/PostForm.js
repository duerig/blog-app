// PostForm.js
//
// Form for creating statuses, updates, posts, and photoblogs

/*global define: true */
define(['jquery', 'appnet',
        'text!template/PostForm.html',
        'text!template/ImageView.html',
        'jquery-ui', 'gridster', 'bootstrap'],
function ($, appnet, postFormString, imageViewString) {
  'use strict';

  var STATUS = 0;
  var UPDATE = 1;
  var BLOG = 2;
  var PHOTOSET = 3;

  function PostForm(options)
  {
    this.type = STATUS;
    this.root = options.root;
    this.channelId = options.channelId;
    this.suffix = options.suffix;
    this.postStatus = options.postStatus;
    this.postUpdate = options.postUpdate;
    this.broadcastUpdate = options.broadcastUpdate;
    this.postBlog = options.postBlog;
    this.broadcastBlog = options.broadcastBlog;
    this.postPhoto = options.postPhoto;
    this.broadcastPhoto = options.broadcastPhoto;
    this.gridview = null;
    this.gridsize = 140;
    this.gridmargin = 5;
    this.imageList = [];

    this.initialize();
  }

  PostForm.prototype.initialize = function ()
  {
    this.root.html($(postFormString).contents());
    var status = $('#status');
    this.root.find('#message-form').submit($.proxy(this.clickStatus, this));
    this.root.find('#status-submit').click($.proxy(this.clickStatus, this));
    this.root.find('#title-text').bind('propertychange keyup input paste',
                                       $.proxy(this.changeBodyText, this));
    this.root.find('#summary-text').bind('propertychange keyup input paste',
                                         $.proxy(this.changeBodyText, this));
    this.root.find('#body-text').bind('propertychange keyup input paste',
                                      $.proxy(this.changeBodyText, this));
    this.root.find('#update-button').click($.proxy(this.clickPostUpdate, this));
    this.root.find('#broadcast-update-button').click($.proxy(this.clickBroadcastUpdate, this));
    this.root.find('#update-button').hide();
    this.root.find('#broadcast-update-button').hide();
    this.root.find('#title-text').hide();
    this.root.find('#summary-text').hide();
    this.root.find('#title-left').hide();
    this.gridsize = (this.root.width() - this.gridmargin * 8) / 5;
    this.gridview = this.root.find('#postgrid ul').gridster({
      widget_margins: [this.gridmargin, this.gridmargin],
      widget_base_dimensions: [this.gridsize, this.gridsize],
      min_rows: 5,
      min_cols: 5,
      serialize_params: $.proxy(this.serializeGridView, this)
    }).data('gridster');
    this.root.find('#upload-photo').click($.proxy(this.clickUploadPhoto, this));
    this.root.find('#upload-photo').hide();
    this.root.find('#upload-preview').hide();
    this.root.find('#upload-file').change($.proxy(this.updatePreview, this));
    this.root.find('#postgrid').hide();
  };

  PostForm.prototype.clickStatus = function (event)
  {
    event.preventDefault();
    var field = this.root.find('#body-text');
    var color = $('#status-color').val();
    if (field.val())
    {
      this.postStatus(field.val(), color);
      field.val('');
      this.changeBodyText();
    }
    return false;
  };

  PostForm.prototype.clickPostUpdate = function (event)
  {
    event.preventDefault();
    var title = this.root.find('#title-text');
    var summary = this.root.find('#summary-text');
    var field = this.root.find('#body-text');
    if (field.val() &&
        (this.type !== BLOG || title.val()) &&
        (this.type !== PHOTOSET || title.val()))
    {
      if (this.type === UPDATE)
      {
        this.postUpdate(field.val());
      }
      else if (this.type === BLOG)
      {
        this.postBlog(title.val(), summary.val(), field.val());
      }
      else if (this.type === PHOTOSET)
      {
        this.postPhoto(title.val(), field.val(), this.getPhotos());
      }
      title.val('');
      summary.val('');
      field.val('');
      this.root.find('#postgrid').hide();
      this.gridview.remove_all_widgets();
      this.imageList = [];
      this.type = BLOG;
      this.changeBodyText();
    }
    return false;
  };

  PostForm.prototype.clickBroadcastUpdate = function (event)
  {
    event.preventDefault();
    var title = this.root.find('#title-text');
    var summary = this.root.find('#summary-text');
    var field = this.root.find('#body-text');
    if (field.val() &&
        (this.type !== BLOG || title.val()) &&
        (this.type !== PHOTOSET || title.val()))
    {
      if (this.type === UPDATE)
      {
        this.broadcastUpdate(field.val());
      }
      else if (this.type === BLOG)
      {
        this.broadcastBlog(title.val(), summary.val(), field.val());
      }
      else if (this.type === PHOTOSET)
      {
        this.broadcastPhoto(title.val(), field.val(), this.getPhotos());
      }
      title.val('');
      summary.val('');
      field.val('');
      this.root.find('#postgrid').hide();
      this.gridview.remove_all_widgets();
      this.imageList = [];
      this.type = BLOG;
      this.changeBodyText();
    }
    return false;
  };

  PostForm.prototype.updateCharsLeft = function ()
  {
    var text = this.root.find('#body-text');
    var maxUpdate = 256 - this.suffix.length;
    var left = 25 - text.val().length;
    var title = this.root.find('#title-text');
    if (this.type === UPDATE)
    {
      left = maxUpdate - text.val().length;
    }
    else if (this.type === BLOG)
    {
      left = 6000 - text.val().length;
    }
    else if (this.type === PHOTOSET)
    {
      left = maxUpdate - text.val().length - title.val().length;
    }
    this.root.find('#chars-left').html(left);
  };

  PostForm.prototype.changeBodyText = function (event)
  {
    var text = this.root.find('#body-text');
    var maxUpdate = 256 - this.suffix.length;
    var changed = false;
    if ((this.type === STATUS && text.val().length > 25) ||
        (this.type === UPDATE && text.val().length <= 25) ||
        (this.type === UPDATE && text.val().length > maxUpdate) ||
        (this.type === BLOG && text.val().length <= maxUpdate))
    {
      changed = true;
    }

    if (changed)
    {
      this.clearAll();

      if (text.val().length <= 25)
      {
        this.root.find('#status-color').show();
        this.root.find('#status-submit').show();
        this.root.find('#message-form').addClass('form-inline');
        this.root.find('#upload-form').show();
        text.attr('rows', '1');
        this.type = STATUS;
      }
      else if (text.val().length > 25 && text.val().length <= maxUpdate)
      {
        this.root.find('#update-button').html('Update');
        this.root.find('#update-button').show();
        this.root.find('#broadcast-update-button').show();
        this.root.find('#upload-form').show();
        text.addClass('input-xxlarge');
        text.attr('rows', '5');
        this.type = UPDATE;
      }
      else
      {
        this.root.find('#title-text').show();
        this.root.find('#summary-text').show();
        this.root.find('#title-left').show();
        this.root.find('#update-button').html('Blog');
        this.root.find('#update-button').show();
        this.root.find('#broadcast-update-button').show();
        text.addClass('input-xxlarge');
        text.attr('rows', '25');
        this.type = BLOG;
      }
    }
    this.updateCharsLeft();
    var title = this.root.find('#title-text');
    var summary = this.root.find('#summary-text');
    var titleLeft = 256 - title.val().length - this.suffix.length;
    if (summary.val() !== '')
    {
      titleLeft = titleLeft - summary.val().length - ': \n\n'.length;
    }
    this.root.find('#title-left').html(titleLeft);
  };

  PostForm.prototype.clearAll = function ()
  {
    this.root.find('#update-button').hide();
    this.root.find('#broadcast-update-button').hide();
    this.root.find('#body-text').removeClass('input-xxlarge');
    this.root.find('#status-color').hide();
    this.root.find('#status-submit').hide();
    this.root.find('#message-form').removeClass('form-inline');
    this.root.find('#title-text').hide();
    this.root.find('#summary-text').hide();
    this.root.find('#title-left').hide();
    this.root.find('#upload-form').hide();
    this.root.find('#postgrid').hide();
  };

  PostForm.prototype.serializeGridView = function (tag, grid)
  {
    return {
      x: grid.col,
      y: grid.row,
      width: grid.size_x,
      height: grid.size_y,
      id: $(tag).data('id'),
      info: this.imageList[$(tag).data('id')],
      tag: tag
    };
  };

  PostForm.prototype.getPhotos = function ()
  {
    var result = [];
    var photos = this.gridview.serialize();
    var i = 0;
    for (i = 0; i < photos.length; i += 1)
    {
      result.push({
        x: photos[i].x,
        y: photos[i].y,
        width: photos[i].width,
        height: photos[i].height,
        id: photos[i].id,
        info: photos[i].info
      });
    }
    return result;
  };

  PostForm.prototype.updatePreview = function (event)
  {
    var input = this.root.find('#upload-file');
    var preview = this.root.find('#upload-preview');
    if (input[0].files && input[0].files[0])
    {
      var reader = new FileReader();
      reader.onload = function (e) {
        preview.attr('src', e.target.result);
        preview.show();
      };
      reader.readAsDataURL(input[0].files[0]);
      this.root.find('#upload-photo').show();
    }
    else
    {
      preview.hide();
      this.root.find('#upload-photo').hide();
    }
  };

  PostForm.prototype.clickUploadPhoto = function (event)
  {
    event.preventDefault();
    var input = this.root.find('#upload-file')[0];
    if (input.files && input.files[0])
    {
      var endpoint = 'https://alpha-api.app.net/stream/0/files';
      endpoint += '?include_annotations=1';
      endpoint += '&access_token=' + appnet.api.accessToken;
      var options = new FormData();
      options.append('type', 'net.app.alpha.attachment');
      options.append('content', input.files[0]);
      options.append('public', true);
      $.ajax({
        data: options,
        dataType: 'json',
        contentType: false,
        type: 'POST',
        url: endpoint,
        processData: false
      }).done($.proxy(this.completeUploadPhoto, this))
        .fail(failUploadPhoto);
      this.root.find('#upload-photo').button('loading');
      this.root.find('#upload-file').prop('disabled', true);
    }
    return false;
  };
    
  PostForm.prototype.completeUploadPhoto = function (response)
  {
    this.root.find('#upload-photo').button('reset');
    this.root.find('#upload-preview').hide();
    this.root.find('#upload-file').prop('disabled', false);
    $('#upload-form')[0].reset();
    this.root.find('#upload-photo').hide();
    this.addPhoto(response.data);
  };

  var failUploadPhoto = function (response)
  {
    this.root.find('#upload-photo').button('reset');
    this.root.find('#upload-preview').hide();
    this.root.find('#upload-file').prop('disabled', false);
    $('#upload-form')[0].reset();
    this.root.find('#upload-photo').hide();
    console.log('Failure');
    console.dir(response);
    console.dir(this);
  };

  PostForm.prototype.addPhoto = function (file)
  {
    if (this.type !== PHOTOSET)
    {
      var text = this.root.find('#body-text');
      this.clearAll();
      this.root.find('#title-text').show();
      this.root.find('#update-button').html('Photoset');
      this.root.find('#update-button').show();
      this.root.find('#broadcast-update-button').show();
      this.root.find('#upload-form').show();
      this.root.find('#postgrid').show();
      text.addClass('input-xxlarge');
      text.attr('rows', '5');
      text.attr('placeholder', 'Caption...');
      this.type = PHOTOSET;
      this.updateCharsLeft();
    }
    var id = this.imageList.length;
    var newImage = {
      url: file.url_permanent
    };
    if (file.image_thumb_200s)
    {
      newImage.thumbnail = file.image_thumb_200s.url;
    }
    this.imageList.push(newImage);
    var newItem = this.makeNewItem(id);
    this.gridview.add_widget(newItem, 1, 1);
  };

  PostForm.prototype.makeNewItem = function (id)
  {
    var context = this;
    var newItem = $(imageViewString);
    var url = this.imageList[id].url;
    if (this.imageList[id].thumbnail)
    {
      url = this.imageList[id].thumbnail;
    }
    newItem.data('id', id);
    newItem.css('background-image', 'url("' + url + '")');
    newItem.resizable({
      grid: [this.gridsize + (this.gridmargin * 2),
             this.gridsize + (this.gridmargin * 2)],
      animate: false,
      minWidth: this.gridsize - 5,
      minHeight: this.gridsize - 5,
      containment: this.root,
      autoHide: true,
      stop: function (event, ui) {
        var resized = $(this);
        setTimeout(function () {
          resizeBlock(resized, context);
        }, 300);
      }
    });
    newItem.find('.ui-resizable-handle').hover(
      function () { context.gridview.disable(); },
      function () { context.gridview.enable(); });
    return newItem;
  };

  function resizeBlock(target, context)
  {
    var tag = $(target);
    var current = context.gridview.serialize(tag)[0];
    var increment = context.gridsize + (context.gridmargin * 2);
    var grid_w = 1 + Math.round((tag.width() - context.gridsize) / increment);
    var grid_h = 1 + Math.round((tag.height() - context.gridsize) / increment);

    context.gridview.disable();
    context.gridview.remove_widget(tag, function () {
      tag.remove();
      var newItem = context.makeNewItem(current.id);
      context.gridview.add_widget(newItem, grid_w, grid_h,
                                  current.x, current.y);
      context.gridview.enable();
    });
  }

  return PostForm;

});
