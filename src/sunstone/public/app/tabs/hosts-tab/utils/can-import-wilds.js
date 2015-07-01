define(function(require){
  /*
    CONSTRUCTOR
   */

  return _canImportWilds;

  /*
    FUNCTION DEFINITIONS
   */

  /* Check if any of the existing VMs in the Host define the IMPORT_TEMPLATE
      attribute to be imported into OpenNebula.
    @param {Object} element Host element as returned by OpenNebula
    @result {Boolean}
  */
  function _canImportWilds(element) {
    var canImportWilds = false;
    if (element.TEMPLATE.VM) {
      var vms = element.TEMPLATE.VM;
      if (!$.isArray(vms)) { // If only 1 VM convert to array
        vms = [vms];
      }
      $.each(vms, function() {
        if (this.IMPORT_TEMPLATE) {
          canImportWilds = true;
          return false;
        }
      });
    }
    return canImportWilds;
  }
});