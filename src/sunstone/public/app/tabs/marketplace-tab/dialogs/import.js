/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./import/html');
  var ContentHTML = require('hbs!./import/content');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var ResourceSelect = require('utils/resource-select');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var OpenNebulaImage = require('opennebula/image');
  var OpenNebulaTemplate = require('opennebula/template');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./import/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;
  Dialog.prototype.try_to_create_template = _try_to_create_template;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;

    context.foundation('abide', 'reflow');
    $("#market_import_dialog_content", context).html(
      ContentHTML({'element': this.element})
    );

    ResourceSelect.insert({
        context: $('#market_img_datastore', context),
        resourceName: 'Datastore',
        filterKey: 'TYPE',
        filterValue: '' + OpenNebulaDatastore.TYPES.IMAGE_DS
      });

    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');

    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      that.number_of_files = that.element['files'].length;
      that.template_created = false;
      that.images_information = [];


      $("input, button", context).attr("disabled", "disabled");
      $(".market_image_result:not(.success)",  context).html(
        '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>');
      $(".market_template_result",  context).html(
        '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>');

      var template_context = $("#market_import_file_template", context);

      $.each(that.element['files'], function(index, value){
        var local_context = $("#market_import_file_"+index,  context);

        if ($(".market_image_result:not(.success)", local_context).length > 0) {
          img_obj = {
            "image" : {
              "NAME": $("input.name",local_context).val(),
              "PATH": that.element['links']['download']['href']+'/'+index,
              "TYPE": value['type'],
              "MD5": value['md5'],
              "SHA1": value['sha1'],
              "DRIVER": value['driver'],
              "DEV_PREFIX": value['dev_prefix'],
              "FROM_APP": that.element['_id']["$oid"],
              "FROM_APP_NAME": that.element['name'],
              "FROM_APP_FILE": index
            },
            "ds_id" : $("#market_img_datastore select", context).val()
          };

          OpenNebulaImage.create({
            timeout: true,
            data: img_obj,
            success: function (file_index, file_context){
              return function(request, response) {
                $(".market_image_result", file_context).addClass("success").html(
                  '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                  '</span>');

                $(".market_image_response", file_context).html(
                  '<p style="font-size:12px" class="running-color">'+
                  Locale.tr("Image created successfully")+' ID:'+response.IMAGE.ID+
                  '</p>');

                that.images_information[file_index] = response;

                that.try_to_create_template(context);
              };
            }(index, local_context),
            error: function (request, error_json){
              $(".market_template_result", template_context).html('');

              $(".market_image_result", local_context).html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                  '<i class="fa fa-cloud fa-stack-2x"></i>'+
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                '</span>');

              $(".market_image_response", local_context).html(
                '<p style="font-size:12px" class="error-color">'+
                (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))+
                '</p>');

              $("input", template_context).removeAttr("disabled");
              $("input", local_context).removeAttr("disabled");
              $("button", context).removeAttr("disabled");
            }
          });
        }
      });

      that.try_to_create_template(context);

      return false;
    });

    return false;
  }

  function _onShow(context) {

    return false;
  }

  /**
   * @param {object} params
   *        - params.element : Marketplace appliance as returned by a .show call
   */
  function _setParams(params) {
    this.element = params.element;
  }


  function _try_to_create_template(context){
    var that = this;

    var template_context = $("#market_import_file_template",  context);

    var images_created = $(".market_image_result.success", context).length;

    if ((images_created == this.number_of_files) && !that.template_created) {
      that.template_created = true;

      if (that.element['opennebula_template'] && that.element['opennebula_template'] !== "CPU=1") {
        var vm_template;
        try {
          vm_template = JSON.parse( TemplateUtils.htmlDecode(that.element['opennebula_template']) );
        } catch (error) {
          $(".market_template_result", template_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
            '</span>');

          $(".market_template_response", template_context).html(
            '<p style="font-size:12px" class="error-color">'+
            (error.message || Locale.tr("Cannot contact server: is it running and reachable?"))+
            '</p>');

          $("input", template_context).removeAttr("disabled");
          $("button", context).removeAttr("disabled");
          that.template_created = false;
          return;
        }

        if ($.isEmptyObject(vm_template.DISK)){
          vm_template.DISK = [];
        } else if (!$.isArray(vm_template.DISK)){
          vm_template.DISK = [vm_template.DISK];
        }

        vm_template.NAME = $("input", template_context).val();
        if (!vm_template.CPU){
          vm_template.CPU = "1";
        }
        if (!vm_template.MEMORY){
          vm_template.MEMORY = "1024";
        }

        $.each(that.images_information, function(image_index, image_info){
          if (!vm_template.DISK[image_index]) {
            vm_template.DISK[image_index] = {};
          }

          vm_template.DISK[image_index].IMAGE = image_info.IMAGE.NAME;
          vm_template.DISK[image_index].IMAGE_UNAME = image_info.IMAGE.UNAME;
        });

        vm_template.FROM_APP = that.element['_id']["$oid"];
        vm_template.FROM_APP_NAME = that.element['name'];

        OpenNebulaTemplate.create({
          timeout: true,
          data: {vmtemplate: vm_template},
          success: function (request, response){
            $(".market_template_result", template_context).addClass("success").html(
              '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
              '</span>');

            $(".market_template_response", template_context).html(
              '<p style="font-size:12px" class="running-color">'+
              Locale.tr("Template created successfully")+' ID:'+response.VMTEMPLATE.ID+
              '</p>');

            $("button", context).hide();
          },
          error: function (request, error_json){
            $(".market_template_result", template_context).html(
              '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
              '</span>');

            $(".market_template_response", template_context).html(
              '<p style="font-size:12px" class="error-color">'+
              (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))+
              '</p>');

            $("input", template_context).removeAttr("disabled");
            $("button", context).removeAttr("disabled");
            that.template_created = false;
          }
        });
      } else {
        $("button", context).hide();
      }
    }
  }

});
