define(function(require) {
  require('jquery');

  var Helper = require('./opennebula/helper'),
      Action = require('./opennebula/action'),
      Auth   = require('./opennebula/auth'),
      Error  = require('./opennebula/error'),

      Acl             = require('./opennebula/acl'),
      Cluster         = require('./opennebula/cluster'),
      Datastore       = require('./opennebula/datastore'),
      Group           = require('./opennebula/group'),
      Host            = require('./opennebula/host'),
      Image           = require('./opennebula/image'),
      Marketplace     = require('./opennebula/marketplace'),
      Network         = require('./opennebula/network'),
      Role            = require('./opennebula/role'),
      securitygroup   = require('./opennebula/securitygroup'),
      Service         = require('./opennebula/service'),
      ServiceTemplate = require('./opennebula/servicetemplate'),
      Support         = require('./opennebula/support'),
      Template        = require('./opennebula/template'),
      User            = require('./opennebula/user'),
      Vdc             = require('./opennebula/vdc'),
      Vm              = require('./opennebula/vm'),
      Zone            = require('./opennebula/zone')

  if (typeof(csrftoken) != "undefined") {
    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
      var params = originalOptions.data;

      if (typeof(params) == "string") {
        params = JSON.parse(params);
        params["csrftoken"] = csrftoken;
        options.data = JSON.stringify(params);
      } else {
        params = params || {};
        params["csrftoken"] = csrftoken;
        options.data = $.param(params);
      }
    });
  }

  $.ajaxSetup({
    converters: {
      "text json": function(textValue) {
        return jQuery.parseJSON(jQuery('<div/>').text(textValue).html());
      }
    }
  });

  var OpenNebula = {
    'Helper': Helper,
    'Action': Action,
    'Auth': Auth,
    'Error': Error,
    'Acl': Acl,
    'Cluster': Cluster,
    'Datastore': Datastore,
    'Group': Group,
    'Host': Host,
    'Image': Image,
    'Marketplace': Marketplace,
    'Network': Network,
    'Role': Role,
    'SecurityGroup': securitygroup,
    'Service': Service,
    'ServiceTemplate': ServiceTemplate,
    'Support': Support,
    'Template': Template,
    'User': User,
    'Vdc': Vdc,
    'VM': Vm,
    'Zone': Zone
  }

  return OpenNebula;
});
