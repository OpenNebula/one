define(function(require) {
  /*
    Common functions for VNets
   */


  /*
    @param {Object} info Object representing the VNet as returned by OpenNebula
   */
   function _getARList(info){
    var ar_list = info.AR_POOL.AR;

    if (!ar_list){ //empty
      ar_list = [];
    } else if (ar_list.constructor != Array) { //>1 lease
      ar_list = [ar_list];
    }

    return ar_list;
  }

  return {
    'getARList': _getARList
  }
})
