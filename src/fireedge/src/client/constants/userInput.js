/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
 * @typedef {(
 * 'text' |
 * 'text64' |
 * 'password' |
 * 'number' |
 * 'number-float' |
 * 'range' |
 * 'range-float' |
 * 'boolean' |
 * 'list' |
 * 'array' |
 * 'list-multiple'
 * )} UserInputType
 * - OpenNebula types for user inputs
 */

/**
 * @typedef {object} UserInputObject
 * @property {boolean} mandatory - If `true`, the input will be required
 * @property {UserInputType} type - Input type
 * @property {string} name - Name of input
 * @property {string} [description] - Description of input
 * @property {number|string} [min] - Minimum value of range type input
 * @property {number|string} [max] - Maximum value of range type input
 * @property {string[]} [options] - Options available for the input
 * @property {number|string|string[]} [default] - Default value for the input
 */

/** @enum {UserInputType} User input types */
export const USER_INPUT_TYPES = {
  text: 'text',
  text64: 'text64',
  password: 'password',
  number: 'number',
  numberFloat: 'number-float',
  range: 'range',
  rangeFloat: 'range-float',
  boolean: 'boolean',
  list: 'list',
  array: 'array',
  listMultiple: 'list-multiple',
}
