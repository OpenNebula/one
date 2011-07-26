/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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


/* Some useful functions for Sunstone default plugins */
var INTERVAL=60000; //milisecs

function someTime(){
    return Math.floor(Math.random()*30000);
}

//introduces 0s before a number until in reaches 'length'.
function pad(number,length) {
    var str = '' + number;
    while (str.length < length)
        str = '0' + str;
    return str;
}

//turns a Unix-formatted time into a human readable string
function pretty_time(time_seconds)
{
    var d = new Date();
    d.setTime(time_seconds*1000);

    var secs = pad(d.getSeconds(),2);
    var hour = pad(d.getHours(),2);
    var mins = pad(d.getMinutes(),2);
    var day = pad(d.getDate(),2);
    var month = pad(d.getMonth()+1,2); //getMonths returns 0-11
    var year = d.getFullYear();

    return hour + ":" + mins +":" + secs + "&nbsp;" + month + "/" + day + "/" + year;
}

function pretty_time_axis(time){
    var d = new Date();
    d.setTime(time*1000);

    var secs = pad(d.getSeconds(),2);
    var hour = pad(d.getHours(),2);
    var mins = pad(d.getMinutes(),2);
    var day = pad(d.getDate(),2);
    var month = pad(d.getMonth()+1,2); //getMonths returns 0-11
    var year = d.getFullYear();

    return hour + ":" + mins + ":" + secs;// + "&nbsp;" + month + "/" + day;
}

//returns a human readable size in Kilo, Mega, Giga or Tera bytes
function humanize_size(value) {
    if (typeof(value) === "undefined") {
        value = 0;
    }
    var binarySufix = ["K", "M", "G", "T" ];
    var i=0;
    while (value > 1024 && i < 3){
        value = value / 1024;
        i++;
    }
    value = Math.round(value * 10) / 10;

    if (value - Math.round(value) == 0) {
        value = Math.round(value);
    }

    var st = value + binarySufix[i];
    return st;
}

//Wrapper to add an element to a dataTable
function addElement(element,data_table){
    data_table.fnAddData(element);
}

//deletes an element with id 'tag' from a dataTable
function deleteElement(data_table,tag){
    var tr = $(tag).parents('tr')[0];
    data_table.fnDeleteRow(tr);
    $('input',data_table).trigger("change");
}

//Listens to the checkboxes of the datatable. This function is used
//by standard sunstone plugins to enable/disable certain action buttons
//according to the number of elements checked in the dataTables.
//It also checks the "check-all" box when all elements are checked
function tableCheckboxesListener(dataTable){

    //Initialization - disable all buttons
    var context = dataTable.parents('form');
    var last_action_b = $('.last_action_button',context);
    $('.top_button, .list_button',context).button("disable");
    if (last_action_b.length && last_action_b.val().length){
        last_action_b.button("disable");
    };
    $('.create_dialog_button',context).button("enable");
    $('.alwaysActive',context).button("enable");

    //listen to changes in the visible inputs
    $('tbody input',dataTable).live("change",function(){
        var table = $(this).parents('tbody');
        var context = table.parents('form');
        var nodes = $('tr',table);
        var total_length = nodes.length;
        var checked_length = $('input:checked',nodes).length;

        var last_action_b = $('.last_action_button',context);


        //if all elements are checked we check the check-all box
        if (total_length == checked_length && total_length != 0){
            $('.check_all',dataTable).attr("checked","checked");
        } else {
            $('.check_all',dataTable).removeAttr("checked");
        }

        //if some element is checked, we enable buttons, otherwise
        //we disable them.
        if (checked_length){
            $('.top_button, .list_button',context).button("enable");
            //check if the last_action_button should be enabled
            if (last_action_b.length && last_action_b.val().length){
                last_action_b.button("enable");
            };
        } else {
            $('.top_button, .list_button',context).button("disable");
            last_action_b.button("disable");
        }

        //any case the create dialog buttons should always be enabled.
        $('.create_dialog_button',context).button("enable");
        $('.alwaysActive',context).button("enable");
    });

}

// Updates a data_table, with a 2D array containing the new values
// Does a partial redraw, so the filter and pagination are kept
function updateView(item_list,data_table){
    if (data_table!=null) {
        data_table.fnClearTable();
        data_table.fnAddData(item_list);
        data_table.fnDraw(false);
    };
}

//replaces an element with id 'tag' in a dataTable with a new one
function updateSingleElement(element,data_table,tag){
    var nodes = data_table.fnGetNodes();
    var tr = $(tag,nodes).parents('tr')[0];
    var position = data_table.fnGetPosition(tr);
    data_table.fnUpdate(element,position,0,false);
    $('input',data_table).trigger("change");

}

// Returns an string in the form key=value key=value ...
// Does not explore objects in depth.
function stringJSON(json){
    var str = ""
    for (field in json) {
        str+= field + '=' + json[field] + ' ';
    }
    return str;
}

//Notifications
//Notification of submission of action
function notifySubmit(action, args, extra_param){
    var action_text = action.replace(/OpenNebula\./,'').replace(/\./,' ');

    var msg = "<h1>Submitted</h1>";
    if (!args || (typeof args == 'object' && args.constructor != Array)){
        msg += action_text;
    } else {
        msg += action_text + ": " + args;
    }
    if (extra_param != null)
        msg += " >> " + extra_param;

    $.jGrowl(msg, {theme: "jGrowl-notify-submit"});
}

//Notification on error
function notifyError(msg){
    msg = "<h1>Error</h1>" + msg;

    $.jGrowl(msg, {theme: "jGrowl-notify-error", sticky: true });
}

function notifyMessage(msg){
    msg = "<h1>Info</h1>" + msg;

    $.jGrowl(msg, {theme: "jGrowl-notify-submit"});
}

// Returns an HTML string with the json keys and values in the form
// key: value<br />
// It recursively explores objects
function prettyPrintJSON(template_json,padding,weight, border_bottom,padding_top_bottom){
    var str = ""
    if (!template_json){ return "Not defined";}
    if (!padding) {padding=0};
    if (!weight) {weight="bold";}
    if (!border_bottom) {border_bottom = "1px solid #CCCCCC";}
    if (!padding_top_bottom) {padding_top_bottom=6;}
    var field = null;

    if (template_json.constructor == Array){
        for (field = 0; field < template_json.length; ++field){
            str += prettyPrintRowJSON(field,template_json[field],padding,weight, border_bottom,padding_top_bottom);
        }
    } else {
        for (field in template_json) {
            str += prettyPrintRowJSON(field,template_json[field],padding,weight, border_bottom,padding_top_bottom);
        }
    }
    return str;
}

function prettyPrintRowJSON(field,value,padding,weight, border_bottom,padding_top_bottom){
    var str="";

    if (typeof value == 'object'){
        //name of field row
        str += '<tr>\
                  <td class="key_td" style=\
                      "padding-left:'+padding+'px;\
                       font-weight:'+weight+';\
                       border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px;">'
                       +field+
                 '</td>\
                  <td class="value_td" style=\
                      "border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px">\
                  </td>\
                </tr>';
        //attributes rows
        //empty row - prettyprint - empty row
        str += '<tr>\
                  <td class="key_td" style="border-bottom:0"></td>\
                  <td class="value_td" style="border-bottom:0"></td>\
                </tr>' +
                     prettyPrintJSON(value,padding+25,"normal","0",1) +
               '<tr>\
                  <td class="key_td"></td>\
                  <td class="value_td"></td>\
               </tr>';
    } else {
        str += '<tr>\
                    <td class="key_td" style="\
                    padding-left:'+padding+'px;\
                    font-weight:'+weight+';\
                    border-bottom:'+border_bottom+';\
                    padding-top:'+padding_top_bottom+'px;\
                    padding-bottom:'+padding_top_bottom+'px">'+
                    field+
                   '</td>\
                    <td class="value_td" style="\
                       border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px">'+
                    value+
                   '</td>\
                </tr>';
    };

    return str;
}

//Add a listener to the check-all box of a datatable, enabling it to
//check and uncheck all the checkboxes of its elements.
function initCheckAllBoxes(datatable){
    //not showing nice in that position
    //$('.check_all').button({ icons: {primary : "ui-icon-check" },
    //							text : true});

    //small css hack
    $('.check_all',datatable).css({"border":"2px"});
    $('.check_all',datatable).click(function(){
        if ($(this).attr("checked")) {
            $('tbody input:checkbox',
              $(this).parents("table")).each(function(){
                  $(this).attr("checked","checked");
              });

        } else {
            $('tbody input:checkbox',
              $(this).parents("table")).each(function(){
                  $(this).removeAttr("checked");
              });
        }
        $('tbody input:checkbox',$(this).parents("table")).trigger("change");
    });
}

//standard handling for the server errors on ajax requests.
//Pops up a message with the information.
function onError(request,error_json) {
    var method;
    var action;
    var object;
    var id;
    var reason;
    var m;
    var message = error_json.error.message;

    if ( typeof onError.disabled == 'undefined' ) {
        onError.disabled=false;
    }

    //redirect to login if unauthenticated
    if (error_json.error.http_status=="401") {
        window.location.href = "login";
        onError.disabled=false;
        return false;
    };

    if (!message){
        if (!onError.disabled){
            notifyError("Cannot contact server: is it running and reachable?");
            onError.disabled=true;
        }
        return false;
    } else {
        onError.disabled=false;
    }

    //Parse known errors:
    var get_error = /^\[(\w+)\] Error getting ([\w ]+) \[(\d+)\]\.$/;
    var auth_error = /^\[(\w+)\] User \[(\d+)\] not authorized to perform action on ([\w ]+).$/;

    if (m = message.match(get_error)) {
        method  = m[1];
        action  = "Show";
        object  = m[2];
        id      = m[3];
    } else if (m = message.match(auth_error)) {
        method = m[1];
        object     = m[3];
        reason = "Unauthorized";
    }

    if (m) {
        var rows;
        var i;
        var value;
        rows = ["method","action","object","id","reason"];
        message = "";
        for (i = 0; i<rows.length; i++){
            key = rows[i];
            value = eval(key);
            if (value)
                message += "<tr><td class=\"key_error\">"+key+"</td><td>"+value+"</td></tr>";
        }
        message = "<table>" + message + "</table>";
    }

    notifyError(message);
    return true;
}

//Replaces the checkboxes of a datatable with a ajax-loading spinner.
//Used when refreshing elements of a datatable.
function waitingNodes(dataTable){
    var nodes = dataTable.fnGetData();
    for (var i=0;i<nodes.length;i++){
        dataTable.fnUpdate(spinner,i,0);
    }
};

function getUserName(uid){
    if (typeof(dataTable_users) != "undefined"){
        return getName(uid,dataTable_users);
    }
    return uid;
}

function getGroupName(gid){
    if (typeof(dataTable_groups) != "undefined"){
        return getName(gid,dataTable_groups);
    }
    return gid;
}

function getName(id,dataTable){
    var name = id;
    if (typeof(dataTable) == "undefined") {
        return name;
    }
    var nodes = dataTable.fnGetData();

    $.each(nodes,function(){
        if (id == this[1]) {
            name = this[2];
            return false;
        }
    });
    return name;
}


//Replaces all class"tip" divs with an information icon that
//displays the tip information on mouseover.
function setupTips(context){

    //For each tip in this context
    $('div.tip',context).each(function(){
        //store the text
        var tip = $(this).html();
        //replace the text with an icon and spans
        $(this).html('<span class="ui-icon ui-icon-info info_icon"></span>');
        $(this).append('<span class="tipspan"></span>');

        $(this).append('<span class="ui-icon ui-icon-alert man_icon" />');

        //add the text to .tipspan
        $('span.tipspan',this).html(tip);
        //make sure it is not floating in the wrong place
        $(this).parent().append('<div class="clear"></div>');
        //hide the text
        $('span.tipspan',this).hide();

        //When the mouse is hovering on the icon we fadein/out
        //the tip text
        $('span.info_icon',this).hover(function(e){
            var top, left;
            top = e.pageY - 15;// - $(this).parents('#create_vm_dialog').offset().top - 15;
            left = e.pageX + 15;// - $(this).parents('#create_vm_dialog').offset().left;
            $(this).next().css(
                {"top":top+"px",
                 "left":left+"px"});
            $(this).next().fadeIn();
        },function(){
            $(this).next().fadeOut();
        });
    });
}

//returns an array of ids of selected elements in a dataTable
function getSelectedNodes(dataTable){
    var selected_nodes = [];
    if (dataTable != null){
        //Which rows of the datatable are checked?
        var nodes = $('input:checked',$('tbody',dataTable));
        $.each(nodes,function(){
            selected_nodes.push($(this).val());
        });
    }
    return selected_nodes;
}

//returns a HTML string with a select input code generated from
//a dataTable
function makeSelectOptions(dataTable,
                           id_col,name_col,
                           status_col,
                           status_bad,
                           user_col){
    var nodes = dataTable.fnGetData();
    var select = '<option class="empty_value" value="">Please select</option>';
    var array;
    $.each(nodes,function(){
        var id = this[id_col];
        var name = this[name_col];
        var status;
        if (status_col >= 0) {
            status = this[status_col];
        }
        var user = user_col > 0 ? this[user_col] : false;
        var isMine = user ? (username == user) || (uid == user) : true;


        if (status_col < 0 || (status != status_bad) || isMine ){
            select +='<option value="'+id+'">'+name+'</option>';
        }
    });
    return select;
}

//Escape " in a string and return it
function escapeDoubleQuotes(string){
    string = string.replace(/\\"/g,'"');
    return string.replace(/"/g,'\\"');
}

function generateMonitoringDivs(graphs, id_prefix){
    var str = "";
    //40% of the width of the screen minus
    //129px (left menu size)
    var width = ($(window).width()-129)*42/100;
    var id_suffix="";
    var label="";

    $.each(graphs,function(){
        label = this.monitor_resources;
        id_suffix=label.replace(/,/g,'_');
        id = id_prefix+id_suffix;
        str+='<table class="info_table">\
                <thead><tr><th colspan="1">'+this.title+'</th></tr></thead>\
                <tr><td id="legend_'+id_suffix+'"></td></tr>\
                <tr><td style="border:0">\
                <div id="'+id+'" style="width:'+width+'px; height:150px;margin-bottom:10px;position:relative;left:-20px;">'+
                  spinner+
                '</div>\
              </td></tr></table>';
    });

    return str;
}

function plot_graph(data,context,id_prefix,info){
    var labels = info.monitor_resources;
    var humanize = info.humanize_figures ?
        humanize_size : function(val){ return val };
    var id_suffix = labels.replace(/,/g,'_');
    var labels_array = labels.split(',');
    var monitoring = data.monitoring
    var series = [];
    var serie;
    var mon_count = 0;

    for (var i=0; i<labels_array.length; i++) {
        serie = {
            label: labels_array[i],
            data: monitoring[labels_array[i]]
        };
        series.push(serie);
        mon_count++;
    };

    var options = {
        legend : { show : true,
                   noColumns: mon_count++,
                   container: $('#legend_'+id_suffix)
                 },
        xaxis : {
            tickFormatter: function(val,axis){
                return pretty_time_axis(val);
            },
        },
        yaxis : { labelWidth: 40,
                  tickFormatter: function(val, axis) {
                      return humanize(val);
                  }
                }
    }

    id = id_prefix + id_suffix;
    $.plot($('#'+id, context),series,options);
}

//Enables showing full information on this type of fields on
//mouse hover
function shortenedInfoFields(context){
    $('.shortened_info',context).live("mouseenter",function(e){
        var full_info = $(this).next();
        var top,left;
        top = (e.pageY-15)+"px";
        left = (e.pageX+15)+"px";
        full_info.css({"top":top,"left":left});
        full_info.fadeIn();
    });

    $('.shortened_info',context).live("mouseleave",function(e){
        $(this).next().fadeOut();
    });
}

function setupTemplateUpdateDialog(){

    //Append to DOM
    $('div#dialogs').append('<div id="template_update_dialog" title="Update template"></div>');

    //Put HTML in place
    $('#template_update_dialog').html(
        '<form action="javascript:alert(\'js error!\');">\
               <h3 style="margin-bottom:10px;">Update the template here:</h3>\
                  <fieldset style="border-top:none;">\
                        <label for="template_update_select">Select a template:</label>\
                        <select id="template_update_select" name="template_update_select"></select>\
                        <div class="clear"></div>\
                        <textarea id="template_update_textarea" style="width:100%; height:14em;">Select a template</textarea>\
                  </fieldset>\
                  <fieldset>\
                        <div class="form_buttons">\
                          <button class="button" id="template_update_button" value="">\
                          Update\
                          </button>\
                        </div>\
                  </fieldset>\
        </form>');

    $('#template_update_dialog').dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:410,
        resizable:false,
    });

    $('#template_update_dialog button').button();

    $('#template_update_dialog #template_update_select').live("change",function(){
        var id = $(this).val();
        if (id.length){
            var resource = $('#template_update_dialog #template_update_button').val();
            $('#template_update_dialog #template_update_textarea').val("Loading...");
            Sunstone.runAction(resource+".fetch_template",id);
        } else {
            $('#template_update_dialog #template_update_textarea').val("");
        }
    });

    $('#template_update_dialog #template_update_button').click(function(){
        var new_template = $('#template_update_dialog #template_update_textarea').val();
        var id = $('#template_update_dialog #template_update_select').val();
        var resource = $(this).val();
        Sunstone.runAction(resource+".update",id,new_template);
        $('#template_update_dialog').dialog('close');
        return false;
    });
}

function popUpTemplateUpdateDialog(elem_str,select_items,sel_elems){
    $('#template_update_dialog #template_update_button').val(elem_str);
    $('#template_update_dialog #template_update_select').html(select_items);
    $('#template_update_dialog #template_update_textarea').val("");

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select_items+'</select>').each(function(){
            if ($.inArray($(this).val(),sel_elems) >= 0){
                new_select+='<option value="'+$(this).val()+'">'+$(this).text()+'</option>';
            };
        });
        $('#template_update_dialog #template_update_select').html(new_select);
        if (sel_elems.length == 1) {
            $('#template_update_dialog #template_update_select option').attr("selected","selected");
            $('#template_update_dialog #template_update_select').trigger("change");
        }
    };

    $('#template_update_dialog').dialog('open');
    return false;
}

//functions that used as true and false conditions for testing mainly
function True(){
    return true;
}
function False(){
    return false;
}

function Empty(){
};
