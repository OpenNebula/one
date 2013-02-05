/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

function someTime(){ //some time under 30secs
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

// Format time for plot axis
// If show date, only date information is shown
function pretty_time_axis(time, show_date){
    var d = new Date();
    d.setTime(time*1000);

    var secs = pad(d.getSeconds(),2);
    var hour = pad(d.getHours(),2);
    var mins = pad(d.getMinutes(),2);
    var day = pad(d.getDate(),2);
    var month = pad(d.getMonth()+1,2); //getMonths returns 0-11
    var year = d.getFullYear();

    if (show_date)
        return month + "/" + day;
    else
        return hour + ":" + mins;
}

function pretty_time_runtime(time){
    var d = new Date();
    d.setTime(time*1000);

    var secs = pad(d.getUTCSeconds(),2);
    var hour = pad(d.getUTCHours(),2);
    var mins = pad(d.getUTCMinutes(),2);
    var day = d.getUTCDate()-1;
    var month = pad(d.getUTCMonth()+1,2); //getMonths returns 0-11
    var year = d.getUTCFullYear();

    return day + "d " + hour + ":" + mins;// + ":" + secs;// + "&nbsp;" + month + "/" + day;
}

//returns a human readable size in Kilo, Mega, Giga or Tera bytes
//if no from_bytes, assumes value comes in Ks
function humanize_size(value,from_bytes) {
    if (typeof(value) === "undefined") {
        value = 0;
    }
    var binarySufix = from_bytes ?
        ["", "K", "M", "G", "T" ] : ["K", "M", "G", "T" ];
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
function addElement(element,dataTable){
    dataTable.fnAddData(element);
}

//deletes an element with id 'tag' from a dataTable
function deleteElement(dataTable,tag){
    var tr = $(tag,dataTable).parents('tr')[0];
    dataTable.fnDeleteRow(tr);
    recountCheckboxes(dataTable);
}

//Handle the activation of action buttons and the check_all box
//when elements in a datatable are modified.
function recountCheckboxes(dataTable){
    var table = $('tbody',dataTable);
    var context = table.parents('form');
    var nodes = $('tr',table); //visible nodes
    var total_length = nodes.length;
    var checked_length = $('input.check_item:checked',nodes).length;
    var last_action_b = $('.last_action_button',context);

    if (checked_length) { //at least 1 element checked
        //enable action buttons
        $('.top_button, .list_button',context).button("enable");
        //check if the last_action_button should be enabled
        if (last_action_b.length && last_action_b.val().length){
            last_action_b.button("enable");
        };
        //enable checkall box
        if (total_length == checked_length){
            $('.check_all',dataTable).attr('checked','checked');
        } else {
            $('.check_all',dataTable).removeAttr('checked');
        };
    } else { //no elements cheked
        //disable action buttons, uncheck checkAll
        $('.check_all',dataTable).removeAttr('checked');
        $('.top_button, .list_button',context).button("disable");
        last_action_b.button("disable");
    };

    //any case the create dialog buttons should always be enabled.
    $('.create_dialog_button',context).button("enable");
    $('.alwaysActive',context).button("enable");
}

//Init action buttons and checkboxes listeners
function tableCheckboxesListener(dataTable){
    //Initialization - disable all buttons
    var context = dataTable.parents('form');

    $('.last_action_button',context).button("disable");
    $('.top_button, .list_button',context).button("disable");
    //These are always enabled
    $('.create_dialog_button',context).button("enable");
    $('.alwaysActive',context).button("enable");

    //listen to changes in the visible inputs
    $('tbody input.check_item',dataTable).live("change",function(){
        var datatable = $(this).parents('table');
        recountCheckboxes(datatable);
    });
}

// Updates a data_table, with a 2D array containing the new values
// Does a partial redraw, so the filter and pagination are kept
function updateView(item_list,dataTable){
    if (dataTable) {
        dataTable.fnClearTable();
        dataTable.fnAddData(item_list);
        dataTable.fnDraw(false);
    };
}

//replaces an element with id 'tag' in a dataTable with a new one
function updateSingleElement(element,dataTable,tag){
    var nodes = dataTable.fnGetNodes();
    var tr = $(tag,nodes).parents('tr')[0];
    var position = dataTable.fnGetPosition(tr);
    dataTable.fnUpdate(element,position,0,false);
    recountCheckboxes(dataTable);
}

function getElementData(id, resource_tag, dataTable){
    var nodes = dataTable.fnGetNodes();
    var tr = $(resource_tag+'_'+id,nodes).parents('tr')[0];
    return dataTable.fnGetData(tr);
}

// Returns an string in the form key=value key=value ...
// Does not explore objects in depth.
function stringJSON(json){
    var str = "";
    for (field in json) {
        str+= field + '=' + json[field] + ' ';
    };
    return str;
}

//Notifications
//Notification of submission of action
function notifySubmit(action, args, extra_param){
    var action_text = action.replace(/OpenNebula\./,'').replace(/\./,' ');

    var msg = '<h1>'+tr("Submitted")+'</h1>';
    if (!args || (typeof args == 'object' && args.constructor != Array)){

        msg += action_text;
    } else {

        msg += action_text + ": " + args;
    };
    if (extra_param && extra_param.constructor != Object) {
        msg += " >> " + extra_param;
    };

    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
}

//Notification on error
function notifyError(msg){
    msg = "<h1>"+tr("Error")+"</h1>" + msg;
    $.jGrowl(msg, {theme: "jGrowl-notify-error", position: "bottom-right", sticky: true });
}

//Standard notification
function notifyMessage(msg){
    msg = "<h1>"+tr("Info")+"</h1>" + msg;
    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
}

// Returns an HTML string with the json keys and values
// Attempts to css format output, giving different values to
// margins etc. according to depth level etc.
// See example of use in plugins.
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
                       +tr(field)+
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
                    tr(field)+
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

    //small css hack
    $('input.check_all',datatable).css({"border":"2px"});
    $('input.check_all',datatable).live("change",function(){
        var table = $(this).parents('table');
        var checked = $(this).attr('checked');
        if (checked) { //check all
            $('tbody input.check_item',table).attr('checked','checked');
        } else { //uncheck all
            $('tbody input.check_item',table).removeAttr('checked');
        };
        recountCheckboxes(table);
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
    };

    //redirect to login if unauthenticated
    if (error_json.error.http_status=="401") {
        switch (whichUI()){
        case "selfservice":
            window.location.href = "ui";
            break;
        default:
            window.location.href = "login";
        };

        onError.disabled=false;
        return false;
    };


    if (!message){
        if (!onError.disabled){
            notifyError(tr("Cannot contact server: is it running and reachable?"));
            onError.disabled=true;
        }
        return false;
    };

    if (message.match(/^Network is unreachable .+$/)){
        if (!onError.disabled){
            notifyError(tr("Network is unreachable: is OpenNebula running?"));
            onError.disabled=true;
        };
        return false;
    } else {
        onError.disabled=false;
    };


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
        reason = tr("Unauthorized");
    };

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
    };

    notifyError(message);
    return true;
}

//Replaces the checkboxes of a datatable with a ajax-loading spinner.
//Used when refreshing elements of a datatable.
function waitingNodes(dataTable){
    $('tr input.check_item:visible',dataTable).replaceWith(spinner);
}


//The following functions extract the value of a specific column
//in a dataTable. If the order of datatable columns is changed this
//should be the only place to adjust.
function getUserName(uid){
    if (typeof(dataTable_users) != "undefined"){
        return getName(uid,dataTable_users,2);
    }
    return uid;
}

function getGroupName(gid){
    if (typeof(dataTable_groups) != "undefined"){
        return getName(gid,dataTable_groups,2);
    }
    return gid;
}

function getImageName(id){
    if (typeof(dataTable_images) != "undefined"){
        return getName(id,dataTable_images,4);
    }
    return id;
};

function getClusterName(id){
    if (typeof(dataTable_clusters) != "undefined"){
        return getName(id,dataTable_clusters,2);
    }
    return id;
};

function getDatastoreName(id){
    if (typeof(dataTable_datastores) != "undefined"){
        return getName(id,dataTable_datastores,4);
    }
    return id;
};

function getVNetName(id){
    if (typeof(dataTable_vNetworks) != "undefined"){
        return getName(id,dataTable_vNetworks,4);
    }
    return id;
};

function getHostName(id){
    if (typeof(dataTable_hosts) != "undefined"){
        return getName(id,dataTable_hosts,2);
    }
    return id;
};

function getTemplateName(id){
    if (typeof(dataTable_templates) != "undefined"){
        return getName(id,dataTable_templates,4);
    }
    return id;
};

// Returns the value of the column with the resource of specified
// id in the dataTable.
function getName(id,dataTable,name_col){
    var name = id;
    if (typeof(dataTable) == "undefined") {
        return name;
    }
    var nodes = dataTable.fnGetData();

    $.each(nodes,function(){
        if (id == this[1]) {
            name = this[name_col];
            return false;
        }
    });
    return name;
};

// A more general version of the above.
// Search a datatable record matching the filter_str in the filter_col. Returns
// the value of that record in the desired value column.
function getValue(filter_str,filter_col,value_col,dataTable){
    var value="";
    if (typeof(dataTable) == "undefined") return value;

    var nodes = dataTable.fnGetData();

    $.each(nodes,function(){
        if (filter_str == this[filter_col]){
            value = this[value_col];
            return false;
        };
    });
    return value;
};

//Replaces all class"tip" divs with an information icon that
//displays the tip information on mouseover.
function setupTips(context){

    $('ui-dialog').css('z-index', '1000')
    //For each tip in this context
    $('div.tip',context).each(function(){
       // //store the text
       // var obj = $(this);
       // var tip = obj.html();
       // //replace the text with an icon and spans
       // obj.html('<span class="ui-icon ui-icon-info info_icon"></span>');
       // obj.append('<span class="tipspan"></span>');
//
       // obj.append('<span class="ui-icon ui-icon-alert man_icon" />');
//
       // //add the text to .tipspan
       // $('span.tipspan',obj).html(tip);
       // //make sure it is not floating in the wrong place
       // obj.parent().append('<div class="clear"></div>');
       // //hide the text
       // $('span.tipspan',obj).hide();
//
       // //When the mouse is hovering on the icon we fadein/out
       // //the tip text
       // $('span.info_icon',obj).hover(function(e){
       //     var icon = $(this);
       //     var top, left;
       //     top = e.pageY - 15;// - $(this).parents('#create_vm_dialog').offset().top - 15;
       //     left = e.pageX + 15;// - $(this).parents('#create_vm_dialog').offset().left;
       //     icon.next().css(
       //         {"top":top+"px",
       //          "left":left+"px"});
       //     icon.next().fadeIn();
       // },function(){
       //     $(this).next().fadeOut();
       // });
        //store the text
        var obj = $(this);
        obj.removeClass('tip');
        var tip = obj.html();
        //replace the text with an icon and spans
        console.log(tip)
        obj.html('<span class="has-tip" data-width="210" title="'+tip+'"><span class="ui-icon ui-icon-info info_icon"></span></span>');

        //obj.append('<span class="ui-icon ui-icon-alert man_icon" />');

        //add the text to .tipspan
        //$('span.has-tip',obj).html(tip);


    });
}

//returns an array of ids of selected elements in a dataTable
function getSelectedNodes(dataTable){
    var selected_nodes = [];
    if (dataTable){
        //Which rows of the datatable are checked?
        var nodes = $('tbody input.check_item:checked',dataTable);
        $.each(nodes,function(){
            selected_nodes.push($(this).val());
        });
    };
    return selected_nodes;
}

//returns a HTML string with options for
//a select input code generated from a dataTable.
//Allows filtering elements specifing status columns
//and bad status (if the values of the columns match the bad status)
//then this elem is skipped.
//no_empty_obj allows to skip adding a Please Select option
function makeSelectOptions(dataTable,
                           option_value_col,
                           option_name_col,
                           status_cols,
                           bad_status_values,
                           no_empty_opt){
    var nodes = dataTable.fnGetData();
    var select = "";
    if (!no_empty_opt)
        select = '<option class="empty_value" value="">'+tr("Please select")+'</option>';
    var array;
    for (var j=0; j<nodes.length;j++){
        var elem = nodes[j];
        var value = elem[option_value_col];

        //ASSUMPTION: elem id in column 1
        var id = elem[1];

        var name = elem[option_name_col];
        var status, bad_status;
        var ok=true;
        for (var i=0;i<status_cols.length;i++){
            status = elem[status_cols[i]];
            bad_status = bad_status_values[i];
            //if the column has a bad value, we
            //will skip this item
            if (status == bad_status){
                ok=false;
                break;
            };
        };
        if (ok){
            select +='<option elem_id="'+id+'" value="'+value+'">'+name+' (id:'+id+')</option>';
        };
    };
    return select;
}

//Escape doublequote in a string and return it
function escapeDoubleQuotes(string){
    string = string.replace(/\\"/g,'"');
    return string.replace(/"/g,'\\"');
}

//Generate the div elements in which the monitoring graphs
//will be contained. They have some elements which ids are
//determined by the graphs configuration, so when the time
//of plotting comes, we can put the data in the right place.
function generateMonitoringDivs(graphs, id_prefix, options){
    var str = "";
    //40% of the width of the screen minus
    //200px (left menu size)
    var width = ($(window).width()-200)*39/100;
    var id_suffix="";
    var label="";
    var id="";
    var omit_title = options && options.omit_title;

    $.each(graphs,function(){
        label = this.monitor_resources;
        id_suffix=label.replace(/,/g,'_');
        id_suffix=id_suffix.replace(/\//g,'_');
        id = id_prefix+id_suffix;
        str+='<table class="info_table">'+
            (!omit_title ? '<thead><tr><th colspan="1">'+this.title+'</th></tr></thead>' : '')
             + '<tr><td id="legend_'+id_suffix+'"></td></tr>\
                <tr><td style="border:0;width:100%;">\
                <div id="'+id+'" style="width:'+width+'px; height:150px;position:relative;left:0px;margin: 0 auto 10px auto">'+
                  spinner+
                '</div>\
              </td></tr></table>';
    });

    return str;
}

//Draws data for plotting. It will find the correct
//div for doing it in the context with an id
//formed by a prefix (i.e. "hosts") and a suffix
//determined by the graph configuration: "info".
function plot_graph(data,context,id_prefix,info){
    var monitoring_resources = info.monitor_resources;
    var labels  = info.labels
    var humanize = info.humanize_figures ?
        humanize_size : function(val){ return val };
    var convert_from_bytes = info.convert_from_bytes;
    var id_suffix = monitoring_resources.replace(/,/g,'_');
    id_suffix = id_suffix.replace(/\//g,'_');
    var monitoring_resources_array = monitoring_resources.split(',');

    if (labels) {
        labels_array = labels.split(',')
    }

    var monitoring = data.monitoring
    var series = [];
    var serie;
    var mon_count = 0;
    var show_date = info.show_date;

    //make sure series are painted in the order of the
    //monitoring_resources array.
    for (var i=0; i<monitoring_resources_array.length; i++) {
        serie = {
            //Turns label TEMPLATE/BLABLA into BLABLA
            label: labels ? labels_array[i] : monitoring_resources_array[i].split('/').pop(),
            data: monitoring[monitoring_resources_array[i]]
        };
        series.push(serie);
        mon_count++;
    };

    //Set options for the plots:
    // * Where the legend goes
    // * Axis options: print time and sizes correctly
    var options = {
        legend : { show : true,
                   noColumns: mon_count+1,
                   container: $('#legend_'+id_suffix)
                 },
        xaxis : {
            tickFormatter: function(val,axis){
                return pretty_time_axis(val, show_date);
            }
        },
        yaxis : { labelWidth: 40,
                  tickFormatter: function(val, axis) {
                      return humanize(val, convert_from_bytes);
                  },
                  min: 0
                }
    };

    id = id_prefix + id_suffix;
    $.plot($('#'+id, context),series,options); //call to flot lib
}

//Enables showing full information on this type of fields on
//mouse hover
//Really nice for a user with many groups. Unused.
/*
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
}*/

//Prepares the dialog used to update the template of an element.
function setupTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="template_update_dialog" title=\"'+tr("Update template")+'"></div>');
    var dialog = $('#template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(
        '<form action="javascript:alert(\'js error!\');">\
               <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the template you want to update")+':</h3>\
                  <fieldset style="border-top:none;">\
                        <label for="template_update_select">'+tr("Select a template")+':</label>\
                        <select id="template_update_select" name="template_update_select"></select>\
                        <div class="clear"></div>\
                        <textarea id="template_update_textarea" style="width:100%; height:14em;">'+tr("Select a template")+'</textarea>\
                  </fieldset>\
                  <fieldset>\
                        <div class="form_buttons">\
                          <button class="button" id="template_update_button" value="">\
                          '+tr("Update")+'\
                          </button>\
                        </div>\
                  </fieldset>\
        </form>');

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:430,
        resizable:false
    });

    $('button',dialog).button();

    $('#template_update_select',dialog).change(function(){
        var id = $(this).val();
        if (id && id.length){
            var dialog = $('#template_update_dialog');
            var resource = $('#template_update_button',dialog).val();
            $('#template_update_textarea',dialog).val("Loading...");
            Sunstone.runAction(resource+".fetch_template",id);
        } else {
            $('#template_update_textarea',dialog).val("");
        };
    });

    $('#template_update_button',dialog).click(function(){
        var dialog = $('#template_update_dialog');
        var new_template = $('#template_update_textarea',dialog).val();
        var id = $('#template_update_select',dialog).val();

        if (!id || !id.length) {
            dialog.dialog('close');
            return false;
        };

        //Workaround so deletion of templates is allowed.
        if (!new_template) new_template=" ";

        var resource = $(this).val();
        Sunstone.runAction(resource+".update",id,new_template);
        dialog.dialog('close');
        return false;
    });
}

//Pops up a dialog to update a template.
//If 1 element is selected, then this the only one shown.
//If no elements are selected, then all elements are included in the select box.
//If several elements are selected, only those are included in the select box.
function popUpTemplateUpdateDialog(elem_str,select_items,sel_elems){
    var dialog =  $('#template_update_dialog');
    $('#template_update_button',dialog).val(elem_str);
    $('#template_update_select',dialog).html(select_items);
    $('#template_update_textarea',dialog).val("");

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">'+tr("Please select")+'</option>' : "";
        $('option','<select>'+select_items+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#template_update_select option',dialog).attr('selected','selected');
            $('#template_update_select',dialog).trigger("change");
        }
    };

    dialog.dialog('open');
    return false;
}


//Shows run a custom action when clicking on rows.
function infoListener(dataTable, info_action){
    $('tbody tr',dataTable).live("click",function(e){
        if ($(e.target).is('input') ||
            $(e.target).is('select') ||
            $(e.target).is('option')) return true;

        var aData = dataTable.fnGetData(this);
        var id = $(aData[0]).val();
        if (!id) return true;

        var count = $('tbody .check_item:checked', dataTable).length;

        //If ctrl is hold down or there is already some item selected
        //then just select.
        if (info_action){
            if (e.ctrlKey || count >= 1)
                $('.check_item',this).trigger('click');
            else {
                popDialogLoading();
                Sunstone.runAction(info_action,id)
            };
        } else {
            $('.check_item',this).trigger('click');
        };

        return false;
    });
}

function mustBeAdmin(){
    return gid == 0;
}

function mustNotBeAdmin(){
    return !mustBeAdmin();
}

function users_sel(){
    return users_select;
}

function groups_sel(){
    return groups_select;
}

function hosts_sel(){
    return hosts_select;
}

function clusters_sel() {
    return clusters_select;
}

function datastores_sel() {
    return datastores_select;
}

/* Below functions to easier permission management */

function ownerUse(resource){
    return parseInt(resource.PERMISSIONS.OWNER_U);
};
function ownerManage(resource){
    return parseInt(resource.PERMISSIONS.OWNER_M);
};
function ownerAdmin(resource){
    return parseInt(resource.PERMISSIONS.OWNER_A);
};

function groupUse(resource){
    return parseInt(resource.PERMISSIONS.GROUP_U);
};
function groupManage(resource){
    return parseInt(resource.PERMISSIONS.GROUP_M);
};
function groupAdmin(resource){
    return parseInt(resource.PERMISSIONS.GROUP_A);
};

function otherUse(resource){
    return parseInt(resource.PERMISSIONS.OTHER_U);
};
function otherManage(resource){
    return parseInt(resource.PERMISSIONS.OTHER_M);
};
function otherAdmin(resource){
    return parseInt(resource.PERMISSIONS.OTHER_A);
};


function ownerPermStr(resource){
    var result = "";
    result += ownerUse(resource) ? "u" : "-";
    result += ownerManage(resource) ? "m" : "-";
    result += ownerAdmin(resource) ? "a" : "-";
    return result;
};

function groupPermStr(resource){
    var result = "";
    result += groupUse(resource) ? "u" : "-";
    result += groupManage(resource) ? "m" : "-";
    result += groupAdmin(resource) ? "a" : "-";
    return result;
};

function otherPermStr(resource){
    var result = "";
    result += otherUse(resource) ? "u" : "-";
    result += otherManage(resource) ? "m" : "-";
    result += otherAdmin(resource) ? "a" : "-";
    return result;
};

function setPermissionsTable(resource,context){
    if (ownerUse(resource))
        $('.owner_u',context).attr('checked','checked');
    if (ownerManage(resource))
        $('.owner_m',context).attr('checked','checked');
    if (ownerAdmin(resource))
        $('.owner_a',context).attr('checked','checked');
    if (groupUse(resource))
        $('.group_u',context).attr('checked','checked');
    if (groupManage(resource))
        $('.group_m',context).attr('checked','checked');
    if (groupAdmin(resource))
        $('.group_a',context).attr('checked','checked');
    if (otherUse(resource))
        $('.other_u',context).attr('checked','checked');
    if (otherManage(resource))
        $('.other_m',context).attr('checked','checked');
    if (otherAdmin(resource))
        $('.other_a',context).attr('checked','checked');
};

// Sets up a dialog to edit and update user and group quotas
// Called from user/group plugins
function setupQuotasDialog(dialog){

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 740,
        height: height
    });

    $('button',dialog).button();
    $('#vm_quota,#datastore_quota,#image_quota,#network_quota',dialog).hide();

    $('#quota_types input',dialog).click(function(){
        $('#vm_quota,#datastore_quota,#image_quota,#network_quota',dialog).hide();
        $('#'+$(this).val()+'_quota',dialog).show();
        $('#add_quota_button',dialog).show();
    })

    $('#add_quota_button',dialog).hide();

    $('#add_quota_button',dialog).click(function(){
        var sel = $('#quota_types input:checked',dialog).val();
        var fields = $('div#'+sel+'_quota input,div#'+sel+'_quota select',dialog);
        var json = {};

        for (var i = 0; i < fields.length; i++){
            var field = $(fields[i]);
            var name = field.attr('name');
            var value = field.val();
            if (name == 'ID' && !value.length){
                notifyError(tr("Please select an element"));
                return false;
            };
            if (!value) value = 0;
            json[name] = value;
        };

        json['TYPE'] = sel.toUpperCase();

        if (json['TYPE'] == "VM" &&
            $('.current_quotas table tbody tr.vm_quota', dialog).length){
            notifyError("Only 1 VM quota is allowed")
            return false;
        }


        var tr = quotaListItem(json)
        $('.current_quotas table tbody',dialog).append($(tr).hide().fadeIn());
        return false;
    });

    $('form', dialog).submit(function(){
        var obj = {};
        $('table tbody tr',this).each(function(){
            var json = JSON.parse($(this).attr('quota'));
            var type = json['TYPE'];
            delete json['TYPE'];
            obj[type.toUpperCase()] = json;
        });

        var action = $('div.form_buttons button',this).val();
        var sel_elems = SunstoneCfg["actions"][action].elements();
        Sunstone.runAction(action,sel_elems,obj);
        dialog.dialog('close');
        return false;
    });
}

function popUpQuotasDialog(dialog, resource, sel_elems){
    var im_sel = makeSelectOptions(dataTable_images,1,4,[],[]);
    var vn_sel = makeSelectOptions(dataTable_vNetworks,1,4,[],[]);
    $('#datastore_quota select',dialog).html(datastores_sel());
    $('#image_quota select',dialog).html(im_sel);
    $('#network_quota select',dialog).html(vn_sel);

    $('table tbody',dialog).empty();
    //If only one user is selected we fecth the user's quotas, otherwise we do nothing.
    if (sel_elems.length == 1){
        var id = sel_elems[0];
        Sunstone.runAction(resource + '.fetch_quotas',id);
    };

    dialog.dialog('open');
}


//Action to be performed when an edit quota icon is clicked.
function setupQuotaIcons(){
    $('.quota_edit_icon').live('click',function(){
        var dialog = $(this).parents('form');
        var tr = $(this).parents('tr');
        var quota = JSON.parse(tr.attr('quota'));
        switch (quota.TYPE){
            case "VM":
            $('div#vm_quota input[name="VMS"]',dialog).val(quota.VMS);
            $('div#vm_quota input[name="MEMORY"]',dialog).val(quota.MEMORY);
            $('div#vm_quota input[name="CPU"]',dialog).val(quota.CPU);
            break;
            case "DATASTORE":
            $('div#datastore_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#datastore_quota input[name="SIZE"]',dialog).val(quota.SIZE);
            $('div#datastore_quota input[name="IMAGES"]').val(quota.IMAGES);
            break;
            case "IMAGE":
            $('div#image_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#image_quota input[name="RVMS"]',dialog).val(quota.RVMS);
            break;
            case "NETWORK":
            $('div#network_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#network_quota input[name="LEASES"]',dialog).val(quota.LEASES);
            break;
        }
        $('div#quota_types input[value="'+quota.TYPE.toLowerCase()+'"]',dialog).trigger('click');
        tr.fadeOut(function(){$(this).remove()});
        return false;
    });
}

// Returns an object with quota information in form of list items
function parseQuotas(elem, formatter_f){
    var quotas = [];
    var results = {
        VM : "",
        DATASTORE : "",
        IMAGE : "",
        NETWORK : ""
    }
    //max 1 vm quota
    if (!$.isEmptyObject(elem.VM_QUOTA)){
        elem.VM_QUOTA.VM.TYPE = 'VM'
        quotas.push(elem.VM_QUOTA.VM)
    }

    var ds_arr = []
    if ($.isArray(elem.DATASTORE_QUOTA.DATASTORE)){
        ds_arr = elem.DATASTORE_QUOTA.DATASTORE
    } else if (!$.isEmptyObject(elem.DATASTORE_QUOTA)){
        ds_arr = [elem.DATASTORE_QUOTA.DATASTORE]
    }

    for (var i = 0; i < ds_arr.length; i++){
        ds_arr[i].TYPE = 'DATASTORE';
        quotas.push(ds_arr[i]);
    }

    var im_arr = []
    if ($.isArray(elem.IMAGE_QUOTA.IMAGE)){
        im_arr = elem.IMAGE_QUOTA.IMAGE
    } else if (!$.isEmptyObject(elem.IMAGE_QUOTA)){
        im_arr = [elem.IMAGE_QUOTA.IMAGE]
    }

    for (var i = 0; i < im_arr.length; i++){
        im_arr[i].TYPE = 'IMAGE';
        quotas.push(im_arr[i]);
    }

    var vn_arr = []
    if ($.isArray(elem.NETWORK_QUOTA)){
        vn_arr = elem.NETWORK_QUOTA.NETWORK
    } else if (!$.isEmptyObject(elem.NETWORK_QUOTA)){
        vn_arr = [elem.NETWORK_QUOTA.NETWORK]
    }

    for (var i = 0; i < vn_arr.length; i++){
        vn_arr[i].TYPE = 'NETWORK';
        quotas.push(vn_arr[i]);
    }

    for (var i = 0; i < quotas.length; i++){
        var tr = formatter_f(quotas[i]);
        results[quotas[i].TYPE] += tr;
    }
    return results;
}

//Receives a quota json object. Returns a nice string out of it.
function quotaListItem(quota_json){
    var value = JSON.stringify(quota_json)
    var str = '<tr quota=\''+value+'\' ';

    if (quota_json.TYPE == "VM")
        str += ' class="vm_quota" ';

    str += '><td>'+
        quota_json.TYPE+
        '</td><td style="width:100%;"><pre style="margin:0;">';
    switch(quota_json.TYPE){
    case "VM":
        str +=  'VMs: ' + quota_json.VMS + (quota_json.VMS_USED ? ' (' + quota_json.VMS_USED + '). ' : ". ") +
               'Memory: ' + quota_json.MEMORY + (quota_json.MEMORY_USED ? ' MB (' + quota_json.MEMORY_USED + ' MB). ' : " MB. ") +
               'CPU: ' + quota_json.CPU +  (quota_json.CPU_USED ? ' (' + quota_json.CPU_USED + '). ' : ". ");
        break;
    case "DATASTORE":
        str +=  'ID/Name: ' + getDatastoreName(quota_json.ID) + '. ' +
               'Size: ' + quota_json.SIZE +  (quota_json.SIZE_USED ? ' MB (' + quota_json.SIZE_USED + ' MB). ' : " MB. ") +
               'Images: ' + quota_json.IMAGES +  (quota_json.IMAGES_USED ? ' (' + quota_json.IMAGES_USED + '). ' : ".");
        break;
    case "IMAGE":
        str +=  'ID/Name: ' + getImageName(quota_json.ID) + '. ' +
               'RVMs: ' + quota_json.RVMS +  (quota_json.RVMS_USED ? ' (' + quota_json.RVMS_USED + '). ' : ". ");
        break;
    case "NETWORK":
        str +=  'ID/Name: ' + getVNetName(quota_json.ID) + '. ' +
               'Leases: ' + quota_json.LEASES +  (quota_json.LEASES_USED ? ' (' + quota_json.LEASES_USED + '). ': ". ");
        break;
    }
    str += '</td><td><button class="quota_edit_icon"><i class="icon-pencil"></i></button></pre></td></tr>';
    return str;
}

/* Returns the code of a jquery progress bar
   Options: object with width, height, label and fontSize as keys
*/
function progressBar(value, opts){
    if (value > 100) value = 100;

    if (!opts) opts = {};

    if (!opts.width) opts.width = 'auto';

    if (!opts.label) opts.label = "";

    if (!opts.height) opts.height = '10px';

    if (!opts.fontSize) opts.fontSize = '0.6em';

    if (!opts.labelVPos) opts.labelVPos = '-4px';

    if (!opts.labelHPos) opts.labelHPos = '90px';

    return '<div style="height:'+opts.height+';width:'+opts.width+';position:relative" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'">\
            <span style="position:absolute;width: 100%; text-align: center;font-weight:normal;font-size:'+opts.fontSize+';">'+opts.label+'</span>\
           <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+value+'%;"/>\
         </div>';
}

function loadAccounting(resource, id, graphs, options){
    var secs_in_day = 3600 * 24;
    var now = Math.floor(new Date().getTime() / 1000)
    var start = options && options.start ? options.start : now - secs_in_day;
    var end = options && options.end ? options.end : now;
    var interval;
    if (options && options.interval){
        interval = options.interval;
    } else {
        //If we are asking more than one interval is one day, otherwise 1 hour
        interval = (end - start) > secs_in_day ? secs_in_day : 3600;
    }

    for (var i = 0; i < graphs.length; i++){
        var graph_cfg = graphs[i];
        graph_cfg.start =  start
        graph_cfg.end = end
        graph_cfg.interval = interval
        // If the date range is longer than 24 hours, then show only
        // date, otherwise show time in the x axis
        graph_cfg.show_date = (end - start) > (3600 * 24)? true : false;
        Sunstone.runAction(resource+".accounting", id, graph_cfg);
    };
}


function insert_extended_template_table(template_json,resource_type,resource_id)
{
    console.log(template_json);
    var str = '<table id="'+resource_type.toLowerCase()+'_template_table" class="info_table">\
                 <thead>\
                   <tr>\
                     <th colspan="2">' +
                      tr("Extended Template") +
                     '</th>\
                   </tr>\
                  </thead>\
                  <tr>\
                    <td class="key_td"><input type="text" name="new_key" id="new_key" /></td>\
                    <td class="value_td"><input type="text" name="new_value" id="new_value" /></td>\
                    <td class=""><button id="button_add_value">'+tr("Add")+'</button>\</td>\
                  </tr>' + fromJSONtoHTMLTable(template_json,
                                               resource_type,
                                               resource_id) +
                 '</table>'

    // Remove previous listeners
    $("#new_key").die();
    $("#new_value").die();
    $("#div_minus").die();
    $("#div_edit").die();
    $(".input_edit_value").die();
    $("#button_add_value").die();

    // Add listener for add key and add value for Extended Template
    $('#button_add_value').live("click", function() {
        if ( $('#new_value').val() != "" && $('#new_key').val() != "" )
        {
            template_json[$('#new_key').val()] = $('#new_value').val();

            var template_str = "";
            for(var key in template_json)
                template_str=template_str+key+"="+ template_json[key]+"\n";

            Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
        }
    });

    $('#new_value').live("keypress", function(e) {
          var ev = e || window.event;
          var key = ev.keyCode;

          if (key == 13)
          {
             //Get the button the user wants to have clicked
             $('#button_add_value').click();
             ev.preventDefault();
          }
    })

    // Listener for key,value pair remove action
    $("#div_minus").live("click", function() {
        // Remove div_minus_ from the id
        field=this.firstElementChild.id.substring(10,this.firstElementChild.id.length);
        // Erase the value from the template
        delete template_json[tr(field)];

        // Convert from hash to string
        var template_str = "\n";
        for(var key in template_json)
            template_str=template_str+key+"="+ template_json[key]+"\n";

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
    });

    // Listener for key,value pair edit action
    $("#div_edit").live("click", function() {
        var key_str=this.firstElementChild.id.substring(9,this.firstElementChild.id.length);

        var value_str = $("#value_td_input_"+key_str).text();
        $("#value_td_input_"+key_str).html('<input class="input_edit_value" id="input_edit_'+key_str+'" type="text" value="'+value_str+'"/>');

    });


     $(".input_edit_value").live("change", function() {
        var key_str   = this.id.substring(11,this.id.length);
        var value_str = this.value;

        delete template_json[key_str];
        template_json[key_str]=value_str;

        // Convert from hash to string
        var template_str = "\n";
        for(var key in template_json)
            template_str=template_str+key+"=\""+ template_json[key]+"\"\n";

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
    });

    return str;
}

// Returns an HTML string with the json keys and values
function fromJSONtoHTMLTable(template_json,resource_type,resource_id,vectorial){
    var str = ""
    if (!template_json){ return "Not defined";}
    var field = null;

    // Iterate for each value in the JSON object
    for (field in template_json)
    {
        str += fromJSONtoHTMLRow(field,
                                 template_json[field],
                                 resource_type,
                                 resource_id,
                                 vectorial);
    }

    return str;
}


// Helper for fromJSONtoHTMLTable function
function fromJSONtoHTMLRow(field,value,resource_type,resource_id, vectorial){
    var str = "";

    // value can be an array
    if (value.constructor == Array)
    {
        var it=null;

        for (it = 0; it < value.length; ++it)
        {
           var current_value = value[it];

           // if value is object, we are dealing with a vectorial value
           if (typeof current_value == 'object')
           {
               if (it==0)
               {
                   // if it is the first occurrence, print the header
                   str += '<tr id="'+resource_type.toLowerCase()+'_template_table_'+tr(field)+'">\
                               <td class="key_td key_vectorial_td">'+tr(field)+'</td>\
                               <td class="value_vectorial_td"></td>\
                               <td>\
                                  <div id="div_edit">\
                                     <a id="div_edit_vectorial_'+tr(field)+'" class="edit_vectorial_e" href="#">e</a>\
                                  </div>\
                               </td>\
                               <td>\
                                 <div id="div_minus">\
                                    <a id="div_minus_vectorial_'+tr(field)+'" class="remove_vectorial_x" href="#">x</a>\
                                 </div>\
                               </td>'
               }

               str += fromJSONtoHTMLTable(current_value,
                                          resource_type,
                                          resource_id,
                                          true);
           }
           else
           {
               str += fromJSONtoHTMLRow(field,
                                        current_value,
                                        resource_type,
                                        resource_id,
                                        false);
           }
        }
    }
    else // or value can be a string
    {
        var align_str       = "";
        var key_class_str   = "";
        var value_class_str = "";

        if(vectorial)
        {
            align_str="text-align:center";
            key_class_str=" key_vectorial_td";
            value_class_str=" value_vectorial_td";
        }

        str += '<tr>\
                  <td class="key_td'+key_class_str+'" style="'+align_str+'">'+tr(field)+'</td>\
                  <td class="value_td'+value_class_str+'" id="value_td_input_'+tr(field)+'">'+value+'</td>';

        if (vectorial)
        {
            str += '<td></td><td></td></tr>'
        }
        else
        {
            str += '<td>\
                     <div id="div_edit">\
                       <a id="div_edit_'+tr(field)+'" class="edit_e" href="#">e</a>\
                     </div>\
                    </td>\
                    <td>\
                          <div id="div_minus">\
                             <a id="div_minus_'+tr(field)+'" class="remove_x" href="#">x</a>\
                          </div>\
                    </td>\
                   </tr>';
        }

    }


    return str;
}

//Returns an octet given a permission table with checkboxes
function buildOctet(permTable){
    var owner=0;
    var group=0;
    var other=0;

    if ($('.owner_u',permTable).is(':checked'))
        owner+=4;
    if ($('.owner_m',permTable).is(':checked'))
        owner+=2;
    if ($('.owner_a',permTable).is(':checked'))
        owner+=1;

    if ($('.group_u',permTable).is(':checked'))
        group+=4;
    if ($('.group_m',permTable).is(':checked'))
        group+=2;
    if ($('.group_a',permTable).is(':checked'))
        group+=1;

    if ($('.other_u',permTable).is(':checked'))
        other+=4;
    if ($('.other_m',permTable).is(':checked'))
        other+=2;
    if ($('.other_a',permTable).is(':checked'))
        other+=1;

    return ""+owner+group+other;
};


// Returns HTML with listeners to control permissions
function insert_permissions_table(resource_type,resource_id, owner, group, vm_uid, vm_gid){
     var str ='<table class="'+resource_type.toLowerCase()+'_permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" class="permission_check other_a" /></td>\
                     </tr>'

     if (mustBeAdmin())
     {
        str += '<tr><td style="width:130px">'+tr("Ownership")+'</td>\</tr>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td></td>\
                         <td id="value_td_owner">'+owner+'</td>\
                          <td><div id="div_edit_chg_owner">\
                                 <a id="div_edit_chg_owner_link" class="edit_e" href="#">e</a>\
                              </div>\
                          </td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td></td>\
                         <td id="value_td_group">'+group+'</td>\
                          <td><div id="div_edit_chg_group">\
                                 <a id="div_edit_chg_group_link" class="edit_e" href="#">e</a>\
                              </div>\
                          </td>\
                     </tr>\
                   </table>'

        // Handlers for chown
        $("#div_edit_chg_owner_link").die();
        $("#user_confirm_select").die();

        // Listener for key,value pair edit action
        $("#div_edit_chg_owner_link").live("click", function() {
            var value_str = $("#value_td_owner").text();
            var select_str='<select style="margin: 10px 0;" id="user_confirm_select">';
            select_str += makeSelectOptions(dataTable_users,1,2,[],[],true);
            select_str+="</select>";
            $("#value_td_owner").html(select_str);
            $("select#user_confirm_select").val(vm_uid);
        });

        $("#user_confirm_select").live("change", function() {
            var value_str = $('select#user_confirm_select').val();
            if(value_str!="")
            {
                // Let OpenNebula know
                Sunstone.runAction(resource_type+".chown",resource_id,value_str);
            }
        });

        // Handlers for chgrp
        $("#div_edit_chg_group_link").die();
        $("#group_confirm_select").die();

        // Listener for key,value pair edit action
        $("#div_edit_chg_group_link").live("click", function() {
            var value_str = $("#value_td_group").text();
            var select_str='<select style="margin: 10px 0;" id="group_confirm_select">';
            select_str += makeSelectOptions(dataTable_groups,1,2,[],[],true);
            select_str+="</select>";
            $("#value_td_group").html(select_str);
            $("select#group_confirm_select").val(vm_gid);
        });

        $("#group_confirm_select").live("change", function() {
            var value_str = $('select#group_confirm_select').val();
            if(value_str!="")
            {
                // Let OpenNebula know
                Sunstone.runAction(resource_type+".chgrp",resource_id,value_str);
            }
        });
    }

    $(".permission_check").die();
    $(".permission_check").live('change',function(){
        var permissions_table  = $("."+resource_type.toLowerCase()+"_permissions_table");
        var permissions_octect = { octet : buildOctet(permissions_table) };

        Sunstone.runAction(resource_type+".chmod",resource_id,permissions_octect);
    });

    return str;

}



/*
 * jQuery Foundation Tooltips 2.0.2
 * http://foundation.zurb.com
 * Copyright 2012, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, undefined) {
  'use strict';
  
  var settings = {
      bodyHeight : 0,
      selector : '.has-tip',
      additionalInheritableClasses : [],
      tooltipClass : '.tooltip',
      tipTemplate : function (selector, content) {
        return '<span data-selector="' + selector + '" class="' + settings.tooltipClass.substring(1) + '">' + content + '<span class="nub"></span></span>';
      }
    },
    methods = {
      init : function (options) {
        settings = $.extend(settings, options);

        // alias the old targetClass option
        settings.selector = settings.targetClass ? settings.targetClass : settings.selector;

        return this.each(function () {
          var $body = $('body');


            $body.on('mouseenter.tooltip mouseleave.tooltip', settings.selector, function (e) {
              var $this = $(this);

              if (e.type === 'mouseenter') {
                methods.showOrCreateTip($this);
              } else if (e.type === 'mouseleave') {
                methods.hide($this);
              }
            });

          $(this).data('tooltips', true);

        });
      },
      showOrCreateTip : function ($target, content) {
        var $tip = methods.getTip($target);

        if ($tip && $tip.length > 0) {
          methods.show($target);
        } else {
          methods.create($target, content);
        }
      },
      getTip : function ($target) {
        var selector = methods.selector($target),
          tip = null;

        if (selector) {
          tip = $('span[data-selector=' + selector + ']' + settings.tooltipClass);
        }
        return (tip.length > 0) ? tip : false;
      },
      selector : function ($target) {
        var id = $target.attr('id'),
          dataSelector = $target.data('selector');

        if (id === undefined && dataSelector === undefined) {
          dataSelector = 'tooltip' + Math.random().toString(36).substring(7);
          $target.attr('data-selector', dataSelector);
        }
        return (id) ? id : dataSelector;
      },
      create : function ($target, content) {
        var $tip = $(settings.tipTemplate(methods.selector($target),
          $('<div>').html(content ? content : $target.attr('title')).html())),
          classes = methods.inheritable_classes($target);

        $tip.addClass(classes).appendTo('body');
        $target.removeAttr('title');
        methods.show($target);
      },
      reposition : function (target, tip, classes) {
        var width, nub, nubHeight, nubWidth, column, objPos;

        tip.css('visibility', 'hidden').show();

        width = target.data('width');
        nub = tip.children('.nub');
        nubHeight = nub.outerHeight();
        nubWidth = nub.outerWidth();

        objPos = function (obj, top, right, bottom, left, width) {
          return obj.css({
            'top' : top,
            'bottom' : bottom,
            'left' : left,
            'right' : right,
            'max-width' : (width) ? width : 'auto'
          }).end();
        };

        objPos(tip, (target.offset().top + target.outerHeight() + 10), 'auto', 'auto', target.offset().left, width);
        objPos(nub, -nubHeight, 'auto', 'auto', 10);

        if ($(window).width() < 767) {
          column = target.closest('.columns');

          if (column.length < 0) {
            // if not using Foundation
            column = $('body');
          }
          tip.width(column.outerWidth() - 25).css('left', 15).addClass('tip-override');
          objPos(nub, -nubHeight, 'auto', 'auto', target.offset().left);
        } else {
          if (classes && classes.indexOf('tip-top') > -1) {
            objPos(tip, (target.offset().top - tip.outerHeight() - nubHeight), 'auto', 'auto', target.offset().left, width)
              .removeClass('tip-override');
            objPos(nub, 'auto', 'auto', -nubHeight, 'auto');
          } else if (classes && classes.indexOf('tip-left') > -1) {
            objPos(tip, (target.offset().top + (target.outerHeight() / 2) - nubHeight), 'auto', 'auto', (target.offset().left - tip.outerWidth() - 10), width)
              .removeClass('tip-override');
            objPos(nub, (tip.outerHeight() / 2) - (nubHeight / 2), -nubHeight, 'auto', 'auto');
          } else if (classes && classes.indexOf('tip-right') > -1) {
            objPos(tip, (target.offset().top + (target.outerHeight() / 2) - nubHeight), 'auto', 'auto', (target.offset().left + target.outerWidth() + 10), width)
              .removeClass('tip-override');
            objPos(nub, (tip.outerHeight() / 2) - (nubHeight / 2), 'auto', 'auto', -nubHeight);
          } else if (classes && classes.indexOf('tip-centered-top') > -1) {
            objPos(tip, (target.offset().top - tip.outerHeight() - nubHeight), 'auto', 'auto', (target.offset().left + ((target.outerWidth() - tip.outerWidth()) / 2) ), width)
              .removeClass('tip-override');
            objPos(nub, 'auto', ((tip.outerWidth() / 2) -(nubHeight / 2)), -nubHeight, 'auto');
          } else if (classes && classes.indexOf('tip-centered-bottom') > -1) {
            objPos(tip, (target.offset().top + target.outerHeight() + 10), 'auto', 'auto', (target.offset().left + ((target.outerWidth() - tip.outerWidth()) / 2) ), width)
              .removeClass('tip-override');
            objPos(nub, -nubHeight, ((tip.outerWidth() / 2) -(nubHeight / 2)), 'auto', 'auto');
          }
        }
        tip.css('visibility', 'visible').hide();
      },
      inheritable_classes : function (target) {
        var inheritables = ['tip-top', 'tip-left', 'tip-bottom', 'tip-right', 'tip-centered-top', 'tip-centered-bottom', 'noradius'].concat(settings.additionalInheritableClasses),
          classes = target.attr('class'),
          filtered = classes ? $.map(classes.split(' '), function (el, i) {
              if ($.inArray(el, inheritables) !== -1) {
                return el;
              }
          }).join(' ') : '';
          
        return $.trim(filtered);
      },
      show : function ($target) {
        var $tip = methods.getTip($target);

        methods.reposition($target, $tip, $target.attr('class'));
        $tip.fadeIn(150);
      },
      hide : function ($target) {
        var $tip = methods.getTip($target);

        $tip.fadeOut(150);
      },
      reload : function () {
        var $self = $(this);

        return ($self.data('tooltips')) ? $self.foundationTooltips('destroy').foundationTooltips('init') : $self.foundationTooltips('init');
      },
      destroy : function () {
        return this.each(function () {
          $(window).off('.tooltip');
          $(settings.selector).off('.tooltip');
          $(settings.tooltipClass).each(function (i) {
            $($(settings.selector).get(i)).attr('title', $(this).text());
          }).remove();
        });
      }
    };

  $.fn.foundationTooltips = function (method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.foundationTooltips');
    }
  };
}(jQuery, this));

;(function ($, window, undefined) {
  'use strict';
  
  $.fn.foundationAlerts = function (options) {
    var settings = $.extend({
      callback: $.noop
    }, options);
    
    $(document).on("click", ".alert-box a.close", function (e) {
      e.preventDefault();
      $(this).closest(".alert-box").fadeOut(function () {
        $(this).remove();
        // Do something else after the alert closes
        settings.callback();
      });
    });
    
  };

})(jQuery, this);
