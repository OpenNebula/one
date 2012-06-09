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
                if (partitionPath == "CLUSTER" && !partition.length)
                    partition = "none"
                
                if (!partitions[partition])
                    partitions[partition] = value
                else
                    partitions[partition] += value
            }

            var series = []
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
                var color = config.colorize ? config.colorize(partition) : null
                series.push({ label: partition, 
                             data: data,
                             color: color
                           })
                i++
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
                var elem = list[i].HOST
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
                    color: config.colorize? config.colorize(paths[i]) : null
                })
            }
            return series
        }
    }
}


var SunstoneMonitoringConfig = {
    "HOST" : {
        plot: function(mon){
            plotHostMonitoring(mon) //not defined at parsing moment
        },
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
            "cpuPerCluster" : {
                path: ["HOST_SHARE","CPU_USAGE"],
                partitionPath: "CLUSTER_ID",
                operation: SunstoneMonitoring.ops.partition,
                dataType: "bars",
                plotOptions: {
                    series: { bars: {show: true, barWidth: 0.5 }},
                    xaxis: { show: false },
                    yaxis: { min: 0 },
                    legend : {
                        noColumns: 2,
                        labelFormatter: function(label){
                            if (label == "-1") return "none"
                            return getClusterName(label)
                        }
                    }
                }
            },
            "memoryPerCluster" : {
                path: ["HOST_SHARE","MEM_USAGE"],
                partitionPath: "CLUSTER_ID",
                operation: SunstoneMonitoring.ops.partition,
                dataType: "bars",
                plotOptions: {
                    series: { bars: {show: true, barWidth: 0.5 }},
                    xaxis: { show: false },
                    yaxis: { 
                        tickFormatter : function(val,axis) {
                            return humanize_size(val);
                        },
                        min: 0
                    },
                    legend : {
                        noColumns: 2,
                        labelFormatter: function(label){
                            if (label == "-1") return "none"
                            return getClusterName(label)
                        }
                    }
                }
            },
            "globalCpuUsage" : {
                partitionPath: ["HOST_SHARE", "USED_CPU"],
                dataType: "pie",
                operation: SunstoneMonitoring.ops.hostCpuUsagePartition,
                plotOptions: {
                    series: { pie: { show: true  } },
                }
            },
            "totalHosts" : {
                operation: SunstoneMonitoring.ops.totalize
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
                        container: '#cpuUsageBar_legend',
                        labelFormatter: function(label, series){
                            return label[1].toLowerCase()
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
                        container: '#memoryUsageBar_legend',
                        labelFormatter: function(label, series){
                            return label[1].toLowerCase()
                        }
                    }
                }
            },
        }
    },
    "USER" : {
        plot: function(mon){
            plotUserMonitoring(mon)
        },
        monitor: {
            "usersPerGroup" : {
                partitionPath: "GNAME",
                operation: SunstoneMonitoring.ops.partition,
                dataType: "bars",
                plotOptions: {
                    series: { bars: {show: true, barWidth: 0.5 }},
                    xaxis: { show: false },
                    yaxis: { tickDecimals: 0,
                             min: 0 },
                    legend : {
                        noColumns: 2,
                    }
                }
            },
            "totalUsers" : {
                operation: SunstoneMonitoring.ops.totalize
            },
        }
    },
    "ACL" : {
        plot: function(mon){
            plotAclMonitoring(mon)
        },
        monitor: {
            "totalAcls" : {
                operation: SunstoneMonitoring.ops.totalize
            }
        },
    },
    "GROUP" : {
        plot: function(mon){
            plotGroupMonitoring(mon)
        },
        monitor: {
            "totalGroups" : {
                operation: SunstoneMonitoring.ops.totalize
            }
        },
    },
    "VM" : {
        plot: function(mon){
            plotVMMonitoring(mon)
        },
        monitor: {
            "totalVMs" : {
                operation: SunstoneMonitoring.ops.totalize
            },
            "statePie" : {
                partitionPath: "STATE",
                operation: SunstoneMonitoring.ops.partition,
                dataType: "pie",
                colorize: function(state){
                    switch (state) {
                    case '0': return "rgb(160,160,160)" //light gray - init
                    case '1': return "rgb(239,201,86)" //yellow - pending
                    case '2': return "rgb(237,154,64)" //orange - hold
                    case '3': return "rgb(108,183,108)" //green - active
                    case '4': return "rgb(175,216,248)" //blue - stopped
                    case '5': return "rgb(112,164,205)" //dark blue - suspended
                    case '6': return "rgb(71,71,71)" //gray - done
                    case '7': return "rgb(203,75,75)" //red - failed

                    }
                },
                plotOptions : {
                    series: { pie: { show: true  } },
                    legend : {
                        labelFormatter: function(label, series){
                            return OpenNebula.Helper.resource_state("vm",label) + 
                                ' - ' + series.data[0][1] + ' (' + 
                                Math.floor(series.percent) + '%' + ')';
                        }
                    }
                }
            },
            "netUsageBar" : {
                paths: [ "NET_RX", "NET_TX" ],
                operation: SunstoneMonitoring.ops.singleBar,
                plotOptions: {
                    series: { bars: { show: true,
                                      horizontal: true,
                                      barWidth: 0.5 }
                            },
                    yaxis: { show: false },
                    xaxis: {
                        min: 0,
                        tickFormatter : function(val,axis) {
                            return humanize_size(val);
                        },
                    },
                    legend: {
                        noColumns: 3,
                        container: '#netUsageBar_legend',
                        labelFormatter: function(label, series){
                            return label + " - " + humanize_size(series.data[0][0])
                        }
                    }
                }
            },
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