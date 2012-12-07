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

/* ---------------- Cluster tab plugin ---------------- */

/* ------------ Cluster creation dialog ------------ */

var host_datatable_table_tmpl='<thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
          <th>' + tr("ID") + '</th>\
          <th>' + tr("Name") + '</th>\
          <th>' + tr("Cluster") + '</th>\
          <th>' + tr("Running VMs") + '</th>\
          <th>' + tr("Real CPU") + '</th>\
          <th>' + tr("Allocated CPU") + '</th>\
          <th>' + tr("Real MEM") + '</th>\
          <th>' + tr("Allocated MEM") + '</th>\
          <th>' + tr("Status") + '</th>\
          <th>' + tr("IM MAD") + '</th>\
          <th>' + tr("VM MAD") + '</th>\
          <th>' + tr("Last monitored on") + '</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyhosts">\
      </tbody>'

var vnet_datatable_table_tmpl='<thead>\
      <tr>\
        <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
        <th>'+tr("ID")+'</th>\
        <th>'+tr("Owner")+'</th>\
        <th>'+tr("Group")+'</th>\
        <th>'+tr("Name")+'</th>\
        <th>'+tr("Cluster")+'</th>\
        <th>'+tr("Type")+'</th>\
        <th>'+tr("Bridge")+'</th>\
        <th>'+tr("Total Leases")+'</th>\
      </tr>\
    </thead>\
    <tbody id="tbodyvnetworks">\
    </tbody>'

var datastore_datatable_table_tmpl='<thead>\
      <tr>\
        <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
        <th>'+tr("ID")+'</th>\
        <th>'+tr("Owner")+'</th>\
        <th>'+tr("Group")+'</th>\
        <th>'+tr("Name")+'</th>\
        <th>'+tr("Cluster")+'</th>\
        <th>'+tr("Basepath")+'</th>\
        <th>'+tr("TM MAD")+'</th>\
        <th>'+tr("DS MAD")+'</th>\
        <th>'+tr("System")+'</th>\
      </tr>\
    </thead>\
    <tbody id="tbodydatastores">\
    </tbody>'


var create_cluster_tmpl ='<div id="cluster_create_tabs">\
  <fieldset>\
  <label for="name">' + tr("Name") + ':</label><input type="text" name="name" id="name" />\
  </fieldset>\
    <ul>\
        <li><a href="#tab-hosts">'+tr("HOSTs")+'</a></li>\
        <li><a href="#tab-vnets">'+tr("VIRTUAL NETWORKs")+'</a></li>\
        <li><a href="#tab-datastores">'+tr("DATASTOREs")+'</a></li>\
    </ul>\
    <div id="tab-hosts">\
    <fieldset>\
      <div id="datatable_cluster_hosts_div">\
            <h3>' +
            tr("Select Hosts for this Cluster") +
            '<button id="refresh_host_table_button_class" class="icon-refresh action_button" value="ClusterHost.list" style="float:right;"></h3>\
            <hr>\
            <table id="datatable_cluster_hosts" class="display">' + host_datatable_table_tmpl + '</table></div>\
      <div id="selected_hosts_div"></div>\
    </fieldset>\
              <div class="form_buttons">\
                <button class="button" type="" value="" id="tf_btn_hosts_next">'+tr("VIRTUAL NETWORKs >")+'</button>\
              </div>\
    </div>\
    <div id="tab-vnets">\
    <fieldset>\
      <div id="datatable_cluster_vnets_div">\
            <h3>' +
            tr("Select Virtual Networks for this Cluster") +
            '<button id="refresh_vnet_table_button_class" class="icon-refresh action_button" value="ClusterVN.list" style="float:right;"></h3>\
            <hr>\
            <table id="datatable_cluster_vnets" class="display">' + vnet_datatable_table_tmpl + '</table></div>\
      <div id="selected_vnets_div"></div>\
    </fieldset>\
              <div class="form_buttons">\
                <button class="button" type="" value="" id="tf_btn_vnets_back">'+tr("< HOSTs")+'</button>\
              </div>\
              <div class="form_buttons">\
                <button class="button" type="" value="" id="tf_btn_vnets_next">'+tr("DATASTOREs >")+'</button>\
              </div>\
    </div>\
    <div id="tab-datastores">\
    <fieldset>\
      <div id="datatable_cluster_datastores_div">\
            <h3>' +
            tr("Select Datastores for this Xluster") +
            '<button id="refresh_datastore_table_button_class" class="icon-refresh action_button" value="ClusterDS.list" style="float:right;"></h3>\
            <hr>\
            <table id="datatable_cluster_datastores" class="display">' + datastore_datatable_table_tmpl + '</table></div>\
      <div id="selected_datastores_div"></div>\
    </fieldset>\
              <div class="form_buttons">\
                <button class="button" type="" value="" id="tf_btn_datastores_back">'+tr("< VIRTUAL NETWORKS")+'</button>\
              </div>\
    </div>\
  <fieldset>\
    <div class="form_buttons">\
        <button class="button" type="submit" id="create_cluster_submit" value="OpenNebula.Cluster.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button>\
    </div>\
  </fieldset>\
</div>';

// Common utils for datatatables
  // Holds the selected items
var host_list_for_cluster_creation={};
var vnet_list_for_cluster_creation={};
var datastore_list_for_cluster_creation={};


var host_row_hash={};
var vnet_row_hash={};
var datastore_row_hash={};

// Prepares the cluster creation dialog
function setupCreateClusterDialog(){

    dialogs_context.append('<div title=\"'+tr("Create cluster")+'\" id="create_cluster_dialog"></div>');
    $create_cluster_dialog = $('div#create_cluster_dialog');
    var dialog = $create_cluster_dialog;

    dialog.html(create_cluster_tmpl);
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    dialog.dialog({
        autoOpen: false,
        modal: true,
        height: height,
        width: 'auto'//400
    });

    //Enable tabs
    $('#cluster_create_tabs',dialog).tabs({});

    //  ------- Create the dialog datatables ------------
    dataTable_cluster_hosts = $("#datatable_cluster_hosts", dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": { //exclude checkbox column
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,4] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [9,3,10,11,12] },
            { "sWidth": "150", "aTargets": [5,6,7,8] },
            { "bVisible": false, "aTargets": [0,3,5,6,7,8,10,11,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it
    dataTable_cluster_hosts.fnClearTable();

    dataTable_cluster_hosts.fnFilter( "-", 3); // Only show no assigned resources
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_hosts);

    dataTable_cluster_vnets = $("#datatable_cluster_vnets", dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,6,7,8] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [2,3,5] },
            { "bVisible": false, "aTargets": [0,5,7]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    //preload it
    dataTable_cluster_vnets.fnClearTable();
    dataTable_cluster_vnets.fnFilter( "-", 5); // Only show no assigned resources
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_vnets);

    dataTable_cluster_datastores = $("#datatable_cluster_datastores", dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,9] },
            { "sWidth": "100px", "aTargets": [2,3,5,7,8] },
            { "bVisible": false, "aTargets": [0,5,6,7,8,9] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    //preload it
    dataTable_cluster_datastores.fnClearTable();
    dataTable_cluster_datastores.fnFilter( "-", 5); // Only show no assigned resources
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_datastores);

    //  ------- End of create the dialog datatables ------------

    // Add listener to row select action
    //   Marks it in another background color
    //   Adds or removes the element from the list

    $('#datatable_cluster_hosts', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_cluster_hosts.fnGetData(this);
          var host_id = aData[1];

          if(!$("td:first", this).hasClass('markrow'))
          {
            host_list_for_cluster_creation[host_id]=1;
            host_row_hash[host_id]=this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            $('div#selected_hosts_div', dialog).append('<span id="tag_host_'+aData[1]+'"><span class="ui-icon ui-icon-close"></span>'+aData[2]+'</span>');
          }
          else
          {
            host_list_for_cluster_creation[host_id]=0;
            $("td:first", this).parent().children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_hosts_div span#tag_host_'+host_id, dialog).remove();
          }

          return false;
      });


    $('#datatable_cluster_vnets', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_cluster_vnets.fnGetData(this);
          var vnet_id = aData[1];
          var name    = aData[4];

          if(!$("td:first", this).hasClass('markrow'))
          {
            vnet_list_for_cluster_creation[vnet_id]=1;
            vnet_row_hash[vnet_id]=this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            $('div#selected_vnets_div', dialog).append('<span id="tag_vnet_'+vnet_id+'"><span class="ui-icon ui-icon-close"></span>'+name+'</span>');
          }
          else
          {
            vnet_list_for_cluster_creation[vnet_id]=0;
            $("td:first", this).parent().children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_vnets_div span#tag_vnet_'+vnet_id, dialog).remove();
          }

          return false;
      });


      $('#datatable_cluster_datastores', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData = dataTable_cluster_datastores.fnGetData(this);
          var ds_id = aData[1];
          var name  = aData[4];

          if(!$("td:first", this).hasClass('markrow'))
          {
            datastore_list_for_cluster_creation[ds_id]=1;
            datastore_row_hash[ds_id]=this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            $('div#selected_datastores_div', dialog).append('<span id="tag_datastore_'+ds_id+'"><span class="ui-icon ui-icon-close"></span>'+name+'</span>');
          }
          else
          {
            datastore_list_for_cluster_creation[ds_id]=0;
            $("td:first", this).parent().children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_datastores_div span#tag_datastore_'+ds_id, dialog).remove();
          }

          return false;
      });


      $( "#cluster_create_tabs span.ui-icon-close" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         if (id.match(/host/g))
         {
              var host_id=id.substring(9,id.length);
              host_list_for_cluster_creation[host_id]=0;
              $("td:first", host_row_hash[host_id]).parent().children().each(function(){$(this).removeClass('markrow');});
         }
         else if (id.match(/vnet/g))
         {
              var vnet_id=id.substring(9,id.length);
              vnet_list_for_cluster_creation[vnet_id]=0;
              $("td:first", vnet_row_hash[vnet_id]).parent().children().each(function(){$(this).removeClass('markrow');});
         }
         else if (id.match(/datastore/g))
         {
              var datastore_id=id.substring(14,id.length);
              datastore_list_for_cluster_creation[datastore_id]=0;
              $("td:first", datastore_row_hash[datastore_id]).parent().children().each(function(){$(this).removeClass('markrow');});
         }
      });

    // Enhance buttons
    $('button',dialog).button();

    $("#refresh_host_table_button_class", dialog).click( function(){
       Sunstone.runAction("ClusterHost.list");
      }
    );

    $("#refresh_vnet_table_button_class", dialog).click( function(){
       Sunstone.runAction("ClusterVN.list");
      }
    );

    $("#refresh_datastore_table_button_class", dialog).click( function(){
       Sunstone.runAction("ClusterDS.list");
      }
    );

    $("#tf_btn_hosts_next", dialog).click( function()
       {
         $("#cluster_create_tabs", dialog).tabs( "select", "tab-vnets" );
       }
    );

    $("#tf_btn_vnets_back", dialog).click( function()
       {
         $("#cluster_create_tabs", dialog).tabs( "select", "tab-hosts" );
       }
    );

    $("#tf_btn_vnets_next", dialog).click( function()
       {
         $("#cluster_create_tabs", dialog).tabs( "select", "tab-datastores" );
       }
    );

    $("#tf_btn_datastores_back", dialog).click( function()
       {
         $("#cluster_create_tabs", dialog).tabs( "select", "tab-vnets" );
       }
    );

    $("#cluster_create_tabs", dialog).tabs( "select", "tab-hosts" );

    // Handle the Create button
    $('#create_cluster_submit').click(function(){


        if (!($('input#name',dialog).val().length)){
            notifyError(tr("Cluster name missing!"));
            return false;
        }

        var cluster_json = {
            "cluster": {
                "name": $('#name',dialog).val(),
                "hosts": host_list_for_cluster_creation,
                "vnets": vnet_list_for_cluster_creation,
                "datastores": datastore_list_for_cluster_creation
            }
        };

        // Create the OpenNebula.Cluster.
        // If it is successfull we refresh the list.
        Sunstone.runAction("Cluster.create",cluster_json);

        $create_cluster_dialog.dialog('close');
        return false;
    });
}

// Open creation dialogs
function popUpCreateClusterDialog(){
    Sunstone.runAction("ClusterHost.list");
    Sunstone.runAction("ClusterVN.list");
    Sunstone.runAction("ClusterDS.list");
    $create_cluster_dialog.dialog('open');
    return false;
}


/* -------- Host datatable -------- */

//Setup actions
var cluster_host_actions = {

    "ClusterHost.list" : {
        type: "list",
        call: OpenNebula.Host.list,
        callback: updateClusterHostsView,
        error: onError
    },

    "ClusterHostInfo.list" : {
        type: "list",
        call: OpenNebula.Host.list,
        callback: updateClusterHostsInfoView,
        error: onError
    }
}

//callback to update the list of hosts for Create dialog
function updateClusterHostsView (request,host_list){
    var host_list_array = [];

    $.each(host_list,function(){
        //Grab table data from the host_list
        host_list_array.push(hostElementArray(this));
    });

    updateView(host_list_array,dataTable_cluster_hosts);
    updateHostSelect();
}

//callback to update the list of hosts for info panel
function updateClusterHostsInfoView (request,host_list){
    var host_list_array = [];

    $.each(host_list,function(){
        if(this.HOST.CLUSTER_ID == cluster_info.ID)
          host_list_array.push(hostElementArray(this));
    });

    updateView(host_list_array,dataTable_cluster_hosts_panel);
}

//updates the host select by refreshing the options in it
function updateHostSelect(){
    hosts_select = makeSelectOptions(dataTable_cluster_hosts,
                                     1,//id_col
                                     2,//name_col
                                     [7,7],//status_cols
                                     [tr("ERROR"),tr("OFF"),tr("RETRY")]//bad_st
                                    );
}


/* -------- Virtual Networks datatable -------- */

//Setup actions
var cluster_vnet_actions = {

    "ClusterVN.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: updateVNetworksView,
        error: onError
    },

    "ClusterVNInfo.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: updateClusterVNetworksInfoView,
        error: onError
    }
}

//updates the list of virtual networks for Create dialog
function updateVNetworksView(request, network_list){
    var network_list_array = [];

    $.each(network_list,function(){
        network_list_array.push(vNetworkElementArray(this));
    });

    updateView(network_list_array,dataTable_cluster_vnets);
}

//callback to update the list of vnets for info panel
function updateClusterVNetworksInfoView (request,vnet_list){
    var vnet_list_array = [];

    $.each(vnet_list,function(){
        if(this.VNET.CLUSTER_ID == cluster_info.ID)
          vnet_list_array.push(vNetworkElementArray(this));
    });

    updateView(vnet_list_array,dataTable_cluster_vnets_panel);
}


/* -------- Datastores datatable -------- */

//Setup actions
var cluster_datastore_actions = {

    "ClusterDS.list" : {
        type: "list",
        call: OpenNebula.Datastore.list,
        callback: updateDatastoresView,
        error: onError
    },

    "ClusterDSInfo.list" : {
        type: "list",
        call: OpenNebula.Datastore.list,
        callback: updateClusterDatastoresInfoView,
        error: onError
    }
}

//updates the list of datastores for Create dialog
function updateDatastoresView(request, list){
    var list_array = [];

    $.each(list,function(){
        list_array.push( datastoreElementArray(this));
    });

    updateView(list_array,dataTable_cluster_datastores);
    updateDatastoreSelect();
    updateInfraDashboard("datastores",list);
}

//callback to update the list of datastores for info panel
function updateClusterDatastoresInfoView (request,datastore_list){
    var datastore_list_array = [];

    $.each(datastore_list,function(){
        if(this.DATASTORE.CLUSTER_ID == cluster_info.ID)
          datastore_list_array.push(datastoreElementArray(this));
    });

    updateView(datastore_list_array,dataTable_cluster_datastores_panel);
}


/* -------- End of datatables section -------- */


var clusters_tab_content = '\
<h2><i class="icon-copy"></i> '+tr("Clusters")+'</h2>\
<form id="form_cluters" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_clusters" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
      <th>' + tr("ID") + '</th>\
      <th>' + tr("Name") + '</th>\
      <th>' + tr("Hosts") + '</th>\
      <th>' + tr("Virtual Networks") + '</th>\
      <th>' + tr("Datastores") + '</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyclusters">\
  </tbody>\
</table>\
</form>';

var clusters_select="";
var dataTable_clusters;
var $create_cluster_dialog;


//Setup actions
var cluster_actions = {

    "Cluster.create" : {
        type: "create",
        call: OpenNebula.Cluster.create,
        callback: function(request, response){
            //addClusterElement,
            for (var host in request.request.data[0].cluster.hosts)
                if (request.request.data[0].cluster.hosts[host])
                    Sunstone.runAction("Cluster.addhost",response.CLUSTER.ID,host);
            for (var vnet in request.request.data[0].cluster.vnets)
                if (request.request.data[0].cluster.vnets[vnet])
                    Sunstone.runAction("Cluster.addvnet",response.CLUSTER.ID,vnet);
            for (var datastore in request.request.data[0].cluster.datastores)
                if (request.request.data[0].cluster.datastores[datastore])
                    Sunstone.runAction("Cluster.adddatastore",response.CLUSTER.ID,datastore);

            Sunstone.runAction('Cluster.list');
            updateClustersView();

            setTimeout(Sunstone.runAction('Cluster.list'),5000);
            setTimeout(updateClustersView(),5000);

        },
        error: onError,
        notify: true
    },

    "Cluster.create_dialog" : {
        type: "custom",
        call: popUpCreateClusterDialog
    },

    "Cluster.list" : {
        type: "list",
        call: OpenNebula.Cluster.list,
        callback: updateClustersView,
        error: onError
    },

    "Cluster.show" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: updateClusterInfo,
        error: onError
    },

    "Cluster.showinfo" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: updateClusterInfo,
        error: onError
    },

    "Cluster.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_clusters);
            Sunstone.runAction("Cluster.list");
        },
        error: onError
    },

    "Cluster.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.Cluster.list({timeout: true, success: updateClustersView,error: onError});
        }
    },

    "Cluster.addhost" : {
        type: "single",
        call : OpenNebula.Cluster.addhost,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0][1].host_id);
        },
        error : onError
    },

    "Cluster.delhost" : {
        type: "single",
        call : OpenNebula.Cluster.delhost,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0][1].host_id);
        },
        error : onError
    },

    "Cluster.adddatastore" : {
        type: "single",
        call : OpenNebula.Cluster.adddatastore,
        callback : function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][1].ds_id);
        },
        error : onError
    },

    "Cluster.deldatastore" : {
        type: "single",
        call : OpenNebula.Cluster.deldatastore,
        callback : function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][1].ds_id);
        },
        error : onError
    },

    "Cluster.addvnet" : {
        type: "single",
        call : OpenNebula.Cluster.addvnet,
        callback : function (req) {
            Sunstone.runAction("Network.show",req.request.data[0][1].vnet_id);
        },
        error : onError
    },

    "Cluster.delvnet" : {
        type: "single",
        call : OpenNebula.Cluster.delvnet,
        callback : function (req) {
            Sunstone.runAction("Network.show",req.request.data[0][1].vnet_id);
        },
        error : onError
    },

    "Cluster.delete" : {
        type: "multiple",
        call : OpenNebula.Cluster.del,
        callback : deleteClusterElement,
        elements: clusterElements,
        error : onError,
        notify:true
    },

    "Cluster.update" : {
        type: "single",
        call: OpenNebula.Cluster.update,
        callback: function(){
            notifyMessage(tr("Template updated correctly"));
        },
        error: onError
    },

    "Cluster.fetch_template" : {
        type: "single",
        call: OpenNebula.Cluster.fetch_template,
        callback: function(request,response){
            $('#template_update_dialog #template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Cluster.update_dialog" : {
        type: "custom",
        call: function() {
            popUpTemplateUpdateDialog("Cluster",
                                      makeSelectOptions(dataTable_clusters,
                                                        1,//idcol
                                                        2,//namecol
                                                        [],
                                                        []),
                                      clusterElements());
        }
    }
};

var cluster_buttons = {
    "Cluster.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },
    "Cluster.update_dialog" : {
        type : "action",
        text : tr("Update properties"),
        alwaysActive: true
    },
    "Cluster.delete" : {
        type: "confirm",
        text: tr("Delete")
    }
};

var clusters_tab = {
    title: tr("Clusters"),
    content: clusters_tab_content,
    buttons: cluster_buttons,
    showOnTopMenu: false,
    tabClass: "topTab subTab",
    parentTab: "infra_tab"
};

var cluster_info_panel = {
    "cluster_info_tab" : {
        title: tr("Cluster information"),
        content:""
    },

    "cluster_host_tab" : {
        title: tr("Cluster Hosts"),
        content: ""
    },
    "cluster_vnet_tab" : {
        title: tr("Cluster Virtual Networks"),
        content: ""
    },
    "cluster_datastore_tab" : {
        title: tr("Cluster Datastores"),
        content: ""
    }

};


// Cluster monitoring configuration. This config controls the monitoring
// which is plotted in the cluster dashboards.
// It operations are run for every cluster and are related to hosts in that
// cluster
SunstoneMonitoringConfig['CLUSTER_HOST'] = {
    plot: function(monitoring){
        //plot the series calculated for the hosts in a specific cluster
        var cluster_id = SunstoneMonitoringConfig.CLUSTER_HOST.cluster_id
        if (cluster_id == '-1') cluster_id = '-';

        for (plotID in monitoring){
            var container = $('div#'+plotID+cluster_id,main_tabs_context);
            SunstoneMonitoring.plot("CLUSTER_HOST",
                                    plotID,
                                    container,
                                    monitoring[plotID]);
        };
    },
    // Monitor configuration are the same those in the HOST
    // configuration (except for cluster partitions)
    // the difference is that these are plotted somewhere else.
    monitor : {
        "statePie" : {
            partitionPath: "STATE",
            operation: SunstoneMonitoring.ops.partition,
            dataType: "pie",
            colorize: function(state){
                switch (state) {
                case '0': return "rgb(239,201,86)" //yellow
                case '1': return "rgb(175,216,248)" //blue
                case '2': return "rgb(108,183,108)" //green
                case '3': return "rgb(203,75,75)" //red
                case '4': return "rgb(71,71,71)" //gray
                case '5': return "rgb(160,160,160)" //light gray
                }
            },
            plotOptions : {
                series: { pie: { show: true  } },
                legend : {
                    labelFormatter: function(label, series){
                        return OpenNebula.Helper.resource_state("host_simple",label) +
                            ' - ' + series.data[0][1] + ' (' +
                            Math.floor(series.percent) + '%' + ')';
                    }
                }
            }
        },
        "globalCpuUsage" : {
            partitionPath: ["HOST_SHARE", "USED_CPU"],
            dataType: "pie",
            operation: SunstoneMonitoring.ops.hostCpuUsagePartition,
            plotOptions: {
                series: { pie: { show: true  } }
            }
        },
        "cpuUsageBar" : {
            paths: [
                ["HOST_SHARE","MAX_CPU"],
                ["HOST_SHARE","USED_CPU"],
                ["HOST_SHARE","CPU_USAGE"],
            ],
            operation: SunstoneMonitoring.ops.singleBar,
            plotOptions: {
                series: { bars: { show: true,
                                  horizontal: true,
                                  barWidth: 0.5 }
                        },
                yaxis: { show: false },
                xaxis: { min:0 },
                legend: {
                    noColumns: 3,
                    margin: [-25,-35],
                    labelFormatter: function(label, series){
                        if (label[1] == "USED_CPU") {
                            return tr("Real CPU");
                        }
                        else if (label[1] == "CPU_USAGE") {
                            return tr("Allocated CPU");
                        }
                        else if (label[1] == "MAX_CPU") {
                            return tr("Total CPU");
                        }
                    }
                }
            }
        },
        "memoryUsageBar" : {
            paths: [
                ["HOST_SHARE","MAX_MEM"],
                ["HOST_SHARE","USED_MEM"],
                ["HOST_SHARE","MEM_USAGE"],
            ],
            operation: SunstoneMonitoring.ops.singleBar,
            plotOptions: {
                series: { bars: { show: true,
                                  horizontal: true,
                                  barWidth: 0.5 }
                        },
                yaxis: { show: false },
                xaxis: {
                    tickFormatter : function(val,axis) {
                        return humanize_size(val);
                    },
                    min: 0
                },
                legend: {
                    noColumns: 3,
                    margin: [-25,-35],
                    labelFormatter: function(label, series){
                        if (label[1] == "USED_MEM") {
                            return tr("Real MEM");
                        }
                        else if (label[1] == "MEM_USAGE") {
                            return tr("Allocated MEM");
                        }
                        else if (label[1] == "MAX_MEM") {
                            return tr("Total MEM");
                        }
                    }
                }
            }
        }
    }
}


Sunstone.addActions(cluster_host_actions);
Sunstone.addActions(cluster_vnet_actions);
Sunstone.addActions(cluster_datastore_actions);
Sunstone.addActions(cluster_actions);
Sunstone.addMainTab('clusters_tab',clusters_tab);
Sunstone.addInfoPanel("cluster_info_panel",cluster_info_panel);

//return lists of selected elements in cluster list
function clusterElements(){
    return getSelectedNodes(dataTable_clusters);
}

function clusterElementArray(element_json){

    var element = element_json.CLUSTER;

    var hosts = 0;
    if ($.isArray(element.HOSTS.ID))
        hosts = element.HOSTS.ID.length;
    else if (!$.isEmptyObject(element.HOSTS.ID))
        hosts = 1;

    var vnets = 0;
    if ($.isArray(element.VNETS.ID))
        vnets = element.VNETS.ID.length;
    else if (!$.isEmptyObject(element.VNETS.ID))
        vnets = 1;

    var dss = 0;
    if ($.isArray(element.DATASTORES.ID))
        dss = element.DATASTORES.ID.length;
    else if (!$.isEmptyObject(element.DATASTORES.ID))
        dss = 1;


    return [
        '<input class="check_item" type="checkbox" id="cluster_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.NAME,
        hosts,
        vnets,
        dss
    ];
}


//updates the cluster select by refreshing the options in it
function updateClusterSelect(){
    clusters_select = '<option value="-1">Default (none)</option>';
    clusters_select += makeSelectOptions(dataTable_clusters,
                                         1,//id_col
                                         2,//name_col
                                         [],//status_cols
                                         [],//bad_st
                                         true
                                        );
}

//callback for an action affecting a cluster element
function updateClusterElement(request, element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    updateSingleElement(element,dataTable_clusters,'#cluster_'+id);
    updateClusterSelect();
}

//callback for actions deleting a cluster element
function deleteClusterElement(req){
    deleteElement(dataTable_clusters,'#cluster_'+req.request.data);
    $('div#cluster_tab_'+req.request.data,main_tabs_context).remove();
    updateClusterSelect();
}

//call back for actions creating a cluster element
function addClusterElement(request,element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    addElement(element,dataTable_clusters);
    updateClusterSelect();
}

//callback to update the list of clusters.
function updateClustersView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(clusterElementArray(this));
    });

    //Remove the menus as we recreate them again.
    removeClusterMenus();
    newClusterMenu(list);

    updateView(list_array,dataTable_clusters);
    updateClusterSelect();
    //dependency with the infraestructure dashboard plugin
    updateInfraDashboard("clusters",list);
};

// Updates the cluster info panel tab content and pops it up
function updateClusterInfo(request,cluster){
    cluster_info = cluster.CLUSTER;

    //Information tab
    var info_tab = {
        title : tr("Cluster information"),
        content :
        '<table id="info_cluster_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("Cluster information") + ' - '+cluster_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td">'+cluster_info.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Name") + '</td>\
                <td class="value_td">'+cluster_info.NAME+'</td>\
            </tr>\
            </tbody>\
         </table>\
         <table id="cluster_template_table" class="info_table">\
             <thead><tr><th colspan="2">' + tr("Cluster template") + '</th></tr></thead>'+
                prettyPrintJSON(cluster_info.TEMPLATE)+
         '</table>'
    }

    var cluster_host_tab = {
        title: tr("Hosts"),
        content : '<div id="datatable_cluster_hosts_info_div"><table id="datatable_cluster_hosts_info_panel" class="display">' + host_datatable_table_tmpl + '</table></div>'
    }

    var cluster_vnet_tab = {
        title: tr("Virtual Networks"),
        content : '<div id="datatable_cluster_vnets_info_div"><table id="datatable_cluster_vnets_info_panel" class="display">' + vnet_datatable_table_tmpl + '</table></div>'
    }

    var cluster_datastore_tab = {
        title: tr("Datastores"),
        content : '<div id="datatable_cluster_datastores_info_div"><table id="datatable_cluster_datastores_info_panel" class="display">' + datastore_datatable_table_tmpl + '</table></div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_host_tab",cluster_host_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_vnet_tab",cluster_vnet_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_datastore_tab",cluster_datastore_tab);

    Sunstone.popUpInfoPanel("cluster_info_panel");

    // Hosts datatable

    dataTable_cluster_hosts_panel = $("#datatable_cluster_hosts_info_panel").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": { //exclude checkbox column
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,4] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [9,3,10,11,12] },
            { "sWidth": "150", "aTargets": [5,6,7,8] },
            { "bVisible": false, "aTargets": [0,3,5,6,7,8,10,11,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it
    dataTable_cluster_hosts_panel.fnClearTable();

    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_hosts_panel);

    // Virtual networks datatable

    dataTable_cluster_vnets_panel = $("#datatable_cluster_vnets_info_panel", dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,6,7,8] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [2,3,5] },
            { "bVisible": false, "aTargets": [0,5,7]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    //preload it
    dataTable_cluster_vnets_panel.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_vnets_panel);

    // Datastores datatable

    dataTable_cluster_datastores_panel = $("#datatable_cluster_datastores_info_panel", dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,9] },
            { "sWidth": "100px", "aTargets": [2,3,5,7,8] },
            { "bVisible": false, "aTargets": [0,5,6,7,8,9] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    //preload it
    dataTable_cluster_datastores_panel.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_cluster_datastores_panel);

    // initializa datatables values

    Sunstone.runAction("ClusterHostInfo.list");
    Sunstone.runAction("ClusterVNInfo.list");
    Sunstone.runAction("ClusterDSInfo.list");
}


//generates the HTML for the dashboard of a specific cluster
function clusterTabContent(cluster_json) {
    var cluster = cluster_json.CLUSTER;
    var hosts_n = 0;
    var dss_n = 0;
    var vnets_n = 0;


    // Count resources in cluster
    if (cluster.DATASTORES.ID &&
        cluster.DATASTORES.ID.constructor == Array){
        dss_n = cluster.DATASTORES.ID.length;
    } else if (cluster.DATASTORES.ID)
        dss_n = 1;

    if (cluster.HOSTS.ID &&
        cluster.HOSTS.ID.constructor == Array){
        hosts_n = cluster.HOSTS.ID.length;
    } else if (cluster.HOSTS.ID)
        hosts_n = 1;

    if (cluster.VNETS.ID &&
        cluster.VNETS.ID.constructor == Array){
        vnets_n = cluster.VNETS.ID.length;
    } else if (cluster.VNETS.ID)
        vnets_n = 1;

    //special case for cluster none, simplified dashboard
    if (cluster.ID == "-"){
        var html_code = '\
<table class="dashboard_table">\
<tr>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Cluster information") + '<i class="icon-refresh action_button" value="Host.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("ID") + '</td>\
              <td class="value_td">'+cluster.ID+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Name") + '</td>\
              <td class="value_td">'+cluster.NAME+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Hosts state") + '</td>\
              <td class="key_td">' + tr("Hosts CPU Usage") + '</td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="statePie'+cluster.ID+'" style="float:left;width:50%;height:100px;">'+tr("No monitoring information available")+'</div>\
                              <div id="globalCpuUsage'+cluster.ID+'" style="float:right;width:50%;height:100px;">'+tr("No monitoring information available")+'</div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max CPU") + '</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="cpuUsageBar'+cluster.ID+'" style="width:95%;height:50px">'+tr("No monitoring information available")+'</div>\
              </td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max Memory") + '</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="memoryUsageBar'+cluster.ID+'" style="width:95%;height:50px">'+tr("No monitoring information available")+'</div>\
              </td>\
            </tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Hosts") + '</h3>\
        <div class="panel_info">\
          <ul>\
             <li><a class="action_button" href="#hosts_tab" value="Host.create_dialog">'+tr("Create new host")+'</a></li>\
             <li><a class="action_button" href="#hosts_tab" value="Host.create_dialog">'+tr("Create new host")+'</a></li>\
             <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#hosts_tab">'+tr("Manage unclustered hosts")+'</a></li>\
          </ul>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Datastores") + '</h3>\
        <div class="panel_info">\
            <ul>\
                <li><a class="action_button" href="#datastores_tab" value="Datastore.create_dialog">'+tr("Create new datastore")+'</a></li>\
                <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#datastores_tab">'+tr("Manage unclustered datastores")+'</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Virtual Networks") + '</h3>\
        <div class="panel_info">\
          <ul>\
             <li><a class="action_button" href="#vnets_tab" value="Network.create_dialog">'+tr("Create new virtual network")+'</a></li>\
             <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#vnets_tab">'+tr("Manage unclustered virtual networks")+'</a></li>\
          </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>\
';
        return html_code;
    };

    //end cluster 'none' special html

    var html_code = '\
<table class="dashboard_table">\
<tr>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Cluster information") + '<i class="icon-refresh action_button" value="Host.list" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("ID") + '</td>\
              <td class="value_td">'+cluster.ID+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Name") + '</td>\
              <td class="value_td">'+cluster.NAME+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Hosts state") + '</td>\
              <td class="key_td">' + tr("Hosts CPU Usage") + '</td>\
            </tr>\
            <tr>\
              <td colspan="2">\
                   <div id="statePie'+cluster.ID+'" style="float:left;width:50%;height:100px;">'+tr("No monitoring information available")+'</div>\
                   <div id="globalCpuUsage'+cluster.ID+'" style="float:right;width:50%;height:100px;">'+tr("No monitoring information available")+'</div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max CPU") + '</td>\
              <td><div class="cpuUsageBar_legend"></div></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="cpuUsageBar'+cluster.ID+'" style="width:95%;height:50px">'+tr("No monitoring information available")+'</div>\
              </td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max Memory") + '</td>\
              <td><div class="memoryUsageBar_legend"></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="memoryUsageBar'+cluster.ID+'" style="width:95%;height:50px">'+tr("No monitoring information available")+'</div>\
              </td>\
            </tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Hosts") + '</h3>\
        <div class="panel_info">\
\
          <p><br />'+tr("Current number of hosts in this cluster")+': '+hosts_n+'.</p><p>\
          <ul>\
             <li><a class="action_button" href="#hosts_tab" value="Host.create_dialog">'+tr("Create new host")+'</a></li>\
             <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#hosts_tab">'+tr("Manage cluster hosts")+'</a></li>\
\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Datastores") + '</h3>\
        <div class="panel_info">\
\
           <p><br />'+tr("Current number of datastores in this cluster")+': '+dss_n+'.</p><p>\
\
          <ul>\
             <li><a class="action_button" href="#datastores_tab" value="Datastore.create_dialog">'+tr("Create new datastore")+'</a></li>\
             <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#datastores_tab">'+tr("Manage cluster datastores")+'</a></li>\
          </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Virtual Networks") + '</h3>\
        <div class="panel_info">\
\
           <p><br />'+tr("Current number of virtual networks in this cluster")+': '+vnets_n+'.</p><p>\
\
          <ul>\
             <li><a class="action_button" href="#vnets_tab" value="Network.create_dialog">'+tr("Create new virtual network")+'</a></li>\
             <li><a class="show_tab_button" filter_id="'+cluster.ID+'" href="#vnets_tab">'+tr("Manage cluster virtual networks")+'</a></li>\
          </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>\
';

    return html_code;
};

//Removes the clusters from the submenu
function removeClusterMenus(){
    var data = dataTable_clusters.fnGetData();

    Sunstone.removeMainTab('cluster_tab_-',true);

    for (var i=0; i < data.length; i++){
        var id = data[i][1];
        Sunstone.removeMainTab('cluster_tab_'+id,true);
    };
};

// Creates new cluster submenus
// insert cluster none manually
function newClusterMenu(list){
    var cluster_none = {
        'CLUSTER' : {
            'NAME' : 'None',
            'ID' : '-',
            'DATASTORES' : [],
            'HOSTS' : [],
            'VNETS' : []
        }
    };

    newClusterMenuElement(cluster_none);

    for (var i=0; i < list.length; i++){
        newClusterMenuElement(list[i]);
    };
    $('div#menu li#li_clusters_tab span').removeClass('ui-icon-circle-minus');
    $('div#menu li#li_clusters_tab span').addClass('ui-icon-circle-plus');
};

// Create new cluster menu
function newClusterMenuElement(element){
    var cluster = element.CLUSTER;

    //trim long cluster names
    var menu_name = cluster.NAME.length > 10 ?
        cluster.NAME.substring(0,9)+'...' : cluster.NAME;

    // Menu object
    var menu_cluster = {
        title: menu_name + ' (id ' + cluster.ID + ')',
        content: clusterTabContent(element),
        tabClass: 'subTab subsubTab',
        parentTab: 'clusters_tab'

    };

    // Add to sunstone
    Sunstone.addMainTab('cluster_tab_'+cluster.ID,menu_cluster,true);
};

// Basicly, we show the hosts/datastore/vnets tab, but before we set
// a filter on the cluster column, so it only shows the cluster we want.
function clusterResourceViewListeners(){
    //hack  the menu selection
    $('.show_tab_button').live('click',function(){
        var dest = $(this).attr('href').substring(1);
        var filter_id = $(this).attr('filter_id');
        switch (dest) {
        case 'hosts_tab':
            dataTable_hosts.fnFilter(getClusterName(filter_id),3,false,true,false,true);
            break;
        case 'datastores_tab':
            dataTable_datastores.fnFilter(getClusterName(filter_id),5,false,true,false,true);
            break;
        case 'vnets_tab':
            dataTable_vNetworks.fnFilter(getClusterName(filter_id),5,false,true,false,true);
            break;
        };
        showTab(dest,'li_cluster_tab'+filter_id);
        return false;
    });
};


// Receives the list of hosts, divides them into clusters.
// For each cluster, it calls the monitoring action for the hosts
// on that cluster. The monitoring is then plotted in the cluster dashboard.
// This is called from hosts plugin.
function monitorClusters(list){
    var clustered_hosts = { "-" : []}

    //extract current clusters from table
    //and initialize the object in which hosts will be divided
    var cluster_list = dataTable_clusters.fnGetData();
    $.each(cluster_list,function(){
        clustered_hosts[this[1]] = []
    });

    for (var i = 0; i < list.length; i++){
        var cluster_id = list[i].HOST.CLUSTER_ID;
        if (!clustered_hosts[cluster_id])
            clustered_hosts[cluster_id] = [{ CLUSTER_HOST : list[i].HOST }];
        else
            clustered_hosts[cluster_id].push({ CLUSTER_HOST : list[i].HOST })
    }
    for (cluster in clustered_hosts){
        SunstoneMonitoringConfig.CLUSTER_HOST.cluster_id = cluster;
        SunstoneMonitoring.monitor('CLUSTER_HOST', clustered_hosts[cluster]);
    }
}

//Prepares the autorefresh for hosts
function setClusterAutorefresh() {
    setInterval(function(){
        var selected_menu = $('div#menu li.navigation-active-li');
        var inSubMenu = selected_menu.attr('id').indexOf('cluster') > 0;

        var checked = $('input.check_item:checked',dataTable_clusters);
        var  filter = $("#datatable_clusters_filter input",dataTable_clusters.parents('#datatable_clusters_wrapper')).attr('value');
        if (!checked.length && !filter.length && !inSubMenu){
            Sunstone.runAction("Cluster.autorefresh");
        }
    },INTERVAL+someTime());
}

function clusters_sel() {
    return clusters_select;
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the host datatable, preload it
//and add specific listeners
$(document).ready(function(){


    //prepare host datatable
    dataTable_clusters = $("#datatable_clusters",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,3,4,5] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it
    dataTable_clusters.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_clusters);
    Sunstone.runAction("Cluster.list");

    setupCreateClusterDialog();

    setClusterAutorefresh();

    clusterResourceViewListeners();

    initCheckAllBoxes(dataTable_clusters);
    tableCheckboxesListener(dataTable_clusters);
    infoListener(dataTable_clusters, "Cluster.showinfo");

});
