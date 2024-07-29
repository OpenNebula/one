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

  var Config = require('sunstone-config');

  function _counterAnimation(domClass, value, extra) {
    var time = 1500;

    if ( !Config.doCountAnimation ){
      time = 1;
    }

    if(!extra){
      extra = "";
    }
    $(domClass).each(function () {
      $(this).prop('Counter', 0).animate({
          Counter: value
      }, {
          duration: time,
          easing: 'swing',
          step: function (now) {
              $(this).text(Math.ceil(now) + " " + extra);
          }
      });
    });
  }

  function _counterAnimationDecimal(domClass, value, extra) {
    var time = 1500;

    if ( !Config.doCountAnimation ){
      time = 1;
    }

    if(!extra){
      extra = "";
    }
    $(domClass).each(function () {
      $(this).prop('Counter', 0).animate({
          Counter: value
      }, {
          duration: time,
          easing: 'swing',
          step: function (now) {
            $(this).text(Math.round(now*10)/10 + " " + extra);
          }
      });
    });
  }

  return {
    "counterAnimation": _counterAnimation,
    "counterAnimationDecimal": _counterAnimationDecimal
  };
});