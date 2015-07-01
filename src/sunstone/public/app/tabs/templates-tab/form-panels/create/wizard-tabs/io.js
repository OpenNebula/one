define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./io/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./io/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('input_output')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-exchange';
    this.title = Locale.tr("Input/Output");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    Tips.setup(context);

    $("input[name='graphics_type']", context).change(function() {
      $("#TYPE", context).val($(this).attr("value"))
      $("#LISTEN", context).val("0.0.0.0")
    });

    context.off("click", '#add_input');
    context.on("click", '#add_input', function() {
      var table = $('#input_table', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(-1);
      $(row).addClass("vm_param");

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "INPUT_TYPE"
      element1.type = "text";
      element1.value = $('select#INPUT_TYPE', context).val()
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("input");
      element2.id = "INPUT_BUS"
      element2.type = "text";
      element2.value = $('select#INPUT_BUS', context).val()
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    context.off('click', "i.remove-tab");
    context.on('click', "i.remove-tab", function() {
      $(this).closest("tr").remove()
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    var graphicsJSON = WizardFields.retrieve(context);

    if (!$.isEmptyObject(graphicsJSON) && $("#RANDOM_PASSWD:checked", context).length > 0) {
      graphicsJSON["RANDOM_PASSWD"] = "YES";
    }

    if (!$.isEmptyObject(graphicsJSON)) { templateJSON['GRAPHICS'] = graphicsJSON; };

    var inputsJSON = [];
    $('#input_table tr', context).each(function() {
      if ($('#INPUT_TYPE', $(this)).val()) {
        inputsJSON.push({
          'TYPE': $('#INPUT_TYPE', $(this)).val(),
          'BUS': $('#INPUT_BUS', $(this)).val()
        });
      }
    });

    if (!$.isEmptyObject(inputsJSON)) { templateJSON['INPUTS'] = inputsJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var graphicsJSON = templateJSON['GRAPHICS'];
    if (graphicsJSON) {
      var type = graphicsJSON.TYPE;
      if (type) {
        $("input[value='" + type.toUpperCase() + "']").click();
      }

      if (graphicsJSON["RANDOM_PASSWD"] == "YES") {
        $("#RANDOM_PASSWD", context).attr("checked", "checked");
      }

      WizardFields.fill(context, graphicsJSON);
      delete templateJSON['GRAPHICS']
    }

    var inputsJSON = templateJSON['INPUTS'];
    if (inputsJSON) {
      if (!(inputsJSON instanceof Array)) {
        inputsJSON = [inputsJSON];
      }

      $.each(inputsJSON, function() {
        var table = $('#input_table', context)[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "INPUT_TYPE";
        element1.type = "text";
        element1.value = TemplateUtils.htmlDecode(this.TYPE);
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "INPUT_BUS";
        element2.type = "text";
        element2.value = TemplateUtils.htmlDecode(this.BUS);
        cell2.appendChild(element2);

        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
      });

      delete templateJSON['INPUTS']
    }
  }
});
