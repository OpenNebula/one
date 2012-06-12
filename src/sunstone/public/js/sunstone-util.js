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
// See exapmle of use in plugins.
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
    var nodes = dataTable.fnGetData();
    for (var i=0;i<nodes.length;i++){
        dataTable.fnUpdate(spinner,i,0);
    };
}

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

//Search a datatable record matching the filter_str in the filter_col. Returns
//the value of that record in the desired value column.
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

    //For each tip in this context
    $('div.tip',context).each(function(){
        //store the text
        var obj = $(this);
        var tip = obj.html();
        //replace the text with an icon and spans
        obj.html('<span class="ui-icon ui-icon-info info_icon"></span>');
        obj.append('<span class="tipspan"></span>');

        obj.append('<span class="ui-icon ui-icon-alert man_icon" />');

        //add the text to .tipspan
        $('span.tipspan',obj).html(tip);
        //make sure it is not floating in the wrong place
        obj.parent().append('<div class="clear"></div>');
        //hide the text
        $('span.tipspan',obj).hide();

        //When the mouse is hovering on the icon we fadein/out
        //the tip text
        $('span.info_icon',obj).hover(function(e){
            var icon = $(this);
            var top, left;
            top = e.pageY - 15;// - $(this).parents('#create_vm_dialog').offset().top - 15;
            left = e.pageX + 15;// - $(this).parents('#create_vm_dialog').offset().left;
            icon.next().css(
                {"top":top+"px",
                 "left":left+"px"});
            icon.next().fadeIn();
        },function(){
            $(this).next().fadeOut();
        });
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

//returns a HTML string with a select input code generated from
//a dataTable. Allows filtering elements.
function makeSelectOptions(dataTable,
                           id_col,name_col,
                           status_cols,
                           bad_status_values,no_empty_opt){
    var nodes = dataTable.fnGetData();
    var select = "";
    if (!no_empty_opt)
        select = '<option class="empty_value" value="">'+tr("Please select")+'</option>';
    var array;
    for (var j=0; j<nodes.length;j++){
        var elem = nodes[j];
        var id = elem[id_col];
        var name = elem[name_col];
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
            select +='<option value="'+id+'">'+name+'</option>';
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
function generateMonitoringDivs(graphs, id_prefix){
    var str = "";
    //43% of the width of the screen minus
    //129px (left menu size)
    var width = ($(window).width()-129)*40/100;
    var id_suffix="";
    var label="";
    var id="";

    $.each(graphs,function(){
        label = this.monitor_resources;
        id_suffix=label.replace(/,/g,'_');
        id_suffix=id_suffix.replace(/\//g,'_');
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

//Draws data for plotting. It will find the correct
//div for doing it in the context with an id
//formed by a prefix (i.e. "hosts") and a suffix
//determined by the graph configuration: "info".
function plot_graph(data,context,id_prefix,info){
    var labels = info.monitor_resources;
    var humanize = info.humanize_figures ?
        humanize_size : function(val){ return val };
    var id_suffix = labels.replace(/,/g,'_');
    id_suffix = id_suffix.replace(/\//g,'_');
    var labels_array = labels.split(',');
    var monitoring = data.monitoring
    var series = [];
    var serie;
    var mon_count = 0;

    //make sure series are painted in the order of the
    //labels array.
    for (var i=0; i<labels_array.length; i++) {
        serie = {
            label: labels_array[i],
            data: monitoring[labels_array[i]]
        };
        series.push(serie);
        mon_count++;
    };

    //Set options for the plots:
    // * Where the legend goes
    // * Axis options: print time and sizes correctly
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
        height:410,
        resizable:false,
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
        if ($(e.target).is('input')) {return true;}

        var aData = dataTable.fnGetData(this);
        var id = $(aData[0]).val();
        if (!id) return true;

        var count = $('tbody .check_item:checked', dataTable).length;

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