/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var RangeSlider = require('utils/range-slider');

  return {
    'insert': _insert,
    'retrieve': _retrieve
  };

  function _insert(template_json, disksContext) {
    var template_disk = template_json.VMTEMPLATE.TEMPLATE.DISK
    var disks = []
    if ($.isArray(template_disk)) {
      disks = template_disk
    } else if (!$.isEmptyObject(template_disk)) {
      disks = [template_disk]
    }

    if (disks.length > 0) {
      disksContext.html(
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<h3 class="subheader text-right">'+
              '<span class="left">'+
                '<i class="fa fa-tasks fa-lg"></i>&emsp;'+
                Locale.tr("Disks")+
              '</span>'+
              '<span class="provision_create_template_disk_cost_div hidden">' +
                '<span class="cost_value">0.00</span> '+
                '<small style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</small>'+
              '</span>'+
              '<br>'+
            '</h3>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns disksContainer">'+
            '<span class="text-center" style="font-size:80px">'+
              '<i class="fa fa-spinner fa-spin"></i>'+
            '</span>'+
          '</div>'+
        '</div>')

      OpenNebula.Template.show({
        data : {
            id: template_json.VMTEMPLATE.ID,
            extended: true
        },
        success: function(request, extendedTemplateJSON) {
          var extendedTemplateDisk = extendedTemplateJSON.VMTEMPLATE.TEMPLATE.DISK;
          var extendedDisks = []
          if ($.isArray(extendedTemplateDisk)) {
            extendedDisks = extendedTemplateDisk
          } else if (!$.isEmptyObject(extendedTemplateDisk)) {
            extendedDisks = [extendedTemplateDisk]
          }


          var disk_cost = template_json.VMTEMPLATE.TEMPLATE.DISK_COST;
          if (disk_cost && Config.isFeatureEnabled("showback")) {
            $(".provision_create_template_disk_cost_div", disksContext).show();

            disksContext.on("change.fndtn.slider", '.range-slider', function(){
              /*if ($(this).attr('data-slider') <= 0) {
                var diskContainer = $(this).parent('.diskContainer');
                $("#SIZE", diskContainer).val(diskContainer.data('original_size'));
              }*/

              var cost = 0;
              $('.range-slider', disksContext).each(function(){
                if ($(this).attr('data-slider') > 0) {
                  cost += $(this).attr('data-slider') * disk_cost
                }
              })
              $(".cost_value", disksContext).html(cost.toFixed(2));
            });
          } else {
            $(".provision_create_template_disk_cost_div", disksContext).hide();
          }

          var diskContext;
          $(".disksContainer", disksContext).html("");
          $.each(extendedDisks, function(disk_id, disk) {
            diskContext = $('<div class="row diskContainer">'+
                '<div class="large-12 columns diskSlider">' +
                '</div>' +
              '</div>').appendTo($(".disksContainer", disksContext));

            diskContext.data('template_disk', disks[disk_id]);

            var sizeGB = disk.SIZE / 1024;
            diskContext.data('original_size', sizeGB);

            var label = disk.IMAGE ? disk.IMAGE : Locale.tr("Volatile Disk");
            var enabled = !(disk.PERSISTENT && disk.PERSISTENT.toUpperCase() == "YES");

            RangeSlider.insert({
              'label': label,
              'unitLabel': 'GB',
              'name': 'SIZE',
              'start': sizeGB,
              'end': sizeGB + 500,
              'step': 10,
              'startValue': sizeGB,
              'enabled': enabled
            }, $(".diskSlider", diskContext));
          })
        }
      })
    } else {
      disksContext.html("");
    }
  }

  function _retrieve(context) {
    var disks = [];
    var disk, size;
    $(".diskContainer", context).each(function(){
      if ($(this).data("template_disk")) {
        disk = $(this).data("template_disk");
        original_size = $(this).data("original_size");
        size = $("#SIZE", this).val();
        if (size && size > original_size && size > 0) {
          disk['SIZE'] = Math.ceil(size * 1024);
        }
      }

      if (disk) {
        disks.push(disk);
      }
    });

    return disks;
  }
});
