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
    var lang_tmp="";
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

    var updateUserTemplate = function(request,user_json){
        var template = user_json.USER.TEMPLATE;
        var template_str="";
        template["LANG"] = lang_tmp;

        //convert json to ONE template format - simple conversion
        $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
        });

        var obj = {
            data: {
                id: uid,
                extra_param: template_str
            },
            error: onError,
            success: function() {
                $.post('config',JSON.stringify({lang:lang_tmp}),function(){
                    window.location.href = ".";
                });
            },
        };
        OpenNebula.User.update(obj);

    };

    lang_tmp = lang_str;

    if (whichUI() == "sunstone"){
        var obj = {
            data : {
                id: uid,
            },
            success: updateUserTemplate
        };
        OpenNebula.User.show(obj);
    } else {
        dialog.dialog('close');
    };
};

$(document).ready(function(){
    //Update static translations
    $('#doc_link').html(tr("Documentation"));
    $('#support_link').html(tr("Support"));
    $('#community_link').html(tr("Community"));
    $('#welcome').html(tr("Welcome"));
    $('#logout').html(tr("Sign out"));
});