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
  // Dependencies
  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize');
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var ResourceSelect = require('utils/resource-select');
  var QuotaLimits = require('./quota-limits');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var TemplateUtils = require('utils/template-utils');
  var OpenNebula = require('opennebula');

  // Constants
  var QUOTA_LIMIT_DEFAULT   = QuotaLimits.QUOTA_LIMIT_DEFAULT;
  var QUOTA_LIMIT_UNLIMITED = QuotaLimits.QUOTA_LIMIT_UNLIMITED;


  /**
   * Returns true if the quotas are empty
   * @param  {Object} resource_info User/Group object
   * @return {boolean} true if the quotas are empty
   */
  function _emptyQuotas(resource_info){
    return ($.isEmptyObject(resource_info.VM_QUOTA) &&
            $.isEmptyObject(resource_info.DATASTORE_QUOTA) &&
            $.isEmptyObject(resource_info.IMAGE_QUOTA) &&
            $.isEmptyObject(resource_info.NETWORK_QUOTA) );
  }

  // If the VM quotas are empty, inits the VM counters to 0, and sets the limit
  // to 'default'. It is not applied to oneadmin user/group
  function _initEmptyQuotas(resource){
    if ($.isEmptyObject(resource.VM_QUOTA) && resource.ID != 0){
      resource.VM_QUOTA = {
        VM: {
          VMS                   : QUOTA_LIMIT_DEFAULT,
          VMS_USED              : 0,
          CPU                   : QUOTA_LIMIT_DEFAULT,
          CPU_USED              : 0,
          MEMORY                : QUOTA_LIMIT_DEFAULT,
          MEMORY_USED           : 0,
          SYSTEM_DISK_SIZE      : QUOTA_LIMIT_DEFAULT,
          SYSTEM_DISK_SIZE_USED : 0,
          RUNNING_VMS           : QUOTA_LIMIT_DEFAULT,
          RUNNING_VMS_USED      : 0,
          RUNNING_CPU           : QUOTA_LIMIT_DEFAULT,
          RUNNING_CPU_USED      : 0,
          RUNNING_MEMORY        : QUOTA_LIMIT_DEFAULT,
          RUNNING_MEMORY_USED   : 0
        }
      };
    }
  }

  /**
   * Returns a widget with the VM quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _vmsWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var vms_bar;

    if (!empty_quotas){
      vms_bar = _editableQuotaBar(
        info.VM_QUOTA.VM.VMS_USED,
        info.VM_QUOTA.VM.VMS,
        default_quotas.VM_QUOTA.VM.VMS,
        { quota_name: "VM_VMS"});
    } else {
      vms_bar = _editableQuotaBar(
        0,
        QUOTA_LIMIT_DEFAULT,
        default_quotas.VM_QUOTA.VM.VMS,
        { quota_name: "VM_VMS"});
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("VMs") + '</legend>\
        <div>'+vms_bar+'</div>\
        <br>\
      </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the CPU quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _cpuWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var cpu_bar;

    if (!empty_quotas){
      cpu_bar = _editableQuotaBar(
            info.VM_QUOTA.VM.CPU_USED,
            info.VM_QUOTA.VM.CPU,
            default_quotas.VM_QUOTA.VM.CPU,
            {   is_float: true,
                quota_name: "VM_CPU"
            });
    } else {
      cpu_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_quotas.VM_QUOTA.VM.CPU,
            {   is_float: true,
                quota_name: "VM_CPU"
            });
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("CPU") + '</legend>\
        <div>'+cpu_bar+'</div>\
        <br>\
        </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the memory quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _memoryWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var memory_bar;

    if (!empty_quotas){
      memory_bar = _editableQuotaBar(
            info.VM_QUOTA.VM.MEMORY_USED,
            info.VM_QUOTA.VM.MEMORY,
            default_quotas.VM_QUOTA.VM.MEMORY,
            {   mb: true,
                quota_name: "VM_MEMORY"
            });
    } else {
      memory_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_quotas.VM_QUOTA.VM.MEMORY,
            {   mb: true,
                quota_name: "VM_MEMORY"
            });
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("Memory") + '</legend>\
        <div>'+memory_bar+'</div>\
        <br>\
        </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the system disk quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _systemDiskWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var system_bar;

    if (!empty_quotas){
      system_bar = _editableQuotaBar(
            info.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED,
            info.VM_QUOTA.VM.SYSTEM_DISK_SIZE,
            default_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE,
            {   mb: true,
                quota_name: "VM_SYSTEM_DISK_SIZE"
            });
    } else {
      system_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE,
            {   mb: true,
                quota_name: "VM_SYSTEM_DISK_SIZE"
            });
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("System disks") + '</legend>\
        <div>'+system_bar+'</div>\
        <br>\
        </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the RUNNING VM quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _runningVmsWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var running_vms_bar;

    if (!empty_quotas){
      running_vms_bar = _editableQuotaBar(
        info.VM_QUOTA.VM.RUNNING_VMS_USED,
        info.VM_QUOTA.VM.RUNNING_VMS,
        default_quotas.VM_QUOTA.VM.RUNNING_VMS,
        { quota_name: "RUNNING_VM_VMS"});
    } else {
      running_vms_bar = _editableQuotaBar(
        0,
        QUOTA_LIMIT_DEFAULT,
        default_quotas.VM_QUOTA.VM.VMS,
        { quota_name: "RUNNING_VM_VMS"});
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("Running VMs") + '</legend>\
        <div>'+running_vms_bar+'</div>\
        <br>\
      </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the RUNNING CPU quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _runningCpuWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var running_cpu_bar;

    if (!empty_quotas){
      running_cpu_bar = _editableQuotaBar(
            info.VM_QUOTA.VM.RUNNING_CPU_USED,
            info.VM_QUOTA.VM.RUNNING_CPU,
            default_quotas.VM_QUOTA.VM.RUNNING_CPU,
            {   is_float: true,
                quota_name: "RUNNING_VM_CPU"
            });
    } else {
      running_cpu_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_quotas.VM_QUOTA.VM.RUNNING_CPU,
            {   is_float: true,
                quota_name: "RUNNING_VM_CPU"
            });
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("Running CPU") + '</legend>\
        <div>'+running_cpu_bar+'</div>\
        <br>\
        </fieldset>'

    return quotas_tab_html;
  }

  /**
   * Returns a widget with the RUNNING MEMORY quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _runningMemoryWidget(info, default_quotas){
    var empty_quotas = $.isEmptyObject(info.VM_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset>';
    }

    var running_memory_bar;

    if (!empty_quotas){
      running_memory_bar = _editableQuotaBar(
            info.VM_QUOTA.VM.RUNNING_MEMORY_USED,
            info.VM_QUOTA.VM.RUNNING_MEMORY,
            default_quotas.VM_QUOTA.VM.RUNNING_MEMORY,
            {   mb: true,
                quota_name: "RUNNING_VM_MEMORY"
            });
    } else {
      running_memory_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_quotas.VM_QUOTA.VM.RUNNING_MEMORY,
            {   mb: true,
                quota_name: "RUNNING_VM_MEMORY"
            });
    }

    quotas_tab_html +=
        '<legend>' + Locale.tr("Running Memory") + '</legend>\
        <div>'+running_memory_bar+'</div>\
        <br>\
        </fieldset>'

    return quotas_tab_html;
  }


  /**
   * Returns a widget with the image quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _imageWidget(info, default_quotas) {
    var empty_quotas = $.isEmptyObject(info.IMAGE_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px; display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px">';
    }

    quotas_tab_html +=
          '<legend>'+Locale.tr("Image")+'</legend>\
          <table class="quota_table image_quota_table">\
          <thead>\
              <tr>\
                  <th style="width:16%">'+Locale.tr("ID")+'</th>\
                  <th style="width:84%">'+Locale.tr("Running VMs")+'</th>\
              </tr>\
          </thead>\
          <tbody>';

    var img_quotas = [];

    if (!empty_quotas){
      if (Array.isArray(info.IMAGE_QUOTA.IMAGE))
        img_quotas = info.IMAGE_QUOTA.IMAGE;
      else if (info.IMAGE_QUOTA.IMAGE.ID)
        img_quotas = [info.IMAGE_QUOTA.IMAGE];
    }

    for (var i=0; i < img_quotas.length; i++){

      var default_img_quotas = default_quotas.IMAGE_QUOTA[img_quotas[i].ID]

      if (default_img_quotas == undefined){
        default_img_quotas = {
          "RVMS"  : QUOTA_LIMIT_UNLIMITED
        }
      }

      var rvms_bar = _editableQuotaBar(
        img_quotas[i].RVMS_USED,
        img_quotas[i].RVMS,
        default_img_quotas.RVMS,
        { quota_name: "IMAGE_RVMS"});

      quotas_tab_html +=
        '<tr class="image_quota_tr" quota_id="'+img_quotas[i].ID+'">\
          <td>'+img_quotas[i].ID+'</td>\
          <td>'+rvms_bar+'</td>\
        </tr>';
    }

    quotas_tab_html +=
              '</tbody>\
              <tfoot>\
                  <tr class="editable_quota" style="display: none">\
                      <td colspan="2">\
                          <a type="button" \
                            class="button small radius small-12" \
                            id="image_add_quota_btn"><i class="fas fa-plus"></i>\
                            '+Locale.tr("Add a new quota")+'\
                          </a>\
                      </td>\
                  </tr>\
              </tfoot>\
          </table>\
      </fieldset>';

    return quotas_tab_html;
  }

  /**
   * @param  {Object} context jquery object, e.g. $("panel-id")
   * @param  {Object} default_quotas default quotas for Users/Groups
   */
  function _setupImageWidget(context, default_quotas){
    context.off("click", "#image_add_quota_btn");
    context.on("click", "#image_add_quota_btn", function(){

      $(".image_quota_table tbody", context).append(
        '<tr class="image_quota_tr" quota_id="-1">\
          <td class="image_select" colspan="2"></td>\
          <td class="rvms_bar"></td>\
        </tr>');

      ResourceSelect.insert({
          context: $('.image_select', $(".image_quota_table tbody tr", context).last()),
          resourceName: 'Image',
          force: true,
          emptyValue: true
        });

      $(".image_quota_table tbody tr", context).last().off(
                                            "change", ".resource_list_select");

      $(".image_quota_table tbody tr", context).last().on(
                                  "change", ".resource_list_select", function(){

          $(this).parents("td").attr("colspan", "1");

          var image_id = $(this).val();
          var tr = $(this).parents("tr");
          tr.attr("quota_id", image_id);

          var default_img_quotas = default_quotas.IMAGE_QUOTA[image_id];

          if (default_img_quotas == undefined){
            default_img_quotas = {
              "RVMS"  : QUOTA_LIMIT_UNLIMITED
            }
          }

          var rvms_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_img_quotas.RVMS,
            { quota_name: "IMAGE_RVMS"});

          $("td.rvms_bar", tr).html(rvms_bar);

          $(".editable_quota", tr).show();
          $(".non_editable_quota", tr).hide();

          $.each($("input", tr), function(){
            initQuotaInputValue(this);
          });
        });

      return false;
    });
  }

  /**
   * Returns a widget with the datastore quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _datastoreWidget(info, default_quotas) {
    var empty_quotas = $.isEmptyObject(info.DATASTORE_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px; display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px">';
    }

    quotas_tab_html +=
        '<legend>'+Locale.tr("Datastore")+'</legend>\
        <table class="quota_table ds_quota_table">\
          <thead>\
              <tr>\
                <th style="width:16%">'+Locale.tr("ID")+'</th>\
                <th style="width:42%">'+Locale.tr("Images")+'</th>\
                <th style="width:42%">'+Locale.tr("Size")+'</th>\
              </tr>\
          </thead>\
          <tbody>';

    var ds_quotas = [];

    if (!empty_quotas){
      if (Array.isArray(info.DATASTORE_QUOTA.DATASTORE))
        ds_quotas = info.DATASTORE_QUOTA.DATASTORE;
      else if (info.DATASTORE_QUOTA.DATASTORE.ID)
        ds_quotas = [info.DATASTORE_QUOTA.DATASTORE];
    }

    for (var i=0; i < ds_quotas.length; i++){

      var default_ds_quotas = default_quotas.DATASTORE_QUOTA[ds_quotas[i].ID]

      if (default_ds_quotas == undefined){
        default_ds_quotas = {
          "IMAGES"    : QUOTA_LIMIT_UNLIMITED,
          "SIZE"      : QUOTA_LIMIT_UNLIMITED
        }
      }

      var img_bar = _editableQuotaBar(
          ds_quotas[i].IMAGES_USED,
          ds_quotas[i].IMAGES,
          default_ds_quotas.IMAGES,
          { quota_name: "DS_IMAGES" });

      var size_bar = _editableQuotaBar(
          ds_quotas[i].SIZE_USED,
          ds_quotas[i].SIZE,
          default_ds_quotas.SIZE,
          {   mb: true,
              quota_name: "DS_SIZE"
          });

      quotas_tab_html +=
      '<tr class="ds_quota_tr" quota_id="'+ds_quotas[i].ID+'">\
        <td>'+ds_quotas[i].ID+'</td>\
        <td>'+img_bar+'</td>\
        <td>'+size_bar+'</td>\
      </tr>';
    }

    quotas_tab_html +=
            '</tbody>\
            <tfoot>\
                <tr class="editable_quota" style="display: none">\
                    <td colspan="3">\
                        <a type="button" \
                          class="button small radius small-12" \
                          id="ds_add_quota_btn"><i class="fas fa-plus"></i>\
                          '+Locale.tr("Add a new quota")+'\
                        </a>\
                    </td>\
                </tr>\
            </tfoot>\
        </table>\
        <div class="">\
        </div>\
    </fieldset>';

    return quotas_tab_html;
  }

  /**
   * @param  {Object} context jquery object, e.g. $("panel-id")
   * @param  {Object} default_quotas default quotas for Users/Groups
   */
  function _setupDatastoreWidget(context, default_quotas){
    context.off("click", "#ds_add_quota_btn");
    context.on("click", "#ds_add_quota_btn", function(){

      $(".ds_quota_table tbody", context).append(
        '<tr class="ds_quota_tr" quota_id="-1">\
          <td class="ds_select" colspan="3"></td>\
          <td class="img_bar"></td>\
          <td class="size_bar"></td>\
        </tr>');

      ResourceSelect.insert({
          context: $('.ds_select', $(".ds_quota_table tbody tr", context).last()),
          resourceName: 'Datastore',
          force: true,
          emptyValue: true
        });

      $(".ds_quota_table tbody tr", context).last().off(
                                            "change", ".resource_list_select");

      $(".ds_quota_table tbody tr", context).last().on(
                                "change", ".resource_list_select", function(){

        $(this).parents("td").attr("colspan", "1");

        var ds_id = $(this).val();
        var tr = $(this).parents("tr");
        tr.attr("quota_id", ds_id);

        var default_ds_quotas = default_quotas.DATASTORE_QUOTA[ds_id];

        if (default_ds_quotas == undefined){
            default_ds_quotas = {
                "IMAGES"    : QUOTA_LIMIT_UNLIMITED,
                "SIZE"      : QUOTA_LIMIT_UNLIMITED
            }
        }

        var img_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_ds_quotas.IMAGES,
            { quota_name: "DS_IMAGES" });

        var size_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_ds_quotas.SIZE,
            {   mb: true,
                quota_name: "DS_SIZE"
            });

        $("td.img_bar", tr).html(img_bar);
        $("td.size_bar", tr).html(size_bar);

        $(".editable_quota", tr).show();
        $(".non_editable_quota", tr).hide();

        $.each($("input", tr), function(){
          initQuotaInputValue(this);
        });
      });

      return false;
    });

    return false;
  }

  /**
   * Returns a widget with the network quotas
   * @param  {Object} info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @return {string} html string
   */
  function _networkWidget(info, default_quotas) {
    var empty_quotas = $.isEmptyObject(info.NETWORK_QUOTA);

    var quotas_tab_html = "";

    if (empty_quotas){
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px; display: none" class="editable_quota">';
    } else {
      quotas_tab_html +=
        '<fieldset style="padding: 5px 15px">';
    }

    quotas_tab_html +=
        '<legend>'+Locale.tr("Network")+'</legend>\
        <table class="quota_table network_quota_table">\
            <thead>\
                <tr>\
                    <th style="width:16%">'+Locale.tr("ID")+'</th>\
                    <th style="width:84%">'+Locale.tr("Leases")+'</th>\
                </tr>\
            </thead>\
            <tbody>';

    var net_quotas = [];

    if (!empty_quotas){
      if (Array.isArray(info.NETWORK_QUOTA.NETWORK))
        net_quotas = info.NETWORK_QUOTA.NETWORK;
      else if (info.NETWORK_QUOTA.NETWORK.ID)
        net_quotas = [info.NETWORK_QUOTA.NETWORK];
    }

    for (var i=0; i < net_quotas.length; i++){
      var default_net_quotas = default_quotas.NETWORK_QUOTA[net_quotas[i].ID]

      if (default_net_quotas == undefined){
        default_net_quotas = {
          "LEASES" : QUOTA_LIMIT_UNLIMITED
        }
      }

      var leases_bar = _editableQuotaBar(
          net_quotas[i].LEASES_USED,
          net_quotas[i].LEASES,
          default_net_quotas.LEASES,
          { quota_name: "NETWORK_LEASES" });

      quotas_tab_html +=
        '<tr class="network_quota_tr" quota_id="'+net_quotas[i].ID+'">\
          <td>'+net_quotas[i].ID+'</td>\
          <td>'+leases_bar+'</td>\
        </tr>';
    }

    quotas_tab_html +=
            '</tbody>\
            <tfoot>\
              <tr class="editable_quota" style="display: none">\
                <td colspan="2">\
                  <a type="button" \
                    class="button small radius small-12" \
                    id="network_add_quota_btn"><i class="fas fa-plus"></i>\
                    '+Locale.tr("Add a new quota")+'\
                  </a>\
                </td>\
              </tr>\
            </tfoot>\
          </table>\
        </fieldset>';

    return quotas_tab_html;
  }

  /**
   * @param  {Object} context jquery object, e.g. $("panel-id")
   * @param  {Object} default_quotas default quotas for Users/Groups
   */
  function _setupNetworkWidget(context, default_quotas){
    context.off("click", "#network_add_quota_btn");
    context.on("click", "#network_add_quota_btn", function(){

      $(".network_quota_table tbody", context).append(
          '<tr class="network_quota_tr" quota_id="-1">\
              <td class="network_select" colspan="2"></td>\
              <td class="leases_bar"></td>\
          </tr>');

      ResourceSelect.insert({
          context: $('.network_select', $(".network_quota_table tbody tr", context).last()),
          resourceName: 'Network',
          force: true,
          emptyValue: true
        });

      $(".network_quota_table tbody tr", context).last().off(
                                            "change", ".resource_list_select");

      $(".network_quota_table tbody tr", context).last().on(
                                  "change", ".resource_list_select", function(){

        $(this).parents("td").attr("colspan", "1");

        var network_id = $(this).val();
        var tr = $(this).parents("tr");
        tr.attr("quota_id", network_id);

        var default_net_quotas = default_quotas.NETWORK_QUOTA[network_id];

        if (default_net_quotas == undefined){
          default_net_quotas = {
            "LEASES" : QUOTA_LIMIT_UNLIMITED
          }
        }

        var leases_bar = _editableQuotaBar(
            0,
            QUOTA_LIMIT_DEFAULT,
            default_net_quotas.LEASES,
            { quota_name: "NETWORK_LEASES" });

        $("td.leases_bar", tr).html(leases_bar);

        $(".editable_quota", tr).show();
        $(".non_editable_quota", tr).hide();

        $.each($("input", tr), function(){
          initQuotaInputValue(this);
        });
      });

      return false;
    });

    return false;
  }

  /**
   * Creates a quotas panel
   * @param  {Object} resourece_info User/Group object
   * @param  {Object} default_quotas default quotas for Users/Groups
   * @param  {boolean} edit_enabled true to show the edit button and functionality
   * @return {string} html string with all the quota widgets
   */
  function _initQuotasPanel(resource_info, default_quotas, edit_enabled){
    _initEmptyQuotas(resource_info);

    var vms_quota = _vmsWidget(resource_info, default_quotas);
    var cpu_quota = _cpuWidget(resource_info, default_quotas);
    var memory_quota = _memoryWidget(resource_info, default_quotas);
    var system_disk_size_quota = _systemDiskWidget(resource_info, default_quotas);
    var running_vms_quota = _runningVmsWidget(resource_info, default_quotas);
    var running_cpu_quota = _runningCpuWidget(resource_info, default_quotas);
    var running_memory_quota = _runningMemoryWidget(resource_info, default_quotas);

    var image_quota = _imageWidget(resource_info, default_quotas);
    var network_quota = _networkWidget(resource_info, default_quotas);
    var datastore_quota = _datastoreWidget(resource_info, default_quotas);

    var quotas_html;

    quotas_html = '<div class="quotas">';

    if (edit_enabled) {
        quotas_html +=
        '<div class="row">\
          <div class="large-12 columns">\
            <span class="right">\
              <button class="button primary small radius" id="edit_quotas_button">\
                <span class="fas fa-edit"></span> '+Locale.tr("Edit")+'\
              </button>\
              <button class="button alert small radius" id="cancel_quotas_button" style="display: none">\
                '+Locale.tr("Cancel")+'\
              </button>\
              <button class="button success small radius" id="submit_quotas_button" style="display: none">\
                '+Locale.tr("Apply")+'\
              </button>\
            </span>\
          </div>\
        </div>';
    }

    if (_emptyQuotas(resource_info)) {
        quotas_html +=
        '<div class="row non_editable_quota">\
          <div class="large-8 large-centered columns">\
            <div class="text-center">\
              <span class="fa-stack fa-5x" style="color: #dfdfdf">\
                <i class="fas fa-cloud fa-stack-2x"></i>\
                <i class="fas fa-align-left fa-stack-1x fa-inverse"></i>\
              </span>\
              <br>\
              <p style="font-size: 18px; color: #999">\
                '+Locale.tr("There are no quotas defined")+'\
              </p>\
            </div>\
          </div>\
        </div>';
    }

    quotas_html +=
        '<div class="row">\
          <div class="medium-6 columns">' + vms_quota + '</div>\
          <div class="medium-6 columns">' + running_vms_quota + '</div>\
        </div>\
        <div class="row">\
          <div class="medium-6 columns">' + cpu_quota + '</div>\
          <div class="medium-6 columns">' + running_cpu_quota+ '</div>\
        </div>\
        <div class="row">\
          <div class="medium-6 columns">' + memory_quota + '</div>\
          <div class="medium-6 columns">' + running_memory_quota+ '</div>\
        </div>\
        <div class="row">\
          <div class="medium-6 columns">' + system_disk_size_quota + '</div>\
        </div>\
        <br><br>\
        <div class="row">\
          <div class="large-6 columns">' + image_quota + '</div>\
          <div class="large-6 columns right">' + network_quota + '</div>\
        </div>\
        <br><br>\
        <div class="row">\
          <div class="large-12 columns">' + datastore_quota + '</div>\
        </div>\
      </div>';

    return quotas_html;
  }

  function input_val(input){
    switch(input.attr("quota_mode")) {
      case "edit":
        return input.val();
      case "default":
        return QUOTA_LIMIT_DEFAULT;
      case "unlimited":
        return QUOTA_LIMIT_UNLIMITED;
    }
  }

  function initQuotaInputValue(input){
    switch($(input).val()) {
      case QUOTA_LIMIT_DEFAULT:
        $(input).parents(".quotabar_container").find(".quotabar_default_btn").click();
        break;
      case QUOTA_LIMIT_UNLIMITED:
        $(input).parents(".quotabar_container").find(".quotabar_unlimited_btn").click();
        break;
      default:
        break;
    }
  }

  function quotasPanelEditAction(parent_container){
    $("#edit_quotas_button", parent_container).hide();
    $("#cancel_quotas_button", parent_container).show();
    $("#submit_quotas_button", parent_container).show();

    $.each($("div.quotabar_container input", parent_container), function(){
      initQuotaInputValue(this);
    });

    $(".editable_quota", parent_container).show();
    $(".non_editable_quota", parent_container).hide();

    return false;
  }

  function setupQuotasBarButtons(resource_info, parent_container){
    parent_container.off("click", ".quotabar_edit_btn");
    parent_container.on("click",  ".quotabar_edit_btn", function() {
      var input = $(this).parents(".quotabar_container").find("input");

      if(input.attr("quota_mode") != "edit"){
        input.attr("quota_mode", "edit");
        input.attr("disabled", false);
        input.val( input.attr("quota_limit") >= 0 ? input.attr("quota_limit") : "0" );
      }

      return false;
    });

    parent_container.off("click", ".quotabar_default_btn");
    parent_container.on("click",  ".quotabar_default_btn", function() {
      var input = $(this).parents(".quotabar_container").find("input");

      var default_value = input.attr("quota_default");

      if (default_value == QUOTA_LIMIT_UNLIMITED) {
        default_value = "∞";
      }

      input.val( Locale.tr("Default") + " (" + default_value + ")" );
      input.attr("quota_mode", "default");
      input.attr("disabled", "disabled");

      return false;
    });

    parent_container.off("click", ".quotabar_unlimited_btn");
    parent_container.on("click",  ".quotabar_unlimited_btn", function() {
      var input = $(this).parents(".quotabar_container").find("input");

      input.val(Locale.tr("Unlimited"));
      input.attr("quota_mode", "unlimited");
      input.attr("disabled", "disabled");

      return false;
    });
  }

  function retrieveQuotasValues(parent_container){
    var obj = {};

    obj["VM"] = {
      "CPU"              : input_val( $("div[quota_name=VM_CPU] input", parent_container) ),
      "MEMORY"           : input_val( $("div[quota_name=VM_MEMORY] input", parent_container) ),
      "VMS"              : input_val( $("div[quota_name=VM_VMS] input", parent_container) ),
      "SYSTEM_DISK_SIZE" : input_val( $("div[quota_name=VM_SYSTEM_DISK_SIZE] input", parent_container) ),
      "RUNNING_CPU"      : input_val( $("div[quota_name=RUNNING_VM_CPU] input", parent_container) ),
      "RUNNING_MEMORY"   : input_val( $("div[quota_name=RUNNING_VM_MEMORY] input", parent_container) ),
      "RUNNING_VMS"      : input_val( $("div[quota_name=RUNNING_VM_VMS] input", parent_container) ),
    };

    $.each($("tr.image_quota_tr", parent_container), function(){
      if($(this).attr("quota_id") != "-1"){
        if (obj["IMAGE"] == undefined) {
          obj["IMAGE"] = [];
        }

        obj["IMAGE"].push({
          "ID"    : $(this).attr("quota_id"),
          "RVMS"  : input_val( $("div[quota_name=IMAGE_RVMS] input", this) )
        });
      }
    });

    $.each($("tr.network_quota_tr", parent_container), function(){
      if($(this).attr("quota_id") != "-1"){
        if (obj["NETWORK"] == undefined) {
          obj["NETWORK"] = [];
        }

        obj["NETWORK"].push({
          "ID"    : $(this).attr("quota_id"),
          "LEASES": input_val( $("div[quota_name=NETWORK_LEASES] input", this) )
        });
      }
    });

    $.each($("tr.ds_quota_tr", parent_container), function(){
      if($(this).attr("quota_id") != "-1"){
        if (obj["DATASTORE"] == undefined) {
          obj["DATASTORE"] = [];
        }

        obj["DATASTORE"].push({
          "ID"    : $(this).attr("quota_id"),
          "IMAGES": input_val( $("div[quota_name=DS_IMAGES] input", this) ),
          "SIZE"  : input_val( $("div[quota_name=DS_SIZE] input", this) )
        });
      }
    });

    return obj;
  }

  /**
   * Setups the html returned by initQuotasPanel, adding listeners for the edit
   * buttons
   * @param  {Object} resourece_info User/Group object
   * @param  {Object} parent_container jquery object, e.g. $("panel-id")
   * @param  {boolean} edit_enabled true to show the edit button and functionality
   * @param  {string} resource_name User or Group
   */
  function _setupQuotasPanel(resource_info, parent_container, edit_enabled, resource_name){
    /*Check effective group quotas*/
    if (resource_name == "User"){
      this.resource_info = resource_info;
      this.parent_container = parent_container;
      var that = this;
      OpenNebula.Group.show({
        data: {
            id: resource_info.GID
        }, success: function (request, group_json) {
            if (group_json.GROUP.VM_QUOTA.VM){
              if (group_json.GROUP.VM_QUOTA.VM.VMS != "-1" && group_json.GROUP.VM_QUOTA.VM.VMS != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.VMS) < parseInt(that.resource_info.VM_QUOTA.VM.VMS)){
                $("div[quota_name=VM_VMS] .progress-text", that.parent_container).text(that.resource_info.VM_QUOTA.VM.VMS_USED + " / " + group_json.GROUP.VM_QUOTA.VM.VMS);
                $("div[quota_name=VM_VMS] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.VMS);
              }
              if (group_json.GROUP.VM_QUOTA.VM.CPU != "-1" && group_json.GROUP.VM_QUOTA.VM.CPU != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.CPU) < parseInt(that.resource_info.VM_QUOTA.VM.CPU)){
                $("div[quota_name=VM_CPU] .progress-text", that.parent_container).text(that.resource_info.VM_QUOTA.VM.CPU_USED + " / " + group_json.GROUP.VM_QUOTA.VM.CPU);
                $("div[quota_name=VM_CPU] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.CPU);
              }
              if (group_json.GROUP.VM_QUOTA.VM.MEMORY != "-1" && group_json.GROUP.VM_QUOTA.VM.MEMORY != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.MEMORY) < parseInt(that.resource_info.VM_QUOTA.VM.MEMORY)){
                $("div[quota_name=VM_MEMORY] .progress-text", that.parent_container).text(Humanize.size(that.resource_info.VM_QUOTA.VM.MEMORY_USED * 1024) + " / " + Humanize.size(group_json.GROUP.VM_QUOTA.VM.MEMORY * 1024));
                $("div[quota_name=VM_MEMORY] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.MEMORY);
              }
              if (group_json.GROUP.VM_QUOTA.VM.SYSTEM_DISK_SIZE != "-1" && group_json.GROUP.VM_QUOTA.VM.SYSTEM_DISK_SIZE != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.SYSTEM_DISK_SIZE) < parseInt(that.resource_info.VM_QUOTA.VM.SYSTEM_DISK_SIZE)){
                $("div[quota_name=VM_SYSTEM_DISK_SIZE] .progress-text", that.parent_container).text(Humanize.size(that.resource_info.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED * 1024) + " / " + Humanize.size(group_json.GROUP.VM_QUOTA.VM.SYSTEM_DISK_SIZE * 1024));
                $("div[quota_name=VM_SYSTEM_DISK_SIZE] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.SYSTEM_DISK_SIZE);
              }
              if (group_json.GROUP.VM_QUOTA.VM.RUNNING_VMS != "-1" && group_json.GROUP.VM_QUOTA.VM.RUNNING_VMS != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.RUNNING_VMS) < parseInt(that.resource_info.VM_QUOTA.VM.RUNNING_VMS)){
                $("div[quota_name=VM_RUNNING_VMS] .progress-text", that.parent_container).text(that.resource_info.VM_QUOTA.VM.RUNNING_VMS_USED + " / " + group_json.GROUP.VM_QUOTA.VM.RUNNING_VMS);
                $("div[quota_name=VM_RUNNING_VMS] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.RUNNING_VMS);
              }
              if (group_json.GROUP.VM_QUOTA.VM.RUNNING_CPU != "-1" && group_json.GROUP.VM_QUOTA.VM.RUNNING_CPU != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.RUNNING_CPU) < parseInt(that.resource_info.VM_QUOTA.VM.RUNNING_CPU)){
                $("div[quota_name=VM_RUNNING_CPU] .progress-text", that.parent_container).text(that.resource_info.VM_QUOTA.VM.RUNNING_CPU_USED + " / " + group_json.GROUP.VM_QUOTA.VM.RUNNING_CPU);
                $("div[quota_name=VM_RUNNING_CPU] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.RUNNING_CPU);
              }
              if (group_json.GROUP.VM_QUOTA.VM.RUNNING_MEMORY != "-1" && group_json.GROUP.VM_QUOTA.VM.RUNNING_MEMORY != "-2" && parseInt(group_json.GROUP.VM_QUOTA.VM.RUNNING_MEMORY) < parseInt(that.resource_info.VM_QUOTA.VM.RUNNING_MEMORY)){
                $("div[quota_name=VM_RUNNING_MEMORY] .progress-text", that.parent_container).text(Humanize.size(that.resource_info.VM_QUOTA.VM.RUNNING_MEMORY_USED * 1024) + " / " + Humanize.size(group_json.GROUP.VM_QUOTA.VM.RUNNING_MEMORY * 1024));
                $("div[quota_name=VM_RUNNING_MEMORY] input", that.parent_container).val(group_json.GROUP.VM_QUOTA.VM.RUNNING_MEMORY);
              }
            }

            /*Check Images*/
            if (!$.isEmptyObject(group_json.GROUP.IMAGE_QUOTA) && that.resource_info.IMAGE_QUOTA.IMAGE){
              var imageQuota = that.resource_info.IMAGE_QUOTA.IMAGE;
              if (!Array.isArray(imageQuota)){
                imageQuota = [that.resource_info.IMAGE_QUOTA.IMAGE];
              }
              var imageGroupQuota = group_json.GROUP.IMAGE_QUOTA.IMAGE;
              if (!Array.isArray(imageGroupQuota)){
                imageGroupQuota = [group_json.GROUP.IMAGE_QUOTA.IMAGE];
              }
              $.each(imageQuota, function(key, user_value){
                $.each(imageGroupQuota, function(key, group_value){
                  if (user_value.ID == group_value.ID && group_value.RVMS != "-1" && group_value.RVMS != "-2" && parseInt(group_value.RVMS) < parseInt(user_value.RVMS)){
                    $("tr[quota_id=" + user_value.ID + "] div[quota_name=IMAGE_RVMS] .progress-text", that.parent_container).text(user_value.RVMS_USED + " / " + group_value.RVMS);
                    $("tr[quota_id=" + user_value.ID + "] div[quota_name=IMAGE_RVMS] input", that.parent_container).val(group_value.RVMS);
                  }
                });
              });
            }

            /*Check VNets*/
            if (!$.isEmptyObject(group_json.GROUP.NETWORK_QUOTA) && that.resource_info.NETWORK_QUOTA.NETWORK){
              var vnetQuota = that.resource_info.NETWORK_QUOTA.NETWORK;
              if (!Array.isArray(vnetQuota)){
                vnetQuota = [that.resource_info.NETWORK_QUOTA.NETWORK];
              }
              var vnetGroupQuota = group_json.GROUP.NETWORK_QUOTA.NETWORK;
              if (!Array.isArray(vnetGroupQuota)){
                vnetGroupQuota = [group_json.GROUP.NETWORK_QUOTA.NETWORK];
              }
              $.each(vnetQuota, function(key, user_value){
                $.each(vnetGroupQuota, function(key, group_value){
                  if (user_value.ID == group_value.ID && group_value.LEASES != "-1" && group_value.LEASES != "-2" && parseInt(group_value.LEASES) < parseInt(user_value.LEASES)){
                    $("tr[quota_id=" + user_value.ID + "] div[quota_name=NETWORK_LEASES] .progress-text", that.parent_container).text(user_value.LEASES_USED + " / " + group_value.LEASES);
                    $("tr[quota_id=" + user_value.ID + "] div[quota_name=NETWORK_LEASES] input", that.parent_container).val(group_value.LEASES);
                  }
                });
              });
            }

            /*Check Datastores*/
            if (!$.isEmptyObject(group_json.GROUP.DATASTORE_QUOTA) && that.resource_info.DATASTORE_QUOTA.DATASTORE){
              var dsQuota = that.resource_info.DATASTORE_QUOTA.DATASTORE;
              if (!Array.isArray(dsQuota)){
                dsQuota = [that.resource_info.DATASTORE_QUOTA.DATASTORE];
              }
              var dsGroupQuota = group_json.GROUP.DATASTORE_QUOTA.DATASTORE;
              if (!Array.isArray(dsGroupQuota)){
                dsGroupQuota = [group_json.GROUP.DATASTORE_QUOTA.DATASTORE];
              }
              $.each(dsQuota, function(key, user_value){
                $.each(dsGroupQuota, function(key, group_value){
                  if (user_value.ID == group_value.ID){
                    if (group_value.IMAGES != "-1" && group_value.IMAGES != "-2" && parseInt(group_value.IMAGES) < parseInt(user_value.IMAGES)){
                      $("tr[quota_id=" + user_value.ID + "] div[quota_name=DS_IMAGES] .progress-text", that.parent_container).text(user_value.IMAGES_USED + " / " + group_value.IMAGES);
                      $("tr[quota_id=" + user_value.ID + "] div[quota_name=DS_IMAGES] input", that.parent_container).val(group_value.IMAGES);
                    }
                    if (group_value.SIZE != "-1" && group_value.SIZE != "-2" && parseInt(group_value.SIZE) < parseInt(user_value.SIZE)){
                      $("tr[quota_id=" + user_value.ID + "] div[quota_name=DS_SIZE] .progress-text", that.parent_container).text(Humanize.size(user_value.SIZE_USED * 1024) + " / " + Humanize.size(group_value.SIZE * 1024));
                      $("tr[quota_id=" + user_value.ID + "] div[quota_name=DS_SIZE] input", that.parent_container).val(group_value.SIZE);
                    }
                  }
                });
              });
            }

        }, error: function () {
          // Do nothing
        }
      });
    }

    if (edit_enabled) {
      parent_container.off("click", "#edit_quotas_button");
      parent_container.on("click",  "#edit_quotas_button", function() {
        return quotasPanelEditAction(parent_container);
      });

      parent_container.off("click", "#cancel_quotas_button");
      parent_container.on("click",  "#cancel_quotas_button", function() {
        Sunstone.runAction(resource_name+".show", resource_info.ID);
        return false;
      });

      parent_container.off("click", "#submit_quotas_button");
      parent_container.on("click",  "#submit_quotas_button", function() {
        var obj = retrieveQuotasValues(parent_container);
        Sunstone.runAction(resource_name+".set_quota", [resource_info.ID], obj);

        return false;
      });

      setupQuotasBarButtons(resource_info, parent_container);

      var default_quotas = QuotaDefaults.getDefaultQuotas(resource_name);

      _setupImageWidget(parent_container, default_quotas);
      _setupNetworkWidget(parent_container, default_quotas);
      _setupDatastoreWidget(parent_container, default_quotas);
    }
  }

  /*
   * opts.is_float : true to parse quota_limit and default_limit as floats instead of int
   * opts.mb : true if the quota is in MB
   * opts.quota_name : string to identify the quota widget
   */
  function _editableQuotaBar(usage, quota_limit, default_limit, opts){

      if (!opts) opts = {};
      if (!opts.quota_name) opts.quota_name = "";

      var limit;

      if (opts.is_float){
          usage = parseFloat(usage, 10);
          limit = _quotaFloatLimit(quota_limit, default_limit);
      } else {
          usage = parseInt(usage, 10);
          limit = _quotaIntLimit(quota_limit, default_limit);
      }

      percentage = 0;

      if (limit > 0){
          percentage = Math.floor((usage / limit) * 100);

          if (percentage > 100){
              percentage = 100;
          }
      } else if (limit == 0 && usage > 0){
          percentage = 100;
      }

      var info_str;

      if (opts.mb){
          info_str = Humanize.size(usage * 1024)+' / '
              +((limit >= 0) ? Humanize.size(limit * 1024) : '-')
      } else {
          info_str = usage+' / '+((limit >= 0) ? limit : '-');
      }

      html =
      '<div class="quotabar_container" quota_name="'+opts.quota_name+'">\
        <div class="row collapse editable_quota" style="font-size: 12px; display: none">\
          <div class="small-2 columns">\
            <label style="font-size: 12px; margin: 0px" class="inline right">'+ usage + ' /&nbsp;</label>\
          </div>';


      if (opts.mb){
          html +=
          '<div class="small-4 columns">';
      }else{
          html +=
          '<div class="small-5 columns">';
      }

      html +=
            '<input type="text" style="font-size: 12px; margin: 0px" quota_mode="edit" quota_limit="'+quota_limit+'" quota_default="'+default_limit+'" value="'+quota_limit+'"/>\
          </div>';

      if (opts.mb){
          html +=
          '<div class="small-1 columns">\
            <span style="font-size: 12px; height: 2.0625rem !important; line-height: 2.0625rem !important;" class="postfix">MB</span>\
          </div>';
      }

      html +=
          '<div class="small-5 columns">\
            <div class="button-group">\
              <a class="button tiny secondary quotabar_edit_btn"><span class="fas fa-pencil-alt"></span></a>\
              <a class="button tiny secondary quotabar_default_btn"><span class="fas fa-file"></span></a>\
              <a class="button tiny secondary quotabar_unlimited_btn"><strong>&infin;</strong></a>\
            </div>\
          </div>\
        </div>\
        <div class="row collapse non_editable_quota">\
          <div class="large-12 columns">'+
            ProgressBar.html(usage, limit, info_str)+
          '</div>\
        </div>\
      </div>';
      return html;
  }

  /**
   * @param      {number}   usage     The usage
   * @param      {number}   limit     The max limit
   * @param      {string}   info_str  The info str, can be null
   * @return     {Object}           { "percentage", "str" }
   */
  function _process(usage, limit, info_str) {
    info_str = info_str || (usage + ' / ' + ((limit >= 0) ? limit : '-'));

    percentage = 0;

    if (limit > 0) {
      percentage = Math.floor((usage / limit) * 100);

      if (percentage > 100) {
        percentage = 100;
      }
    } else if (limit == 0 && usage > 0) {
      percentage = 100;
    }

    return {
      "percentage": percentage,
      "str": info_str
    }
  }

  /**
   *  Returns an object with {"percentage", "str"}
   */
  function _quotaInfo(usage, limit, default_limit){
      var int_usage = parseInt(usage, 10);
      var int_limit = _quotaIntLimit(limit, default_limit);
      return _process(int_usage, int_limit, null);
  }

  /**
   *  Returns an object with {"percentage", "str"}
   */
  function _quotaMBInfo(usage, limit, default_limit){
      var int_usage = parseInt(usage, 10);
      var int_limit = _quotaIntLimit(limit, default_limit);

      info_str = Humanize.size(int_usage * 1024)+' / '
              +((int_limit >= 0) ? Humanize.size(int_limit * 1024) : '-')

      return _process(int_usage, int_limit, info_str);
  }

  /**
   *  Returns an object with {"percentage", "str"}
   */
  function _quotaFloatInfo(usage, limit, default_limit){
      var float_usage = parseFloat(usage, 10);
      var float_limit = _quotaFloatLimit(limit, default_limit);
      return _process(float_usage, float_limit, null);
  }

  function _quotaBar(usage, limit, default_limit){
    var int_usage = parseInt(usage, 10);
    var int_limit = _quotaIntLimit(limit, default_limit);
    return ProgressBar.html(int_usage, int_limit, null);
  }

  function _quotaBarMB(usage, limit, default_limit){
    var int_usage = parseInt(usage, 10);
    var int_limit = _quotaIntLimit(limit, default_limit);

    info_str = Humanize.size(int_usage * 1024)+' / ' +
                  ((int_limit >= 0) ? Humanize.size(int_limit * 1024) : '-');

    return ProgressBar.html(int_usage, int_limit, info_str);
  }

  function _quotaBarFloat(usage, limit, default_limit){
    var float_usage = parseFloat(usage, 10);
    var float_limit = _quotaFloatLimit(limit, default_limit);
    return ProgressBar.html(float_usage, float_limit, null);
  }

  function _quotaIntLimit(limit, default_limit){
    i_limit = parseInt(limit, 10);
    i_default_limit = default_limit? parseInt(default_limit, 10) : i_limit;

    if (limit == QUOTA_LIMIT_DEFAULT){
      i_limit = i_default_limit;
    }

    if (isNaN(i_limit))
    {
      i_limit = 0;
    }

    return i_limit
  }

  function _quotaFloatLimit(limit, default_limit){
    f_limit = parseFloat(limit, 10);
    f_default_limit = parseFloat(default_limit, 10);

    if (f_limit == parseFloat(QUOTA_LIMIT_DEFAULT, 10)){
      f_limit = f_default_limit;
    }

    if (isNaN(f_limit))
    {
      f_limit = 0;
    }

    return f_limit
  }

  //============================================================================
  // Quotas dialog
  //============================================================================

  function _quotas_tmpl(uniqueId){
    return '<div class="row">\
        <div class="large-12 columns">\
          <dl id="' + uniqueId + 'Tabs" class="tabs sunstone-info-tabs text-center" data-tabs>\
               <dd class="tabs-title is-active"><a href="#vm_quota"><i class="fas fa-cloud"></i><br>'+Locale.tr("VM")+'</a></dd>\
               <dd class="tabs-title"><a href="#datastore_quota"><i class="fas fa-folder-open"></i><br>'+Locale.tr("Datastore")+'</a></dd>\
               <dd class="tabs-title"><a href="#image_quota"><i class="fas fa-upload"></i><br>'+Locale.tr("Image")+'</a></dd>\
               <dd class="tabs-title"><a href="#network_quota"><i class="fas fa-globe"></i><br>'+Locale.tr("VNet")+'</a></dd>\
          </dl>\
        </div>\
      </div>\
      <div class="row">\
        <div class="tabs-content" data-tabs-content="' + uniqueId + 'Tabs">\
          <div id="vm_quota" class="tabs-panel is-active">\
          </div>\
          <div id="datastore_quota" class="tabs-panel">\
          </div>\
          <div id="image_quota" class="tabs-panel">\
          </div>\
          <div id="network_quota" class="tabs-panel">\
          </div>\
        </div>\
      </div>';
  }

  /**
   * Sets up a dialog to edit and update user and group quotas
   */
  function _setupQuotasDialog(context){
    Foundation.reflow(context, 'tabs');

    $('form', context).submit(function(){
      var obj = retrieveQuotasValues(context);
      var action = $('div.form_buttons button',this).val();
      var sel_elems = Sunstone.getAction(action).elements();
      Sunstone.runAction(action,sel_elems,obj);

      return false;
    });
  }

  function _populateQuotasDialog(resource_info, default_quotas, context){
    var action = $('div.form_buttons button',context).val();
    var elements = Sunstone.getAction(action).elements({names: true});

    if (elements) {
      var html = '<h6 class="subheader">';

      html += elements.map(function(element){
        return (TemplateUtils.htmlEncode(element.id)+'&nbsp;'+
                TemplateUtils.htmlEncode(element.name));
        }).join(',&emsp;')

      html += '</h6>';

      $('.confirm-resources-header', context).html(html);
    }

    var vms_quota = _vmsWidget(resource_info, default_quotas);
    var cpu_quota = _cpuWidget(resource_info, default_quotas);
    var memory_quota = _memoryWidget(resource_info, default_quotas);
    var system_disk_size_quota = _systemDiskWidget(resource_info, default_quotas);
    var running_vms_quota = _runningVmsWidget(resource_info, default_quotas);
    var running_cpu_quota = _runningCpuWidget(resource_info, default_quotas);
    var running_memory_quota = _runningMemoryWidget(resource_info, default_quotas);

    var image_quota = _imageWidget(resource_info, default_quotas);
    var network_quota = _networkWidget(resource_info, default_quotas);
    var datastore_quota = _datastoreWidget(resource_info, default_quotas);

    $("#vm_quota", context).html(
        '<div class="medium-6 columns">' + vms_quota + '</div>\
        <div class="medium-6 columns">' + running_vms_quota + '</div>\
        <div class="medium-6 columns">' + cpu_quota + '</div>\
        <div class="medium-6 columns">' + running_cpu_quota + '</div>\
        <div class="medium-6 columns">' + memory_quota + '</div>\
        <div class="medium-6 columns">' + running_memory_quota + '</div>\
        <div class="medium-6 columns">' + system_disk_size_quota+ '</div>');

    $("#datastore_quota", context).html(
        '<div class="large-12 columns">' + datastore_quota + '</div>');

    $("#image_quota", context).html(
        '<div class="large-12 columns">' + image_quota + '</div>');

    $("#network_quota", context).html(
        '<div class="large-12 columns">' + network_quota + '</div>');

    setupQuotasBarButtons(resource_info, context);

    _setupImageWidget(context, default_quotas);
    _setupNetworkWidget(context, default_quotas);
    _setupDatastoreWidget(context, default_quotas);

    quotasPanelEditAction(context);
  }

  return {
    'initEmptyQuotas': _initEmptyQuotas,
    'quotaBar': _quotaBar,
    'quotaBarMB': _quotaBarMB,
    'quotaBarFloat': _quotaBarFloat,
    'initQuotasPanel': _initQuotasPanel,
    'setupQuotasPanel': _setupQuotasPanel,
    'dialogHTML': _quotas_tmpl,
    'setupQuotasDialog': _setupQuotasDialog,
    'populateQuotasDialog': _populateQuotasDialog,
    'quotaFloatInfo': _quotaFloatInfo,
    'quotaMBInfo': _quotaMBInfo,
    'quotaInfo': _quotaInfo
  };
});
