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

var oZones = {

    "Error": function(resp)
    {
        var error = {};
        if (resp.responseText)
        {
            try {
                error = JSON.parse(resp.responseText);
            }
            catch (e) {
                error.error = {message: "It appears there was a server exception. Please check server's log."};
            };
        }
        else
        {
            error.error = {};
        }
        error.error.http_status = resp.status;
        return error;
    },

    "is_error": function(obj)
    {
        return obj.error ? true : false;
    },

    "Helper": {
        "resource_state": function(type, value)
        {
            var state;
            switch(type)
            {
                case "HOST":
                case "host":
                    state = tr(["INIT",
                               "MONITORING_MONITORED",
                               "MONITORED",
                               "ERROR",
                               "DISABLED",
                               "MONITORING_ERROR"][value]);
                    break;
                case "HOST_SIMPLE":
                case "host_simple":
                    state = tr(["INIT",
                               "UPDATE",
                               "ON",
                               "ERROR",
                               "OFF",
                               "RETRY"][value]);
                    break;
                case "VM":
                case "vm":
                    state = tr(["INIT",
                               "PENDING",
                               "HOLD",
                               "ACTIVE",
                               "STOPPED",
                               "SUSPENDED",
                               "DONE",
                               "FAILED",
                               "POWEROFF"][value]);
                    break;
                case "VM_LCM":
                case "vm_lcm":
                    state = tr(["LCM_INIT",
                               "PROLOG",
                               "BOOT",
                               "RUNNING",
                               "MIGRATE",
                               "SAVE_STOP",
                               "SAVE_SUSPEND",
                               "SAVE_MIGRATE",
                               "PROLOG_MIGRATE",
                               "PROLOG_RESUME",
                               "EPILOG_STOP",
                               "EPILOG",
                               "SHUTDOWN",
                               "CANCEL",
                               "FAILURE",
                               "CLEANUP",
                               "UNKNOWN",
                               "HOTPLUG",
                               "SHUTDOWN_POWEROFF"][value]);
                    break;
                case "IMAGE":
                case "image":
                    state = tr(["INIT",
                               "READY",
                               "USED",
                               "DISABLED",
                               "LOCKED",
                               "ERROR",
                               "CLONE",
                               "DELETE",
                               "USED_PERS"][value]);
                    break;
                case "VM_MIGRATE_REASON":
                case "vm_migrate_reason":
                    state = tr(["NONE",
                               "ERROR",
                               "STOP_RESUME",
                               "USER",
                               "CANCEL"][value]);
                    break;
                default:
                    return value;
            }
            if (!state) state = value
            return state;
        },

        "image_type": function(value)
        {
            return ["OS", "CDROM", "DATABLOCK"][value];
        },
// TODO Are we going to use this ??
        "action": function(action, params)
        {
            obj = {
                "action": {
                    "perform": action
                }
            }
            if (params)
            {
                obj.action.params = params;
            }
            return obj;
        },
// END TODO

        "request": function(resource, method, data) {
            var r = {
                "request": {
                    "resource"  : resource,
                    "method"    : method
                }
            }
            if (data)
            {
                if (typeof(data) != "array")
                {
                    data = [data];
                }
                r.request.data = data;
            }
            return r;
        },

        "pool": function(resource, response)
        {
            var pool_name = resource + "_POOL";
            var type = resource;
            var pool;

            if (typeof(pool_name) == "undefined")
            {
                return Error('Incorrect Pool');
            }

            var p_pool = [];

            if (response[pool_name]) {
                pool = response[pool_name][type];
            } else { pull = null };

            if (pool == null)
            {
                return p_pool;
            }
            else if (pool.length)
            {
                for (i=0;i<pool.length;i++)
                {
                    p_pool[i]={};
                    p_pool[i][type]=pool[i];
                }
                return(p_pool);
            }
            else
            {
                p_pool[0] = {};
                p_pool[0][type] = pool;
                return(p_pool);
            }
        }
    },

    "Action": {
        "create": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var request = oZones.Helper.request(resource,"create", data);

            $.ajax({
                url: resource.toLowerCase(),
                type: "POST",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        },

        "update": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var data = params.data.extra_param;
            var request = oZones.Helper.request(resource,"update", data);

            $.ajax({
                url: resource.toLowerCase()+'/'+id,
                type: "PUT",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        },

        "del": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = oZones.Helper.request(resource,"delete", id);

            $.ajax({
                url: resource.toLowerCase() + "/" + id,
                type: "DELETE",
                success: function(){
                    return callback ? callback(request) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        },

        "list": function(params,resource,subresource){
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;
            var request = oZones.Helper.request(resource,"list");

            var url = resource.toLowerCase();
            url = subresource ? url + "/" + subresource : url;
            $.ajax({
                url: url,
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response){
                    return callback ?
                        callback(request, oZones.Helper.pool(resource,response)) : null;
                },
                error: function(response)
                {
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        },

        //Subresource examples: "fetch_template", "log"...
        "show": function(params,resource,subresource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = subresource ?
                oZones.Helper.request(resource,subresource,id) :
                oZones.Helper.request(resource,"show", id);

            var url = resource.toLowerCase() + "/" + id;
            url = subresource? url + "/" + subresource : url;

            $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        }
    },

    "Auth": {
        "resource": "AUTH",

        "login": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var username = params.data.username;
            var password = params.data.password;
            var remember = params.remember;

            var resource = oZones.Auth.resource;
            var request  = oZones.Helper.request(resource,"login");

            $.ajax({
                url: "login",
                type: "POST",
                data: {remember: remember},
                beforeSend : function(req) {
                    var token = username + ':' + password;
                    var authString = 'Basic ';
                    if (typeof(btoa) === 'function')
                        authString += btoa(token)
                    else {
                        token = CryptoJS.enc.Utf8.parse(token);
                        authString += CryptoJS.enc.Base64.stringify(token)
                    }

                    req.setRequestHeader( "Authorization", authString);
                },
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        },

        "logout": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;

            var resource = oZones.Auth.resource;
            var request =oZones.Helper.request(resource,"logout");

            $.ajax({
                url: "logout",
                type: "POST",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        }
    },

    "Config": {
        "resource": "CONFIG",

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;

            var resource = oZones.Config.resource;
            var request = oZones.Helper.request(resource,"list");

            $.ajax({
                url: "config",
                type: "GET",
                dataType: "json",
                success: function(response){
                    return callback ? callback(request,response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, oZones.Error(response)) : null;
                }
            });
        }
    },

    "Zone": {
        "resource": "ZONE",

        "create": function(params){
            oZones.Action.create(params,oZones.Zone.resource);
        },
        "del" : function(params){
            oZones.Action.del(params,oZones.Zone.resource);
        },
        "list": function(params){
            oZones.Action.list(params,oZones.Zone.resource);
        },
        "show": function(params){
            oZones.Action.show(params,oZones.Zone.resource);
        },

        "subresource" : function(params,subresource){
            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;
            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,subresource, id);

            $.ajax({
                url: "zone/" + id + "/" + subresource,
                type: "GET",
                dataType: "json",
                success: function(response){
                    return callback ?
                        callback(request, oZones.Helper.pool(subresource.toUpperCase(),response)) : null;
                },
                error: function(response){
                    return callback_error ? callback_error(request,oZones.Error(response)) : null;
                }
            });

        },

        "host": function(params){
            oZones.Zone.subresource(params,"host");
        },
        "image": function(params){
            oZones.Zone.subresource(params,"image");
        },
        "vmtemplate": function(params){
            oZones.Zone.subresource(params,"vmtemplate");
        },
        "user": function(params){
            oZones.Zone.subresource(params,"user");
        },
        "vm": function(params){
            oZones.Zone.subresource(params,"vm");
        },
        "vnet": function(params){
            oZones.Zone.subresource(params,"vnet");
        },
        "group": function(params){
            oZones.Zone.subresource(params,"group");
        },
        "cluster": function(params){
            oZones.Zone.subresource(params,"cluster");
        },
        "datastore": function(params){
            oZones.Zone.subresource(params,"datastore");
        }
    },

    "VDC": {
        "resource": "VDC",

        "create": function(params){
            oZones.Action.create(params,oZones.VDC.resource);
        },
        "update": function(params){
            oZones.Action.update(params,oZones.VDC.resource);
        },
        "del": function(params){
            oZones.Action.del(params,oZones.VDC.resource);
        },
        "list": function(params){
            oZones.Action.list(params,oZones.VDC.resource);
        },
        "show": function(params){
            oZones.Action.show(params,oZones.VDC.resource);
        }
    },

    "ZoneHosts": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneHosts.resource,"host");
        }
    },

    "ZoneVMs": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneVMs.resource,"vm");
        }
    },

    "ZoneVNs": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneVNs.resource,"vnet");
        }
    },

    "ZoneImages": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneImages.resource,"image");
        }
    },

    "ZoneUsers": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneImages.resource,"user");
        }
    },

    "ZoneTemplates": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneImages.resource,"vmtemplate");
        }
    },

    "ZoneClusters": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneClusters.resource,"cluster");
        }
    },

    "ZoneDatastores": {
        "resource": "ZONE",
        "list": function(params){
            oZones.Action.list(params,oZones.ZoneDatastores.resource,"datastore");
        }
    }
};
