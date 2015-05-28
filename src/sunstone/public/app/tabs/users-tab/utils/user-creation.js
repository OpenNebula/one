define(function(require) {

  var TemplateHTML = require('hbs!./user-creation/html');

  return {
    'html': _html,
    'setup': _setup,
    'retrieve': _retrieve,
    'disable': _disable,
    'enable': _enable
  };

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    $('#driver', context).change(function(){
      if ($(this).val() == "ldap"){
        $('#pass',context).hide().removeAttr('required');
        $('label[for="pass"]',context).hide();
      } else {
        $('#pass',context).show().attr('required', '');
        $('label[for="pass"]',context).show();
      }
    });

    $('input[name="custom_auth"]',context).parent().hide();
    $('select#driver',context).change(function(){
      if ($(this).val() == "custom"){
        $('input[name="custom_auth"]',context).parent().show();
        $('input[name="custom_auth"]',context).attr('required', '');
      } else {
        $('input[name="custom_auth"]',context).parent().hide();
        $('input[name="custom_auth"]',context).removeAttr('required');
      }
    });
  }

  /**
   * @param  {object} context jquery selector
   * @return {object}         Returns an object with the attributes:
   *                                  - name
   *                                  - password
   *                                  - auth_driver
   */
  function _retrieve(context){
    var user_name = $('#username',context).val();
    var user_password = $('#pass',context).val();
    var driver = $('#driver', context).val();

    if (driver == 'custom'){
      driver = $('input[name="custom_auth"]', context).val();
    } else if (driver == "ldap") {
      user_password = "-";
    }

    return {
      "name" : user_name,
      "password" : user_password,
      "auth_driver" : driver
    };
  }

  /**
   * Disables all inputs, and removes the abide required tags
   * @param  {object} context jquery selector
   */
  function _disable(context){
    $('#username',context).attr('disabled','disabled').removeAttr('required');
    $('#pass',context).attr('disabled','disabled').removeAttr('required');
    $('#driver',context).attr('disabled','disabled').removeAttr('required');
    $('#custom_auth',context).attr('disabled','disabled').removeAttr('required');
  }

  /**
   * Enables all inputs, and adds the abide required tags
   * @param  {object} context jquery selector
   */
  function _enable(context){
    $('#username',context).removeAttr("disabled").attr('required', '');
    $('#pass',context).removeAttr("disabled").attr('required', '');
    $('#driver',context).removeAttr("disabled").attr('required', '');
    $('#custom_auth',context).removeAttr("disabled");

    $('select#driver',context).change();
  }
});
