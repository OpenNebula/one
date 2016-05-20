/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

define(function(require){
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var OpenNebulaImage = require('opennebula/image');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var DisksResizeTemplate = require('hbs!./disks-resize/html');

  return {
    'insert': _insert,
    'retrieve': _retrieve
  };

  function _calculateCost(context, disk_cost){
    var cost = 0;

    $(".diskContainer", context).each(function(){
      var size = 0;

      var fields = WizardFields.retrieve(this);

      if (fields.SIZE != undefined){
        size = fields.SIZE;
      } else{
        disk = $(this).data("template_disk");

        if (disk != undefined && disk['SIZE'] != undefined){
          size = disk['SIZE'];
        }
      }

      cost += size * disk_cost;
      cost += $(this).data('disk_snapshot_total_cost');
    });

    $(".cost_value", context).text(cost.toFixed(2));
  }

  /**
   * @param {Object} opts - template_json: extended info template (with DISK/SIZE)
   *                      - disksContext: jquery selector, where to place the html
   *                      - force_persistent {bool}: mark all disks as if they
   *                          were persistent, disabling resize inputs
   */
  function _insert(opts) {

    var disksContext = opts.disksContext;

    var template_disk = opts.template_json.VMTEMPLATE.TEMPLATE.DISK
    var disks = []
    if ($.isArray(template_disk)) {
      disks = template_disk
    } else if (!$.isEmptyObject(template_disk)) {
      disks = [template_disk]
    }

    if (disks.length > 0) {
      disksContext.html(DisksResizeTemplate());

      var disk_cost = opts.template_json.VMTEMPLATE.TEMPLATE.DISK_COST;

      if (disk_cost == undefined) {
        disk_cost = Config.onedConf.DEFAULT_COST.DISK_COST;
      }

      if (disk_cost != 0 && Config.isFeatureEnabled("showback")) {
        $(".provision_create_template_disk_cost_div", disksContext).show();

        disksContext.on("input", "input", function(){
          _calculateCost(disksContext, disk_cost);
        });

        _calculateCost(disksContext, disk_cost);
      } else {
        $(".provision_create_template_disk_cost_div", disksContext).hide();
      }

      var diskContext;
      $(".disksContainer", disksContext).html("");
      $.each(disks, function(disk_id, disk) {
        diskContext = $(
          '<div class="row diskContainer">'+
            '<div class="small-12 columns">'+
              '<label></label>'+
            '</div>'+
            '<div class="large-12 columns diskSlider">' +
            '</div>' +
          '</div>').appendTo($(".disksContainer", disksContext));

        diskContext.data('template_disk', disk);

        var disk_snapshot_total_size = 0;
        if (disk.DISK_SNAPSHOT_TOTAL_SIZE != undefined) {
          disk_snapshot_total_size = parseInt(disk.DISK_SNAPSHOT_TOTAL_SIZE);
        }

        diskContext.data('disk_snapshot_total_size', disk_snapshot_total_size);
        diskContext.data('disk_snapshot_total_cost', disk_snapshot_total_size * disk_cost);

        var volatile = (disk.IMAGE == undefined && disk.IMAGE_ID == undefined);

        var label;

        if (volatile){
          label = Locale.tr("Volatile Disk");
        } else {
          label = disk.IMAGE ? disk.IMAGE : Locale.tr("Image was not found");
        }

        $("label", diskContext).text(Locale.tr("DISK") + ' ' + disk_id + ': ' + label);

        var persistent =
          ( opts.force_persistent ||
            (disk.PERSISTENT && disk.PERSISTENT.toUpperCase() == "YES") );

        var disabled =
          ( persistent ||
            (disk.TYPE && OpenNebulaImage.TYPES[disk.TYPE] == OpenNebulaImage.TYPES.CDROM) );

        if (persistent){
          $("label", diskContext).append('<i class="disk-resize-icon fa-border has-tip left fa fa-lg fa-floppy-o" title="' +
              Locale.tr("Persistent image. The changes will be saved back to the datastore after the VM is shut down") + '"></i>')

        }else{
          $("label", diskContext).append('<i class="disk-resize-icon fa-border has-tip left fa fa-lg fa-recycle" title="' +
              Locale.tr("Non-persistent disk. The changes will be lost once the VM is shut down") + '"></i>')

        }

        if (disk.IMAGE_STATE){
          var color_class = OpenNebulaImage.stateColor(disk.IMAGE_STATE) + "-color";

          $("label", diskContext).append('<i class="'+color_class+' fa-border has-tip left fa fa-square" title="' +
              Locale.tr("Image state: ") + OpenNebulaImage.stateStr(disk.IMAGE_STATE) + '"></i>')
        } else if (disk.IMAGE || disk.IMAGE_ID) {
          var color_class = "error-color";

          $("label", diskContext).append('<i class="'+color_class+' fa-border has-tip left fa fa-square" title="' +
              Locale.tr("Image was not found") + '"></i>')
        } // else is volatile, does not have state

        var attr;

        if (disabled){
          if (disk.SIZE){
            attr = UserInputs.parse("SIZE","O|fixed|"+label+"||"+disk.SIZE);
          } else {
            attr = UserInputs.parse("SIZE","O|fixed|"+label+"||-");
          }
        } else {
          if (disk.SIZE != undefined){
            // Range from original size to size + 500GB
            var min = parseInt(disk.SIZE);
            var max = min + 512000;

            attr = UserInputs.parse(
              "SIZE",
              "O|range|"+label+"|"+min+".."+max+"|"+min);
          } else {
            attr = UserInputs.parse(
              "SIZE",
              "M|number|"+label+"||");
          }
        }

        UserInputs.insertAttributeInputMB(attr, $(".diskSlider", diskContext));
      })

    } else {
      disksContext.html("");
    }
  }

  function _retrieve(context) {
    var disks = [];
    var disk;
    $(".diskContainer", context).each(function(){
      if ($(this).data("template_disk")) {
        disk = $(this).data("template_disk");

        var fields = WizardFields.retrieve(this);

        if (fields.SIZE != undefined){
          disk['SIZE'] = fields.SIZE;
        }
      }

      if (disk) {
        disks.push(disk);
      }
    });

    return disks;
  }
});
