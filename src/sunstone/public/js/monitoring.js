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


var SunstoneMonitoringConfig = {}
var SunstoneMonitoring = {
    monitor : function(resource, list){

        if (!SunstoneMonitoringConfig[resource])
            return false

        var monConfigs = SunstoneMonitoringConfig[resource].monitor
        var monitoring = {}
        for (conf in monConfigs){
            var conf_obj = monConfigs[conf]
            var plotID = conf
            var series = conf_obj.operation(resource, list, conf_obj)
            monitoring[plotID]=series
        }

        //Call back after monitorization is done
        SunstoneMonitoringConfig[resource].plot(monitoring)
    },
    plot : function(resource,plotID,container,series){
        var config = SunstoneMonitoringConfig[resource].monitor[plotID]
        var options = config.plotOptions
        $.plot(container,series,options)
    },
    ops : {
        partition : function(resource,list,config){
            var path = config.path
            var partitionPath = config.partitionPath
            var dataType = config.dataType
            var partitions = {}
            for (var i=0; i< list.length; i++){
                var elem = list[i][resource]
                var value = path ? parseInt(explore_path(elem,path),10) : 1
                var partition = explore_path(elem, partitionPath)

                //Things on cluster none
                if ((partitionPath == "CLUSTER" && !partition.length) ||
                    (partitionPath == "CLUSTER_ID" && partition == "-1"))
                    partition = "none"

                if (!partitions[partition])
                    partitions[partition] = value
                else
                    partitions[partition] += value
            }

            var series = []
            var axis_labels = []
            var i = 0;
            for (partition in partitions) {
                var value = partitions[partition]
                var data;
                switch (dataType){
                case "pie":
                    data = value; break
                case "bars":
                    data = [[i,value]]; break
                case "horizontal_bars":
                    data = [[value,i]]; break
                default:
                    data = value;
                }
                axis_labels.push([i,partition])
                var color = config.colorize ? config.colorize(partition) : null
                series.push({ label: partition,
                             data: data,
                             color: color
                           })
                i++
            }

            if (config.plotOptions.xaxis &&
                config.plotOptions.xaxis.customLabels == true){
                config.plotOptions.xaxis.ticks = axis_labels
                config.plotOptions.xaxis.tickSize = 1
            }

            return series
        },
        hostCpuUsagePartition : function(resource,list,config){
            partitions = {
                "Idle" : 0,
                "Ok" : 0,
                "Used" : 0,
                "Working" : 0,
                "Overloaded" : 0
            }

            for (var i=0; i< list.length; i++){
                var elem = list[i][resource]
                var value = elem.HOST_SHARE.USED_CPU * 100 /
                    elem.HOST_SHARE.MAX_CPU
                if (value > 80)
                    partitions["Overloaded"]++
                else if (value > 60)
                    partitions["Working"]++
                else if (value > 40)
                    partitions["Used"]++
                else if (value > 20)
                    partitions["Ok"]++
                else
                    partitions["Idle"]++
            }

            series = [];
            for (partition in partitions) {
                var data = partitions[partition]
                var color = config.colorize ? config.colorize(partition) : null
                series.push({ label: partition,
                              data: data,
                            })
            }
            return series
        },
        totalize : function(resource,list,config){
            return list.length
        },
        singleBar : function(resource,list,config){
            var paths = config.paths

            var totals = new Array(paths.length)
            for (var i=0; i< totals.length; i++) totals[i] = 0

            var series = []

            for (var i=0; i< list.length; i++){
                var elem = list[i][resource]
                for (var j=0; j< paths.length; j++)
                    totals[j] += parseInt(explore_path(elem,paths[j]),10)
            }

            for (var i=0; i< totals.length; i++){
                series.push({
                    data: [[totals[i],0]],
                    label: paths[i],
                    color: config.colorize? config.colorize(paths[i]) : null,
                })
            }
            return series
        }
    }
}

function explore_path(elem,path){
    if (!$.isArray(path)) //base case - non array
        return elem[path]
    else if (path.length == 1) //base case - array
        return elem[path[0]]
    else {//recurse
        var array = path.slice(0) //clone path
        var p = array.splice(0,1)
        return explore_path(elem[p],array)
    }
}
