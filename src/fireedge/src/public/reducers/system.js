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

let initial = {};

const GetConfigSystem = config => {
  let data = {};
  if (config) {
    const systemData = config();
    if (
      systemData?.SYSTEM_DATA?.NO_AUTH &&
      Array.isArray(systemData?.SYSTEM_DATA?.NO_AUTH)
    ) {
      const dataNoAuth = systemData.SYSTEM_DATA.NO_AUTH;
      const render = (finder, configData, result = {}) => {
        const rtn = result;
        const allowedTypes = ['string', 'number', 'boolean'];
        if (finder && Array.isArray(finder)) {
          finder.forEach(find => {
            const entriesFind = Object.entries(find);
            const [key, value] = entriesFind && entriesFind[0];
            const findKey = key && key === '0' ? find : key;
            const findValue = key && key !== '0' && value;
            if (findKey in configData && configData[findKey] !== null) {
              const typeElement = typeof configData[findKey];
              if (allowedTypes.includes(typeElement)) {
                rtn[findKey] = configData[findKey];
              } else if (Array.isArray(configData[findKey])) {
                const xxx = configData[findKey].reduce(
                  (accValue, currentValue) => {
                    const validate = render(
                      findValue,
                      currentValue,
                      rtn[findKey]
                    );
                    if (Object.entries(validate).length > 0) {
                      accValue.push(validate);
                    }
                    return accValue;
                  },
                  []
                );
                rtn[findKey] = xxx;
              } else {
                rtn[findKey] = render(
                  findValue,
                  configData[findKey],
                  rtn[findKey]
                );
              }
            }
            if (configData[findKey] === null) {
              rtn[findKey] = null;
            }
          });
        }
        return rtn;
      };
      data = render(dataNoAuth, systemData);
    }
    initial = { ...initial, ...data };
  }

  return (state = initial, action) => {
    switch (action.type) {
      default:
        return state;
    }
  };
};

module.exports = GetConfigSystem;
