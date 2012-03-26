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
    innerLayout.close("south");
}

function popDialog(content){
    $("#dialog").html(content);
    innerLayout.open("south");
}

function popDialogLoading(){
    var loading = '<div style="margin-top:'+Math.round($("#dialog").height()/6)+'px; text-align: center; width: 100%"><img src="images/pbar.gif" alt="loading..." /></div>';
    popDialog(loading);
}

function showTab(tabname,highlight_tab){
    //Since menu items no longer have an <a> element
    //we no longer expect #tab_id here, but simply tab_id
    //So safety check - remove # from #tab_id if present to ensure compatibility
    if (tabname.indexOf('#') == 0)
        tabname = tabname.substring(1);
    if (highlight_tab && highlight_tab.indexOf('#') == 0)
        highlight_tab == highlight.substring(1);

    var activeTab = tabname;

    if (!highlight_tab) highlight_tab = activeTab;

    //clean selected menu
    $("#navigation li").removeClass("navigation-active-li");
    $("div#header ul#menutop_ul li").removeClass("navigation-active-li");

    //select tab in left menu
    var li = $("#navigation li#li_"+highlight_tab)
    li.addClass("navigation-active-li");

    //select tab in top menu
    var top_li = $("div#header ul#menutop_ul li#top_"+highlight_tab);
    top_li.addClass("navigation-active-li");


    //show tab
    $(".tab").hide();
    $('#'+activeTab).show();
    innerLayout.close("south");
}

function setupTabs(){

    var topTabs = $(".outer-west ul li.topTab");
    var subTabs = $(".outer-west ul li.subTab");

    subTabs.live("click",function(){
        //leave floor to topTab listener in case of tabs with both classes
        if ($(this).hasClass('topTab')) return false;

        var tab = $(this).attr('id').substring(3);
        showTab(tab);
        return false;
    });

    topTabs.live("click",function(e){
        var tab = $(this).attr('id').substring(3);
        //Subtabs have a class with the name of  this tab
        var subtabs = $('div#menu li.'+tab);

        //toggle subtabs only when clicking on the icon or when clicking on an
        //already selected menu
        if ($(e.target).is('span') ||
            $(this).hasClass("navigation-active-li")){
            //for each subtab, we hide the subsubtabs
            subtabs.each(function(){
                //for each subtab, hide its subtabs
                var subsubtabs = $(this).attr('id').substr(3);
                //subsubtabs class
                subsubtabs = $('div#menu li.'+subsubtabs);
                subsubtabs.hide();
            });
            //hide subtabs and reset icon to + position, since all subsubtabs
            //are hidden
            subtabs.fadeToggle('fast');
            $('span',subtabs).removeClass('ui-icon-circle-minus');
            $('span',subtabs).addClass('ui-icon-circle-plus');
            //toggle icon on this tab
            $('span',this).toggleClass('ui-icon-circle-plus ui-icon-circle-minus');
        };
        //if we are clicking on the icon only, do not show the tab
        if ($(e.target).is('span')) return false;

        showTab(tab);
        return false;
    });

};

function setupTopMenu(){
    $('div#header ul#menutop_ul li').live('click',function(){
        var tab = "#" + $(this).attr('id').substring(4);
        showTab(tab);
    });
};

$(document).ready(function () {
    $(".tab").hide();

    setupTabs();
    setupTopMenu();

    outerLayout = $('body').layout({
        applyDefaultStyles:       false
    ,   center__paneSelector:	".outer-center"
    ,	west__paneSelector:		".outer-west"
    ,	west__size:				181
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

    var factor = 0.6;
    var dialog_height = Math.floor($(".outer-center").height()*factor);

    innerLayout = $('div.outer-center').layout({
        fxName:                 "slide"
    ,   initClosed:             true
    ,   center__paneSelector:	".inner-center"
    ,	south__paneSelector:	".inner-south"
    ,   south__size:            dialog_height
    ,	spacing_open:			5  // ALL panes
    ,	spacing_closed:			5 // ALL panes
    });

});
