/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');
  require('opennebula/cluster');
  require('opennebula/user');
  require('opennebula/group');
  
  /**
   * Insert a select with the specified list of OpenNebula resources
   * The list of resources will be retrieved running a Resource.list action
   *
   * @param {Object}  opts
   * @param {Object}  opts.context - jQuery selector where the select will be added
   * @param {string}  opts.resourceName - Name of the OpenNebula JS resource (i.e: Cluster, Host)
   * @param {string}  [opts.initValue] - The value of an option to be selected by default
   * @param {Boolean} [opts.emptyValue] - Add a first option with the text Please select
   * @param {Boolean} [opts.triggerChange] - Trigger the change event after the select is added
   * @param {Boolean} [opts.onlyName] - Show only the name of the resource instead of ID:NAME
   * @param {string}  [opts.extraOptions] - Extra options to be included in the select as a HTML string
   * @param {string}  [opts.filterKey] - Select the resources whose filterKey matches filterValue
   * @param {string}  [opts.filterValue] - RegExp that will be evaluated to filter the resources
   * @param {Boolean} [opts.nameValues] - Use the object NAME instead of the ID as the option values
   * @param {string}  [opts.selectId] - Optional ID for the html select element
   * @param {Boolean} [opts.required] - True to make the html select required
   * @param {function}[opts.callback] - Callback function to call after the select element is
   *                                    added to the DOM
   */
  var _insert = function(opts) {
    var Resource = require('opennebula/' + opts.resourceName.toLowerCase());
    opts.context.html('<i class="fas fa-spinner fa-spin"></i>');

    Resource.list({
      options: { force: opts.force || false },
      timeout: true,
      success: function (request, elemList) {
        var elemId = '';

        if (opts.selectId != undefined){
          elemId = 'id="'+opts.selectId+'"';
        }

        var required = '';

        if (opts.required == true){
          required = 'required';
        }

        var selectHTML = '<select '+elemId+' '+required+' class="resource_list_select">';

        if (opts.emptyValue) {
          selectHTML += '<option class="empty_value" value="">' +
                          Locale.tr("Please select") + '</option>';
        }

        if (opts.extraOptions !== undefined) {
          selectHTML += opts.extraOptions;
        }

        var resourceXMLRoot = Resource.resource;
        var elem, add;
        $.each(elemList, function() {
          elem = this[resourceXMLRoot];

          if (opts.filterKey !== undefined && opts.filterValue !== undefined) {
            if (elem[opts.filterKey] === opts.filterValue) {
              add = true;
            } else {
              add = false;
            }
          } else {
            add = true;
          }

          if (resourceXMLRoot === "DATASTORE" && elem.TEMPLATE.TYPE === "SYSTEM_DS"){
            add = false;
          }

          if (add === true) {
            var val;

            if (opts.nameValues == true){
              val = TemplateUtils.htmlDecode(elem.NAME);
            }else{
              val = elem.ID;
            }

            selectHTML += '<option elem_id="' + elem.ID + '" value="' + val + '">';
            if (!opts.onlyName) {
              selectHTML += elem.ID + ': ';
            }
            selectHTML += TemplateUtils.htmlDecode(elem.NAME) + '</option>';
          }
        });

        selectHTML += '</select>';

        opts.context.html(selectHTML);

        if (opts.initValue !== undefined) {
          $('.resource_list_select', opts.context).val(opts.initValue);
        }
        if (opts.triggerChange === true) {
          $(' .resource_list_select', opts.context).change();
        }

        if(opts.callback != undefined){
          opts.callback($('.resource_list_select', opts.context));
        }
      },
      error: Notifier.onError
    });
  }

  return {
    'insert': _insert
  }
})
