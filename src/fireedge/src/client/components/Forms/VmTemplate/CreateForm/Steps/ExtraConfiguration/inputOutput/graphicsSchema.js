/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean } from 'yup'

import { Field, arrayToOptions, filterFieldsByHypervisor } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { vcenter, lxc, kvm } = HYPERVISORS

/** @type {Field} Type field */
const TYPE = {
  name: 'GRAPHICS.TYPE',
  type: INPUT_TYPES.TOGGLE,
  dependOf: '$general.HYPERVISOR',
  values: (hypervisor = kvm) => {
    const types = {
      [vcenter]: [T.VMRC],
      [lxc]: [T.VNC]
    }[hypervisor] ?? [T.VNC, T.SDL, T.SPICE]

    return arrayToOptions(types)
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

/** @type {Field} Listen field */
const LISTEN = {
  name: 'GRAPHICS.LISTEN',
  label: T.ListenOnIp,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: noneType => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  fieldProps: { placeholder: '0.0.0.0' },
  grid: { md: 12 }
}

/** @type {Field} Port field */
const PORT = {
  name: 'GRAPHICS.PORT',
  label: T.ServerPort,
  tooltip: T.ServerPortConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: noneType => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Keymap field */
const KEYMAP = {
  name: 'GRAPHICS.KEYMAP',
  label: T.Keymap,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: noneType => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  fieldProps: { placeholder: 'en-us' }
}

/** @type {Field} Password random field  */
const RANDOM_PASSWD = {
  name: 'GRAPHICS.RANDOM_PASSWD',
  label: T.GenerateRandomPassword,
  type: INPUT_TYPES.CHECKBOX,
  dependOf: TYPE.name,
  htmlType: noneType => !noneType && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .default(() => false)
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    }),
  grid: { md: 12 }
}

/** @type {Field} Password field */
const PASSWD = {
  name: 'GRAPHICS.PASSWD',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  dependOf: [TYPE.name, RANDOM_PASSWD.name],
  htmlType: ([noneType, random] = []) =>
    (!noneType || random) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

/** @type {Field} Command field */
const COMMAND = {
  name: 'GRAPHICS.COMMAND',
  label: T.Command,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: noneType => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of Graphics fields
 */
export const GRAPHICS_FIELDS = hypervisor =>
  filterFieldsByHypervisor(
    [TYPE, LISTEN, PORT, KEYMAP, PASSWD, RANDOM_PASSWD, COMMAND],
    hypervisor
  )
