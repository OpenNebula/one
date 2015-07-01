define(function(require) {
  require('foundation.slider');
  var QuotaLimits = require('utils/quotas/quota-limits');

  return {
    'setup': setup_provision_quota_widget,
    'reset': reset_provision_quota_widget,
    'retrieve': retrieve_provision_quota_widget
  }

  function setup_provision_quota_widget(context) {
    context.foundation('reflow', 'slider');
    // Mode selector, for the 3 sliders
    $("select.provision_quota_select", context).on('change', function() {
        var row = $(this).closest(".row");

        switch ($(this).val()) {
          case "edit":
            $("div.provision_quota_edit", row).show();
            $("div.provision_quota_default", row).hide();
            $("div.provision_quota_unlimited", row).hide();

            $("input", row).change();

            break;

          case "default":
            $("div.provision_quota_edit", row).hide();
            $("div.provision_quota_default", row).show();
            $("div.provision_quota_unlimited", row).hide();

            break;

          case "unlimited":
            $("div.provision_quota_edit", row).hide();
            $("div.provision_quota_default", row).hide();
            $("div.provision_quota_unlimited", row).show();

            break;
        }

        return false;
      });

    var provision_rvms_quota_input = $(".provision_rvms_quota_input", context);

    $(".provision_rvms_quota_slider", context).on('change', function() {
        provision_rvms_quota_input.val($(this).attr('data-slider'))
      });

    provision_rvms_quota_input.change(function() {
      $(".provision_rvms_quota_slider", context).foundation(
                                          'slider', 'set_value', this.value);
    });

    var provision_cpu_quota_input = $(".provision_cpu_quota_input", context);

    $(".provision_cpu_quota_slider", context).on('change', function() {
        provision_cpu_quota_input.val($(this).attr('data-slider'))
      });

    provision_cpu_quota_input.change(function() {
      $(".provision_cpu_quota_slider", context).foundation(
                                          'slider', 'set_value', this.value);
    });

    var provision_memory_quota_input = $(".provision_memory_quota_input", context);
    var provision_memory_quota_tmp_input = $(".provision_memory_quota_tmp_input", context);

    var update_final_memory_input = function() {
        var value = provision_memory_quota_tmp_input.val();
        if (value > 0) {
          provision_memory_quota_input.val(Math.floor(value * 1024));
        } else {
          provision_memory_quota_input.val(value);
        }
      }

    $(".provision_memory_quota_slider", context).on('change', function() {
        provision_memory_quota_tmp_input.val($(this).attr('data-slider'));
        update_final_memory_input();
      });

    provision_memory_quota_tmp_input.change(function() {
      update_final_memory_input();
      $(".provision_memory_quota_slider", context).foundation(
                                          'slider', 'set_value', this.value);
    });

    $(".provision_rvms_quota_input", context).val('').change();
    $(".provision_memory_quota_input", context).val('').change();
    $(".provision_memory_quota_tmp_input", context).val('').change();
    $(".provision_cpu_quota_input", context).val('').change();
  }

  function reset_provision_quota_widget(context) {
    $("select.provision_quota_select", context).val('edit').change();

    $(".provision_rvms_quota_input", context).val('').change();
    $(".provision_memory_quota_input", context).val('').change();
    $(".provision_memory_quota_tmp_input", context).val('').change();
    $(".provision_cpu_quota_input", context).val('').change();
  }

  function retrieve_provision_quota_widget(context) {
    var retrieve_quota = function(select, input) {
      switch (select.val()) {
        case "edit":
          return input.val();
        case "default":
          return QuotaLimits.QUOTA_LIMIT_DEFAULT;
        case "unlimited":
          return QuotaLimits.QUOTA_LIMIT_UNLIMITED;
      }
    }

    var vms_limit = retrieve_quota(
          $(".provision_rvms_quota select.provision_quota_select", context),
          $(".provision_rvms_quota_input", context));

    var cpu_limit = retrieve_quota(
          $(".provision_cpu_quota select.provision_quota_select", context),
          $(".provision_cpu_quota_input", context));

    var mem_limit = retrieve_quota(
          $(".provision_memory_quota select.provision_quota_select", context),
          $(".provision_memory_quota_input", context));

    return {
      "VM" : {
        "VOLATILE_SIZE": QuotaLimits.QUOTA_LIMIT_DEFAULT,
        "VMS":    vms_limit,
        "MEMORY": mem_limit,
        "CPU":    cpu_limit
      }
    };
  }
});
