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
const { request } = require('axios');
const btoa = require('btoa');
const { Map } = require('immutable');

const {
  defaultOneFlowServer
} = require('../../../../utils/constants/defaults');
const { getConfig } = require('../../../../utils/yml');
const { httpMethod } = require('../../../../utils/constants/defaults');
const { addPrintf } = require('../../../../utils/general');
const { httpResponse } = require('../../../../utils/server');
const {
  ok,
  internalServerError
} = require('../../../../utils/constants/http-codes');

const { GET, DELETE } = httpMethod;

const appConfig = getConfig();
const oneFlowServiceDataConection =
  appConfig.ONE_FLOW_SERVER || defaultOneFlowServer;

const parsePostData = (postData = {}) => {
  const rtn = {};
  Object.entries(postData).forEach(([key, value]) => {
    try {
      rtn[key] = JSON.parse(value, (k, val) => {
        try {
          return JSON.parse(val);
        } catch (error) {
          return val;
        }
      });
    } catch (error) {
      rtn[key] = value;
    }
  });
  return rtn;
};

const returnSchemaError = (error = []) =>
  error
    .map(element => (element && element.stack ? element.stack : ''))
    .toString();

const conectionOneFlow = (
  res,
  next = () => undefined,
  method = GET,
  user = '',
  path = '/',
  requestData = '',
  postData = ''
) => {
  if (res && next && method && user) {
    const options = {
      method,
      baseURL: `${oneFlowServiceDataConection.PROTOCOL}://${oneFlowServiceDataConection.HOST}:${oneFlowServiceDataConection.PORT}`,
      url: path,
      headers: {
        Authorization: `Basic ${btoa(user)}`
      },
      validateStatus: status => status
    };

    if (requestData) {
      options.url = addPrintf(path, requestData);
    }

    if (postData) {
      options.data = postData;
    }
    request(options)
      .then(response => {
        if (response && response.statusText) {
          if (response.status >= 200 && response.status < 400) {
            if (response.data) {
              return response.data;
            }
            if (
              response.config.method &&
              response.config.method.toUpperCase() === DELETE
            ) {
              const parseToNumber = validate =>
                isNaN(parseInt(validate, 10))
                  ? validate
                  : parseInt(validate, 10);
              return Array.isArray(requestData)
                ? parseToNumber(requestData[0])
                : parseToNumber(requestData);
            }
          } else if (response.data) {
            throw Error(response.data);
          }
        }
        throw Error(response.statusText);
      })
      .then(data => {
        res.locals.httpCode = httpResponse(ok, data);
        next();
      })
      .catch(e => {
        const codeInternalServerError = Map(internalServerError).toObject();
        if (e && e.message) {
          codeInternalServerError.data = e.message;
        }
        res.locals.httpCode = httpResponse(internalServerError, e && e.message);
        next();
      });
  }
};

const functionRoutes = {
  conectionOneFlow,
  parsePostData,
  returnSchemaError
};

module.exports = functionRoutes;
