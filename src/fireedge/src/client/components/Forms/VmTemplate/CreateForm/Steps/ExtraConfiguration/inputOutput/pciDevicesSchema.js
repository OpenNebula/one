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
import { object, string, array, ObjectSchema } from 'yup'

import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getPciDevices } from 'client/models/Host'
import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { vcenter, lxc, firecracker } = HYPERVISORS

/**
 * Transform a PCI device to String.
 *
 * @param {ObjectSchema} pciDevice - PCI device information
 * @returns {string} - DEVICE, VENDOR, CLASS and PROFILES separated by semicolon
 */
export const transformPciToString = (pciDevice = {}) => {
  const { DEVICE = '', VENDOR = '', CLASS = '', PROFILES = '' } = pciDevice

  return [DEVICE, VENDOR, CLASS, PROFILES].join(';')
}

/**
 * Obtain values from a PCI device String.
 *
 * @param {string} pciDevice - DEVICE, VENDOR, CLASS and PROFILES separated by semicolon
 * @returns {ObjectSchema} - PCI device information
 */
export const getPciAttributes = (pciDevice = '') => {
  const [DEVICE, VENDOR, CLASS, PROFILES] = pciDevice.split(';')

  return { DEVICE, VENDOR, CLASS, PROFILES }
}

/** @type {Field} Name PCI device field */
const NAME_FIELD = {
  name: 'DEVICE_NAME',
  label: T.DeviceName,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { data: hosts = [] } = useGetHostsQuery()
    const pciDevices = hosts.map(getPciDevices).flat()

    return arrayToOptions(pciDevices, {
      getText: ({ DEVICE_NAME } = {}) => DEVICE_NAME,
      getValue: transformPciToString,
    })
  },
  validation: string().trim().notRequired(),
  grid: { sm: 12, md: 3 },
}

/** @type {Field} Name PCI device field */
const PROFILE_FIELD = {
  name: 'PROFILE',
  label: T.Profile,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: (pciDevice) => {
    if (pciDevice) {
      const { PROFILES } = getPciAttributes(pciDevice)
      const profiles = PROFILES.trim() === '' ? [] : PROFILES.split(',')

      return arrayToOptions(profiles)
    }

    return arrayToOptions([])
  },
  dependOf: NAME_FIELD.name,
  htmlType: (pciDevice) => {
    const { PROFILES } = getPciAttributes(pciDevice)
    const emptyProfiles = !PROFILES || PROFILES === '' || PROFILES === '-'

    return emptyProfiles && INPUT_TYPES.HIDDEN
  },
  validation: string().trim().notRequired(),
  grid: { sm: 12, md: 3 },
}

/** @type {Field} Common field properties */
const commonFieldProps = (name) => ({
  name,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.TEXT,
  dependOf: NAME_FIELD.name,
  watcher: (pciDevice) => {
    if (pciDevice) {
      const { [name]: attribute } = getPciAttributes(pciDevice)

      return attribute
    }
  },
  validation: string().trim().required(),
  grid: { xs: 12, sm: 3, md: 2 },
})

/** @type {Field} Common hidden field properties */
const commonHiddenFieldProps = (name) => ({
  name,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.TEXT,
  htmlType: INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .afterSubmit((content) => content),
  fieldProps: { disabled: true },
  grid: { xs: 12, sm: 3, md: 2 },
})

/** @type {Field} PCI device field */
const DEVICE_FIELD = { label: T.Device, ...commonFieldProps('DEVICE') }

/** @type {Field} PCI device field */
const VENDOR_FIELD = { label: T.Vendor, ...commonFieldProps('VENDOR') }

/** @type {Field} PCI device field */
const CLASS_FIELD = { label: T.Class, ...commonFieldProps('CLASS') }

/** @type {Field} PCI device field */
const SHORT_ADDRESS_FIELD = { ...commonHiddenFieldProps('SHORT_ADDRESS') }

/** @type {Field} PCI device field */
const NETWORK_FIELD = { ...commonHiddenFieldProps('NETWORK') }

/** @type {Field} PCI device field */
const NETWORK_UNAME_FIELD = { ...commonHiddenFieldProps('NETWORK_UNAME') }

/** @type {Field} PCI device field */
const SECURITY_GROUPS_FIELD = { ...commonHiddenFieldProps('SECURITY_GROUPS') }

/** @type {Field} PCI device field */
const TYPE_FIELD = { ...commonHiddenFieldProps('TYPE') }

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of Graphic inputs fields
 */
export const PCI_FIELDS = (hypervisor, oneConfig, adminGroup) =>
  disableFields(
    filterFieldsByHypervisor(
      [NAME_FIELD, PROFILE_FIELD, DEVICE_FIELD, VENDOR_FIELD, CLASS_FIELD],
      hypervisor
    ),
    'PCI',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} PCI devices object schema */
export const PCI_SCHEMA = getObjectSchemaFromFields([
  PROFILE_FIELD,
  DEVICE_FIELD,
  VENDOR_FIELD,
  CLASS_FIELD,
  SHORT_ADDRESS_FIELD,
  NETWORK_FIELD,
  NETWORK_UNAME_FIELD,
  SECURITY_GROUPS_FIELD,
  TYPE_FIELD,
])

/** @type {ObjectSchema} PCI devices schema */
export const PCI_DEVICES_SCHEMA = object({
  PCI: array(PCI_SCHEMA).ensure(),
})
