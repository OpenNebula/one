define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');
  var OpenNebulaError = require('opennebula/error');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaVM = require('opennebula/vm');
  var OpenNebulaNetwork = require('opennebula/network');
  
  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  
  /*
    CONSTANTS
   */
  
  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Host"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    }

    BaseFormPanel.call(this);
  };

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;
  
  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {

    $(".drivers", context).hide();

    $("#host_type_mad", context).on("change", function() {
      $("#vmm_mad", context).val(this.value).change();
      $("#im_mad", context).val(this.value).change();

      if (this.value == "custom") {
        $(".vcenter_credentials", context).hide();
        $("#vnm_mads", context).show();
        $("#name_container", context).show();
        $("#"+TAB_ID+"submit_button", "#"+TAB_ID).show();
        $(".drivers", context).show();
      } else if (this.value == "vcenter") {
        $("#vnm_mads", context).hide();
        $("#name_container", context).hide();
        $(".vcenter_credentials", context).show();
        $("#"+TAB_ID+"submit_button", "#"+TAB_ID).hide();
        $(".drivers", context).hide();
      } else {
        $(".vcenter_credentials", context).hide();
        $("#vnm_mads", context).show();
        $("#name_container", context).show();
        $("#"+TAB_ID+"submit_button", "#"+TAB_ID).show();
        $(".drivers", context).hide();
      }
    });

    $("#get_vcenter_clusters", context).on("click", function() {
      // TODO notify if credentials empty
      var container = $(".vcenter_clusters", context);

      container.show();

      $(".accordion_advanced_toggle", container).trigger("click");

      $.ajax({
        url: 'vcenter',
        type: "GET",
        data: {timeout: false},
        dataType: "json",
        headers: {
          "X_VCENTER_USER": $("#vcenter_user", context).val(),
          "X_VCENTER_PASSWORD": $("#vcenter_password", context).val(),
          "X_VCENTER_HOST": $("#vcenter_host", context).val()
        },
        success: function(response) {
          $("#vcenter_user", context).attr("disabled", "disabled");
          $("#vcenter_password", context).attr("disabled", "disabled");
          $("#vcenter_host", context).attr("disabled", "disabled");
          $("#get_vcenter_clusters", context).hide();
          $(".import_vcenter_clusters_div", context).show();

          $(".content", container).html("");

          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<p style="color: #999">' + Locale.tr("Please select the vCenter Clusters to be imported to OpenNebula. Each vCenter Cluster will be included as a new OpenNebula Host") + '</p>' +
              '</div>' +
            '</div>').appendTo($(".content", container));

          $.each(response, function(datacenter_name, clusters) {
            $('<div class="row">' +
                '<div class="large-12 columns">' +
                  '<h5>' +
                    datacenter_name + ' ' + Locale.tr("Datacenter") +
                  '</h5>' +
                '</div>' +
              '</div>').appendTo($(".content", container));

            if (clusters.length == 0) {
              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<label>' +
                      Locale.tr("No clusters found in this DataCenter") +
                    '</label>' +
                  '</div>' +
                '</div>').appendTo($(".content", container));
            } else {
              $.each(clusters, function(id, cluster_name) {
                var row = $('<div class="vcenter_cluster">' +
                    '<div class="row">' +
                      '<div class="large-10 columns">' +
                        '<label>' +
                          '<input type="checkbox" class="cluster_name"/> ' +
                          cluster_name +
                        '</label>' +
                        '<div class="large-12 columns vcenter_host_response">' +
                        '</div>' +
                      '</div>' +
                      '<div class="large-2 columns vcenter_host_result">' +
                      '</div>' +
                    '</div>' +
                  '</div>').appendTo($(".content", container));

                $(".cluster_name", row).data("cluster_name", cluster_name);
                //$(".cluster_name", row).data("datacenter_name", datacenter_name);
              });
            }
          });

          var templates_container = $(".vcenter_templates", context);
          var vms_container = $(".vcenter_vms", context);
          var networks_container = $(".vcenter_networks", context);

          var vcenter_user = $("#vcenter_user", context).val();
          var vcenter_password = $("#vcenter_password", context).val();
          var vcenter_host = $("#vcenter_host", context).val();

          fillVCenterTemplates({
                container: templates_container,
                vcenter_user: vcenter_user,
                vcenter_password: vcenter_password,
                vcenter_host: vcenter_host
              });

          fillVCenterNetworks({
                container: networks_container,
                vcenter_user: vcenter_user,
                vcenter_password: vcenter_password,
                vcenter_host: vcenter_host
              });
        },
        error: function(response) {
          $(".vcenter_clusters", context).hide();
          Notifier.onError({}, OpenNebulaError(response));
        }
      });

      return false;
    });

    $("#import_vcenter_clusters", context).on("click", function() {
      $(this).hide();

      var cluster_id = $('#host_cluster_id .resource_list_select', context).val();
      if (!cluster_id) cluster_id = "-1";

      $.each($(".cluster_name:checked", context), function() {
        var cluster_context = $(this).closest(".vcenter_cluster");
        $(".vcenter_host_result:not(.success)", cluster_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var host_json = {
          "host": {
            "name": $(this).data("cluster_name"),
            "vm_mad": "vcenter",
            "vnm_mad": "dummy",
            "im_mad": "vcenter",
            "cluster_id": cluster_id
          }
        };

        OpenNebulaHost.create({
          timeout: true,
          data: host_json,
          success: function(request, response) {
            $(".vcenter_host_result", cluster_context).addClass("success").html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_host_response", cluster_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Host created successfully") + ' ID:' + response.HOST.ID +
                '</p>');

            var template_raw =
              "VCENTER_USER=\"" + $("#vcenter_user", context).val() + "\"\n" +
              "VCENTER_PASSWORD=\"" + $("#vcenter_password", context).val() + "\"\n" +
              "VCENTER_HOST=\"" + $("#vcenter_host", context).val() + "\"\n";

            Sunstone.runAction("Host.update_template", response.HOST.ID, template_raw);
            Sunstone.getDataTable(TAB_ID).addElement(request, response);
          },
          error: function (request, error_json) {
            $(".vcenter_host_result",  context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_host_response",  context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });

      $.each($(".template_name:checked", context), function() {
        var template_context = $(this).closest(".vcenter_template");

        $(".vcenter_template_result:not(.success)", template_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var template_json = {
          "vmtemplate": {
            "template_raw": $(this).data("one_template")
          }
        };

        OpenNebulaTemplate.create({
          timeout: true,
          data: template_json,
          success: function(request, response) {
            $(".vcenter_template_result", template_context).addClass("success").html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Template created successfully") + ' ID:' + response.VMTEMPLATE.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_template_result", template_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });

      $.each($(".vm_name:checked", context), function() {
        var vm_context = $(this).closest(".vcenter_vm");

        $(".vcenter_vm_result:not(.success)", vm_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var vm_json = {
          "vm": {
            "vm_raw": $(this).data("one_vm")
          }
        };

        var host_id_to_deploy = $(this).data("vm_to_host");

        OpenNebulaVM.create({
          timeout: true,
          data: vm_json,
          success: function(request, response) {
            var extra_info = {};

            extra_info['host_id'] = host_id_to_deploy;
            extra_info['ds_id']   = -1;
            extra_info['enforce'] = false;

            Sunstone.runAction("VM.deploy_action", response.VM.ID, extra_info);

            $(".vcenter_vm_result", vm_context).addClass("success").html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_vm_response", vm_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("VM imported successfully") + ' ID:' + response.VM.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_vm_response", vm_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_vm_response", vm_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });

      $.each($(".network_name:checked", context), function() {
        var network_context = $(this).closest(".vcenter_network");

        $(".vcenter_network_result:not(.success)", network_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var network_size = $(".netsize", network_context).val();
        var network_tmpl = $(this).data("one_network");
        var netname      = $(this).data("network_name");
        var type         = $('.type_select', network_context).val();

        var ar_array = [];
        ar_array.push("TYPE=" + type);
        ar_array.push("SIZE=" + network_size);

        switch (type) {
          case 'ETHER':
            var mac = $('.eth_mac_net', network_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }

            break;
          case 'IP4':
            var mac = $('.four_mac_net', network_context).val();
            var ip = $('.four_ip_net', network_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (ip) {
              ar_array.push("IP=" + ip);
            }

            break;
          case 'IP6':
            var mac = $('.six_mac_net', network_context).val();
            var gp = $('.six_global_net', network_context).val();
            var ula = $('.six_mac_net', network_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (gp) {
              ar_array.push("GLOBAL_PREFIX=" + gp);
            }
            if (ula) {
              ar_array.push("ULA_PREFIX=" + ula);
            }

            break;
        }

        network_tmpl += "\nAR=[" 
        network_tmpl += ar_array.join(",\n")
        network_tmpl += "]"

        if ($(".vlaninfo", network_context)) {
          network_tmpl += "VLAN=\"YES\"\n";
          network_tmpl += "VLAN_ID=" + $(".vlaninfo", network_context).val() + "\n";
        }

        var vnet_json = {
          "vnet": {
            "vnet_raw": network_tmpl
          }
        };

        OpenNebulaNetwork.create({
          timeout: true,
          data: vnet_json,
          success: function(request, response) {
            $(".vcenter_network_result", network_context).addClass("success").html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Virtual Network created successfully") + ' ID:' + response.VNET.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_network_result", network_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });

      return false;
    });

    // Show custom driver input only when custom is selected in selects
    $('input[name="custom_vmm_mad"],' +
       'input[name="custom_im_mad"],' +
       'input[name="custom_vnm_mad"]', context).parent().hide();

    $('select#vmm_mad', context).change(function() {
      if ($(this).val() == "custom")
          $('input[name="custom_vmm_mad"]').parent().show();
      else
          $('input[name="custom_vmm_mad"]').parent().hide();
    });

    $('select#im_mad', context).change(function() {
      if ($(this).val() == "custom")
          $('input[name="custom_im_mad"]').parent().show();
      else
          $('input[name="custom_im_mad"]').parent().hide();
    });

    $('select#vnm_mad', context).change(function() {
      if ($(this).val() == "custom")
          $('input[name="custom_vnm_mad"]').parent().show();
      else
          $('input[name="custom_vnm_mad"]').parent().hide();
    });

    $('#create_host_form').on("keyup keypress", function(e) {
          var code = e.keyCode || e.which; 
          if (code  == 13) {               
            e.preventDefault();
            return false;
          }
        });

    Tips.setup();
    return false;
  }

  function _submitWizard(context) {
    var name = $('#name', context).val();
    if (!name) {
      Sunstone.hideFormPanelLoading(this.tabId);
      Notifier.notifyError(Locale.tr("Host name missing!"));
      return false;
    }

    var cluster_id = $('#host_cluster_id .resource_list_select', context).val();
    if (!cluster_id) cluster_id = "-1";

    var vmm_mad = $('select#vmm_mad', context).val();
    vmm_mad = vmm_mad == "custom" ? $('input[name="custom_vmm_mad"]').val() : vmm_mad;
    var im_mad = $('select#im_mad', context).val();
    im_mad = im_mad == "custom" ? $('input[name="custom_im_mad"]').val() : im_mad;
    var vnm_mad = $('select#vnm_mad', context).val();
    vnm_mad = vnm_mad == "custom" ? $('input[name="custom_vnm_mad"]').val() : vnm_mad;

    var host_json = {
      "host": {
        "name": name,
        "vm_mad": vmm_mad,
        "vnm_mad": vnm_mad,
        "im_mad": im_mad,
        "cluster_id": cluster_id
      }
    };

    //Create the OpenNebula.Host.
    //If it is successfull we refresh the list.
    Sunstone.runAction("Host.create", host_json);
    return false;
  }

  function _onShow(context) {
    $("#name", context).focus();

    var cluster_id = $("#host_cluster_id .resource_list_select", context).val();
    if (!cluster_id) cluster_id = "-1";

    ResourceSelect.insert('#host_cluster_id', context, "Cluster", cluster_id, false);
    return false;
  }

  /*
    Retrieve the list of templates from vCenter and fill the container with them

    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function fillVCenterTemplates(opts) {
    var path = '/vcenter/templates';

    opts.container.show();

    $(".accordion_advanced_toggle", opts.container).trigger("click");

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", opts.container).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + Locale.tr("Please select the vCenter Templates to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", opts.container))

        $.each(response, function(datacenter_name, templates){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + Locale.tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", opts.container))

          if (templates.length == 0) {
              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<label>' +
                      Locale.tr("No new templates found in this DataCenter") +
                    '</label>' +
                  '</div>' +
                '</div>').appendTo($(".content", opts.container))
          } else {
            $.each(templates, function(id, template){
              var trow = $('<div class="vcenter_template">' +
                  '<div class="row">' +
                    '<div class="large-10 columns">' +
                      '<label>' +
                        '<input type="checkbox" class="template_name" checked/> ' +
                        template.name + '&emsp;<span style="color: #999">' + template.host + '</span>' +
                      '</label>' +
                      '<div class="large-12 columns vcenter_template_response">'+
                      '</div>'+
                    '</div>' +
                    '<div class="large-2 columns vcenter_template_result">'+
                    '</div>'+
                  '</div>'+
                '</div>').appendTo($(".content", opts.container))

              $(".template_name", trow).data("template_name", template.name)
              $(".template_name", trow).data("one_template", template.one)
            });
          };
        });
      },
      error: function(response){
        opts.container.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });

    return false;
  }

  /*
    Retrieve the list of networks from vCenter and fill the container with them
    
    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function fillVCenterNetworks(opts) {
    var path = '/vcenter/networks';

    opts.container.show();

    $(".accordion_advanced_toggle", opts.container).trigger("click");

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", opts.container).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + Locale.tr("Please select the vCenter Networks to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", opts.container))

        $.each(response, function(datacenter_name, networks){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + Locale.tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", opts.container))

          if (networks.length == 0) {
            $('<div class="row">' +
                '<div class="large-12 columns">' +
                  '<label>' +
                    Locale.tr("No new networks found in this DataCenter") +
                  '</label>' +
                '</div>' +
              '</div>').appendTo($(".content", opts.container))
          } else {
            $.each(networks, function(id, network){
              var netname   = network.name.replace(" ","_");
              var vlan_info = ""

              if (network.vlan) {
                var vlan_info = '<div class="vlan_info">' +
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("VLAN") + 
                           '<input type="text" class="vlaninfo" value="'+network.vlan+'" disabled/>' +
                        '</label>'+
                      '</div>'+
                    '</div>';
              }

              var trow = $('<div class="vcenter_network">' +
                  '<div class="row">' +
                    '<div class="large-10 columns">' +
                      '<div class="large-12 columns">' +
                        '<label>' +
                          '<input type="checkbox" class="network_name" checked/> ' +
                          network.name + '&emsp;<span style="color: #999">' + network.type + '</span>' + 
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + Locale.tr("SIZE") +
                          '<input type="text" class="netsize" value="255"/>' +
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + Locale.tr("TYPE") +
                          '<select class="type_select">'+
                            '<option value="ETHER">eth</option>' +
                            '<option value="IP4">ipv4</option>'+
                            '<option value="IP6">ipv6</option>' + 
                          '</select>' + 
                        '</label>' +
                      '</div>'+
                      '<div class="net_options">' +
                        '<div class="large-4 columns">'+
                          '<label>' + Locale.tr("MAC") + 
                            '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' + 
                          '</label>'+
                        '</div>'+
                      '</div>'+ 
                      vlan_info +
                      '<div class="large-12 columns vcenter_network_response">'+
                      '</div>'+
                    '</div>' +
                    '<div class="large-2 columns vcenter_network_result">'+
                    '</div>'+
                  '</div>'+
                '</div>').appendTo($(".content", opts.container))


              $('.type_select', trow).on("change",function(){
                var network_context = $(this).closest(".vcenter_network");
                var type = $(this).val();

                var net_form_str = ''

                switch(type) {
                  case 'ETHER':
                    net_form_str = 
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") + 
                          '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' + 
                        '</label>'+
                      '</div>';
                    break;
                  case 'IP4':
                    net_form_str = 
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("IP START") + 
                          '<input type="text" class="four_ip_net"/>' + 
                        '</label>'+
                      '</div>'+
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") + 
                          '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' + 
                        '</label>'+
                      '</div>';
                    break;
                  case 'IP6':
                    net_form_str = 
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") + 
                          '<input type="text" class="eth_mac_net"/>' + 
                        '</label>'+
                      '</div>'+
                      '<div class="large-6 columns">'+
                        '<label>' + Locale.tr("GLOBAL PREFIX") + 
                          '<input type="text" class="six_global_net" placeholder="'+Locale.tr("Optional")+'"/>' + 
                        '</label>'+
                      '</div>'+
                      '<div class="large-6 columns">'+
                        '<label>' + Locale.tr("ULA_PREFIX") + 
                          '<input type="text" class="six_ula_net" placeholder="'+Locale.tr("Optional")+'"/>' + 
                        '</label>'+
                      '</div>';
                    break;
                }

                $('.net_options', network_context).html(net_form_str);
              });

              $(".network_name", trow).data("network_name", netname)
              $(".network_name", trow).data("one_network", network.one)
            });
          };
        });
      },
      error: function(response){
        opts.container.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });

    return false;
  }

});
