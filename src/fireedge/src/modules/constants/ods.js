/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

/**
 * This class models the OpenNebula Document Server (ODS) user inputs that
 * will be used in Sinatra servers like OneForm (connection values and user inputs)
 * and OneK8S
 */

/**
 * @typedef {(
 * 'string' |
 * 'number' |
 * 'bool' |
 * 'list' |
 * 'listString' |
 * 'map'
 * )} ODSUserInputType
 * - Terraform types for ODS User Input
 */

/**
 * @typedef MatchValueType
 * @property {ODSUserInputType} type - Type of ODS User Input
 * @property {string} grouped_by - Grouping criteria for ODS User Input
 * @property {string[]|object[]} values - List of possible values for the ODS User Input
 */

/**
 * @typedef ODSUserInput
 * @property {string} name - Name of ODS User Input
 * @property {string} description - Description of ODS User Input
 * @property {string|boolean|number|Array|object} default - Default value for ODS User Input
 * @property {ODSUserInputType} type - Type of ODS User Input
 * @property {MatchValueType} match - Validation rule for ODS User Input
 */

/** @enum {ODSUserInputType} Connection Value types */
export const ODS_USER_INPUT_TYPES = {
  string: 'string',
  number: 'number',
  bool: 'bool',
  list: 'list',
  listString: 'list(string)',
  map: 'map',
}
