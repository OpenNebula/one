define(function(require) {

  var Locale = require('utils/locale');
  var TemplateHTML = require('hbs!./custom-tags-table/html');
  var TemplateUtils = require('utils/template-utils');

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    $('#add_custom', context).click(function() {
      var table = $('#custom_tags', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(rowCount);

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "KEY";
      element1.type = "text";
      element1.value = $('input#KEY', context).val();
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("input");
      element2.id = "VALUE";
      element2.type = "text";
      element2.value = $('input#VALUE', context).val();
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    context.on("click", "i.remove-tab", function() {
      $(this).closest("tr").remove();
    });
  }

  // context is the container div of customTagsHtml()
  function _retrieveCustomTags(context){
    var template_json = {};

    $('#custom_tags tr', context).each(function(){
      if ($('#KEY', $(this)).val()) {
        template_json[$('#KEY', $(this)).val()] = $('#VALUE', $(this)).val();
      }
    });

    return template_json;
  }

  // context is the container div of customTagsHtml()
  // template_json are the key:values that will be put into the table
  function _fillCustomTags(context, template_json){
    $.each(template_json, function(key, value){
      var table = $('#custom_tags', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(rowCount);

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "KEY";
      element1.type = "text";
      element1.value = TemplateUtils.htmlDecode(key);
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("input");
      element2.id = "VALUE";
      element2.type = "text";
      element2.value = TemplateUtils.htmlDecode(value);
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });
  }

  return {
    'html': _html,
    'setup': _setup,
    'retrieve': _retrieveCustomTags,
    'fill': _fillCustomTags
  };
});