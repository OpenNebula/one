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

var OpenNebula = {

    "Error": function(resp)
    {
        var error = {};
        if (resp.responseText)
        {
            error = JSON.parse(resp.responseText);
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
                            "DISABLED"][value];
                    break;
                default:
                    return;
            }
        },

        "image_type": function(value)
        {
            return ["OS", "CDROM", "DATABLOCK"][value];
        },

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

            var resource = OpenNebula.Auth.resource;            
            var request = OpenNebula.Helper.request(resource,"login");

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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "logout": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;

            var resource = OpenNebula.Auth.resource;
            var request = OpenNebula.Helper.request(resource,"logout");

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
                        callback_error(request, OpenNebula.Error(response));
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

            var resource = OpenNebula.Config.resource;
            var request = OpenNebula.Helper.request(resource,"list");

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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "Host": {
        "resource": "HOST",

        "create": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.Host.resource;

            var request = OpenNebula.Helper.request(resource,"create", data);

            $.ajax({
                url: "/host",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Host.resource;


            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/host/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;

            var resource = OpenNebula.Host.resource;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/host",
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response)
                {
                    if (callback)
                    {
                        var host_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, host_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {

            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var resource = OpenNebula.Host.resource;
            var request = OpenNebula.Helper.request(resource,"show", id);

            $.ajax({
                url: "/host/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "enable": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Host.resource;

            var method = "enable";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/host/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "disable": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Host.resource;

            var method = "disable";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/host/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "Network": {
        "resource": "VNET",

        "create": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.Network.resource;

            var request = OpenNebula.Helper.request(resource,"create",data);

            $.ajax({
                url: "/vnet",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Network.resource;

            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/vnet/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;
            var resource = OpenNebula.Network.resource;
            
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/vnet",
                type: "GET",
                dataType: "json",
                data: {timeout: timeout},
                success: function(response)
                {
                    if (callback)
                    {
                        var vnet_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, vnet_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Network.resource;

            var request = OpenNebula.Helper.request(resource,"show", id);

            $.ajax({
                url: "/vnet/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "publish": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Network.resource;

            var method = "publish";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vnet/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "unpublish": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Network.resource;

            var method = "unpublish";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vnet/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "VM": {
        "resource": "VM",

        "create": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.VM.resource;

            var request = OpenNebula.Helper.request(resource,"create",data);

            $.ajax({
                url: "/vm",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Network.resource;

            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/vm/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;

            var resource = OpenNebula.VM.resource;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/vm",
                type: "GET",
                dataType: "json",
                data: {timeout: timeout},
                success: function(response)
                {
                    if (callback)
                    {
                        var vm_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, vm_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "log": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var request = OpenNebula.Helper.request(resource,"log", id);

            $.ajax({
                url: "/vm/" + id + "/log",
                type: "GET",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var request = OpenNebula.Helper.request(resource,"show", id);

            $.ajax({
                url: "/vm/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "deploy": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var host = params.data.extra_param;
            var resource = OpenNebula.VM.resource;

            var method = "deploy";
            var action = OpenNebula.Helper.action(method, {"host_id": host});
            var request = OpenNebula.Helper.request(resource,method, [id, host]);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "shutdown": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "shutdown";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "livemigrate": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var host = params.data.extra_param;
            var resource = OpenNebula.VM.resource;

            var method = "livemigrate";
            var action = OpenNebula.Helper.action(method,{"host_id": host});
            var request = OpenNebula.Helper.request(resource,method, [id, host]);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "migrate": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var host = params.data.extra_param;
            var resource = OpenNebula.VM.resource;

            var method = "migrate";
            var action = OpenNebula.Helper.action(method,{"host_id": host});
            var request = OpenNebula.Helper.request(resource,method, [id, host]);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "hold": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "hold";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "release": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "release";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "stop": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "stop";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "cancel": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "cancel";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "suspend": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;
            
            var method = "suspend";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "resume": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "resume";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "saveas": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var vm_id = params.data.vm_id;
            var disk_id = params.data.disk_id;
            var image_name = params.data.image_name;
            var type = params.data.type;

            var method = "saveas";
            var saveas_params = {
                "vm_id"     : vm_id,
                "disk_id"   : disk_id,
                "image_name": image_name,
                "type"      : type
            }
            var resource = OpenNebula.VM.resource;
            
            var action = OpenNebula.Helper.action(method,saveas_params)
            var request = OpenNebula.Helper.request(resource,method, [vm_id, disk_id, image_name, type]);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "restart": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = "restart";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/vm/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "Cluster": {
        "resource": "CLUSTER",

        "create": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.Cluster.resource;

            var request = OpenNebula.Helper.request(resource,"create", name);

            $.ajax({
                url: "/cluster",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Cluster.resource;

            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/cluster/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;
            var resource = OpenNebula.Cluster.resource;

            var resource = OpenNebula.Cluster.resource;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/cluster",
                type: "GET",
                dataType: "json",
                data: {timeout: timeout},
                success: function(response)
                {
                    if (callback)
                    {
                        var cluster_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, cluster_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "addhost": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var host_id = params.data.id;
            var cluster_id = params.data.extra_param;
            var resource = OpenNebula.Cluster.resource;

            var method = "add_host";
            var action = OpenNebula.Helper.action(method, {
                                                "host_id"   : host_id
                                                });
            var request = OpenNebula.Helper.request(resource,method, [host_id, cluster_id]);

            $.ajax({
                url: "/cluster/" + cluster_id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "removehost": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var host_id = params.data.id;
            var cluster_id = params.data.extra_param;

            var method = "remove_host";
            var action = OpenNebula.Helper.action(method,  {
                                                "host_id"   : host_id
                                                });
            var resource = OpenNebula.Cluster.resource;
                                                
            var request = OpenNebula.Helper.request(resource,method, [host_id, cluster_id]);

            $.ajax({
                url: "/cluster/" + cluster_id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "User": {
        "resource": "USER",

        "create": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.User.resource;

            var request = OpenNebula.Helper.request(resource,"create",data);

            $.ajax({
                url: "/user",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.User.resource;

            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/user/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;

            var resource = OpenNebula.Cluster.resource;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/user",
                type: "GET",
                dataType: "json",
                data: {timeout: timeout},
                success: function(response)
                {
                    if (callback)
                    {
                        var user_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, user_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "passwd": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var passwd = params.data.password;

            var method = "passwd";
            var action = OpenNebula.Helper.action(method,  {
                                                "password"   : passwd
                                                });
                                                
            var resource = OpenNebula.User.resource;
            var request = OpenNebula.Helper.request(resource,method, passwd);

            $.ajax({
                url: "/user/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    },

    "Image": {
        "resource": "IMAGE",

        "register": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var resource = OpenNebula.Image.resource;

            var request = OpenNebula.Helper.request(resource,"register",data);

            $.ajax({
                url: "/image",
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "delete": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.Image.resource;

            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: "/image/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "list": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;

            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: "/image",
                type: "GET",
                dataType: "json",
                data: {timeout: timeout},
                success: function(response)
                {
                    if (callback)
                    {
                        var image_pool = OpenNebula.Helper.pool(resource,response);
                        callback(request, image_pool);
                    }
                },
                error: function(response)
                {
                    if (callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "show": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,"show", id);

            $.ajax({
                url: "/image/" + id,
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "addattr": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var name = params.data.name;
            var value = params.data.value;

            var method = "update";
            var action = OpenNebula.Helper.action(method,  {
                                                "name"      : name,
                                                "value"     : value
                                                });
                                                
            var resource = OpenNebula.Image.resource;                                                
            var request = OpenNebula.Helper.request(resource,method, [id, name, value]);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "rmattr": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var name = params.data.name;
            var value = params.data.value;

            var method = "rm_attr";
            var action = OpenNebula.Helper.action(method,  {
                                                "name"      : name
                                                });
                                                
            var resource = OpenNebula.Image.resource;                                        
            var request = OpenNebula.Helper.request(resource,method, [id, name]);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
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
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "enable": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "enable";
            var action = OpenNebula.Helper.action(method);
            
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "disable": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "disable";
            var action = OpenNebula.Helper.action(method);
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "publish": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "publish";
            var action = OpenNebula.Helper.action(method);
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "unpublish": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "unpublish";
            var action = OpenNebula.Helper.action(method);
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "persistent": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "persistent";
            var action = OpenNebula.Helper.action(method);
            
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        },

        "nonpersistent": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var method = "nonpersistent";
            var action = OpenNebula.Helper.action(method);
            
            var resource = OpenNebula.Image.resource;
            var request = OpenNebula.Helper.request(resource,method, id);

            $.ajax({
                url: "/image/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function()
                {
                    if (callback)
                    {
                        callback(request);
                    }
                },
                error: function(response)
                {
                    if(callback_error)
                    {
                        callback_error(request, OpenNebula.Error(response));
                    }
                }
            });
        }
    }
}
