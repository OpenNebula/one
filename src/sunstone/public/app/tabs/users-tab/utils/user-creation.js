define(function(require) {

  var TemplateHTML = require('hbs!./user-creation/html');

  /**
   * @param {string} idPrefix
   * @param  {object} [options] Options to hide/show each field. Each field is
   *                            enabled by default.
   *                            - name: true, false
   *                            - password: true, false
   *                            - auth_driver: true, false
   */
  function UserCreation(idPrefix, options) {
    this.idPrefix = idPrefix;

    this.options = options;

    if (this.options == undefined){
      this.options = {};
    }

    if (this.options.name == undefined){
      this.options.name = true;
    }

    if (this.options.password == undefined){
      this.options.password = true;
    }

    if (this.options.auth_driver == undefined){
      this.options.auth_driver = true;
    }
  }

  UserCreation.prototype.constructor = UserCreation;
  UserCreation.prototype.html = _html;
  UserCreation.prototype.setup = _setup;
  UserCreation.prototype.retrieve = _retrieve;
  UserCreation.prototype.enable = _enable;
  UserCreation.prototype.disable = _disable;
  UserCreation.prototype.setName = _setName;

  return UserCreation;

  function _html(){
    return TemplateHTML({
      'idPrefix': this.idPrefix
    });
  }

  /**
   * Setups the html
   * @param  {object} context jquery selector
   */
  function _setup(context){
    var that = this;

    if (this.options.name == false){
      $('#'+that.idPrefix+'_username',context).removeAttr('required');
      $('.name_row', context).hide();
    }

    if (this.options.password == false){
      $('#'+that.idPrefix+'_pass',context).removeAttr('required');
      $('.password_row', context).hide();
    }

    if (this.options.auth_driver == false){
      $('.auth_driver_row', context).hide();
    }

    $('#'+that.idPrefix+'_driver', context).change(function(){
      if ($(this).val() == "ldap"){
        $('#'+that.idPrefix+'_pass',context).removeAttr('required');
        $('.password_row', context).hide();
      } else if (that.options.password) {
        $('#'+that.idPrefix+'_pass',context).attr('required', '');
        $('.password_row', context).show();
      }
    });

    $('input[name="custom_auth"]',context).parent().hide();
    $('select#'+that.idPrefix+'_driver',context).change(function(){
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
    var that = this;

    var user_name = $('#'+that.idPrefix+'_username',context).val();
    var user_password = $('#'+that.idPrefix+'_pass',context).val();
    var driver = $('#'+that.idPrefix+'_driver', context).val();

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
    var that = this;

    $('#'+that.idPrefix+'_username',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_pass',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_confirm_password',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_driver',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_custom_auth',context).attr('disabled','disabled').removeAttr('required');
  }

  /**
   * Enables all inputs, and adds the abide required tags
   * @param  {object} context jquery selector
   */
  function _enable(context){
    var that = this;

    $('#'+that.idPrefix+'_username',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_pass',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_confirm_password',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_driver',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_custom_auth',context).removeAttr("disabled");

    $('select#'+that.idPrefix+'_driver',context).change();
  }

  function _setName(context, name){
    $('#'+this.idPrefix+'_username',context).val(name);
  }
});
