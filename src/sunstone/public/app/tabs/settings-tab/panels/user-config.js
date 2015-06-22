define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.accordion');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');

  /*
    TEMPLATES
   */

  var TemplateEasyInfo = require('hbs!./user-config/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./user-config/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info, tabId) {
    this.tabId = tabId || TAB_ID;
    this.title = Locale.tr("Config");
    this.icon = "fa-info";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateEasyInfo({'languageOptions': Locale.language_options});
  }

  function _setup(context) {
    $(document).foundation('accordion', 'reflow');
    var ssh_key = this.element.TEMPLATE.SSH_PUBLIC_KEY;
    if (ssh_key && ssh_key.length) {
      $("#provision_ssh_key", context).val(ssh_key);
      $(".provision_add_ssh_key_button", context).hide();
      $(".provision_update_ssh_key_button"), context.show();
    } else {
      $(".provision_add_ssh_key_button", context).show();
      $(".provision_update_ssh_key_button", context).hide();
    }

    $('#provision_new_language option[value="' + config['user_config']["lang"] + '"]', context).attr('selected', 'selected');
    $('#provision_user_views_select option[value="' + config['user_config']["default_view"] + '"]', context).attr('selected', 'selected');

    $.each(config['available_views'], function(id, view) {
      $('select#provision_user_views_select', context).append('<option value="' + view + '">' + view + '</option>')
    });

    $("#provision_change_password_form").submit(function() {
      var pw = $('#provision_new_password', this).val();
      var confirm_password = $('#provision_new_confirm_password', this).val();

      if (!pw.length) {
        Notifier.notifyError(Locale.tr("Fill in a new password"));
        return false;
      }

      if (pw !== confirm_password) {
        Notifier.notifyError(Locale.tr("Passwords do not match"));
        return false;
      }

      Sunstone.runAction("User.passwd", "-1", pw);
      return false;
    });

    $("#provision_add_ssh_key_form").submit(function() {
      var keypair = $('#provision_ssh_key', this).val();

      if (!keypair.length) {
        Notifier.notifyError(Locale.tr("You have to provide an SSH key"));
        return false;
      }

      OpenNebula.User.show({
        data : {
          id: "-1"
        },
        success: function(request, user_json) {
          var template = user_json.USER.TEMPLATE;

          template["SSH_PUBLIC_KEY"] = keypair;

          template_str = "";
          $.each(template, function(key, value) {
            template_str += (key + '=' + '"' + value + '"\n');
          });

          Sunstone.runAction("User.update_template", "-1", template_str);
        }
      })
      return false;
    });

    $("#provision_change_view_form").submit(function() {
      var view = $('#provision_user_views_select', this).val();

      OpenNebula.User.show({
        data : {
          id: "-1"
        },
        success: function(request, user_json) {
          var template = user_json.USER.TEMPLATE;

          template["DEFAULT_VIEW"] = view;

          template_str = "";
          $.each(template, function(key, value) {
            template_str += (key + '=' + '"' + value + '"\n');
          });

          var data = OpenNebula.Helper.action('update', {"template_raw" : template_str});

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            success: function() {
              window.location.href = ".";
            },
            error: function(response) {
            }
          });
        }
      })
      return false;
    });

    $("#provision_change_language_form").submit(function() {
      var lang = $('#provision_new_language', this).val();

      OpenNebula.User.show({
        data : {
          id: "-1"
        },
        success: function(request, user_json) {
          var template = user_json.USER.TEMPLATE;

          template["LANG"] = lang;

          template_str = "";
          $.each(template, function(key, value) {
            template_str += (key + '=' + '"' + value + '"\n');
          });

          var data = OpenNebula.Helper.action('update', {"template_raw" : template_str});

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            success: function() {
              window.location.href = ".";
            },
            error: function(response) {
            }
          });
        }
      })
      return false;
    });

    return false;
  }
});
