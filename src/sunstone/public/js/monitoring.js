/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             */
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


/* This files act as helper to manage gathering and plotting of data
   in dashboards. */

// Monitoring configuration is composed of diferent configurations that can
// be added anytime. According to its values, data is gathered and processed
// for resources. Example:
/*
SunstoneMonitoringConfig['HOST'] = {
    plot: function(monitoring){
    // receives monitoring data object, with monitoring series
    // information for this resource. monitoring object contains one key per monitoring value below. Normally you can call SunstoneMonitoring.plot() directly
    // with each of the series
    },
    monitor : {
    //This object defines what data is collected and how. i.e.
        "statePie" : {
           // must be an element of resource object. If its a second level
           // key, then write as ['TEMPLATE','MAX_CPU']
            partitionPath: "STATE", //Will create a partition looking at...

            // A function that receives the list of elements and returns
            // a set of series with the relevant information ready
            // ready to be plotted
            operation: SunstoneMonitoring.ops.partition //processing function

            // "pie" or "bars", according to this the series will be
            // formatted in different ways.
            dataType: "pie", //In what format data is collected (for what plot)
            colorize: function(state){ //how to color the series.
            // ie. pie sectors depending on host state
                }
            },
            plotOptions : {
            //jquery flot plot options. See host plugin directly. This options
            //are passed to flot on SunstoneMonitoring.plot().
            }
        },
        "cpuPerCluster" : {
            path: ["HOST_SHARE","CPU_USAGE"], //second level data
            partitionPath: "CLUSTER_ID", //partition data according to...
            operation: SunstoneMonitoring.ops.partition, //processing
            dataType: "bars",
            plotOptions: {
            }
        }
        ...

See sunstone plugins for more info and examples
*/


var SunstoneMonitoringConfig = {}
var SunstoneMonitoring = {
    monitor : function(resource, list){
        // Runs the monitoring operation for each monitor object option
        // on the list of resources that comes as parameter.
        // Forms the monitoring object with the results and calls
        // the plotting function (defined in config).
        if (!SunstoneMonitoringConfig[resource])
            return false

        var monConfigs = SunstoneMonitoringConfig[resource].monitor
        var monitoring = {}
        for (conf in monConfigs){ //for each of the things we want to monitor
            var conf_obj = monConfigs[conf]
            var plotID = conf
            var series = conf_obj.operation(resource, list, conf_obj)
            monitoring[plotID]=series
        }

        SunstoneMonitoringConfig[resource].plot(monitoring)
    },
    plot : function(resource,plotID,container,series){
        // Calls the jQuery flot library plot()
        // with the plotOptions from the configuration for the resource.
        // If series (monitoring info) is empty, put message instead.
        var config = SunstoneMonitoringConfig[resource].monitor[plotID]
        var options = config.plotOptions

        if (!series.length){
            $(container).unbind();
            $(container).text(tr("No monitoring information available"));
        }
        else {
            $.plot(container,series,options)
        }
    },
    ops : {
        // Functions to process data contained in a list of resources in a
        // specific way. The result is a series array containing the
        // information, in the format jQuery flot expects it to plot.
        partition : function(resource,list,config){
            // Partitions data according to partitionPath.
            // That is, it groups resources according to the value of
            // partitionPath (for example, by CLUSTER), and counts
            // how many of them are in each group (so it can be plotted).
            // If path is provided (for example MEMORY),
            // then it sums the value of path, instead
            // of counting.

            // We use this for state pies, memory/cpu by cluster graphs,
            // users per group graphs...

            var path = config.path
            var partitionPath = config.partitionPath
            var dataType = config.dataType //which way the series should look like for flot

            var partitions = {}

            // for each element (for example HOST) in the list
            for (var i=0; i< list.length; i++){
                var elem = list[i][resource]
                var value = path ? parseInt(explore_path(elem,path),10) : 1
                var partition = explore_path(elem, partitionPath)

                // Things on cluster none hack
                if ((partitionPath == "CLUSTER" && !partition.length) ||
                    (partitionPath == "CLUSTER_ID" && partition == "-1"))
                    partition = "none"

                // If the partition group is not there, we create it
                if (!partitions[partition])
                    partitions[partition] = value
                // Otherwise we sum the value to it.
                else
                    partitions[partition] += value
            }

            // Now we have to format the data in the partitions according
            // to what flot expects.
            // Note that for bars the values of our x axis are fixed to
            // [0, 1, 2...] this values are later not shown or alternatively
            // the ticks are renamed with the axis_labels names.

            var series = []
            var axis_labels = []
            var i = 0;
            for (partition in partitions) { //for each partition
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
                // prepare labels for the axis ticks
                // for example CLUSTER names
                axis_labels.push([i,partition])

                // set color of this bar/pie sector
                var color = config.colorize ? config.colorize(partition) : null

                // push the data in the series
                series.push({ label: partition,
                             data: data,
                             color: color
                           })
                i++
            }
            // Modify configuration with custom labels.
            if (config.plotOptions.xaxis &&
                config.plotOptions.xaxis.customLabels == true){
                config.plotOptions.xaxis.ticks = axis_labels
                config.plotOptions.xaxis.tickSize = 1
            }

            return series
        },
        hostCpuUsagePartition : function(resource,list,config){
            // Work as function above, except that partition is pre-defined
            // and hosts are divided into them according to cpu usage.
            var partitions = {
                "Idle" : 0,
                "Ok" : 0,
                "Used" : 0,
                "Working" : 0,
                "Overloaded" : 0
            }

            if (!list.length) return [];

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

            var series = [];
            for (partition in partitions) {
                var data = partitions[partition]
                var color = config.colorize ? config.colorize(partition) : null
                series.push({ label: partition,
                              data: data
                            })
            }
            return series
        },
        totalize : function(resource,list,config){
            // just count how many items are in the list
            return list.length
        },
        singleBar : function(resource,list,config){
            // Paint data series on a single horizontal bar
            // For example used_memory together with memory_usage and max_memory
            // or net_tx vs. net_rx
            // For each data object in the series, a total sum is calculated

            var paths = config.paths // array of paths
            // each path can be an array too if it is >= 2nd level path

            // initialize sums
            var totals = new Array(paths.length)
            for (var i=0; i< totals.length; i++) totals[i] = 0

            var series = []

            // for each item (i.e. HOST), add the value of each of the paths
            // to the respective totals
            for (var i=0; i< list.length; i++){
                var elem = list[i][resource]
                for (var j=0; j< paths.length; j++)
                    totals[j] += parseInt(explore_path(elem,paths[j]),10)
            }

            // The totals have the sum of all items (for example of max_memory)
            // Now for each total we push it to the series object.
            for (var i=0; i< totals.length; i++){
                series.push({
                    data: [[totals[i],0]], //we paint on 0 value of y axis
                    // y axis labels will be hidden
                    label: paths[i],
                    color: config.colorize? config.colorize(paths[i]) : null
                })
            }
            return series
        }
    }
}


// This function explores a path in an element and returns the value.
// For example, if path = 'STATE' it will return elem.STATE. But if
// path = ['TEMPLATE','MAX_CPU'] it will return elem.TEMPLATE.MAX_CPU
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
