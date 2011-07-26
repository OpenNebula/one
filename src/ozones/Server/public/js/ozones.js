/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
        if (obj.error)
        {
            return true;
        }
        else
        {
            return false;
        }
    },

    "Helper": {
        "resource_state": function(type, value)
        {
            switch(type)
            {
                case "HOST","host":
                    return ["INIT",
                            "MONITORING",
                            "MONITORED",
                            "ERROR",
                            "DISABLED"][value];
                    break;
                case "HOST_SIMPLE","host_simple":
                    return ["ON",
                            "ON",
                            "ON",
                            "ERROR",
                            "OFF"][value];
                    break;
                case "VM","vm":
                    return ["INIT",
                            "PENDING",
                            "HOLD",
                            "ACTIVE",
                            "STOPPED",
                            "SUSPENDED",
                            "DONE",
                            "FAILED"][value];
                    break;
                case "VM_LCM","vm_lcm":
                    return ["LCM_INIT",
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
                            "UNKNOWN"][value];
                    break;
                case "IMAGE","image":
                    return ["INIT",
                            "READY",
                            "USED",
                            "DISABLED",
                            "LOCKED",
                            "ERROR"][value];
                    break;
                default:
                    return;
            }
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
                url: "/login",
                type: "POST",
                data: {remember: remember},
                beforeSend : function(req) {
                    req.setRequestHeader( "Authorization",
                                        "Basic " + btoa(username + ":" + password)
                                        )
                },
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
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
                url: "/logout",
                type: "POST",
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
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
                url: "/config",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "Zone": {
        "resource": "ZONE",

        "create": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var data           = params.data;
            var resource       = oZones.Zone.resource;

            var request = oZones.Helper.request(resource,"create", data);

            $.ajax({
                url:  "zone",
                type: "POST",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;
            var resource       = oZones.Zone.resource;


            var request = oZones.Helper.request(resource,"delete", id);

            $.ajax({
                url:  "zone/" + id,
                type: "DELETE",
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zone_pool = oZones.Helper.pool(resource,response);
                        callback(request, zone_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"show", id);

            $.ajax({
                url: "zone/" + id,
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "host": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"host", id);

            $.ajax({
                url: "zone/" + id + "/host",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var host_pool = oZones.Helper.pool("HOST",response);
                        callback(request, host_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "image": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"image", id);

            $.ajax({
                url: "zone/" + id + "/image",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("IMAGE",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "template": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"template", id);

            $.ajax({
                url: "zone/" + id + "/template",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("VMTEMPLATE",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "user": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"user", id);

            $.ajax({
                url: "zone/" + id + "/user",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("USER",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "vm": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"vm", id);

            $.ajax({
                url: "zone/" + id + "/vm",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("VM",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "vn": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"vn", id);

            $.ajax({
                url: "zone/" + id + "/vn",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("VNET",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "group": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.Zone.resource;
            var request  = oZones.Helper.request(resource,"group", id);

            $.ajax({
                url: "zone/" + id + "/group",
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var pool = oZones.Helper.pool("GROUP",response);
                        callback(request, pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "VDC": {
        "resource": "VDC",

        "create": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var data           = params.data;
            var resource       = oZones.VDC.resource;

            var request = oZones.Helper.request(resource,"create", data);

            $.ajax({
                url:  "vdc",
                type: "POST",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;
            var resource       = oZones.VDC.resource;


            var request = oZones.Helper.request(resource,"delete", id);

            $.ajax({
                url:  "vdc/" + id,
                type: "DELETE",
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.VDC.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "vdc",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var vdc_pool = oZones.Helper.pool(resource,response);
                        callback(request, vdc_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {

            var callback       = params.success;
            var callback_error = params.error;
            var id             = params.data.id;

            var resource = oZones.VDC.resource;
            var request  = oZones.Helper.request(resource,"show", id);

            $.ajax({
                url: "vdc/" + id,
                type: "GET",
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        callback(request, response);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneHosts": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneHosts.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/host",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zonehosts_pool = oZones.Helper.pool(resource,response);
                        callback(request, zonehosts_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneVMs": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneVMs.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/vm",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zonevms_pool = oZones.Helper.pool(resource,response);
                        callback(request, zonevms_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneVNs": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneVMs.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/vn",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zonevns_pool = oZones.Helper.pool(resource,response);
                        callback(request, zonevns_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneImages": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneImages.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/image",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zoneimages_pool = oZones.Helper.pool(resource,response);
                        callback(request, zoneimages_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneUsers": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneUsers.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/user",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zoneusers_pool = oZones.Helper.pool(resource,response);
                        callback(request, zoneusers_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    },

    "ZoneTemplates": {
        "resource": "ZONE",

        "list": function(params)
        {
            var callback       = params.success;
            var callback_error = params.error;
            var timeout        = params.timeout || false;

            var resource = oZones.ZoneTemplates.resource;
            var request  = oZones.Helper.request(resource,"list");

            $.ajax({
                url:  "zone/template",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var zonetemplates_pool = oZones.Helper.pool(resource,response);
                        callback(request, zonetemplates_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, oZones.Error(response));
                    }
                }
            });
        }
    }
}
