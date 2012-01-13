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

var activeTab;
var outerLayout, innerLayout;

function hideDialog(){
    innerLayout.close("east");
}

function popDialog(content){
    $("#dialog").html(content);
    innerLayout.open("east");
}

function popDialogLoading(){
    var loading = '<div style="margin-top:'+Math.round($("#dialog").height()/6)+'px; text-align: center; width: 100%"><img src="images/pbar.gif" alt="loading..." /></div>';
    popDialog(loading);
}

function showTab(tabname){
    activeTab = tabname;

    //clean selected menu
    $("#navigation li").removeClass("navigation-active-li");
    $("#navigation li a").removeClass("navigation-active-li-a");

    //select menu
    var li = $("#navigation li:has(a[href='"+activeTab+"'])")
    var li_a = $("#navigation li a[href='"+activeTab+"']")
    li.addClass("navigation-active-li");
    li_a.addClass("navigation-active-li-a");

    //show tab
    $(".tab").hide();
    $(activeTab).show();
    //~ if (activeTab == '#dashboard') {
		//~ emptyDashboard();
		//~ preloadTables();
	//~ }
    innerLayout.close("south");
}

$(document).ready(function () {
    $(".tab").hide();

    $(".outer-west ul li.subTab").live("click",function(){
        var tab = $('a',this).attr('href');
        showTab(tab);
        return false;
    });

    $(".outer-west ul li.topTab").live("click",function(){
        var tab = $('a',this).attr('href');
        //toggle subtabs trick
        $('li.'+tab.substr(1)).toggle();
        showTab(tab);
        return false;
    });

    outerLayout = $('body').layout({
        applyDefaultStyles:       false
    ,   center__paneSelector:	".outer-center"
    ,	west__paneSelector:		".outer-west"
    ,	west__size:				133
    ,	north__size:			26
    ,   south__size:            26
    ,	spacing_open:			0 // ALL panes
    ,	spacing_closed:			0 // ALL panes
    //,	north__spacing_open:	0
    //,	south__spacing_open:	0
    ,	north__maxSize:			200
    ,	south__maxSize:			200
    ,   south__closable:        false
    ,   north__closable:        false
    ,   west__closable:         false
    ,   south__resizable:       false
    ,   north__resizable:       false
    ,   west__resizable:        false
    });

    var factor = 0.45;
    var dialog_height = Math.floor($(".outer-center").width()*factor);

    innerLayout = $('div.outer-center').layout({
        fxName:                 "slide"
    ,   initClosed:             true
    ,   center__paneSelector:	".inner-center"
    ,	east__paneSelector:	".inner-east"
    ,   east__size:            dialog_height
    ,   east__minSize:         400
    ,	spacing_open:			5  // ALL panes
    ,	spacing_closed:			5 // ALL panes
    });

});

