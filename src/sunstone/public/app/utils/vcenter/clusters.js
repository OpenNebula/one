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

define(function(require) {
  // Dependencies
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaError = require('opennebula/error');
  var Notifier = require('utils/notifier');

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
    return '<div class="vcenter_clusters" hidden></div>';
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

        $.each(response, function(datacenter_name, clusters) {
          var content;
          if (clusters.length == 0) {
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li>' +
                      '<span>' +
                        Locale.tr("No new clusters found in this DataCenter") +
                      '</span>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
              '</fieldset>';

            $(".content", context).append(content);
          } else {
            var tableId = "vcenter_network_table_" + datacenter_name;
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small secondary clear_imported">' +
                         Locale.tr("Clear Imported Datastores") +
                      '</button>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
                '<div class="row">' +
                  '<div class="large-12 columns" id="vcenter_cluster_table_' + datacenter_name + '">' +
                  '</div>' +
                '</div>';
            '</fieldset>';

            $(".content", context).append(content);

            var tbody = $('#vcenter_cluster_table_' + datacenter_name, context);

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
                '</div>').appendTo(tbody);

              $(".cluster_name", row).data("cluster_name", cluster_name);
              //$(".cluster_name", row).data("datacenter_name", datacenter_name);
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterClusters(opts);
              return false;
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
