define(function(require) {

  var Locale = require('utils/locale');
  var TemplateHTML = require('hbs!./custom-tags-table/html');
  var RowTemplateHTML = require('hbs!./custom-tags-table/row');
  var TemplateUtils = require('utils/template-utils');

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    context.off("click", ".add_custom_tag");
    context.on("click", ".add_custom_tag", function(){
      $(".custom_tags tbody", context).append(RowTemplateHTML());
    });

    $(".add_custom_tag", context).trigger("click");

    context.on("click", ".custom_tags i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });
  }

  // context is the container div of customTagsHtml()
  function _retrieveCustomTags(context){
    var template_json = {};

    $('.custom_tags tr', context).each(function(){
      if ($('.custom_tag_key', $(this)).val()) {
        template_json[$('.custom_tag_key', $(this)).val()] = $('.custom_tag_value', $(this)).val();
      }
    });

    return template_json;
  }

  // context is the container div of customTagsHtml()
  // template_json are the key:values that will be put into the table
  function _fillCustomTags(context, template_json){
    $(".custom_tags i.remove-tab", context).trigger("click");

    $.each(template_json, function(key, value){
      $(".custom_tags tbody", context).append(
                                    RowTemplateHTML({key: key, value: value}));
    });
  }

  return {
    'html': _html,
    'setup': _setup,
    'retrieve': _retrieveCustomTags,
    'fill': _fillCustomTags
  };
});