define(function(require) {
  // Constants
  var QUOTA_LIMIT_DEFAULT   = "-1";
  var QUOTA_LIMIT_UNLIMITED = "-2";


  // Dependencies
  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize');


  // The default quotas returned by the pool.list method are stored here
  var _defaultUserQuotas;

  function _setDefaultUserQuotas(defaultUserQuotas){
    _defaultUserQuotas = defaultUserQuotas;
  }

  function _getDefaultUserQuotas(defaultUserQuotas){
    return _defaultUserQuotas;
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
          "VOLATILE_SIZE" : QUOTA_LIMIT_UNLIMITED
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

  // If the VM quotas are empty, inits the VM counters to 0, and sets the limit
  // to 'default'. It is not applied to oneadmin user/group
  function _initEmptyQuotas(resource){
    if ($.isEmptyObject(resource.VM_QUOTA) && resource.ID != 0){
      resource.VM_QUOTA = {
        VM: {
          VMS         : QUOTA_LIMIT_DEFAULT,
          VMS_USED    : 0,
          CPU         : QUOTA_LIMIT_DEFAULT,
          CPU_USED    : 0,
          MEMORY      : QUOTA_LIMIT_DEFAULT,
          MEMORY_USED : 0,
          VOLATILE_SIZE      : QUOTA_LIMIT_DEFAULT,
          VOLATILE_SIZE_USED : 0
        }
      };
    }
  }

  function _quotaBar(usage, limit, default_limit){
    var int_usage = parseInt(usage, 10);
    var int_limit = _quotaIntLimit(limit, default_limit);
    return ProgressBar.html(int_usage, int_limit, null);
  }

  function _quotaBarMB(usage, limit, default_limit){
    var int_usage = parseInt(usage, 10);
    var int_limit = _quotaIntLimit(limit, default_limit);

    info_str = Humanize.size(int_usage * 1024)+' / ' +
                  ((int_limit >= 0) ? Humanize.size(int_limit * 1024) : '-');

    return ProgressBar.html(int_usage, int_limit, info_str);
  }

  function _quotaBarFloat(usage, limit, default_limit){
    var float_usage = parseFloat(usage, 10);
    var float_limit = _quotaFloatLimit(limit, default_limit);
    return ProgressBar.html(float_usage, float_limit, null);
  }

  function _quotaIntLimit(limit, default_limit){
    i_limit = parseInt(limit, 10);
    i_default_limit = parseInt(default_limit, 10);

    if (limit == QUOTA_LIMIT_DEFAULT){
      i_limit = i_default_limit;
    }

    if (isNaN(i_limit)){
      i_limit = 0;
    }

    return i_limit;
  }

  function _quotaFloatLimit(limit, default_limit){
    f_limit = parseFloat(limit, 10);
    f_default_limit = parseFloat(default_limit, 10);

    if (f_limit == parseFloat(QUOTA_LIMIT_DEFAULT, 10)){
      f_limit = f_default_limit;
    }

    if (isNaN(f_limit)){
      f_limit = 0;
    }

    return f_limit;
  }

  return {
    'setDefaultUserQuotas': _setDefaultUserQuotas,
    'getDefaultUserQuotas': _getDefaultUserQuotas,
    'initEmptyQuotas': _initEmptyQuotas,
    'default_quotas': _default_quotas,
    'quotaBar': _quotaBar,
    'quotaBarMB': _quotaBarMB,
    'quotaBarFloat': _quotaBarFloat
  };
});
