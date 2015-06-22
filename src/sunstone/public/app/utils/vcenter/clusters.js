define(function(require) {
  // Dependencies
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaError = require('opennebula/error');

  var TemplateHTML = require('hbs!./clusters/html');

  function VCenterClusters() {
    return this;
  }

  VCenterClusters.prototype = {
    'html': _html,
    'insert': _fillVCenterClusters,
    'import': _import
  };
  VCenterClusters.prototype.constructor = VCenterClusters;

  return VCenterClusters;

  function _html() {
    return '<div class="vcenter_clusters hidden"></div>';
  }

  /*
    opts = {
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
      success: function to call after a success
    }
   */
  function _fillVCenterClusters(opts) {
    this.opts = opts;

    var path = '/vcenter';

    var context = $(".vcenter_clusters", opts.container);

    context.html( TemplateHTML({}) );

    context.show();

    $(".accordion_advanced_toggle", context).trigger("click");

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
        $(".content", context).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + Locale.tr("Please select the vCenter Clusters to be imported to OpenNebula. Each vCenter Cluster will be included as a new OpenNebula Host") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", context));

        $.each(response, function(datacenter_name, clusters) {
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + Locale.tr("Datacenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", context));

          if (clusters.length == 0) {
            $('<div class="row">' +
                '<div class="large-12 columns">' +
                  '<label>' +
                    Locale.tr("No clusters found in this DataCenter") +
                  '</label>' +
                '</div>' +
              '</div>').appendTo($(".content", context));
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
                '</div>').appendTo($(".content", context));

              $(".cluster_name", row).data("cluster_name", cluster_name);
              //$(".cluster_name", row).data("datacenter_name", datacenter_name);
            });
          }
        });

        if(opts.success){
          opts.success();
        }
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context, cluster_id) {
    var that = this;

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
            "VCENTER_USER=\"" + that.opts.vcenter_user + "\"\n" +
            "VCENTER_PASSWORD=\"" + that.opts.vcenter_password + "\"\n" +
            "VCENTER_HOST=\"" + that.opts.vcenter_host + "\"\n";

          Sunstone.runAction("Host.update_template", response.HOST.ID, template_raw);
        },
        error: function (request, error_json) {
          $(".vcenter_host_result", cluster_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                '<i class="fa fa-cloud fa-stack-2x"></i>' +
                '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
              '</span>');

          $(".vcenter_host_response", cluster_context).html('<p style="font-size:12px" class="error-color">' +
                (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
              '</p>');
        }
      });
    });
  }
});