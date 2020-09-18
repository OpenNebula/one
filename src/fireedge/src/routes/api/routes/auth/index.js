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
const { AUTH } = require('./string-routes');
const {
  httpMethod,
  defaultMethodLogin
} = require('../../../../utils/constants/defaults');
const {
  internalServerError
} = require('../../../../utils/constants/http-codes');
const { from: fromData } = require('../../../../utils/constants/defaults');

const {
  responseOpennebula,
  checkOpennebulaCommand
} = require('../../../../utils/opennebula');

const {
  authenticate,
  getUser,
  getPass,
  setUser,
  setPass,
  setTfaToken,
  setExtended,
  setNext,
  setReq,
  setRes,
  setNodeConnect,
  setDates,
  getRelativeTime,
  connectOpennebula,
  updaterResponse
} = require('./functions');

const { POST } = httpMethod;

const privateRoutes = [];

const publicRoutes = [
  {
    httpMethod: POST,
    endpoint: AUTH,
    action: (req, res, next, connect) => {
      if (req && res && connect) {
        setReq(req);
        setRes(res);
        setNext(next);
        updaterResponse(Map(internalServerError).toObject());
        const getOpennebulaMethod = checkOpennebulaCommand(
          defaultMethodLogin,
          POST
        );
        if (getOpennebulaMethod) {
          setUser(
            (req &&
              fromData.postBody &&
              req[fromData.postBody] &&
              req[fromData.postBody].user) ||
              ''
          );
          setPass(
            (req &&
              fromData.postBody &&
              req[fromData.postBody] &&
              req[fromData.postBody].pass) ||
              ''
          );
          setTfaToken(
            (req && req[fromData.postBody] && req[fromData.postBody].token) ||
              ''
          );
          setExtended(
            (req &&
              req[fromData.postBody] &&
              req[fromData.postBody].extended) ||
              ''
          );
          setNodeConnect(connect);
          if (getUser() && getPass()) {
            setDates();
            const relativeTime = getRelativeTime();
            const oneConnect = connectOpennebula();
            const dataSourceWithExpirateDate = Map(req).toObject();
            // add expire time unix for opennebula creation token
            dataSourceWithExpirateDate[fromData.postBody].expire = relativeTime;
            dataSourceWithExpirateDate[fromData.postBody].token = '';
            oneConnect(
              defaultMethodLogin,
              getOpennebulaMethod(dataSourceWithExpirateDate),
              (err, value) => {
                responseOpennebula(
                  updaterResponse,
                  err,
                  value,
                  authenticate,
                  next
                );
              }
            );
          }
        } else {
          next();
        }
      } else {
        next();
      }
    }
  }
];

const functionRoutes = {
  private: privateRoutes,
  public: publicRoutes
};

module.exports = functionRoutes;
