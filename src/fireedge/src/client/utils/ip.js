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

// reference to `src/oca/ruby/opennebula/virtual_network.rb`
const mac = '([a-fA-F\\d]{2}:){5}[a-fA-F\\d]{2}'

const v4 =
  '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}'

const v6segment = '[a-fA-F\\d]{1,4}'

const v6 = `
(?:
(?:${v6segment}:){7}(?:${v6segment}|:)|
(?:${v6segment}:){6}(?:${v4}|:${v6segment}|:)|
(?:${v6segment}:){5}(?::${v4}|(?::${v6segment}){1,2}|:)|
(?:${v6segment}:){4}(?:(?::${v6segment}){0,1}:${v4}|(?::${v6segment}){1,3}|:)|
(?:${v6segment}:){3}(?:(?::${v6segment}){0,2}:${v4}|(?::${v6segment}){1,4}|:)|
(?:${v6segment}:){2}(?:(?::${v6segment}){0,3}:${v4}|(?::${v6segment}){1,5}|:)|
(?:${v6segment}:){1}(?:(?::${v6segment}){0,4}:${v4}|(?::${v6segment}){1,6}|:)|
(?::(?:(?::${v6segment}){0,5}:${v4}|(?::${v6segment}){1,7}|:))
)(?:%[0-9a-zA-Z]{1,})?
`
  .replace(/\n/g, '')
  .trim()

// Pre-compile only the exact regexes because adding a global flag make regexes stateful
export const REG_ADDR = new RegExp(`(?:^${v4}$)|(?:^${v6}$)|(?:^${mac}$)`)
export const REG_IP = new RegExp(`(?:^${v4}$)|(?:^${v6}$)`)
export const REG_V4 = new RegExp(`^${v4}$`)
export const REG_V6 = new RegExp(`^${v6}$`)
export const REG_MAC = new RegExp(`^${mac}$`)

/**
 * Checks if string is IPv6 or IPv4.
 *
 * @param {string} string - String to check
 * @returns {boolean} Returns `true` if the given value is an IP
 */
export const isIP = (string) => REG_IP.test(string)

/**
 * Checks if string is IPv6.
 *
 * @param {string} string - String to check
 * @returns {boolean} Returns `true` if the given value is an IPv6
 */
export const isIPv6 = (string) => REG_V6.test(string)

/**
 * Checks if string is IPv4.
 *
 * @param {string} string - String to check
 * @returns {boolean} Returns `true` if the given value is an IPv4
 */
export const isIPv4 = (string) => REG_V4.test(string)

/**
 * Checks if string is MAC address.
 *
 * @param {string} string - String to check
 * @returns {boolean} Returns `true` if the given value is a MAC address
 */
export const isMAC = (string) => REG_MAC.test(string)
