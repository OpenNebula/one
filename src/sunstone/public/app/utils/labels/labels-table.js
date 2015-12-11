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
  /* DEPENDENCIES */

  var Tree = require('./tree');
  var TemplateUtils = require('utils/template-utils');
  var LabelsUtils = require('./utils');
  var TableTemplate = require('hbs!./labels-table/table');
  var Sunstone = require('sunstone');

  var TEMPLATE_ATTR = 'TEMPLATE';
  var LABELS_ATTR = 'LABELS';

  /* CONSTRUCTOR */

  /*
    @param {Object} opts Options for the slider
      opts.element
      opts.resource
      opts.xmlRoot
   */
  function LabelsTable(opts) {
    this.element = opts.element;
    this.resource = opts.resource;
    this.xmlRoot = opts.xmlRoot;
    this.labels = LabelsUtils.deserializeLabels(LabelsUtils.labelsStr(this.element));

    return this;
  };

  LabelsTable.prototype.html = _html;
  LabelsTable.prototype.setup = _setup;

  return LabelsTable;

  /* FUNCTION DEFINITIONS */

  function _html() {
    var labelsTreeHTML = Tree.html(LabelsUtils.makeTree(this.labels));
    return TableTemplate({
      'labelsTreeHTML': labelsTreeHTML
    })
  }

  function _setup(context) {
    var that = this;
    context.off('click', '.addLabel');
    context.on('click', '.addLabel', function() {
      var labels = _retrieveLabels(context);
      var newLabel = $('.newLabel', context).val();
      labels.push(newLabel);

      var templateObj = that.element[TEMPLATE_ATTR];
      templateObj[LABELS_ATTR] = labels.join();
      templateStr  = TemplateUtils.templateToString(templateObj);

      Sunstone.runAction(that.resource + '.update_template', that.element.ID, templateStr);
      return false;
    });

    // Capture the enter key
    context.off('keypress', '.newLabel');
    context.on('keypress', '.newLabel', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;

      if (key == 13 && !ev.altKey) {
        //Get the button the user wants to have clicked
        $('.addLabel', context).click();
        ev.preventDefault();
      }
    });

    context.off('click', '.remove-tab');
    context.on('click', '.remove-tab', function() {
      $(this).closest('li').remove();

      var labels = _retrieveLabels(context);
      var templateObj = that.element[LabelsUtils.TEMPLATE_ATTR];
      templateObj[LabelsUtils.LABELS_ATTR] = labels.join();
      templateStr  = TemplateUtils.templateToString(templateObj);
      Sunstone.runAction(that.resource + ".update_template", that.element.ID, templateStr);
      return false;
    });
  }

  function _retrieveLabels(context) {
    return $('.one-label', context).map(function() {
      return $(this).attr('one-label-full-name');
    }).get();
  }
});
