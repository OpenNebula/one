/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

define(function(require) {
    require('jquery-ui');

    var GuacController = require('utils/guacamole/controller');
    
    var controller = new GuacController();
    var reconnectButton = document.getElementById('buttons__reconnect');
    var selectResolution = document.getElementById('select__resolution');

    var endpoint = new URL(window.location.href);
    var encoded_socket = endpoint.searchParams.get('socket');
    var socket_string = atob(encoded_socket);

    var url = new URL(socket_string);
    var params = url.searchParams;
    var token = params.get('token');
    var connectionType = params.get('type');
    var info = params.get('info');

    controller.setInformation(info);

    // Trigger first connect
    document.readyState !== 'loading'
        ? connect()
        : document.addEventListener('DOMContentLoaded', connect);

    window.onunload = disconnect;
    

    reconnectButton.onclick = function reconnect() {
        disconnect();

        document.querySelector('.toolbar__state h5').innerHTML = '';
        document.querySelector('.toolbar__state .spinner').style.display = 'block';

        setTimeout(connect, 500);
    }

    selectResolution.onchange = function() {
        reconnectButton.click();
    };
    
    function connect() {
        try {
            controller && controller.setConnection(token, connectionType);
        } catch (error) {
            controller && controller.disconnect();
            document.querySelector('.toolbar__state h5').innerHTML = 'Failed';
        }
    }
    
    function disconnect() {
        try {
            controller && controller.disconnect();
        } catch (error) {
            document.querySelector('.toolbar__state h5').innerHTML = 'Failed';
        }
    }
    
});
