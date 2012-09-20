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

//Convert json into the XML that OCCI server can understand
function json2xml(element,root_key) {
    var xml = "";
    if (!root_key) root_key="ROOT";

    if (typeof element == "object") { //Its an object
        $.each(element, function(key,value){
            if (value.constructor == Array){
                for (var i = 0; i < value.length; i++){
                    xml += json2xml(value[i],key);
                };
                //do not wrap arrays in root_key
                return xml;

            } else
                xml += json2xml(value,key);
        });
    } else { //its a simple value. Base condition
        xml += element.toString();
    };
    return "<" + root_key.toUpperCase() + ">" + xml + "</" + root_key.toUpperCase() + ">";
};


$.ajaxSetup({
    converters: {
        "xml ONEjson": function(xml){
            return $.xml2json(xml);
        }
    }
});

var OCCI = {

    "Error": function(resp)
    {
        var error = {
            error : {
                message: resp.responseText,
                http_status : resp.status}
        };
        return error;
    },

    "is_error": function(obj)
    {
        return obj.error ? true : false;
    },

    "Helper": {
        "action": function(action, params)
        {
            action = {
                "perform": action
            }
            if (params)
            {
                action.params = params;
            }
            return action;
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
            var pool_name = resource + "_COLLECTION";
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
            var data = json2xml(params.data,resource);
            var request = OCCI.Helper.request(resource,"create", data);

            $.ajax({
                url: resource.toLowerCase(),
                type: "POST",
                dataType: "xml ONEjson",
                data: data,
                success: function(response){
                    var res = {};
                    res[resource] = response;
                    return callback ? callback(request, res) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        "del": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = OCCI.Helper.request(resource,"delete", id);

            $.ajax({
                url: resource.toLowerCase() + "/" + id,
                type: "DELETE",
                success: function(){
                    return callback ? callback(request) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        "list": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var timeout = params.timeout || false;
            var request = OCCI.Helper.request(resource,"list");

            $.ajax({
                url: resource.toLowerCase(),
                type: "GET",
                data: {timeout: timeout, verbose: true},
                dataType: "xml ONEjson",
                success: function(response){
                    var res = {};
                    res[resource+"_COLLECTION"] = response;
                    return callback ?
                        callback(request, OCCI.Helper.pool(resource,res)) : null;
                },
                error: function(response)
                {
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        //Subresource examples: "fetch_template", "log"...
        "show": function(params,resource){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var request = OCCI.Helper.request(resource,"show", id);

            var url = resource.toLowerCase() + "/" + id;

            $.ajax({
                url: url,
                type: "GET",
                dataType: "xml ONEjson",
                success: function(response){
                    var res = {};
                    res[resource] = response;
                    return callback ? callback(request, res) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        //Example: Simple action: publish. Simple action with action obj: deploy
        //OCCI, rewrite
        "update": function(params,resource,method,action_obj){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var body = json2xml(params.data.body,resource);

            var request = OCCI.Helper.request(resource,method, id);

            $.ajax({
                url: resource.toLowerCase() + "/" + id,
                type: "PUT",
                data: body,
                dataType: "xml ONEjson",
                success: function(response){
                    var res = {};
                    res[resource] = response;
                    return callback ? callback(request,res) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        "simple_action" : function(params, resource, method, action_obj){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;

            var action,request;
            if (action_obj) {
                action = OCCI.Helper.action(method, action_obj);
                request = OCCI.Helper.request(resource,method, [id, action_obj]);
            } else {
                action = OCCI.Helper.action(method);
                request = OCCI.Helper.request(resource,method, id);
            };

            $.ajax({
                url: resource.toLowerCase() + "/" + id + '/action',
                type: "POST",
                data: json2xml(action,'ACTION'),
                dataType: "xml ONEjson",
                success: function(response){
                    var res = {};
                    res[resource] = response;
                    return callback ? callback(request,res) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        "accounting": function(params, resource){
            var callback = params.success;
            var callback_error = params.error;
            var data = params.data;

            var method = "accounting";
            var request = OCCI.Helper.request(resource, method, data);

            $.ajax({
                url: 'ui/accounting',
                type: "GET",
                data: data['monitor'],
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
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
            var lang = params.lang;

            var resource = OCCI.Auth.resource;
            var request = OCCI.Helper.request(resource,"login");

            $.ajax({
                url: "ui/login",
                type: "POST",
                data: {remember: remember, lang: lang},
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
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },

        "logout": function(params)
        {
            var callback = params.success;
            var callback_error = params.error;

            var resource = OCCI.Auth.resource;
            var request = OCCI.Helper.request(resource,"logout");

            $.ajax({
                url: "ui/logout",
                type: "POST",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        }
    },

    "Config": {
        "resource": "CONFIG",

        "list": function(params){
            var callback = params.success;
            var callback_error = params.error;

            var resource = OCCI.Config.resource;
            var request = OCCI.Helper.request(resource,"list");

            $.ajax({
                url: "ui/config",
                type: "GET",
                dataType: "xml ONEjson",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        }
    },

    "Network": {
        "resource": "NETWORK",

        "create": function(params){
            OCCI.Action.create(params,OCCI.Network.resource);
        },
        "del": function(params){
            OCCI.Action.del(params,OCCI.Network.resource);
        },
        "list": function(params){
            OCCI.Action.list(params,OCCI.Network.resource);
        },
        "show": function(params){
            OCCI.Action.show(params,OCCI.Network.resource);
        },
        "publish": function(params){
            params.data.body = { "PUBLIC": "YES" };
            OCCI.Action.update(params,OCCI.Network.resource,"publish");
        },
        "unpublish": function(params){
            params.data.body = { "PUBLIC": "NO" };
            OCCI.Action.update(params,OCCI.Network.resource,"unpublish");
        }
    },

    "VM": {
        "resource": "COMPUTE",

        "create": function(params){
            OCCI.Action.create(params,OCCI.VM.resource);
        },
        "del": function(params){
            OCCI.Action.del(params,OCCI.VM.resource);
        },
        "list": function(params){
            OCCI.Action.list(params,OCCI.VM.resource);
        },
        "show": function(params){
            OCCI.Action.show(params,OCCI.VM.resource);
        },
        "shutdown": function(params){
            params.data.body = { state : "SHUTDOWN" };
            OCCI.Action.update(params,OCCI.VM.resource,"shutdown");
        },
        "stop": function(params){
            params.data.body = { state : "STOPPED" };
            OCCI.Action.update(params,OCCI.VM.resource,"stop");
        },
        "reboot": function(params){
            params.data.body = { state : "REBOOT" };
            OCCI.Action.update(params,OCCI.VM.resource,"reboot");
        },
        "reset": function(params){
            params.data.body = { state : "RESET" };
            OCCI.Action.update(params,OCCI.VM.resource,"reset");
        },
        "cancel": function(params){
            params.data.body = { state : "CANCEL" };
            OCCI.Action.update(params,OCCI.VM.resource,"cancel");
        },
        "suspend": function(params){
            params.data.body = { state : "SUSPENDED" };
            OCCI.Action.update(params,OCCI.VM.resource,"suspend");
        },
        "resume": function(params){
            params.data.body = { state : "RESUME" };
            OCCI.Action.update(params,OCCI.VM.resource,"resume");
        },
        "restart": function(params){
            params.data.body = { state : "RESTART" };
            OCCI.Action.update(params,OCCI.VM.resource,"restart");
        },
        "poweroff": function(params){
            params.data.body = { state : "POWEROFF" };
            OCCI.Action.update(params,OCCI.VM.resource,"poweroff");
        },
        "resubmit": function(params){
            params.data.body = { state : "RESUBMIT" };
            OCCI.Action.update(params,OCCI.VM.resource,"resubmit");
        },
        "done": function(params){
            params.data.body = { state : "DONE" };
            OCCI.Action.update(params,OCCI.VM.resource,"done");
        },
        "saveas" : function(params){
            var obj = params.data.extra_param;
            var disk_id = obj.disk_id;
            var im_name = obj.image_name;
            params.data.body = '<DISK id="'+disk_id+'"><SAVE_AS name="'+im_name+'" /></DISK>';
            OCCI.Action.update(params,OCCI.VM.resource,"saveas");
        },
        "vnc" : function(params,startstop){
            var callback = params.success;
            var callback_error = params.error;
            var id = params.data.id;
            var resource = OCCI.VM.resource;

            var method = startstop;
            var request = OCCI.Helper.request(resource,method, id);
            $.ajax({
                url: "ui/" + method + "/" + id,
                type: "POST",
                dataType: "json",
                success: function(response){
                    return callback ? callback(request, response) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },
        "startvnc" : function(params){
            OCCI.VM.vnc(params,"startvnc");
        },

        "attachdisk" : function(params){
            var action_obj = {"disk_template": params.data.extra_param};
            OCCI.Action.simple_action(params,OCCI.VM.resource,
                                      "attachdisk",
                                      params.data.extra_param);
        },
        "detachdisk" : function(params){
            // extra param is disk id
            var action_obj = '<DISK id="'+params.data.extra_param+'"/>'
            OCCI.Action.simple_action(params,OCCI.VM.resource,
                                      "detachdisk", action_obj);
        }
/*
        "monitor" : function(params){
            OCCI.Action.monitor(params,OCCI.VM.resource,false);
        },
        "monitor_all" : function(params){
            OCCI.Action.monitor(params,OCCI.VM.resource,true);
        }
*/
    },

    "Image": {
        "resource": "STORAGE",

        "create": function(params){
            var callback = params.success;
            var callback_error = params.error;
            var data = {occixml : json2xml(params.data,OCCI.Image.resource)};
            var request = OCCI.Helper.request(OCCI.Image.resource,"create", data);

            $.ajax({
                type: 'POST',
                url: "storage",
                data: data,
                dataType: "xml ONEjson",
                success: function(response){
                    var res = {};
                    res["STORAGE"] = response;
                    return callback ? callback(request, res) : null;
                },
                error: function(response){
                    return callback_error ?
                        callback_error(request, OCCI.Error(response)) : null;
                }
            });
        },
        "del": function(params){
            OCCI.Action.del(params,OCCI.Image.resource);
        },
        "list": function(params){
            OCCI.Action.list(params,OCCI.Image.resource);
        },
        "show": function(params){
            OCCI.Action.show(params,OCCI.Image.resource);
        },
        "publish": function(params){
            params.data.body = { "PUBLIC":"YES" };
            OCCI.Action.update(params,OCCI.Image.resource,"publish");
        },
        "unpublish": function(params){
            params.data.body = { "PUBLIC":"NO" };
            OCCI.Action.update(params,OCCI.Image.resource,"unpublish");
        },
        "persistent": function(params){
            params.data.body = { "PERSISTENT":"YES" };
            OCCI.Action.update(params,OCCI.Image.resource,"persistent");
        },
        "nonpersistent": function(params){
            params.data.body = { "PERSISTENT":"NO" };
            OCCI.Action.update(params,OCCI.Image.resource,"nonpersistent");
        },
        "clone" : function(params){
            var action_obj = { 'NAME' : params.data.extra_param };
            OCCI.Action.simple_action(params, OCCI.Image.resource,
                                      "clone", action_obj)
        }
    },

    "Instance_type" : {
        "resource" : "INSTANCE_TYPE",
        "list" : function(params){
            OCCI.Action.list(params,OCCI.Instance_type.resource);
        }
    },

    "User" : {
        "resource" : "USER",
        "list" : function(params){
            OCCI.Action.list(params,OCCI.User.resource);
        },
        "show" : function(params){
            OCCI.Action.show(params,OCCI.User.resource);
        },
        "accounting" : function(params){
            OCCI.Action.accounting(params, OCCI.User.resource);
        }
    }
}
