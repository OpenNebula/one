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
const { Map } = require('immutable');
const { existsSync } = require('fs-extra');
const { internalServerError } = require('./constants/http-codes');

let cert = '';
let key = '';

const validateServerIsSecure = () => {
  cert = `${__dirname}/../cert/cert.pem`;
  key = `${__dirname}/../cert/key.pem`;
  return existsSync && key && cert && existsSync(key) && existsSync(cert);
};

const getCert = () => cert;
const getKey = () => key;

const httpResponse = (response, data, message) => {
  let rtn = Map(internalServerError).toObject();
  rtn.data = data;
  if (response) {
    rtn = Map(response).toObject();
  }
  if (data || data === 0) {
    rtn.data = data;
  }
  if (message) {
    rtn.message = message;
  }
  return rtn;
};

module.exports = {
  httpResponse,
  validateServerIsSecure,
  getCert,
  getKey
};
