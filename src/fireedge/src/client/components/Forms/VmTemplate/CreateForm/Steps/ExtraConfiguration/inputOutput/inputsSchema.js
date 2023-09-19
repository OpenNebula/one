/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { string, array, object, ObjectSchema } from 'yup'
import { PcMouse, PenTablet, Usb, PlugTypeG } from 'iconoir-react'

import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getValidationFromFields,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  DEVICE_TYPES,
  DEVICE_BUS_TYPES,
  HYPERVISORS,
} from 'client/constants'

const { vcenter, lxc } = HYPERVISORS

export const deviceTypeIcons = {
  [DEVICE_TYPES.mouse]: <PcMouse />,
  [DEVICE_TYPES.tablet]: <PenTablet />,
}

export const busTypeIcons = {
  [DEVICE_BUS_TYPES.usb]: <Usb />,
  [DEVICE_BUS_TYPES.ps2]: <PlugTypeG />,
}

/** @type {Field} Type field */
const TYPE = {
  name: 'TYPE',
  label: T.Type,
  notOnHypervisors: [lxc, vcenter],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.values(DEVICE_TYPES)),
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { sm: 6, md: 6 },
}

/** @type {Field} Bus field */
const BUS = {
  name: 'BUS',
  label: T.Bus,
  notOnHypervisors: [lxc, vcenter],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.values(DEVICE_BUS_TYPES)),
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { sm: 6, md: 6 },
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of Graphic inputs fields
 */
export const INPUTS_FIELDS = (hypervisor, oneConfig, adminGroup) =>
  disableFields(
    filterFieldsByHypervisor([TYPE, BUS], hypervisor),
    'INPUT',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Graphic input object schema */
export const INPUT_SCHEMA = object(getValidationFromFields([TYPE, BUS]))

/** @type {ObjectSchema} Graphic inputs schema */
export const INPUTS_SCHEMA = object({
  INPUT: array(INPUT_SCHEMA).ensure(),
})
