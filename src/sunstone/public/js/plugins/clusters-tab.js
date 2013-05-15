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

/* ---------------- Cluster tab plugin ---------------- */

/* ------------ Cluster creation dialog ------------ */

var host_datatable_table_tmpl='<thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>' + tr("ID") + '</th>\
          <th>' + tr("Name") + '</th>\
          <th>' + tr("Cluster") + '</th>\
          <th>' + tr("RVMs") + '</th>\
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
        <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
        <th>'+tr("ID")+'</th>\
        <th>'+tr("Owner")+'</th>\
        <th>'+tr("Group")+'</th>\
        <th>'+tr("Name")+'</th>\
        <th>'+tr("Cluster")+'</th>\
        <th>'+tr("Type")+'</th>\
        <th>'+tr("Bridge")+'</th>\
        <th>'+tr("Leases")+'</th>\
      </tr>\
    </thead>\
    <tbody id="tbodyvnetworks">\
    </tbody>'

var datastore_datatable_table_tmpl='<thead>\
      <tr>\
        <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
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


var create_cluster_tmpl ='<div class="panel">\
    <h3 >\
      <small id="create_cluster_header">'+tr("Create Cluster")+'</small>\
      <small id="update_cluster_header">'+tr("Update Cluster")+'</small>\
    </h3>\
  </div>\
  <div class="reveal-body">\
  <form id="cluster_create_tabs" class="custom">\
  <div class="row centered">\
    <div class="columns eight centered">\
      <div class="two columns">\
          <label class="inline right"for="name">' + tr("Name")  + ':</label>\
      </div>\
      <div class="nine columns">\
          <input type="text" name="name" id="name" />\
      </div>\
      <div class="one columns">\
          <div class="tip"></div>\
      </div>\
    </div>\
  </div>\
  <br>\
    <dl class="tabs">\
        <dd class="active"><a href="#tab-hosts">'+tr("Hosts")+'</a></dd>\
        <dd><a href="#tab-vnets">'+tr("Virtual Networks")+'</a></dd>\
        <dd><a href="#tab-datastores">'+tr("Datastores")+'</a></dd>\
    </dl>\
    <ul class="tabs-content">\
    <li id="tab-hostsTab" class="active">\
      <div class="row collapse">\
        <div class="seven columns">\
            <button id="refresh_host_table_button_class" class="button small radius secondary action_button" value="ClusterHost.list"><i class="icon-refresh" /></button>\
        </div>\
        <div class="five columns">\
          <input id="cluster_hosts_search" type="text" placeholder="'+tr("Search")+'"/>\
        </div>\
      </div>\
      <div id="datatable_cluster_hosts_div">\
            <table id="datatable_cluster_hosts" class="datatable twelve">' + host_datatable_table_tmpl + '</table></div>\
      <br>\
      <div id="selected_hosts_div">\
        <span id="select_cluster_hosts" class="radius secondary label">'+tr("Please select one or more hosts from the list")+'</span>\
        <span id="cluster_hosts_selected" class="radius secondary label hidden">'+tr("You selected the following hosts:")+'</span>\
      </div>\
    </li>\
    <li id="tab-vnetsTab">\
      <div class="row collapse">\
        <div class="seven columns">\
            <button id="refresh_vnet_table_button_class" class="button small radius secondary action_button" value="ClusterVN.list"><i class="icon-refresh" /></button>\
        </div>\
        <div class="five columns">\
          <input id="cluster_vnets_search" type="text" placeholder="'+tr("Search")+'"/>\
        </div>\
      </div>\
      <div id="datatable_cluster_vnets_div">\
            <table id="datatable_cluster_vnets" class="table twelve">' + vnet_datatable_table_tmpl + '</table></div>\
      <br>\
      <div id="selected_vnets_div">\
        <span id="select_cluster_vnets" class="radius secondary label">'+tr("Please select one or more vnets from the list")+'</span>\
        <span id="cluster_vnets_selected" class="radius secondary label hidden">'+tr("You selected the following vnets:")+'</span>\
      </div>\
    </li>\
    <li id="tab-datastoresTab">\
      <div class="row collapse">\
        <div class="seven columns">\
            <button id="refresh_datastore_table_button_class" class="button small radius secondary action_button" value="ClusterDS.list"><i class="icon-refresh" /></button>\
        </div>\
        <div class="five columns">\
          <input id="cluster_datastores_search" type="text" placeholder="'+tr("Search")+'"/>\
        </div>\
      </div>\
      <div id="datatable_cluster_datastores_div">\
            <table id="datatable_cluster_datastores" class="table twelve">' + datastore_datatable_table_tmpl + '</table></div>\
      <br>\
      <div id="selected_datastores_div">\
        <span id="select_cluster_datastores" class="radius secondary label">'+tr("Please select one or more datastores from the list")+'</span>\
        <span id="cluster_datastores_selected" class="radius secondary label hidden">'+tr("You selected the following datastores:")+'</span>\
      </div>\
    </li>\
    </ul>\
  </form>\
  </div>\
    <div class="reveal-footer">\
    <hr>\
    <div class="form_buttons row">\
        <button class="button success right radius" type="submit" id="create_cluster_submit" value="OpenNebula.Cluster.create">' + tr("Create") + '</button>\
        <button class="button right radius" type="submit" id="update_cluster_submit">' + tr("Update") + '</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
    </div>\
    </div>\
        <a class="close-reveal-modal">&#215;</a>';

// Common utils for datatatables
  // Holds the selected items
selected_hosts_list     = {};
selected_vnets_list     = {};
selected_datastore_list = {};

host_row_hash           = {};
vnet_row_hash           = {};
datastore_row_hash      = {};

// Prepares the cluster creation dialog
function setupCreateClusterDialog(){

    $create_cluster_dialog = $('div#create_cluster_dialog');
    var dialog = $create_cluster_dialog;

    dialog.html(create_cluster_tmpl);
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    dialog.addClass("reveal-modal large max-height");

    //  ------- Create the dialog datatables ------------
    dataTable_cluster_hosts = $("#datatable_cluster_hosts", dialog).dataTable({
        "sDom" :  '<"H">t<"F"p>',
        "oColVis": { //exclude checkbox column
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,5,6,7,8,10,11,12]} // 3 = cluster
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    $('#cluster_hosts_search', dialog).keyup(function(){
      dataTable_cluster_hosts.fnFilter( $(this).val() );
    })

    dataTable_cluster_vnets = $("#datatable_cluster_vnets", dialog).dataTable({
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,7]} // 5 = cluster
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    $('#cluster_vnets_search', dialog).keyup(function(){
      dataTable_cluster_vnets.fnFilter( $(this).val() );
    })

    dataTable_cluster_datastores = $("#datatable_cluster_datastores", dialog).dataTable({
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,6,7,8,9] } // 5 = cluster
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    $('#cluster_datastores_search', dialog).keyup(function(){
      dataTable_cluster_datastores.fnFilter( $(this).val() );
    })

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
          var name    = aData[2];

          if ($.isEmptyObject(selected_hosts_list)) {
            $('#cluster_hosts_selected',  dialog).show();
            $('#select_cluster_hosts', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrowchecked'))
          {
            selected_hosts_list[host_id]=1;
            host_row_hash[host_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            $('div#selected_hosts_div', dialog).append('<span id="tag_hosts_'+host_id+'" class="radius label">'+name+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_hosts_list[host_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_hosts_div span#tag_hosts_'+host_id, dialog).remove();
          }

          if ($.isEmptyObject(selected_hosts_list)) {
            $('#cluster_hosts_selected',  dialog).hide();
            $('#select_cluster_hosts', dialog).show();
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

          if ($.isEmptyObject(selected_vnets_list)) {
            $('#cluster_vnets_selected',  dialog).show();
            $('#select_cluster_vnets', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrowchecked'))
          {
            selected_vnets_list[vnet_id]=1;
            vnet_row_hash[vnet_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            $('div#selected_vnets_div', dialog).append('<span id="tag_vnets_'+vnet_id+'" class="radius label">'+name+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_vnets_list[vnet_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_vnets_div span#tag_vnets_'+vnet_id, dialog).remove();
          }

          if ($.isEmptyObject(selected_vnets_list)) {
            $('#cluster_vnets_selected',  dialog).hide();
            $('#select_cluster_vnets', dialog).show();
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

          if ($.isEmptyObject(selected_datastore_list)) {
            $('#cluster_datastores_selected',  dialog).show();
            $('#select_cluster_datastores', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrowchecked'))
          {
            selected_datastore_list[ds_id]=1;
            datastore_row_hash[ds_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            $('div#selected_datastores_div', dialog).append('<span id="tag_datastores_'+ds_id+'" class="radius label">'+name+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_datastore_list[ds_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_datastores_div span#tag_datastores_'+ds_id, dialog).remove();
          }

          if ($.isEmptyObject(selected_datastore_list)) {
            $('#cluster_datastores_selected',  dialog).hide();
            $('#select_cluster_datastores', dialog).show();
          }

          return false;
      });

    // Add tag listeners
     $( "#cluster_create_tabs span.icon-remove",$create_cluster_dialog).die();
     $( "#cluster_create_tabs span.icon-remove" ).live( "click", function() {
       // Remove the tag
       $(this).parent().remove();

       // Unselect row
       var id = $(this).parent().attr("ID");

       if (id.match(/host/g))
       {
            var host_id=id.substring(10,id.length);
            delete selected_hosts_list[host_id];
            $("td:first", host_row_hash[host_id]).parent().children().each(function(){$(this).removeClass('markrowchecked');});

            if ($.isEmptyObject(selected_hosts)) {
              $('#cluster_hosts_selected',  dialog).hide();
              $('#select_cluster_hosts', dialog).show();
            }
       }
       else if (id.match(/vnet/g))
       {
            var vnet_id=id.substring(10,id.length);
            delete selected_vnets_list[vnet_id];
            $("td:first", vnet_row_hash[vnet_id]).parent().children().each(function(){$(this).removeClass('markrowchecked');});

            if ($.isEmptyObject(selected_hosts)) {
              $('#cluster_vnets_selected',  dialog).hide();
              $('#select_cluster_vnets', dialog).show();
            }

       }
       else if (id.match(/datastore/g))
       {
            var datastore_id=id.substring(15,id.length);
            delete selected_datastore_list[datastore_id];
            $("td:first", datastore_row_hash[datastore_id]).parent().children().each(function(){$(this).removeClass('markrowchecked');});

            if ($.isEmptyObject(selected_hosts)) {
              $('#cluster_datastores_selected',  dialog).hide();
              $('#select_cluster_datastores', dialog).show();
            }
       }
     });

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

    // Handle the Create button
    $('#create_cluster_submit').click(function(){


        if (!($('input#name',dialog).val().length)){
            notifyError(tr("Cluster name missing!"));
            return false;
        }

        var cluster_json = {
            "cluster": {
                "name": $('#name',dialog).val(),
                "hosts": selected_hosts_list,
                "vnets": selected_vnets_list,
                "datastores": selected_datastore_list
            }
        };

        // Create the OpenNebula.Cluster.
        // If it is successfull we refresh the list.
        Sunstone.runAction("Cluster.create",cluster_json);

        $create_cluster_dialog.trigger("reveal:close")
        return false;
    });
}

function reset_counters(){
    selected_hosts_list     = {};
    selected_vnets_list     = {};
    selected_datastore_list = {};


    host_row_hash           = {};
    vnet_row_hash           = {};
    datastore_row_hash      = {};
}

// Open creation dialogs
function popUpCreateClusterDialog(){

    filter_expr = "-" ;

    if ($create_cluster_dialog)
    {
      $create_cluster_dialog.remove();
      dialogs_context.append('<div title=\"'+tr("Create cluster")+'\" id="create_cluster_dialog"></div>');
    }

    reset_counters();

    setupCreateClusterDialog();

    // Activate create button
    $('#create_cluster_submit',$create_cluster_dialog).show();
    $('#update_cluster_submit',$create_cluster_dialog).hide();
    $('#create_cluster_header',$create_cluster_dialog).show();
    $('#update_cluster_header',$create_cluster_dialog).hide();

    Sunstone.runAction("ClusterHost.list");
    Sunstone.runAction("ClusterVN.list");
    Sunstone.runAction("ClusterDS.list");
    $create_cluster_dialog.reveal();

    return false;
}

// Open update dialog
function popUpUpdateClusterDialog(){

    var dialog = $create_cluster_dialog;

    if (dialog)
    {
      dialog.remove();
      dialogs_context.append('<div title=\"'+tr("Update cluster")+'\" id="create_cluster_dialog"></div>');
    }

    reset_counters;

    var selected_nodes = getSelectedNodes(dataTable_clusters);

    if ( selected_nodes.length != 1 )
    {
      notifyError(tr("Please select one (and just one) cluster to update."));
      return false;
    }

    // Get proper cluster_id
    cluster_id   = ""+selected_nodes[0];
    var cluster_name = "";

    var node  = $('tbody input.check_item:checked',dataTable_clusters);

    $.each(node,function(){
        cluster_name = $('td', $(this).closest("tr"))[2].innerHTML;
    });

    filter_expr = "-|"+cluster_name;

    setupCreateClusterDialog();

    Sunstone.runAction("ClusterHost.list");
    Sunstone.runAction("ClusterVN.list");
    Sunstone.runAction("ClusterDS.list");
    $create_cluster_dialog.reveal();

    $('#create_cluster_dialog').attr('title','Update Cluster');

    return false;

}

// Fill update dialog with loaded properties
function fillPopPup(request,response){
  var dialog = $create_cluster_dialog;

  // Harvest variables
  var name     = response.CLUSTER.NAME;
  var host_ids = response.CLUSTER.HOSTS.ID;
  var vnet_ids = response.CLUSTER.VNETS.ID;
  var ds_ids   = response.CLUSTER.DATASTORES.ID;

  if (typeof host_ids == 'string')
  {
    host_ids = [host_ids];
  }

  if (typeof vnet_ids == 'string')
  {
    vnet_ids = [vnet_ids];
  }

  if (typeof ds_ids == 'string')
  {
    ds_ids = [ds_ids];
  }

  // Activate update button
  $('#create_cluster_submit',dialog).hide();
  $('#update_cluster_submit',dialog).show();
  $('#create_cluster_header',dialog).hide();
  $('#update_cluster_header',dialog).show();

  // Fill in the name
  $('#name',dialog).val(name);
  $('#name',dialog).attr("disabled", "disabled");

  // Select hosts belonging to the cluster
  if (host_ids)
  {
    var rows = $("#datatable_cluster_hosts").dataTable().fnGetNodes();

    for (var i = 0; i < host_ids.length; i++)
    {
      for(var j=0;j<rows.length;j++){
        var current_row = $(rows[j]);
        var row_host_id = $(rows[j]).find("td:eq(0)").html();
        var host_name   = $(rows[j]).find("td:eq(1)").html();

        if (host_name)
        {
          if (row_host_id == host_ids[i])
          {
              current_row.click();
          }
        }
      }
    }
  }

  if (vnet_ids)
  {
    var rows = $("#datatable_cluster_vnets").dataTable().fnGetNodes();
    // Select vnets belonging to the cluster
    for (var i = 0; i < vnet_ids.length; i++)
    {
      for(var j=0;j<rows.length;j++){

        var current_row = $(rows[j]);
        var row_vnet_id = $(rows[j]).find("td:eq(0)").html();
        var vnet_name   = $(rows[j]).find("td:eq(3)").html();

        if (vnet_name)
        {
          if (row_vnet_id == vnet_ids[i])
          {
              current_row.click();
          }
        }
      }
    }
  }

  if (ds_ids)
  {
    var rows = $("#datatable_cluster_datastores").dataTable().fnGetNodes();
    // Select datastores belonging to the cluster
    for (var i = 0; i < ds_ids.length; i++)
    {
      for(var j=0;j<rows.length;j++){

        var current_row      = $(rows[j]);
        var row_datastore_id = $(rows[j]).find("td:eq(0)").html();
        var datastore_name   = $(rows[j]).find("td:eq(3)").html();

        if (datastore_name)
        {
          if (row_datastore_id == ds_ids[i])
          {
              current_row.click();
          }
        }
      }
    }
  }

  // Clone already existing resources (to keep track)
  original_hosts_list      = $.extend({}, selected_hosts_list);
  original_vnets_list      = $.extend({}, selected_vnets_list);
  original_datastores_list = $.extend({}, selected_datastore_list);
  cluster_to_update_id     = response.CLUSTER.ID;

  // Define update button
  $('#update_cluster_submit').click(function(){

      // find out which ones are in and out
      for (var host_id in selected_hosts_list)
      {
        if (!original_hosts_list[host_id])
        {
          Sunstone.runAction("Cluster.addhost",cluster_to_update_id,host_id);
        }
      }

      for (var host_id in original_hosts_list)
      {
        if (!selected_hosts_list[host_id])
        {
          Sunstone.runAction("Cluster.delhost",cluster_to_update_id,host_id);
        }
      }

      for (var vnet_id in selected_vnets_list)
      {
        if (!original_vnets_list[vnet_id])
        {
          Sunstone.runAction("Cluster.addvnet",cluster_to_update_id,vnet_id);
        }
      }

      for (var vnet_id in original_vnets_list)
      {
        if (!selected_vnets_list[vnet_id])
        {
          Sunstone.runAction("Cluster.delvnet",cluster_to_update_id,vnet_id);
        }
      }

      for (var ds_id in selected_datastore_list)
      {
        if (!original_datastores_list[ds_id])
        {
          Sunstone.runAction("Cluster.adddatastore",cluster_to_update_id,ds_id);
        }
      }

      for (var ds_id in original_datastores_list)
      {
        if (!selected_datastore_list[ds_id])
        {
          Sunstone.runAction("Cluster.deldatastore",cluster_to_update_id,ds_id);
        }
      }

      $create_cluster_dialog.trigger("reveal:close")

      Sunstone.runAction('Cluster.list');

      return false;
  });
}


/* -------- Host datatable -------- */

//Setup actions
var cluster_host_actions = {

    "ClusterHost.list" : {
        type:     "list",
        call:     OpenNebula.Host.list,
        callback: function(request,host_list){
          updateClusterHostsView(request,host_list);
          dataTable_cluster_hosts.fnFilter( filter_expr, 3, true);
        },
        error:    onError
    },

    "ClusterHostInfo.list" : {
        type:     "list",
        call:     OpenNebula.Host.list,
        callback: updateClusterHostsInfoView,
        error:    onError
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


/* -------- Virtual Networks datatable -------- */

//Setup actions
var cluster_vnet_actions = {

    "ClusterVN.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: function(request,vnet_list){
          updateClusterVNetworksView(request,vnet_list);
          dataTable_cluster_vnets.fnFilter( filter_expr, 5, true);
        },
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
function updateClusterVNetworksView(request, network_list){
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
        callback: function(request,ds_list){
          updateClusterDatastoresView(request,ds_list);
          dataTable_cluster_datastores.fnFilter( filter_expr, 5, true);
          if(filter_expr!="-")
            Sunstone.runAction("Cluster.show_to_update", cluster_id);
        },
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
function updateClusterDatastoresView(request, list){
    var list_array = [];

    $.each(list,function(){
        if(this.DATASTORE.ID!=0)
          list_array.push( datastoreElementArray(this));
    });

    updateView(list_array,dataTable_cluster_datastores);
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
<form class="custom" id="form_cluters" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-copy"></i> '+tr("Clusters")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="cluster_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_clusters" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>' + tr("ID") + '</th>\
      <th>' + tr("Name") + '</th>\
      <th>' + tr("Hosts") + '</th>\
      <th>' + tr("VNets") + '</th>\
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
            Sunstone.runAction('Cluster.list');

            for (var host in request.request.data[0].cluster.hosts)
                if (request.request.data[0].cluster.hosts[host])
                    Sunstone.runAction("Cluster.addhost",response.CLUSTER.ID,host);
            for (var vnet in request.request.data[0].cluster.vnets)
                if (request.request.data[0].cluster.vnets[vnet])
                    Sunstone.runAction("Cluster.addvnet",response.CLUSTER.ID,vnet);
            for (var datastore in request.request.data[0].cluster.datastores)
                if (request.request.data[0].cluster.datastores[datastore])
                    Sunstone.runAction("Cluster.adddatastore",response.CLUSTER.ID,datastore);

            //Sunstone.runAction('Cluster.list');
           // Sunstone.runAction('Cluster.show',response.CLUSTER.ID);
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
        callback: updateClusterElement,
        error: onError
    },

    "Cluster.showinfo" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: updateClusterInfo,
        error: onError
    },

    "Cluster.show_to_update" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: fillPopPup,
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
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.delhost" : {
        type: "single",
        call : OpenNebula.Cluster.delhost,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0][1].host_id);
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.adddatastore" : {
        type: "single",
        call : OpenNebula.Cluster.adddatastore,
        callback : function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][1].ds_id);
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.deldatastore" : {
        type: "single",
        call : OpenNebula.Cluster.deldatastore,
        callback : function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][1].ds_id);
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.addvnet" : {
        type: "single",
        call : OpenNebula.Cluster.addvnet,
        callback : function (req) {
            Sunstone.runAction("Network.show",req.request.data[0][1].vnet_id);
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.delvnet" : {
        type: "single",
        call : OpenNebula.Cluster.delvnet,
        callback : function (req) {
            Sunstone.runAction("Network.show",req.request.data[0][1].vnet_id);
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
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

    "Cluster.update_template" : {  // Update template
        type: "single",
        call: OpenNebula.Cluster.update,
        callback: function(request,response){
           notifyMessage(tr("Cluster updated correctly"));
           Sunstone.runAction('Cluster.show',response.CLUSTER.ID);
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
        type: "single",
        call: popUpUpdateClusterDialog
    },
};

var cluster_buttons = {
    "Cluster.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Cluster.update_dialog" : {
        type : "action",
        layout: "main",
        text : tr("Update"),
        alwaysActive: true
    },
    "Cluster.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
};

var clusters_tab = {
    title: tr("Clusters"),
    content: clusters_tab_content,
    buttons: cluster_buttons,
    showOnTopMenu: false,
    tabClass: "subTab",
    parentTab: "infra-tab"
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

Sunstone.addActions(cluster_host_actions);
Sunstone.addActions(cluster_vnet_actions);
Sunstone.addActions(cluster_datastore_actions);
Sunstone.addActions(cluster_actions);
Sunstone.addMainTab('clusters-tab',clusters_tab);
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

    updateView(list_array,dataTable_clusters);
    updateClusterSelect();
};


// Updates the cluster info panel tab content and pops it up
function updateClusterInfo(request,cluster){
    cluster_info     = cluster.CLUSTER;
    cluster_template = cluster_info.TEMPLATE;

    //Information tab
    var info_tab = {
        title : tr("Information"),
        content :
        '<form class="custom"><div class="">\
        <div class="six columns">\
        <table id="info_cluster_table" class="twelve datatable extended_table">\
            <thead>\
               <tr><th colspan="2">' +
                        tr("Cluster") +
                        ' - '+cluster_info.NAME+'</th></tr>\
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
        </div>\
        <div class="six columns">'
                + insert_extended_template_table(cluster_template,
                                         "Cluster",
                                         cluster_info.ID,
                                         "Tags") +
         '</div>\
        </div></form>'
    }

    var cluster_host_tab = {
        title: tr("Hosts"),
        content : '<div class="columns twelve">\
          <div id="datatable_cluster_hosts_info_div">\
            <table id="datatable_cluster_hosts_info_panel" class="table twelve">' +
              host_datatable_table_tmpl +
            '</table>\
          </div>\
        </div>'
    }

    var cluster_vnet_tab = {
        title: tr("Virtual Networks"),
        content : '<div class="columns twelve">\
          <div id="datatable_cluster_vnets_info_div">\
            <table id="datatable_cluster_vnets_info_panel" class="table twelve">' +
              vnet_datatable_table_tmpl +
            '</table>\
          </div>\
        </div>'
    }

    var cluster_datastore_tab = {
        title: tr("Datastores"),
        content : '<div class="columns twelve">\
          <div id="datatable_cluster_datastores_info_div">\
            <table id="datatable_cluster_datastores_info_panel" class="table twelve">' +
              datastore_datatable_table_tmpl +
            '</table>\
          </div>\
        </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_host_tab",cluster_host_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_vnet_tab",cluster_vnet_tab);
    Sunstone.updateInfoPanelTab("cluster_info_panel","cluster_datastore_tab",cluster_datastore_tab);

    Sunstone.popUpInfoPanel("cluster_info_panel", "clusters-tab");

    $("#cluster_info_panel_refresh", $("#cluster_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Cluster.showinfo', cluster_info.ID);
    })

    // Hosts datatable

    dataTable_cluster_hosts_panel = $("#datatable_cluster_hosts_info_panel").dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": { //exclude checkbox column
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "35px", "aTargets": [9] },
            { "bVisible": false, "aTargets": [0,3,5,6,7,8,10,11,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    // Virtual networks datatable

    dataTable_cluster_vnets_panel = $("#datatable_cluster_vnets_info_panel", dialog).dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,5,6,7]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    // Datastores datatable

    dataTable_cluster_datastores_panel = $("#datatable_cluster_datastores_info_panel", dialog).dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,5,6,7,8,9] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    // initialize datatables values
    Sunstone.runAction("ClusterHostInfo.list");
    Sunstone.runAction("ClusterVNInfo.list");
    Sunstone.runAction("ClusterDSInfo.list");
}

// Basically, we show the hosts/datastore/vnets tab, but before we set
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

//Prepares the autorefresh for hosts
function setClusterAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_clusters);
        var  filter = $("#cluster_search").attr('value');
        if ((checked.length==0) && !filter){
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
    var tab_name = "clusters-tab"

    //prepare host datatable
    dataTable_clusters = $("#datatable_clusters",main_tabs_context).dataTable({
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "35px", "aTargets": [0] },
            { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
            { "bVisible": false, "aTargets": ['_all']}
        ]
    });

    $('#cluster_search').keyup(function(){
      dataTable_clusters.fnFilter( $(this).val() );
    })

    dataTable_clusters.on('draw', function(){
      recountCheckboxes(dataTable_clusters);
    })

    Sunstone.runAction("Cluster.list");

    dialogs_context.append('<div title=\"'+tr("Create cluster")+'\" id="create_cluster_dialog"></div>');

    setClusterAutorefresh();
    clusterResourceViewListeners();

    initCheckAllBoxes(dataTable_clusters);
    tableCheckboxesListener(dataTable_clusters);
    infoListener(dataTable_clusters, "Cluster.showinfo");
});
