define(function(require) {
  var Notifier = require('utils/notifier');
  require('opennebula/cluster');

  var _insert = function(id, context, resource, init_val, empty_value,
      extra_options, filter_att, filter_val, trigger_change_init_val, only_name) {

    var Resource = require('opennebula/' + resource.toLowerCase());
    $(id, context).html('<i class="fa fa-spinner fa-spin"></i>');

    Resource.list({
      timeout: true,
      success: function (request, obj_list) {
        var select_str = '<select class="resource_list_select">';

        if (empty_value) {
          select_str += '<option class="empty_value" value="">' +
                          tr("Please select") + '</option>';
        }

        if (resource == "Cluster") {
          if (!extra_options) {
            extra_options = "";
          }

          extra_options += '<option value="-1">Default (none)</option>';
        }

        if (extra_options) {
          select_str += extra_options;
        }

        if (!filter_att) {
          filter_att = [];
        }

        var res_name = Resource.resource;
        $.each(obj_list, function() {
          var id = this[res_name].ID;
          var name = this[res_name].NAME;
          var add = true;

          for (var i = 0; i < filter_att.length; i++) {
            if (this[res_name][filter_att[i]] == filter_val[i]) {
              add = false;
              break;
            }
          }

          if (add) {
            select_str += '<option elem_id="' + id + '" value="' + id + '">'
            if (!only_name) {
              select_str += id + ': '
            }
            select_str += name + '</option>';
          }
        });

        select_str += "</select>";

        $(id, context).html(select_str);

        if (init_val) {
          $(id + " .resource_list_select", context).val(init_val);
          if (trigger_change_init_val) {
            $(id + " .resource_list_select", context).change();
          }
        }
      },
      error: Notifier.onError
    });
  }

  return {
    'insert': _insert
  }
})
