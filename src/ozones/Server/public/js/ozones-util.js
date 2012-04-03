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


function updateHostsList(req,list,tag,zone_id,zone_name){
    var hostDataTable = $(tag).dataTable();
    var hosts_array = [];

    $.each(list,function(){
        hosts_array.push(hostElementArray(this,zone_id,zone_name));
    });
    if (!zone_id) { hostDataTable.fnClearTable();}
    hostDataTable.fnAddData(hosts_array);
    hostDataTable.fnDraw(false);
}

function updateVMsList(req,list,tag,zone_id,zone_name){
    var vmsDataTable = $(tag).dataTable();
    var vms_array = [];

    var ip_str = function ip_str(vm){
        var nic = vm.TEMPLATE.NIC;
        var ip = '--';
        if ($.isArray(nic)) {
            ip = '';
            $.each(nic, function(index,value){
                ip += value.IP+'<br />';
            });
        } else if (nic && nic.IP) {
            ip = nic.IP;
        };
        return ip;
    };

    $.each(list,function(){
        var vm = this.VM;
        var state = oZones.Helper.resource_state("vm",vm.STATE);
        var hostname = "--";
        var ip = ip_str(vm);

        if (state == "ACTIVE" || state == "SUSPENDED"){
            if (vm.HISTORY_RECORDS.HISTORY.constructor == Array){
                hostname = vm.HISTORY_RECORDS.HISTORY[vm.HISTORY_RECORDS.HISTORY.length-1].HOSTNAME;
            } else {
                hostname = vm.HISTORY_RECORDS.HISTORY.HOSTNAME;
            };
        };

        if (state == "ACTIVE") {
            state = oZones.Helper.resource_state("vm_lcm",vm.LCM_STATE);
        }

        if (zone_id){
            vms_array.push([
                zone_id,
                zone_name,
                vm.ID,
                vm.UNAME,
                vm.GNAME,
                vm.NAME,
                state,
                vm.CPU,
                humanize_size(vm.MEMORY),
                hostname,
                ip,
                pretty_time(vm.STIME)
            ]);
        } else {
            vms_array.push([
                vm.ID,
                vm.UNAME,
                vm.GNAME,
                vm.NAME,
                state,
                vm.CPU,
                humanize_size(vm.MEMORY),
                hostname,
                ip,
                pretty_time(vm.STIME)
            ]);
        };
    });

    vmsDataTable.fnAddData(vms_array);
    vmsDataTable.fnDraw(false);
};

function updateVNsList(req,list,tag,zone_id,zone_name){
    var vnDataTable = $(tag).dataTable();
    var vn_array = [];

    $.each(list,function(){
        var network = this.VNET;
        var total_leases = "0";
        if (network.TOTAL_LEASES){
            total_leases = network.TOTAL_LEASES;
        } else if (network.LEASES && network.LEASES.LEASE){
            total_leases = network.LEASES.LEASE.length ? network.LEASES.LEASE.length : "1";
        }

        if (zone_id) {
            vn_array.push([
                zone_id,
                zone_name,
                network.ID,
                network.UNAME,
                network.GNAME,
                network.NAME,
                network.CLUSTER.length ? network.CLUSTER : "-",
                parseInt(network.TYPE) ? "FIXED" : "RANGED",
                network.BRIDGE,
                total_leases
            ]);
        } else {
            vn_array.push([
                network.ID,
                network.UNAME,
                network.GNAME,
                network.NAME,
                network.CLUSTER.length ? network.CLUSTER : "-",
                parseInt(network.TYPE) ? "FIXED" : "RANGED",
                network.BRIDGE,
                total_leases
            ]);
        }
    });

    vnDataTable.fnAddData(vn_array);
    vnDataTable.fnDraw(false);
};

function updateTemplatesList(req,list,tag,zone_id,zone_name){
    var templateDataTable = $(tag).dataTable();
    var template_array = [];

    $.each(list,function(){
        var template = this.VMTEMPLATE;
        if (zone_id){
            template_array.push([
                zone_id,
                zone_name,
                template.ID,
                template.UNAME,
                template.GNAME,
                template.NAME,
                pretty_time(template.REGTIME),
            ]);
        } else {
            template_array.push([
                template.ID,
                template.UNAME,
                template.GNAME,
                template.NAME,
                pretty_time(template.REGTIME),
           ]);
        };
    });
    templateDataTable.fnAddData(template_array);
    templateDataTable.fnDraw(false);
}

function updateUsersList(req,list,tag, zone_id,zone_name){
    var userDataTable = $(tag).dataTable();
    var user_array = [];

    $.each(list,function(){
        var user = this.USER;
        var name = "";
        var group_str = "";
        if (user.NAME && user.NAME != {}){
            name = user.NAME;
        }

        // if (user.GROUPS.ID){
        //     $.each(user.GROUPS.ID,function() {
        //         groups_str += this +", ";
        //     });
        // }
        if (zone_id){
            user_array.push([
                zone_id,
                zone_name,
                user.ID,
                name
            ]);
        } else {
            user_array.push([
                user.ID,
                name
            ]);
        }

    });
    userDataTable.fnAddData(user_array);
    userDataTable.fnDraw(false);
};

function updateImagesList(req,list,tag,zone_id,zone_name){
    var imageDataTable = $(tag).dataTable();
    var image_array = [];

    $.each(list,function(){
        var image = this.IMAGE;

        if (zone_id) {
            image_array.push([
                zone_id,
                zone_name,
                image.ID,
                image.UNAME,
                image.GNAME,
                image.NAME,
                oZones.Helper.image_type(image.TYPE),
                pretty_time(image.REGTIME),
                parseInt(image.PERSISTENT) ? "yes" : "no",
                oZones.Helper.resource_state("image",image.STATE),
                image.RUNNING_VMS
            ]);
        } else {
            image_array.push([
                image.ID,
                image.UNAME,
                image.GNAME,
                image.NAME,
                oZones.Helper.image_type(image.TYPE),
                pretty_time(image.REGTIME),
                parseInt(image.PERSISTENT) ? "yes" : "no",
                oZones.Helper.resource_state("image",image.STATE),
                image.RUNNING_VMS
            ]);
        };
    });
    imageDataTable.fnAddData(image_array);
    imageDataTable.fnDraw(false);
};


function hostElementArray(host,zone_id,zone_name){

    host = host.HOST;

    //Calculate some values
    var acpu = parseInt(host.HOST_SHARE.MAX_CPU);
    if (!acpu) {acpu=100};
    acpu = acpu - parseInt(host.HOST_SHARE.CPU_USAGE);

    var total_mem = parseInt(host.HOST_SHARE.MAX_MEM);
    var free_mem = parseInt(host.HOST_SHARE.FREE_MEM);

    var ratio_mem = 0;
    if (total_mem) {
        ratio_mem = Math.round(((total_mem - free_mem) / total_mem) * 100);
    }


    var total_cpu = parseInt(host.HOST_SHARE.MAX_CPU);
    var used_cpu = Math.max(total_cpu - parseInt(host.HOST_SHARE.USED_CPU),acpu);

    var ratio_cpu = 0;
    if (total_cpu){
        ratio_cpu = Math.round(((total_cpu - used_cpu) / total_cpu) * 100);
    }


    //progressbars html code - hardcoded jquery html result
     var pb_mem =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_mem+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_mem+'%;"/>\
    <span style="position:relative;left:68px;top:-4px;font-size:0.6em">'+ratio_mem+'%</span>\
    </div>\
</div>';

    var pb_cpu =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_cpu+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_cpu+'%;"/>\
    <span style="position:relative;left:68px;top:-4px;font-size:0.6em">'+ratio_cpu+'%</span>\
    </div>\
</div>';

    if (zone_id){
        return [
            zone_id,
            zone_name,
            host.ID,
            host.NAME,
            host.CLUSTER.length ? host.CLUSTER : "-",
            host.HOST_SHARE.RUNNING_VMS, //rvm
            pb_cpu,
            pb_mem,
            oZones.Helper.resource_state("host_simple",host.STATE) ];
    };

    return [
        host.ID,
        host.NAME,
        host.CLUSTER.length ? host.CLUSTER : "-",
        host.HOST_SHARE.RUNNING_VMS, //rvm
        pb_cpu,
        pb_mem,
        oZones.Helper.resource_state("host_simple",host.STATE) ];
};


function updateClustersList(req,list,tag, zone_id,zone_name){
    var dataTable = $(tag).dataTable();
    var array = [];

    $.each(list,function(){
        var cluster = this.CLUSTER;

        if (zone_id){
            array.push([
                zone_id,
                zone_name,
                cluster.ID,
                cluster.NAME
            ]);
        } else {
            array.push([
                cluster.ID,
                cluster.NAME
            ]);
        };

    });
    dataTable.fnAddData(array);
    dataTable.fnDraw(false);
};

function updateDatastoresList(req,list,tag, zone_id,zone_name){
    var dataTable = $(tag).dataTable();
    var array = [];

    $.each(list,function(){
        var ds = this.DATASTORE;

        if (zone_id){
            array.push([
                zone_id,
                zone_name,
                ds.ID,
                ds.UNAME,
                ds.GNAME,
                ds.NAME,
                ds.CLUSTER.length ? ds.CLUSTER : "-",
            ]);
        } else {
            array.push([
                ds.ID,
                ds.UNAME,
                ds.GNAME,
                ds.NAME,
                ds.CLUSTER.length ? ds.CLUSTER : "-",
            ]);
        };

    });
    dataTable.fnAddData(array);
    dataTable.fnDraw(false);
};
