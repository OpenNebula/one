/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
 * 'fixed' |
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
 * @typedef UserInputObject
 * @property {boolean} mandatory - If `true`, the input will be required
 * @property {UserInputType} type - Input type
 * @property {string} name - Name of input
 * @property {string} [description] - Description of input
 * @property {number|string} [min] - Minimum value.
 * Valid for types: `range` or `range-float`
 * @property {number|string} [max] - Maximum value.
 * Valid for types: `range` or `range-float`
 * @property {string|string[]} [options] - Available options.
 * Valid for types: `list`, `list-multiple` or `array`
 * @property {number|string|string[]} [default] - Default value for the input
 */

/**
 * User input used on provision templates for OneProvision.
 *
 * @typedef UserInputOneProvisionObject
 * @property {string} name - Name of input
 * @property {string} description - Description of input
 * @property {UserInputType} type - Type of input
 * @property {number|string} [min_value] - Minimum value.
 * Valid for types: `range` or `range-float`
 * @property {number|string} [max_value] - Maximum value
 * Valid for types: `range` or `range-float`
 * @property {string|string[]} [options] - Available options.
 * Valid for types: `list`, `list-multiple` or `array`
 * @property {number|string|string[]} default - Default value for the input
 */

/** @enum {UserInputType} User input types */
export const USER_INPUT_TYPES = {
  fixed: 'fixed',
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
