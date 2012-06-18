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

var OpenNebula = {

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
            switch(type)
            {
                case "HOST":
                case "host":
                    return tr(["INIT",
                               "MONITORING_MONITORED",
                               "MONITORED",
                               "ERROR",
                               "DISABLED",
                               "MONITORING_ERROR"][value]);
                    break;
                case "HOST_SIMPLE":
                case "host_simple":
                    return tr(["INIT",
                               "UPDATE",
                               "ON",
                               "ERROR",
                               "OFF",
                               "RETRY"][value]);
                    break;
                case "VM":
                case "vm":
                    return tr(["INIT",
                               "PENDING",
                               "HOLD",
                               "ACTIVE",
                               "STOPPED",
                               "SUSPENDED",
                               "DONE",
                               "FAILED"][value]);
                    break;
                case "VM_LCM":
                case "vm_lcm":
                    return tr(["LCM_INIT",
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
                               "UNKNOWN"][value]);
                    break;
                case "IMAGE":
                case "image":
                    return tr(["INIT",
                               "READY",
                               "USED",
                               "DISABLED",
                               "LOCKED",
                               "ERROR"][value]);
                    break;
                case "VM_MIGRATE_REASON":
                case "vm_migrate_reason":
                    return tr(["NONE",
                               "ERROR",
                               "STOP_RESUME",
                               "USER",
                               "CANCEL"][value]);
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

    "Action": {

        //server requests helper methods

        "create": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;
            var request = OpenNebula.Helper.request(resource,"create", data);

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
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },

        "del": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = OpenNebula.Helper.request(resource,"delete", id);

            $.ajax({
                url: resource.toLowerCase() + "/" + id,
                type: "DELETE",
                success: function(){
                    return callback ? callback(request) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },

        "list": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;
            var request = OpenNebula.Helper.request(resource,"list");

            $.ajax({
                url: resource.toLowerCase(),
                type: "GET",
                data: {timeout: timeout},
                dataType: "json",
                success: function(response){
                    var list = OpenNebula.Helper.pool(resource,response)
                    return callback ?
                        callback(request, list) : null;
                },
                error: function(response)
                {
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },

        //Subresource examples: "fetch_template", "log"...
        "show": function(params,resource,subresource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = subresource ?
                OpenNebula.Helper.request(resource,subresource,id) :
                OpenNebula.Helper.request(resource,"show", id);

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
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },

        "chown": function(params,resource,chgrp){
            var id = params.data.extra_param;
            var action_obj = {"owner_id": id,
                              "group_id": "-1"};

            OpenNebula.Action.simple_action(params,
                                            resource,
                                            "chown",
                                            action_obj);
        },

        "chgrp": function(params,resource){
            var id = params.data.extra_param;
            var action_obj = {"owner_id": "-1",
                              "group_id": id};

            OpenNebula.Action.simple_action(params,
                                            resource,
                                            "chown",
                                            action_obj);
        },

        //Example: Simple action: publish. Simple action with action obj: deploy
        "simple_action": function(params,resource,method,action_obj){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var action,request;
            if (action_obj) {
                action = OpenNebula.Helper.action(method, action_obj);
                request = OpenNebula.Helper.request(resource,method, [id, action_obj]);
            } else {
                action = OpenNebula.Helper.action(method);
                request = OpenNebula.Helper.request(resource,method, id);
            };

            $.ajax({
                url: resource.toLowerCase() + "/" + id + "/action",
                type: "POST",
                data: JSON.stringify(action),
                success: function(){
                   return callback ? callback(request) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },

        "monitor": function(params,resource,all){
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;

            var method = "monitor";
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, data);

            var url = resource.toLowerCase();
            url = all ? url + "/monitor" : url + "/" + params.data.id + "/monitor";

            $.ajax({
                url: url,
                type: "GET",
                data: data['monitor'],
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
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

            var resource = OpenNebula.Auth.resource;
            var request = OpenNebula.Helper.request(resource,"login");

            $.ajax({
                url: "login",
                type: "POST",
                data: {remember: remember},
                beforeSend : function(req) {
                    req.setRequestHeader( "Authorization",
                                        "Basic " + btoa(username + ":" + password)
                                        )
                },
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
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
                url: "logout",
                type: "POST",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
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
                url: "config",
                type: "GET",
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        }
    },

    "Host": {
        "resource": "HOST",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.Host.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.Host.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.Host.resource);
        },
        "show": function(params){
            OpenNebula.Action.show(params,OpenNebula.Host.resource);
        },
        "update": function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Host.resource,
                                            "update",
                                            action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Host.resource,"template");
        },
        "enable": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Host.resource,"enable");
        },
        "disable": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Host.resource,"disable");
        },
        "monitor" : function(params){
            OpenNebula.Action.monitor(params,OpenNebula.Host.resource,false);
        },
        "monitor_all" : function(params){
            OpenNebula.Action.monitor(params,OpenNebula.Host.resource,true);
        }
    },

    "Network": {
        "resource": "VNET",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.Network.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.Network.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.Network.resource);
        },
        "show": function(params){
            OpenNebula.Action.show(params,OpenNebula.Network.resource);
        },
        "chown" : function(params){
            OpenNebula.Action.chown(params,OpenNebula.Network.resource);
        },
        "chgrp" : function(params){
            OpenNebula.Action.chgrp(params,OpenNebula.Network.resource);
        },
        "chmod" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "chmod",
                                            action_obj);
        },
        "publish": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Network.resource,"publish");
        },
        "unpublish": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Network.resource,"unpublish");
        },
        "addleases" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "addleases",
                                            action_obj);
        },
        "rmleases" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "rmleases",
                                            action_obj);
        },
        "hold" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "hold",
                                            action_obj);
        },
        "release" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "release",
                                            action_obj);
        },
        "update": function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Network.resource,
                                            "update",
                                            action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Network.resource,"template");
        },
    },

    "VM": {
        "resource": "VM",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.VM.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.VM.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.VM.resource);
        },
        "show": function(params){
            OpenNebula.Action.show(params,OpenNebula.VM.resource);
        },
        "chown" : function(params){
            OpenNebula.Action.chown(params,OpenNebula.VM.resource);
        },
        "chgrp" : function(params){
            OpenNebula.Action.chgrp(params,OpenNebula.VM.resource);
        },
        "chmod" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.VM.resource,
                                            "chmod",
                                            action_obj);
        },
        "shutdown": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"shutdown");
        },
        "hold": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"hold");
        },
        "release": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"release");
        },
        "stop": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"stop");
        },
        "cancel": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"cancel");
        },
        "suspend": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"suspend");
        },
        "resume": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"resume");
        },
        "restart": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"restart");
        },
        "resubmit": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"resubmit");
        },
        "reboot" : function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"reboot");
        },
        "reset" : function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,"reset");
        },

        "log": function(params){
            OpenNebula.Action.show(params,OpenNebula.VM.resource,"log");
        },
        "deploy": function(params){
            var action_obj = {"host_id": params.data.extra_param};
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,
                                            "deploy",action_obj);
        },
        "livemigrate": function(params){
            var action_obj = {"host_id": params.data.extra_param};
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,
                                            "livemigrate",action_obj);
        },
        "migrate": function(params){
            var action_obj = {"host_id": params.data.extra_param};
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,
                                            "migrate",action_obj);
        },
        "saveas": function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,OpenNebula.VM.resource,
                                            "saveas",action_obj);
        },
        "vnc" : function(params,startstop){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OpenNebula.VM.resource;

            var method = startstop;
            var action = OpenNebula.Helper.action(method);
            var request = OpenNebula.Helper.request(resource,method, id);
            $.ajax({
                url: "vm/" + id + "/" + method,
                type: "POST",
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OpenNebula.Error(response)) : null;
                }
            });
        },
        "startvnc" : function(params){
            OpenNebula.VM.vnc(params,"startvnc");
        },
        "stopvnc" : function(params){
            OpenNebula.VM.vnc(params,"stopvnc");
        },
        "monitor" : function(params){
            OpenNebula.Action.monitor(params,OpenNebula.VM.resource,false);
        },
        "monitor_all" : function(params){
            OpenNebula.Action.monitor(params,OpenNebula.VM.resource,true);
        }
    },

    "Group": {
        "resource": "GROUP",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.Group.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.Group.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.Group.resource);
        }
    },

    "User": {
        "resource": "USER",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.User.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.User.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.User.resource);
        },
        "show" : function(params){
            OpenNebula.Action.show(params,OpenNebula.User.resource);
        },
        "passwd": function(params){
            var action_obj = {"password": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.User.resource,
                                            "passwd",action_obj);
        },
        "chgrp" : function(params){
            var action_obj = {"group_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.User.resource,
                                            "chgrp",action_obj);
        },
        "chauth" : function(params){
            var action_obj = {"auth_driver" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.User.resource,
                                            "chauth",action_obj);
        },
        "update": function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.User.resource,
                                            "update",
                                            action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.User.resource,"template");
        },
        // "addgroup" : function(params){
        //     var action_obj = {"group_id": params.data.extra_param };
        //     OpenNebula.Action.simple_action(params,OpenNebula.User.resource,
        //                                     "addgroup",action_obj);
        // },
        // "delgroup" : function(params){
        //     var action_obj = {"group_id": params.data.extra_param };
        //     OpenNebula.Action.simple_action(params,OpenNebula.User.resource,
        //                                     "delgroup",action_obj);
        // }
    },

    "Image": {
        "resource": "IMAGE",

        "create": function(params){
            OpenNebula.Action.create(params,OpenNebula.Image.resource);
        },
        "del": function(params){
            OpenNebula.Action.del(params,OpenNebula.Image.resource);
        },
        "list": function(params){
            OpenNebula.Action.list(params,OpenNebula.Image.resource);
        },
        "show": function(params){
            OpenNebula.Action.show(params,OpenNebula.Image.resource);
        },
        "chown" : function(params){
            OpenNebula.Action.chown(params,OpenNebula.Image.resource);
        },
        "chgrp" : function(params){
            OpenNebula.Action.chgrp(params,OpenNebula.Image.resource);
        },
        "chmod" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Image.resource,
                                            "chmod",
                                            action_obj);
        },
        "update": function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Image.resource,
                                            "update",
                                            action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Image.resource,"template");
        },
        "enable": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Image.resource,"enable");
        },
        "disable": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Image.resource,"disable");
        },
        "persistent": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Image.resource,"persistent");
        },
        "nonpersistent": function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Image.resource,"nonpersistent");
        },
        "chtype": function(params){
            var action_obj = {"type" : params.data.extra_param};
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Image.resource,
                                            "chtype",
                                            action_obj);
        }
    },

    "Template" : {
        "resource" : "VMTEMPLATE",

        "create" : function(params){
            OpenNebula.Action.create(params,OpenNebula.Template.resource);
        },
        "del" : function(params){
            OpenNebula.Action.del(params,OpenNebula.Template.resource);
        },
        "list" : function(params){
            OpenNebula.Action.list(params,OpenNebula.Template.resource);
        },
        "show" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Template.resource);
        },
        "chown" : function(params){
            OpenNebula.Action.chown(params,OpenNebula.Template.resource);
        },
        "chgrp" : function(params){
            OpenNebula.Action.chgrp(params,OpenNebula.Template.resource);
        },
        "chmod" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Template.resource,
                                            "chmod",
                                            action_obj);
        },
        "update" : function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                     OpenNebula.Template.resource,
                                     "update",
                                     action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Template.resource,"template");
        },
        "publish" : function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Template.resource,"publish");
        },
        "unpublish" : function(params){
            OpenNebula.Action.simple_action(params,OpenNebula.Template.resource,"unpublish");
        },
        "instantiate" : function(params) {
            var vm_name = params.data.extra_param ? params.data.extra_param : "";
            var action_obj = { "vm_name" : vm_name };
            OpenNebula.Action.simple_action(params,OpenNebula.Template.resource,
                                            "instantiate",action_obj);
        },
        "clone" : function(params) {
            var name = params.data.extra_param ? params.data.extra_param : "";
            var action_obj = { "name" : name };
            OpenNebula.Action.simple_action(params,OpenNebula.Template.resource, "clone", action_obj);
        }
    },

    "Acl" : {
        "resource" : "ACL",

        "create" : function(params){
            OpenNebula.Action.create(params,OpenNebula.Acl.resource);
        },
        "del" : function(params){
            OpenNebula.Action.del(params,OpenNebula.Acl.resource);
        },
        "list" : function(params){
            OpenNebula.Action.list(params,OpenNebula.Acl.resource);
        }
    },

    "Cluster" : {
        "resource" : "CLUSTER",

        "create" : function(params){
            OpenNebula.Action.create(params,OpenNebula.Cluster.resource);
        },
        "del" : function(params){
            OpenNebula.Action.del(params,OpenNebula.Cluster.resource);
        },
        "list" : function(params){
            OpenNebula.Action.list(params,OpenNebula.Cluster.resource);
        },
        "show" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Cluster.resource);
        },
        "addhost" : function(params){
            var action_obj = { "host_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "addhost",action_obj);
        },
        "delhost" : function(params){
            var action_obj = { "host_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "delhost",action_obj);
        },
        "adddatastore" : function(params){
            var action_obj = { "ds_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "adddatastore",action_obj);
        },
        "deldatastore" : function(params){
            var action_obj = { "ds_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "deldatastore",action_obj);
        },
        "addvnet" : function(params){
            var action_obj = { "vnet_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "addvnet",action_obj);
        },
        "delvnet" : function(params){
            var action_obj = { "vnet_id": params.data.extra_param };
            OpenNebula.Action.simple_action(params,OpenNebula.Cluster.resource,
                                            "delvnet",action_obj);
        },
    },
    "Datastore" : {
        "resource" : "DATASTORE",

        "create" : function(params){
            OpenNebula.Action.create(params,OpenNebula.Datastore.resource);
        },
        "del" : function(params){
            OpenNebula.Action.del(params,OpenNebula.Datastore.resource);
        },
        "list" : function(params){
            OpenNebula.Action.list(params,OpenNebula.Datastore.resource);
        },
        "show" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Datastore.resource);
        },
        "chown" : function(params){
            OpenNebula.Action.chown(params,OpenNebula.Datastore.resource);
        },
        "chgrp" : function(params){
            OpenNebula.Action.chgrp(params,OpenNebula.Datastore.resource);
        },
        "chmod" : function(params){
            var action_obj = params.data.extra_param;
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Datastore.resource,
                                            "chmod",
                                            action_obj);
        },
        "update" : function(params){
            var action_obj = {"template_raw" : params.data.extra_param };
            OpenNebula.Action.simple_action(params,
                                            OpenNebula.Datastore.resource,
                                            "update",
                                            action_obj);
        },
        "fetch_template" : function(params){
            OpenNebula.Action.show(params,OpenNebula.Datastore.resource,"template");
        },
    },
}
