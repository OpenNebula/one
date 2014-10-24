/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

var vnet_datatable_table_tmpl='<thead>\
      <tr>\
        <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
        <th>'+tr("ID")+'</th>\
        <th>'+tr("Owner")+'</th>\
        <th>'+tr("Group")+'</th>\
        <th>'+tr("Name")+'</th>\
        <th>'+tr("Reservation")+'</th>\
        <th>'+tr("Cluster")+'</th>\
        <th>'+tr("Bridge")+'</th>\
        <th>'+tr("Leases")+'</th>\
        <th>'+tr("VLAN ID")+'</th>\
      </tr>\
    </thead>\
    <tbody id="tbody_cluster_vnetworks">\
    </tbody>'

var datastore_datatable_table_tmpl='<thead>\
      <tr>\
        <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
        <th>'+tr("ID")+'</th>\
        <th>'+tr("Owner")+'</th>\
        <th>'+tr("Group")+'</th>\
        <th>'+tr("Name")+'</th>\
        <th style="width:25%;">'+tr("Capacity")+'</th>\
        <th>'+tr("Cluster")+'</th>\
        <th>'+tr("Basepath")+'</th>\
        <th>'+tr("TM MAD")+'</th>\
        <th>'+tr("DS MAD")+'</th>\
        <th>'+tr("Type")+'</th>\
      </tr>\
    </thead>\
    <tbody id="tbody_cluster_datastores">\
    </tbody>'


var create_cluster_tmpl ='<div class="row">\
    <div class="large-12 columns">\
      <h3 id="create_cluster_header" class="subheader">'+tr("Create Cluster")+'</h3>\
      <h3 id="update_cluster_header" class="subheader">'+tr("Update Cluster")+'</h3>\
    </div>\
  </div>\
  <div class="reveal-body">\
  <form id="cluster_create_tabs" class="custom">\
  <div class="row">\
    <div class="large-6 columns">\
      <label for="name">' + tr("Name")  + '</label>\
      <input type="text" name="name" id="name" />\
    </div>\
    <div class="large-6 columns">\
      <dl class="tabs right-info-tabs text-center right" data-tab>\
          <dd class="active"><a href="#tab-hostsTab"><i class="fa fa-hdd-o"></i><br>'+tr("Hosts")+'</a></dd>\
          <dd><a href="#tab-vnetsTab"><i class="fa fa-upload"></i><br>'+tr("VNets")+'</a></dd>\
          <dd><a href="#tab-datastoresTab"><i class="fa fa-folder-open"></i><br>'+tr("Datastores")+'</a></dd>\
      </dl>\
    </div>\
  </div>\
  <div class="tabs-content">\
    <div id="tab-hostsTab" class="active content">\
      '+generateHostTableSelect("cluster_wizard_hosts")+'\
    </div>\
    <div id="tab-vnetsTab" class="content">\
      <div class="row">\
        <div class="large-8 columns">\
            <button id="refresh_vnet_table_button_class" class="button small radius secondary action_button" value="ClusterVN.list"><i class="fa fa-refresh" /></button>\
        </div>\
        <div class="large-4 columns">\
          <input id="cluster_vnets_search" type="text" class="search" placeholder="'+tr("Search")+'"/>\
        </div>\
      </div>\
      <div id="datatable_cluster_vnets_div">\
        <div class="large-12 columns">\
            <table id="datatable_cluster_vnets" class="table twelve">' + vnet_datatable_table_tmpl + '</table>\
        </div>\
      </div>\
      <br>\
      <div class="row">\
        <div id="selected_vnets_div" class="large-12 columns">\
          <span id="select_cluster_vnets" class="radius secondary label">'+tr("Please select one or more vnets from the list")+'</span>\
          <span id="cluster_vnets_selected" class="radius secondary label hidden">'+tr("You selected the following vnets:")+'</span>\
        </div>\
      </div>\
    </div>\
    <div id="tab-datastoresTab" class="content">\
      <div class="row">\
        <div class="large-8 columns">\
            <button id="refresh_datastore_table_button_class" class="button small radius secondary action_button" value="ClusterDS.list"><i class="fa fa-refresh" /></button>\
        </div>\
        <div class="large-4 columns">\
          <input id="cluster_datastores_search" type="text" class="search" placeholder="'+tr("Search")+'"/>\
        </div>\
      </div>\
      <div id="datatable_cluster_datastores_div">\
        <div class="large-12 columns">\
            <table id="datatable_cluster_datastores" class="table twelve">' + datastore_datatable_table_tmpl + '</table>\
        </div>\
      </div>\
      <div class="row">\
        <div id="selected_datastores_div" class="large-12 columns">\
          <span id="select_cluster_datastores" class="radius secondary label">'+tr("Please select one or more datastores from the list")+'</span>\
          <span id="cluster_datastores_selected" class="radius secondary label hidden">'+tr("You selected the following datastores:")+'</span>\
        </div>\
      </div>\
    </div>\
  </div>\
</form>\
</div>\
<div class="reveal-footer">\
  <div class="form_buttons row">\
      <button class="button success right radius" type="submit" id="create_cluster_submit" value="OpenNebula.Cluster.create">' + tr("Create") + '</button>\
      <button class="button right radius" type="submit" id="update_cluster_submit">' + tr("Update") + '</button>\
  </div>\
</div>\
<a class="close-reveal-modal">&#215;</a>';

// Common utils for datatatables
  // Holds the selected items
selected_vnets_list     = {};
selected_datastore_list = {};

vnet_row_hash           = {};
datastore_row_hash      = {};

// Prepares the cluster creation dialog
function setupCreateClusterDialog(){

    reset_counters();

    $("#create_cluster_dialog").remove();
    dialogs_context.append('<div id="create_cluster_dialog"></div>');

    $create_cluster_dialog = $('div#create_cluster_dialog');
    var dialog = $create_cluster_dialog;

    dialog.html(create_cluster_tmpl);
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");

    var opts = {
        multiple_choice: true
    };

    setupHostTableSelect(dialog, "cluster_wizard_hosts", opts);


    dataTable_cluster_vnets = $("#datatable_cluster_vnets", dialog).dataTable({
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,7]}
        ]
    });


    $('#cluster_vnets_search', dialog).keyup(function(){
      dataTable_cluster_vnets.fnFilter( $(this).val() );
    })

    dataTable_cluster_datastores = $("#datatable_cluster_datastores", dialog).dataTable({
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,7,8,9] }
        ]
    });


    $('#cluster_datastores_search', dialog).keyup(function(){
      dataTable_cluster_datastores.fnFilter( $(this).val() );
    })


    //  ------- End of create the dialog datatables ------------

    $('#datatable_cluster_vnets tbody', dialog).delegate("tr", "click", function(e){
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
            $('div#selected_vnets_div', dialog).append('<span id="tag_vnets_'+vnet_id+'" class="radius label">'+name+' <span class="fa fa-times blue"></span></span> ');
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


      $('#datatable_cluster_datastores tbody', dialog).delegate("tr", "click", function(e){
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
            $('div#selected_datastores_div', dialog).append('<span id="tag_datastores_'+ds_id+'" class="radius label">'+name+' <span class="fa fa-times blue"></span></span> ');
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
     $( "#cluster_create_tabs span.fa.fa-times",$create_cluster_dialog).die();
     $( "#cluster_create_tabs span.fa.fa-times" ).live( "click", function() {
       // Remove the tag
       $(this).parent().remove();

       // Unselect row
       var id = $(this).parent().attr("ID");

       if (id.match(/vnet/g))
       {
            var vnet_id=id.substring(10,id.length);
            delete selected_vnets_list[vnet_id];
            $("td:first", vnet_row_hash[vnet_id]).parent().children().each(function(){$(this).removeClass('markrowchecked');});

            if ($.isEmptyObject(selected_vnets_list)) {
              $('#cluster_vnets_selected',  dialog).hide();
              $('#select_cluster_vnets', dialog).show();
            }

       }
       else if (id.match(/datastore/g))
       {
            var datastore_id=id.substring(15,id.length);
            delete selected_datastore_list[datastore_id];
            $("td:first", datastore_row_hash[datastore_id]).parent().children().each(function(){$(this).removeClass('markrowchecked');});

            if ($.isEmptyObject(selected_datastore_list)) {
              $('#cluster_datastores_selected',  dialog).hide();
              $('#select_cluster_datastores', dialog).show();
            }
       }
     });

    $("#refresh_vnet_table_button_class", dialog).click( function(){
       Sunstone.runAction("ClusterVN.list");
       return false;
      }
    );

    $("#refresh_datastore_table_button_class", dialog).click( function(){
       Sunstone.runAction("ClusterDS.list");
       return false;
      }
    );

    // Handle the Create button
    $('#create_cluster_submit').click(function(){


        if (!($('input#name',dialog).val().length)){
            notifyError(tr("Cluster name missing!"));
            return false;
        }

        var selected_hosts_arr = retrieveHostTableSelect(dialog, "cluster_wizard_hosts");

        var selected_hosts_list = {};

        $.each(selected_hosts_arr, function(i,e){
            selected_hosts_list[e] = 1;
        });

        var cluster_json = {
            "cluster": {
                "name": $('#name',dialog).val(),
                "hosts": selected_hosts_list,
                "vnets": selected_vnets_list,
                "datastores": selected_datastore_list
            }
        };

        // Create the OpenNebula.Cluster.
        Sunstone.runAction("Cluster.create",cluster_json);
        return false;
    });
}

function reset_counters(){
    selected_vnets_list     = {};
    selected_datastore_list = {};

    original_vnets_list     = {};
    original_datastores_list = {};

    vnet_row_hash           = {};
    datastore_row_hash      = {};
}

// Open creation dialogs
function popUpCreateClusterDialog(){
    if (!$create_cluster_dialog || $create_cluster_dialog.html() == "") {
        setupCreateClusterDialog();
    }

    $create_cluster_dialog.die();

    // Activate create button
    $('#create_cluster_submit',$create_cluster_dialog).show();
    $('#update_cluster_submit',$create_cluster_dialog).hide();
    $('#create_cluster_header',$create_cluster_dialog).show();
    $('#update_cluster_header',$create_cluster_dialog).hide();

    refreshHostTableSelect($create_cluster_dialog, "cluster_wizard_hosts");
    Sunstone.runAction("ClusterVN.list");
    Sunstone.runAction("ClusterDS.list");

    $create_cluster_dialog.foundation().foundation('reveal', 'open');

    $("input#name",$create_cluster_dialog).focus();

    return false;
}

// Open update dialog
function popUpUpdateClusterDialog(){

    var selected_nodes = getSelectedNodes(dataTable_clusters);

    if ( selected_nodes.length != 1 )
    {
      notifyError(tr("Please select one (and just one) cluster to update."));
      return false;
    }

    var dialog = $create_cluster_dialog;

    if ($("#create_cluster_dialog")) {
        dialog.html("");
    }

    setupCreateClusterDialog();

    // Activate update button
    $('#create_cluster_submit',$create_cluster_dialog).hide();
    $('#update_cluster_submit',$create_cluster_dialog).show();
    $('#create_cluster_header',$create_cluster_dialog).hide();
    $('#update_cluster_header',$create_cluster_dialog).show();

    Sunstone.runAction("Cluster.show_to_update", selected_nodes[0]);

    $create_cluster_dialog.die();
    $create_cluster_dialog.live('closed', function () {
        $("#create_cluster_dialog").html("");
        setupCreateClusterDialog();
    });

    $create_cluster_dialog.foundation().foundation('reveal', 'open');

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

  // Fill in the name
  $('#name',dialog).val(name);
  $('#name',dialog).attr("disabled", "disabled");

  var original_hosts_list = [];

  // Select hosts belonging to the cluster
  if (host_ids)
  {
    original_hosts_list = host_ids;
    var opts = {
        ids : host_ids
    }

    selectHostTableSelect(dialog, "cluster_wizard_hosts", opts);

/*
    dataTable_cluster_hosts.on('draw', function(){
        dataTable_cluster_hosts.unbind('draw');
        var rows = dataTable_cluster_hosts.fnGetNodes();

        for (var i = 0; i < host_ids.length; i++)
        {
          for(var j=0;j<rows.length;j++){
            var current_row = $(rows[j]);
            var row_host_id = $(rows[j]).find("td:eq(0):not(.markrowchecked)").html();
            var host_name   = $(rows[j]).find("td:eq(1):not(.markrowchecked)").html();

            if (host_name)
            {
              if (row_host_id == host_ids[i])
              {
                  current_row.click();
              }
            }
          }
        }

        original_hosts_list      = $.extend({}, selected_hosts_list);
    });
//*/
  }

  if (vnet_ids)
  {
    dataTable_cluster_vnets.on('draw', function(){
        dataTable_cluster_vnets.unbind('draw');
        var rows = dataTable_cluster_vnets.fnGetNodes();
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

        original_vnets_list      = $.extend({}, selected_vnets_list);
    });
  }

  if (ds_ids)
  {
    dataTable_cluster_datastores.on('draw', function(){
        dataTable_cluster_datastores.unbind('draw');
        var rows = dataTable_cluster_datastores.fnGetNodes();
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

        original_datastores_list = $.extend({}, selected_datastore_list);
    });
  }

  // Clone already existing resources (to keep track)
  cluster_to_update_id     = response.CLUSTER.ID;

    refreshHostTableSelect(dialog, "cluster_wizard_hosts");
    Sunstone.runAction("ClusterVN.list");
    Sunstone.runAction("ClusterDS.list");

  // Define update button
  $('#update_cluster_submit').click(function(){

      // find out which ones are in and out
      var selected_hosts_list = retrieveHostTableSelect(dialog, "cluster_wizard_hosts");

      $.each(selected_hosts_list, function(i,host_id){
        if (original_hosts_list.indexOf(host_id) == -1)
        {
          Sunstone.runAction("Cluster.addhost",cluster_to_update_id,host_id);
        }        
      });

      $.each(original_hosts_list, function(i,host_id){
        if (selected_hosts_list.indexOf(host_id) == -1)
        {
          Sunstone.runAction("Cluster.delhost",cluster_to_update_id,host_id);
        }
      });

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

      $create_cluster_dialog.foundation('reveal', 'close')

      Sunstone.runAction('Cluster.list');

      return false;
  });
}

/* -------- Virtual Networks datatable -------- */

//Setup actions
var cluster_vnet_actions = {

    "ClusterVN.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: function(request,vnet_list){
          updateClusterVNetworksView(request,vnet_list);
          dataTable_cluster_vnets.fnSort( [ [1,config['user_config']['table_order']] ] );
        },
        error: onError
    },

    "ClusterVNInfo.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: function(request,vnet_list){
          updateClusterVNetworksInfoView(request,vnet_list);
          dataTable_cluster_vnets_panel.fnSort( [ [1,config['user_config']['table_order']] ] );
        },
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
          dataTable_cluster_datastores.fnSort( [ [1,config['user_config']['table_order']] ] );
        },
        error: onError
    },

    "ClusterDSInfo.list" : {
        type: "list",
        call: OpenNebula.Datastore.list,
        callback: function(request,ds_list){
          updateClusterDatastoresInfoView(request,ds_list);
          dataTable_cluster_datastores_panel.fnSort( [ [1,config['user_config']['table_order']] ] );
        },
        error: onError
    }
}

//updates the list of datastores for Create dialog
function updateClusterDatastoresView(request, list){
    var list_array = [];

    $.each(list,function(){
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
var dataTable_clusters;
var $create_cluster_dialog;


//Setup actions
var cluster_actions = {

    "Cluster.create" : {
        type: "create",
        call: OpenNebula.Cluster.create,
        callback: function(request, response){
            // Reset the create wizard
            $create_cluster_dialog.foundation('reveal', 'close');
            $create_cluster_dialog.empty();
            setupCreateClusterDialog();

            addClusterElement(request, response);
//            Sunstone.runAction('Cluster.list');

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
            notifyCustom(tr("Cluster created"), " ID: " + response.CLUSTER.ID, false);
        },
        error: onError
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
        callback: function(request, response) {
            updateClusterElement(request, response);
            if (Sunstone.rightInfoVisible($("#clusters-tab"))) {
                updateClusterInfo(request, response);
            }
        },
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
          var tab = dataTable_clusters.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Cluster.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_clusters);
            Sunstone.runAction("Cluster.list", {force: true});
          }
        },
        error: onError
    },

    "Cluster.addhost" : {
        type: "single",
        call : OpenNebula.Cluster.addhost,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("HOST");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.delhost" : {
        type: "single",
        call : OpenNebula.Cluster.delhost,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("HOST");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.adddatastore" : {
        type: "single",
        call : OpenNebula.Cluster.adddatastore,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("DATASTORE");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.deldatastore" : {
        type: "single",
        call : OpenNebula.Cluster.deldatastore,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("DATASTORE");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.addvnet" : {
        type: "single",
        call : OpenNebula.Cluster.addvnet,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("VNET");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.delvnet" : {
        type: "single",
        call : OpenNebula.Cluster.delvnet,
        callback : function (req) {
            OpenNebula.Helper.clear_cache("VNET");
            Sunstone.runAction('Cluster.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Cluster.delete" : {
        type: "multiple",
        call : OpenNebula.Cluster.del,
        callback : deleteClusterElement,
        elements: clusterElements,
        error : onError
    },

    "Cluster.update_template" : {  // Update template
        type: "single",
        call: OpenNebula.Cluster.update,
        callback: function(request,response){
           Sunstone.runAction('Cluster.show',request.request.data[0][0]);
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

    "Cluster.rename" : {
        type: "single",
        call: OpenNebula.Cluster.rename,
        callback: function(request) {
            Sunstone.runAction('Cluster.show',request.request.data[0]);
        },
        error: onError
    }
};

var cluster_buttons = {
    "Cluster.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Cluster.update_dialog" : {
        type : "action",
        layout: "main",
        text : tr("Update")
    },
    "Cluster.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
};

var clusters_tab = {
    title: tr("Clusters"),
    resource: 'Cluster',
    buttons: cluster_buttons,
    showOnTopMenu: false,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="cluster_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-th"></i>&emsp;'+tr("Clusters"),
    info_header: '<i class="fa fa-fw fa-th"></i>&emsp;'+tr("Cluster"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_clusters" class="datatable twelve">\
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
    </table>'
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

//callback for an action affecting a cluster element
function updateClusterElement(request, element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    updateSingleElement(element,dataTable_clusters,'#cluster_'+id);
}

//callback for actions deleting a cluster element
function deleteClusterElement(req){
    deleteElement(dataTable_clusters,'#cluster_'+req.request.data);
    $('div#cluster_tab_'+req.request.data,main_tabs_context).remove();
}

//call back for actions creating a cluster element
function addClusterElement(request,element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    addElement(element,dataTable_clusters);
}

//callback to update the list of clusters.
function updateClustersView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(clusterElementArray(this));
    });

    updateView(list_array,dataTable_clusters);
};


// Updates the cluster info panel tab content and pops it up
function updateClusterInfo(request,cluster){
    cluster_info     = cluster.CLUSTER;
    cluster_template = cluster_info.TEMPLATE;

    //Information tab
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_cluster_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' +tr("Information") +'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td" colspan="2">'+cluster_info.ID+'</td>\
            </tr>'+
            insert_rename_tr(
                'clusters-tab',
                "Cluster",
                cluster_info.ID,
                cluster_info.NAME)+
           '</tbody>\
         </table>\
       </div>\
       <div class="large-6 columns">' +
       '</div>\
     </div>\
     <div class="row">\
          <div class="large-9 columns">'+
               insert_extended_template_table(cluster_template,
                                         "Cluster",
                                         cluster_info.ID,
                                         tr("Attributes")) +
       '</div>\
     </div>'
    }

    var cluster_host_tab = {
        title: tr("Hosts"),
        icon: "fa-hdd-o",
        content : '<div class="row">\
          <div id="datatable_cluster_hosts_info_div" class="large-12 columns">\
            '+generateHostTableSelect("cluster_info_hosts")+'\
          </div>\
        </div>'
    }

    var cluster_vnet_tab = {
        title: tr("VNets"),
        icon: "fa-globe",
        content : '<div class="row">\
          <div id="datatable_cluster_vnets_info_div" class="large-12 columns">\
            <table id="datatable_cluster_vnets_info_panel" class="table twelve">' +
              vnet_datatable_table_tmpl +
            '</table>\
          </div>\
        </div>'
    }

    var cluster_datastore_tab = {
        title: tr("Datastores"),
        icon: "fa-folder-open",
        content : '<div class="row">\
          <div id="datatable_cluster_datastores_info_div" class="large-12 columns">\
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

    // Hosts datatable

    var host_ids = cluster_info.HOSTS.ID;

    if (typeof host_ids == 'string'){
        host_ids = [host_ids];
    } else if (host_ids == undefined){
        host_ids = [];
    }

    var opts = {
        read_only: true,
        fixed_ids: host_ids
    }

    setupHostTableSelect($("#cluster_info_panel"), "cluster_info_hosts", opts);

    refreshHostTableSelect($("#cluster_info_panel"), "cluster_info_hosts");

    // Virtual networks datatable

    dataTable_cluster_vnets_panel = $("#datatable_cluster_vnets_info_panel").dataTable({
        "sDom" : "<'H'>t<'row'<'large-6 columns'i><'large-6 columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,5,6,7]}
        ]
    });

    infoListener(dataTable_cluster_vnets_panel,'Network.show','vnets-tab');

    // Datastores datatable

    dataTable_cluster_datastores_panel = $("#datatable_cluster_datastores_info_panel").dataTable({
        "sDom" : "<'H'>t<'row'<'large-6 columns'i><'large-6 columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,7,8,9] }
        ]
    });

    infoListener(dataTable_cluster_datastores_panel,'Datastore.show','datastores-tab');

    // initialize datatables values
    Sunstone.runAction("ClusterVNInfo.list");
    Sunstone.runAction("ClusterDSInfo.list");
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the host datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = "clusters-tab"

    if (Config.isTabEnabled(tab_name)) {
      //prepare clusters datatable
      dataTable_clusters = $("#datatable_clusters",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ],
          "bSortClasses" : false,
          "bDeferRender": true
      });

      $('#cluster_search').keyup(function(){
        dataTable_clusters.fnFilter( $(this).val() );
      })

      dataTable_clusters.on('draw', function(){
        recountCheckboxes(dataTable_clusters);
      })

      Sunstone.runAction("Cluster.list");

      setupCreateClusterDialog();

      initCheckAllBoxes(dataTable_clusters);
      tableCheckboxesListener(dataTable_clusters);
      infoListener(dataTable_clusters, "Cluster.show");
      dataTable_clusters.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
