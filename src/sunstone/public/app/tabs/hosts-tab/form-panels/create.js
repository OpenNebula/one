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
  var OpenNebulaVM = require('opennebula/vm');
  var VCenterTemplates = require('utils/vcenter/templates');
  var VCenterNetworks = require('utils/vcenter/networks');
  
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

    this.vCenterNetworks = new VCenterNetworks();
    this.vCenterTemplates = new VCenterTemplates();

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
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'vCenterTemplatesHTML': this.vCenterTemplates.html(),
      'vCenterNetworksHTML': this.vCenterNetworks.html()
    });
  }

  function _setup(context) {
    var that = this;

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

    $("#host_type_mad", context).change();

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

          var vms_container = $(".vcenter_vms", context);

          var vcenter_user = $("#vcenter_user", context).val();
          var vcenter_password = $("#vcenter_password", context).val();
          var vcenter_host = $("#vcenter_host", context).val();

          that.vCenterTemplates.insert({
            container: context,
            vcenter_user: vcenter_user,
            vcenter_password: vcenter_password,
            vcenter_host: vcenter_host
          });

          that.vCenterNetworks.insert({
            container: context,
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

      that.vCenterTemplates.import();

      that.vCenterNetworks.import();

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
});
