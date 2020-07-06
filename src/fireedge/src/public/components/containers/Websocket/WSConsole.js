/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import JSONPretty from 'react-json-pretty';
import { messageTerminal } from '../../../../utils/general';

class WSConsole extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: ''
    };
  }

  componentWillMount() {
    const client = new W3CWebSocket(
      'ws://127.0.0.1:3000?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwIiwiYXVkIjoib25lYWRtaW4iLCJqdGkiOiJkYzNjMmJkMDhlODM3MmU0NWY5MDVmNjE0ZjdkMDE0YmQ2ZmE3ZTVjYjlmNjU1OTRjNjRjYzMzZjNiYmYxY2IyIiwiaWF0IjoxNTY5MjIxOTgwLCJleHAiOjE1NzA0MzE1ODB9.ESxu8xeGNVQCAJ2T5-93y2cWofXCNxvsAdT0Jt5Qt5I'
    );

    client.onopen = () => {
      const config = {
        color: 'green',
        type: 'ERROR',
        message: 'WebSocket Client Connected'
      };
      messageTerminal(config);
    };

    client.onmessage = message => {
      if (message && message.data) {
        this.setState({
          data: JSON.parse(message.data)
        });
      }
    };
  }

  render() {
    const { data } = this.state;
    return <JSONPretty id="json-pretty" data={data} />;
  }
}

export default WSConsole;
