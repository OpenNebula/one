define(function(require) {
  var Locale = require('utils/locale');

  return {
    admin : {
      id: 'admin',
      name: "Admin",
      description: Locale.tr("This view provides full control of the cloud"),
      type: "advanced"
    },
    user : {
      id: 'user',
      name: "User",
      description: Locale.tr("In this view users will not be able to manage nor retrieve the hosts and clusters of the cloud. They will be able to see Datastores and Virtual Networks in order to use them when creating a new Image or Virtual Machine, but they will not be able to create new ones."),
      type: "advanced"
    },
    groupadmin : {
      id: 'groupadmin',
      name: "Group Admin",
      description: Locale.tr("This view provides control of all the resources belonging to a group, but with no access to resources outside that group, that is, restricted to the physical and virtual resources of the group. This view features the ability to create new users within the group as well as set and keep track of user quotas."),
      type: "cloud"
    },
    cloud : {
      id: 'cloud',
      name: "Cloud",
      description: Locale.tr("This is a simplified view mainly intended for user that just require a portal where they can provision new virtual machines easily from pre-defined Templates."),
      type: "cloud"
    },
    admin_vcenter : {
      id: 'admin_vcenter',
      name: "Admin vCenter",
      description: Locale.tr("View designed to present the valid operations against a vCenter infrastructure to a cloud administrator"),
      type: "vcenter"
    },
    groupadmin_vcenter : {
      id: 'groupadmin_vcenter',
      name: "Group Admin vCenter",
      description: Locale.tr("View designed to present the valid operations agaist a vCenter infrastructure to a group administrator"),
      type: "vcenter"
    },
    cloud_vcenter : {
      id: 'cloud_vcenter',
      name: "Cloud vCenter",
      description: Locale.tr("View designed to present the valid operations against a vCenter infrastructure to a cloud consumer"),
      type: "vcenter"
    }
  };
});