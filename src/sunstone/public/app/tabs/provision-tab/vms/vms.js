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
    var CapacityInputs = require("tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs");
    var Config = require("sunstone-config");
    var DatastoresTable = require("tabs/datastores-tab/datatable");
    var DisksResize = require("utils/disks-resize");
    var Humanize = require("utils/humanize");
    var Locale = require("utils/locale");
    var NicsSection = require("utils/nics-section");
    var Notifier = require("utils/notifier");
    var OpenNebula = require("opennebula");
    var ProvisionTemplatesList = require("../templates/list");
    var ProvisionVmsList = require("./list");
    var Sunstone = require("sunstone");
    var TemplateUtils = require("utils/template-utils");
    var UniqueId = require("utils/unique-id");
    var UserInputs = require("utils/user-inputs");
    var VMGroupSection = require("utils/vmgroup-section");
    var WizardFields = require("utils/wizard-fields");

    // Templates
    var TemplateVMCapacity = require("hbs!./html/capacity");
    var TemplateVMCard = require("hbs!./html/template_card");
    var TemplateVMLogo = require("hbs!./html/logo");
    var TemplateVMBootRow = require("hbs!./html/boot_row");

    // Constants
    var TAB_ID = require("../tabId");

    var _actions = {
        "setup" : _setup,
        "clearVMCreate": _clearVMCreate,
    }

    /**************************************************************************/
    // Functions
    /**************************************************************************/

    function _clearVMCreate(){
        OpenNebula.Action.clear_cache("VM");
        ProvisionVmsList.show(0);
        var context = $("#provision_create_vm");
        $("#vm_name", context).val("");
        $(".provision_selected_networks").html("");
        $(".provision_vmgroup_selector").html("");
        $(".provision_ds_selector").html("");
        $(".provision-pricing-table", context).removeClass("selected");
        $(".alert-box-error", context).hide();
        $(".total_cost_div", context).hide();
        $("#provision_vm_instantiate_templates_owner_filter").val("all").change();
        $("#provision_vm_instantiate_template_search").val("").trigger("input");
    }
      
    function get_memory_value_unit(template){
        var value;
        var unit;

        if (template.MEMORY >= 1024*1024){
            value = (template.MEMORY/(1024*1024)).toFixed(2);
            unit = "TB";
        }else if (template.MEMORY >= 1024){
            value = (template.MEMORY/1024).toFixed(2);
            unit = "GB";
        } else {
            value = (template.MEMORY ? template.MEMORY : "-");
            unit = "MB";
        }

        return {
            "value": value,
            "unit": unit
        }
    }

    function generate_provision_capacity_accordion(context, element) {
        context.off();
        var template = element.TEMPLATE;
        var cpuCost = template.CPU_COST ? template.CPU_COST : Config.onedConf.DEFAULT_COST.CPU_COST;
        var memoryCost = template.MEMORY_COST ? template.MEMORY_COST : Config.onedConf.DEFAULT_COST.MEMORY_COST;
        
        context.html(TemplateVMCapacity({
            capacityInputsHTML: CapacityInputs.html()
        }));
        
        if (Config.provision.dashboard.isEnabled("quotas")) {
            $("#quotas-mem", context).show();
            $("#quotas-cpu", context).show();
            var quotaMem = false;
            var quotaCpu = false;
            var user = this.user;

            if (user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)){
            var memUsed = parseFloat(user.VM_QUOTA.VM.MEMORY_USED);
            var cpuUsed = parseFloat(user.VM_QUOTA.VM.CPU_USED);

            if (user.VM_QUOTA.VM.MEMORY === "-1" || user.VM_QUOTA.VM.MEMORY === "-2"){
                $("#quotas-mem", context).text(Humanize.size(memUsed * 1024) + " / ∞");
            } else {
                quotaMem = true;
                $("#quotas-mem", context).text(Humanize.size(memUsed * 1024) + " / " + Humanize.size(user.VM_QUOTA.VM.MEMORY * 1024));
            }

            if (user.VM_QUOTA.VM.CPU === "-1" || user.VM_QUOTA.VM.CPU === "-2"){
                $("#quotas-cpu", context).text(cpuUsed + " / ∞");
            } else {
                quotaCpu = true;
                $("#quotas-cpu", context).text(cpuUsed + " / " + user.VM_QUOTA.VM.CPU);
            }
            }
        }

        CapacityInputs.setup(context);
        CapacityInputs.fill(context, element);
        CapacityInputs.setCallback(context, function(values){
            values.MEMORY = values.MEMORY ? values.MEMORY : 0;
            values.CPU = values.CPU ? values.CPU : 0;

            var value_and_unit = get_memory_value_unit(values);
            $(".cpu_value", context).html(values.CPU);
            $(".memory_value", context).html(value_and_unit.value);
            $(".memory_unit", context).html(value_and_unit.unit);

            if (user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)){
            if (quotaMem){
                $("#quotas-mem", context).text( Humanize.size((parseFloat(user.VM_QUOTA.VM.MEMORY_USED) + parseFloat(values.MEMORY)) * 1024) + " / " + Humanize.size(user.VM_QUOTA.VM.MEMORY * 1024));
                if ((parseFloat(values.MEMORY) + parseFloat(user.VM_QUOTA.VM.MEMORY_USED)) > user.VM_QUOTA.VM.MEMORY){
                $("#quotas-mem", context).css("color", "red");
                } else {
                $("#quotas-mem", context).css("color", "black");
                }
            } else {
                $("#quotas-mem", context).text( Humanize.size((parseFloat(user.VM_QUOTA.VM.MEMORY_USED) + parseFloat(values.MEMORY)) * 1024) + " / ∞");
            }
            if (quotaCpu){
                $("#quotas-cpu", context).text(((parseFloat(user.VM_QUOTA.VM.CPU_USED) + parseFloat(values.CPU))).toFixed(2) + " / " + user.VM_QUOTA.VM.CPU);
                if ((parseFloat(values.CPU) + parseFloat(user.VM_QUOTA.VM.CPU_USED)) > user.VM_QUOTA.VM.CPU){
                $("#quotas-cpu", context).css("color", "red");
                } else {
                $("#quotas-cpu", context).css("color", "black");
                }
            } else {
                $("#quotas-cpu", context).text(((parseFloat(user.VM_QUOTA.VM.CPU_USED) + parseFloat(values.CPU))).toFixed(2) + " / ∞");
            }
            }
        });

        var _redoCost = function(values) {
            var cost = 0;
            if (values.CPU != undefined){
            cost += cpuCost * values.CPU;
            }
            if (values.MEMORY != undefined){
            cost += memoryCost * values.MEMORY;
            }
            $(".cost_value", context).html(cost.toFixed(2));
            _calculateCost();
        };

        if ((cpuCost != 0 || memoryCost != 0) && Config.isFeatureEnabled("showback")) {
            $(".provision_create_template_cost_div").show();
            _redoCost(template);
            if (Config.provision.create_vm.isEnabled("capacity_select")){
            CapacityInputs.setCallback(context, _redoCost);
            }
        } else {
            $(".provision_create_template_cost_div").hide();
        }
        
        if (!Config.provision.create_vm.isEnabled("capacity_select")) {
            $('input, select', $(".provision_capacity_selector")).prop("disabled", true);
        }
    }

    function _calculateCost(){
        var context = $("#provision_create_vm");
        var capacity_val = parseFloat( $(".provision_create_template_cost_div .cost_value", context).text() );
        var disk_val = parseFloat( $(".provision_create_template_disk_cost_div .cost_value", context).text() );
        var total = capacity_val + disk_val;
        if (total != 0 && Config.isFeatureEnabled("showback")) {
            $(".total_cost_div", context).show();
            $(".total_cost_div .cost_value", context).text( (total).toFixed(2) );
        }
        if (Config.provision.dashboard.isEnabled("quotas") && this.user && this.user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)) {
            if (!$("#quotas-disks").text().includes("/")){
            var totalSize = parseFloat($("#quotas-disks").text());
            var systemDiskSizeUsed = this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED;
            var sytemDiskSize = this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE;
            if (sytemDiskSize === "-1" || sytemDiskSize === "-2"){
                $("#quotas-disks").text(Humanize.size((parseFloat(systemDiskSizeUsed) + totalSize) * 1024) + " / ∞");
            } else {
                $("#quotas-disks").text(Humanize.size((parseFloat(systemDiskSizeUsed) + totalSize) * 1024) + " / " + Humanize.size(parseFloat(sytemDiskSize) * 1024));
                if ((parseFloat(systemDiskSizeUsed) + totalSize) > parseFloat(sytemDiskSize)){
                $("#quotas-disks", context).css("color", "red");
                } else {
                $("#quotas-disks", context).css("color", "black");
                }
            }
            }
        }
    }

    function show_provision_create_vm(provision_vm_instantiate_templates_datatable) {
        OpenNebula.Action.clear_cache("VMTEMPLATE");
        ProvisionTemplatesList.updateDatatable(provision_vm_instantiate_templates_datatable);
        $("#provision_vm_instantiate_templates_owner_filter").val("all").change();
        $("#provision_vm_instantiate_template_search").val("").trigger("input");
        $(".provision_accordion_template .selected_template").hide();
        $(".provision_accordion_template .select_template").show();
        $("#provision_create_vm .provision_capacity_selector").html("");
        $("#provision_create_vm .provision_disk_selector").html("");
        $("#provision_create_vm .provision_disk_selector").removeData("template_json");
        $("#provision_create_vm .provision_network_selector").html("");
        $("#provision_create_vm .provision_vmgroup_selector").html("");
        $("#provision_create_vm .provision_ds_selector").html("");
        $("#provision_create_vm .provision_add_vmgroup").show();
        $("#provision_create_vm .provision_vmgroup").hide();
        $("#provision_create_vm .provision_ds").hide();
        $("#provision_create_vm .provision_boot").hide();
        $("#provision_create_vm .provision_custom_attributes_selector").html("");
        $("#provision_create_vm li:not(.is-active) a[href='#provision_dd_template']").trigger("click");
        $("#provision_create_vm .total_cost_div").hide();
        $("#provision_create_vm .alert-box-error").hide();
        $(".section_content").hide();
        $("#provision_create_vm").fadeIn();
    }

    function _retrieveBootValue(context) {
        return $("table.boot-order-instantiate-provision", context).attr("value");
    }

    function _fillBootValue(context, value) {
        return $("table.boot-order-instantiate-provision", context).attr("value", value);
    }

    function _refreshBootValue(context) {
        var table = $("table.boot-order-instantiate-provision", context);

        var devices = [];

        $.each($("tr", table), function(){
            if ($("input", this).is(":checked")){
            devices.push( $(this).attr("value") );
            }
        });

        table.attr("value", devices.join(","));
    }

    function appendTemplateCard(aData, tableID) {
        var data = aData.VMTEMPLATE;
        var values = {
            "id": data.ID,
            "name": TemplateUtils.htmlEncode(data.NAME),
            "logo": null,
            "description": TemplateUtils.htmlEncode(data.TEMPLATE.DESCRIPTION) || "...",
            "owner": null
        }

        values.logo = data.TEMPLATE.LOGO ? TemplateVMLogo({img: data.TEMPLATE.LOGO}) : TemplateVMLogo();
        if (data.UID == config.user_id){
            values.owner = Locale.tr("mine");
        } else if (data.GID == config.user_gid){
            values.owner = Locale.tr("group");
        } else {
            values.owner = Locale.tr("system");
        }

        var li = $(TemplateVMCard(values)).appendTo($("#"+tableID+"_ul"));
        $(".provision-pricing-table", li).data("opennebula", aData);
    }

    function _addBootRow(context, value, label, label_class) {
        $("table.boot-order-instantiate-provision tbody", context).append(
            TemplateVMBootRow({
            "empty": false,
            "value": value,
            "label": label,
            "label_class": label_class
            })
        );
    }

    function distinct(value, index, self){
        return self.indexOf(value)===index;
    };

    function _loadBootOrder(context, templateJSON) {
        var table = $("table.boot-order-instantiate-provision", context);
        var prev_value = $(table).attr("value");

        $("table.boot-order-instantiate-provision tbody", context).html("");

        if (templateJSON.DISK !== undefined){
            var disks = Array.isArray(templateJSON.DISK) ? templateJSON.DISK : [templateJSON.DISK];
            disks = disks.filter(distinct);

            $.each(disks, function(i,disk){
                var label = "";
                var label_class = "fa-server";
                var disk_name = "disk";

                if (disk.IMAGE !== undefined){
                    label += disk.IMAGE;
                } else if (disk.IMAGE_ID !== undefined){
                    label += Locale.tr("Image ID") + " " + disk.IMAGE_ID;
                } else {
                    label += Locale.tr("Volatile");
                }

                if (disk.DISK_ID === undefined){
                    disk_name += i;
                } else {
                    disk_name += disk.DISK_ID;
                }

                _addBootRow(context, disk_name, label, label_class);
            });
        }

        if (templateJSON.NIC !== undefined){
            var nics = templateJSON.NIC;

            if (!Array.isArray(nics)){
            nics = [nics];
            }
            nics = nics.filter(distinct);
            nics.map(function(nic,i){
            var label = "";
            var label_class = "fa-globe";
            if (nic && nic.NETWORK && nic.NETWORK !== undefined){
                label += nic.NETWORK;
            } else if (nic.NETWORK_ID !== undefined){
                label += Locale.tr("Network ID") + " " + nic.NETWORK_ID;
            } else {
                label += Locale.tr("Manual settings");
            }
            _addBootRow(context, "nic"+i, label, label_class);
            });
        }

        if (templateJSON.DISK === undefined && templateJSON.NIC === undefined){
            $("table.boot-order-instantiate-provision tbody", context).append(TemplateVMBootRow({"empty": true}));
        }

        if (prev_value.length > 0){
            var pos = 0;

            $.each(prev_value.split(","), function(i,device){
            var tr = $("tr[value=\"" + device + "\"]", table);

            if(tr.length > 0){
                $($("tr", table)[pos]).before(tr);
                $("input", tr).click();

                pos += 1;
            }
            });

            _refreshBootValue(context);
        }
    }

    function initializeTemplateCards(context, tableID) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (context.$("tr", {"filter": "applied"} ).length == 0) {
        context.html(TemplateVMCard({"instantiate":true}));
      } else {
        $("#"+tableID+"_table").html(TemplateVMCard({"instantiate":true, "tableID":tableID}));
      }
      return true;
    }

    function _setup(){
      var provision_vm_instantiate_templates_datatable = $("#provision_vm_instantiate_templates_table").dataTable({
        "iDisplayLength": 6,
        "bAutoWidth": false,
        "sDom" : "<\"H\">t<\"F\"lp>",
        "aLengthMenu": Sunstone.getPaginate(),
        "aoColumnDefs": [
            { "bVisible": false, "aTargets": ["all"]}
        ],
        "aoColumns": [
            { "mDataProp": "VMTEMPLATE.ID" },
            { "mDataProp": "VMTEMPLATE.NAME" },
            { "mDataProp": function ( data, type, val ) {
                var owner;
                if (data.VMTEMPLATE.UID == config.user_id){
                  owner = "mine";
                } else if (data.VMTEMPLATE.GID == config.user_gid){
                  owner = "group";
                } else {
                  owner = "system";
                }
                if (type === "filter") {
                  // In order to make "mine" search work
                  if(owner == "mine"){
                    return Locale.tr("mine");
                  } else if(owner == "group"){
                    return Locale.tr("group");
                  } else if(owner == "system"){
                    return Locale.tr("system");
                  }
                }
                return owner;
              }
            },
            { "mDataProp": "VMTEMPLATE.TEMPLATE.LABELS", "sDefaultContent" : "-"  }
        ],
        "fnPreDrawCallback": function (oSettings) {
          initializeTemplateCards(this, "provision_vm_instantiate_templates");
        },
        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
          appendTemplateCard(aData, "provision_vm_instantiate_templates");
          return nRow;
        },
        "fnDrawCallback": function(oSettings) {
        }
    });

      var tab = $("#"+TAB_ID);
      ProvisionVmsList.generate(
        $(".provision_vms_list_section"), 
        {
          active: true, 
          create: Config.isFeatureEnabled("cloud_vm_create")
        }
      );

      //----------------------------------------------------------------------------
      // Boot order
      //----------------------------------------------------------------------------

      tab.on("click", "button.boot-order-instantiate-provision-up", function(){
          var tr = $(this).closest("tr");
          tr.prev().before(tr);

          _refreshBootValue(tab);

          return false;
      });

      tab.on("click", "button.boot-order-instantiate-provision-down", function(){
          var tr = $(this).closest("tr");
          tr.next().after(tr);

          _refreshBootValue(tab);

          return false;
      });

      $("table.boot-order-instantiate-provision tbody", tab).on("change", "input", function(){
          _refreshBootValue(tab);
      });

      //----------------------------------------------------------------------------
      // End Boot order
      //----------------------------------------------------------------------------
        

      $("#provision_vm_instantiate_template_search").on("input",function(){
          provision_vm_instantiate_templates_datatable.fnFilter( $(this).val() );
      });
      
      $("#provision_vm_instantiate_templates_owner_filter").on("change", function(){
          switch($(this).val()){
            case "all":
              provision_vm_instantiate_templates_datatable.fnFilter("", 2);
              break;
            default:
              provision_vm_instantiate_templates_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
              break;
          }
      });
      
      $("#provision_create_template_refresh_button").click(function(){
          OpenNebula.Action.clear_cache("VMTEMPLATE");
          ProvisionTemplatesList.updateDatatable(provision_vm_instantiate_templates_datatable);
      });

      $("#provision_create_vm input.instantiate_pers").on("change", function(){
          var create_vm_context = $("#provision_create_vm");

          var disksContext = $(".provision_disk_selector", create_vm_context);
          var template_json = disksContext.data("template_json");

          if (template_json != undefined &&
              Config.provision.create_vm.isEnabled("disk_resize")) {

            DisksResize.insert({
              template_json: template_json,
              disksContext: disksContext,
              force_persistent: $(this).prop("checked"),
              cost_callback: _calculateCost,
              uinput_mb: true
            });
          }
      });

      tab.on("click", "#provision_create_vm .provision_select_template .provision-pricing-table.only-one" , function(){
        var create_vm_context = $("#provision_create_vm");
        var that = this;
        
        that.template_base_json = {};
        if (!$(this).hasClass("selected")){
          var template_id = $(this).attr("opennebula_id");
          var template_json = $(this).data("opennebula");

          $(".provision_accordion_template .selected_template").show();
          $(".provision_accordion_template .select_template").hide();
          $(".provision_accordion_template .selected_template_name").html(TemplateUtils.htmlEncode(template_json.VMTEMPLATE.NAME));
          if (template_json.VMTEMPLATE.TEMPLATE.LOGO) {
            $(".provision_accordion_template .selected_template_logo").html("<img  src=\""+TemplateUtils.htmlEncode(template_json.VMTEMPLATE.TEMPLATE.LOGO)+"\">");
          } else {
            $(".provision_accordion_template .selected_template_logo").html("<i class=\"fas fa-file-alt fa-lg\"/> ");
          }

          $("#provision_create_vm .total_cost_div").hide();

          $(".provision_accordion_template a").first().trigger("click");

          $("#provision_create_vm .provision_vmgroup").show();
          $("#provision_create_vm .provision_ds").show();
          $("#provision_create_vm .provision_boot").show();

          OpenNebula.Template.show({
            data : {
              id: template_id,
              extended: false
            },
            timeout: true,
            success: function (request, template_json) {
              that.template_base_json= template_json;
              tab.template_base_json = template_json;
            }
          });

          OpenNebula.Template.show({
            data : {
              id: template_id,
              extended: true
            },
            timeout: true,
            success: function (request, template_json) {
              generate_provision_capacity_accordion(
                $(".provision_capacity_selector", create_vm_context),
                template_json.VMTEMPLATE);

              var disksContext = $(".provision_disk_selector", create_vm_context);
              disksContext.data("template_json", template_json);

              if (Config.provision.create_vm.isEnabled("disk_resize")) {
                var pers = $("input.instantiate_pers", create_vm_context).prop("checked");
                if(pers == undefined){
                  pers = false;
                }
                DisksResize.insert({
                  template_base_json: that.template_base_json,
                  template_json: template_json,
                  disksContext: disksContext,
                  force_persistent: pers,
                  cost_callback: _calculateCost,
                  uinput_mb: true
                });
                if (Config.provision.dashboard.isEnabled("quotas") && user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)) {
                  $("#quotas-disks").show();
                  if (this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-1" || this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-2"){
                    $("#quotas-disks").text(Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) * 1024) + " / " + "∞");
                  } else {
                    $("#quotas-disks").text(Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) * 1024) + " / " + Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE) * 1024));
                  }
                  $("input", disksContext).change();
                }
              } else {
                disksContext.html("");
              }

              if (Config.provision.create_vm.isEnabled("network_select")) {
                NicsSection.insert(template_json, create_vm_context,
                  { "forceIPv4": true,
                    "securityGroups": Config.isFeatureEnabled("secgroups")
                  });
              } else {
                $(".provision_network_selector", create_vm_context).html("");
              }

              if (Config.provision.create_vm.isEnabled("vmgroup_select")) {
                $(".provision_vmgroup_selector", create_vm_context).html("");
                $("#provision_create_vm .provision_add_vmgroup").show();
                VMGroupSection.insert(template_json, $(".vmgroupContext", create_vm_context));
              } else {
                $(".provision_vmgroup_selector", create_vm_context).html("");
                $(".provision_vmgroup", create_vm_context).hide();
              }

              if (Config.provision.create_vm.isEnabled("datastore_select")) {
                $(".provision_ds_selector", create_vm_context).html("");
                var options = {
                  "select": true,
                  "selectOptions": {
                    "multiple_choice": true
                  }
                };
                this.datastoresTable = new DatastoresTable("DatastoresTable" + UniqueId.id(), options);
                $(".provision_ds_selector", create_vm_context).html(this.datastoresTable.dataTableHTML);
                this.datastoresTable.initialize();
                this.datastoresTable.filter("system", 10);
                this.datastoresTable.refreshResourceTableSelect();
                if(template_json.VMTEMPLATE.TEMPLATE.SCHED_DS_REQUIREMENTS){
                  var dsReqJSON = template_json.VMTEMPLATE.TEMPLATE.SCHED_DS_REQUIREMENTS;
                  var dsReq = TemplateUtils.escapeDoubleQuotes(dsReqJSON);
                  var ds_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
                  var ds = [];
                  while (match = ds_id_regexp.exec(dsReq)) {
                    ds.push(match[2]);
                  }
                  var selectedResources = {
                    ids : ds
                  };
                  this.datastoresTable.selectResourceTableSelect(selectedResources);
                }
                $(".provision_ds_selector", create_vm_context).data("dsTable", this.datastoresTable);
              } else {
                $(".provision_ds_selector", create_vm_context).html("");
                $(".provision_ds", create_vm_context).hide();
              }

              if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                UserInputs.vmTemplateInsert(
                    $(".provision_custom_attributes_selector", create_vm_context),
                    template_json,
                    {text_header: "<i class=\"fas fa-gears\"></i> "+Locale.tr("Custom Attributes")});

              } else {
                $(".provision_custom_attributes_selector", create_vm_context).html("");
              }

              // boot order
              
              var osJSON = template_json.VMTEMPLATE.TEMPLATE.OS;
              if (osJSON && osJSON["BOOT"]) {
                _fillBootValue(create_vm_context, osJSON["BOOT"]);
              }

              _loadBootOrder(create_vm_context, template_json.VMTEMPLATE.TEMPLATE);

            },
            error: function(request, error_json, container) {
              Notifier.onError(request, error_json, container);
            }
          });

          return false;
        }
      });

      tab.on("click", "#provision_create_vm .provision-pricing-table.only-one" , function(){
        if (!$(this).hasClass("selected")){
          $(".provision-pricing-table", $(this).parents(".dataTable")).removeClass("selected");
          $(this).addClass("selected");
        }

        return false;
      });

      $("#provision_create_vm").submit(function(){
          var context = $(this);

          var template_id = $(".provision_select_template .selected", context).attr("opennebula_id");
          if (!template_id) {
            $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
            return false;
          }

          var vm_name = $("#vm_name", context).val();
          var nics = NicsSection.retrieve(context);

          var disks = DisksResize.retrieve($(".provision_disk_selector", context));

          var extra_info = {
            "vm_name" : vm_name,
            "template": {}
          };

          var vmgroup = VMGroupSection.retrieve($(".vmgroupContext", context));

          if(vmgroup) {
            $.extend(extra_info.template, vmgroup);
          }

          var dsTable = $(".provision_ds_selector", context).data("dsTable");
          if(dsTable != undefined){
            var req_string = [];
            var ds = dsTable.retrieveResourceTableSelect();
            if(ds){
              $.each(ds, function(index, dsId) {
                req_string.push("ID=\"" + dsId + "\"");
              });
              req_string = req_string.join(" | ");
              req_string = TemplateUtils.escapeDoubleQuotes(req_string);
              extra_info.template.SCHED_DS_REQUIREMENTS = req_string;
            }
          }

          extra_info.template.NIC = nics;

          if (disks.length > 0) {
            extra_info.template.DISK = disks;
          }

          if (Config.provision.create_vm.isEnabled("capacity_select")){
            var capacityContext = $(".provision_capacity_selector", context);
            $.extend(extra_info.template, CapacityInputs.retrieveChanges(capacityContext));
          }

          var user_inputs_values = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));

          if (!$.isEmptyObject(user_inputs_values)) {
              $.extend(extra_info.template, user_inputs_values);
          }

          var topology = {};

          if (extra_info.template && extra_info.template.CORES){
            topology.CORES = extra_info["template"]["CORES"];
            topology.SOCKETS = parseInt(extra_info["template"]["VCPU"]) / parseInt(extra_info["template"]["CORES"]);
            topology.THREADS = 1;
            delete extra_info["template"]["CORES"];
          }
    
          if (!$.isEmptyObject(topology)){
            extra_info.template.TOPOLOGY = topology;
          }

          var boot = _retrieveBootValue(context);
          var os = tab.template_base_json.VMTEMPLATE.TEMPLATE.OS ? tab.template_base_json.VMTEMPLATE.TEMPLATE.OS : {};

          if (boot && boot.length > 0) {
            os.BOOT = boot;
            extra_info.template.OS = os;
          } else {
            extra_info.template.OS = os;
          }

          var action;

          if ($("input.instantiate_pers", context).prop("checked")){
            action = "instantiate_persistent";
          }else{
            action = "instantiate";
          }

          Sunstone.runAction("Provision."+action, template_id, extra_info);
          return false;
      });


      $(document).on("click", ".provision_create_vm_button", function(){
          show_provision_create_vm(provision_vm_instantiate_templates_datatable);
      });

      Foundation.reflow($("#provision_create_vm"));
    }

    return _actions;
})