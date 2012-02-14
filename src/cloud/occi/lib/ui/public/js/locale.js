/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

var lang=""
var locale = {};
var datatable_lang = "";

function tr(str){
    var tmp = locale[str];
    if ( tmp == null || tmp == "" ) {
        //console.debug("Missing translation: "+str);
        tmp = str;
    }
    return tmp;
};

//Pops up loading new language dialog. Retrieves the user template, updates the LANG variable.
//Updates template and session configuration and reloads the view.
function setLang(lang_str){
    var dialog = $('<div title="'+
                   tr("Changing language")+'">'+
                   tr("Loading new language... please wait")+
                   ' '+spinner+'</div>').dialog({
                       draggable:false,
                       modal:true,
                       resizable:false,
                       buttons:{},
                       width: 460,
                       minHeight: 50
                   });

    if (('localStorage' in window) && (window['localStorage'] !== null)){
        localStorage['lang']=lang_str;
    };
    $.post('ui/config',JSON.stringify({lang:lang_str}),function(){window.location.href = "./ui"});
};

$(document).ready(function(){
    //Update static translations
    $('#doc_link').text(tr("Documentation"));
    $('#support_link').text(tr("Support"));
    $('#community_link').text(tr("Community"));
    $('#welcome').text(tr("Welcome"));
    $('#logout').text(tr("Sign out"));
});