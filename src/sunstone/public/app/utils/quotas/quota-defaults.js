define(function(require) {
  // The default quotas returned by the pool.list method are stored here
  var _defaultUserQuotas = {
    "VM_QUOTA": {
      "VM": {
        "CPU":      QUOTA_LIMIT_UNLIMITED,
        "MEMORY":   QUOTA_LIMIT_UNLIMITED,
        "VMS":      QUOTA_LIMIT_UNLIMITED,
        "SYSTEM_DISK_SIZE": QUOTA_LIMIT_UNLIMITED,
      }
    },
    "DATASTORE_QUOTA": {},
    "IMAGE_QUOTA": {},
    "NETWORK_QUOTA": {}
  };

  var _defaultGroupQuotas = {
    "VM_QUOTA": {
      "VM": {
        "CPU":      QUOTA_LIMIT_UNLIMITED,
        "MEMORY":   QUOTA_LIMIT_UNLIMITED,
        "VMS":      QUOTA_LIMIT_UNLIMITED,
        "SYSTEM_DISK_SIZE": QUOTA_LIMIT_UNLIMITED,
      }
    },
    "DATASTORE_QUOTA": {},
    "IMAGE_QUOTA": {},
    "NETWORK_QUOTA": {}
  };

  var QuotaLimits = require('./quota-limits');


  // Constants
  var QUOTA_LIMIT_DEFAULT   = QuotaLimits.QUOTA_LIMIT_DEFAULT;
  var QUOTA_LIMIT_UNLIMITED = QuotaLimits.QUOTA_LIMIT_UNLIMITED;


  function _setDefaultUserQuotas(defaultUserQuotas){
    _defaultUserQuotas = defaultUserQuotas;
  }

  function _setDefaultGroupQuotas(defaultGroupQuotas){
    _defaultGroupQuotas = defaultGroupQuotas;
  }

  function _getDefaultUserQuotas(){
    return _defaultUserQuotas;
  }

  function _getDefaultGroupQuotas(){
    return _defaultGroupQuotas;
  }

  /**
   * @param  {string} resource_name User or Group
   * @return {Object}
   */
  function _getDefaultQuotas(resource_name){
    if(resource_name == "User") {
      return _getDefaultUserQuotas();
    } else {
      return _getDefaultGroupQuotas();
    }
  }

  // Processes the default quotas as returned by OpenNebula, to be easier to
  // use in Sunstone
  function _default_quotas(default_quotas){
    // Initialize the VM_QUOTA to unlimited if it does not exist
    if ($.isEmptyObject(default_quotas.VM_QUOTA)){
      default_quotas.VM_QUOTA = {
        "VM" : {
          "VMS"           : QUOTA_LIMIT_UNLIMITED,
          "MEMORY"        : QUOTA_LIMIT_UNLIMITED,
          "CPU"           : QUOTA_LIMIT_UNLIMITED,
          "SYSTEM_DISK_SIZE" : QUOTA_LIMIT_UNLIMITED
        }
      };
    }

    // Replace the DATASTORE array with a map

    var ds_quotas = [];

    if ($.isArray(default_quotas.DATASTORE_QUOTA.DATASTORE))
      ds_quotas = default_quotas.DATASTORE_QUOTA.DATASTORE;
    else if (default_quotas.DATASTORE_QUOTA.DATASTORE)
      ds_quotas = [default_quotas.DATASTORE_QUOTA.DATASTORE];

    delete default_quotas.DATASTORE_QUOTA;

    default_quotas.DATASTORE_QUOTA = {};

    for (var i=0; i < ds_quotas.length; i++){
      default_quotas.DATASTORE_QUOTA[ds_quotas[i].ID] = ds_quotas[i];
    }

    // Replace the IMAGE array with a map

    var img_quotas = [];

    if ($.isArray(default_quotas.IMAGE_QUOTA.IMAGE))
      img_quotas = default_quotas.IMAGE_QUOTA.IMAGE;
    else if (default_quotas.IMAGE_QUOTA.IMAGE)
      img_quotas = [default_quotas.IMAGE_QUOTA.IMAGE];

    delete default_quotas.IMAGE_QUOTA;

    default_quotas.IMAGE_QUOTA = {};

    for (var i=0; i < img_quotas.length; i++){
      default_quotas.IMAGE_QUOTA[img_quotas[i].ID] = img_quotas[i];
    }

    // Replace the NETWORK array with a map

    var net_quotas = [];

    if ($.isArray(default_quotas.NETWORK_QUOTA.NETWORK))
      net_quotas = default_quotas.NETWORK_QUOTA.NETWORK;
    else if (default_quotas.NETWORK_QUOTA.NETWORK)
      net_quotas = [default_quotas.NETWORK_QUOTA.NETWORK];

    delete default_quotas.NETWORK_QUOTA;

    default_quotas.NETWORK_QUOTA = {};

    for (var i=0; i < net_quotas.length; i++){
      default_quotas.NETWORK_QUOTA[net_quotas[i].ID] = net_quotas[i];
    }

    return default_quotas;
  }


  return {
    'setDefaultUserQuotas': _setDefaultUserQuotas,
    'getDefaultUserQuotas': _getDefaultUserQuotas,
    'setDefaultGroupQuotas': _setDefaultGroupQuotas,
    'getDefaultGroupQuotas': _getDefaultGroupQuotas,
    'getDefaultQuotas': _getDefaultQuotas,
    'default_quotas': _default_quotas
  };
});
