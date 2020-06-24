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

const colors = require('colors');

const messageTerminal = ({ color, type, error, message }) => {
  const colorConsole = color || 'red';
  const typeConsole = type || '';
  const errorConsole = error || '';
  const messageConsole = message || 'Message Console ';
  const consoleColor =
    colorConsole === 'green'
      ? colors.green(messageConsole)
      : colors.red(messageConsole);
  console.log(consoleColor, typeConsole, errorConsole);
};

module.exports = {
  messageTerminal
};
