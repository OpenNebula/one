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

  var TopRowHTML = require('hbs!./menu/top-row');
  var ProvisionTopRowHTML = require('hbs!./menu/provision-top-row');
  var Config = require('sunstone-config');
  return {
    'insert': _insert,
    'insertProvision': _insertProvision,
    'setup': _setup,
    'hide': _hide,
    'show': _show,
    'entryClick': _entryClick,
  };

  function _insert(){
    $('#top-row').html(TopRowHTML({
      logo: Config.logo,
      link: Config.link_logo,
      link_text: Config.text_link_logo
    }));

    _setup();
  }

  function _insertProvision(){
    $('#top-row').html(ProvisionTopRowHTML({logo: Config.provision.logo}));

    $("#menu-wrapper").remove();
  }

  function _setup(){
    $('#menu-toggle').on('click', function(){
      var hiding = $('.sunstone-content').hasClass("large-10");
      if(!hiding){
        $('.sunstone-content').toggleClass('large-10');
        $('.sunstone-content').toggleClass('large-12');
      }

      $('#menu-wrapper').toggle(200, function(){
        if(hiding){
          $('.sunstone-content').toggleClass('large-10');
          $('.sunstone-content').toggleClass('large-12');
        }
      });
    });

    var prevWindowLarge = Foundation.MediaQuery.atLeast('large');

    $(window).resize(function() {
      if(Foundation.MediaQuery.atLeast('large')){
        $('#menu-wrapper').removeClass("menu-small");

        if(!prevWindowLarge){ // resizing from small to large, show menu
          _show();
        }

        prevWindowLarge = true;
      } else {
        $('#menu-wrapper').addClass("menu-small");

        if(prevWindowLarge){ // resizing from large to small, hide menu
          _hide();
        }

        prevWindowLarge = false;
      }
    });

    $(window).resize();
  }

  function _hide(){
    if($('#menu-wrapper').is(':visible')){
      $('#menu-toggle').click();
    }
  }

  function _show(){
    if(!$('#menu-wrapper').is(':visible')){
      $('#menu-toggle').click();
    }
  }

  function _entryClick(){
    if(!Foundation.MediaQuery.atLeast('large')){
      _hide();
    }
  }
});
