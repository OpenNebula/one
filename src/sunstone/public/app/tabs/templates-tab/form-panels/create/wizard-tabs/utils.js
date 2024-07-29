/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /* DEPENDENCIES */

  var OpenNebulaHost = require('opennebula/host');
  var Locale = require('utils/locale');

  var RowTemplateHTML = require('hbs!./utils/pciRow');

  return {
    'pciRowHTML': _pciRowHTML,
    'fillPCIRow': _fillPCIRow,
    'setupPCIRows': _setupPCIRows
  };

  function _pciRowHTML(){
    return RowTemplateHTML();
  }

  /**
   * Fills the PCI row with values taken from an ajax call to oned
   *
   * @param {Object}  opts      Options:
   * @param {JQuery}  opts.tr     tr created with pciRowHTML
   * @param {bool}    opts.remove true (default) to show the remove tr button
   *                      
   */
  function _fillPCIRow(opts){
    OpenNebulaHost.pciDevices({
      data : {},
      timeout: true,
      success: function (request, pciDevices){
        var tr = opts.tr;

        var html = "<select>";

        html += '<option device="" class="" vendor="">'+Locale.tr("Please select")+'</option>';

        $.each(pciDevices, function(i,pci){
          html += '<option device="'+pci['device']+'" '+
                          'class="'+pci['class']+'" '+
                          'vendor="'+pci['vendor']+'">'+
                              pci.device_name+
                  '</option>';
        });

        html += '</select>';

        $(".device_name", opts.tr).html(html);

        $("input", opts.tr).trigger("change");

        if (opts.remove === false){
          $("i.remove-tab", opts.tr).hide();
        }
      },
      error: function(request, error_json){
        console.error("There was an error requesting the PCI devices: "+
                      error_json.error.message);

        $(".device_name", opts.tr).html("");

        if (opts.remove === false){
          $("i.remove-tab", opts.tr).hide();
        }
      }
    });
  }

  /**
   * Setups the pci rows. Can be called once, will work for future rows created
   * later
   */
  function _setupPCIRows(context){

    context.on("change", "td.device_name select", function(){
      var tr = $(this).closest('tr');

      var option = $("option:selected", this);

      $('input[wizard_field="DEVICE"]', tr).val( option.attr("device") );
      $('input[wizard_field="CLASS"]',  tr).val( option.attr("class") );
      $('input[wizard_field="VENDOR"]', tr).val( option.attr("vendor") );
    });

    context.on("change", "tbody input", function(){
      var tr = $(this).closest('tr');

      var opt =
        $('option'+
          '[device="'+$('input[wizard_field="DEVICE"]', tr).val()+'"]'+
          '[class="'+$('input[wizard_field="CLASS"]',  tr).val()+'"]'+
          '[vendor="'+$('input[wizard_field="VENDOR"]', tr).val()+'"]', tr);

        opt.attr('selected', 'selected');
    });

    context.on("click", "i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });
  }
});
