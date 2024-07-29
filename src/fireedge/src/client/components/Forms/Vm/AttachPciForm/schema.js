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
import { string, ObjectSchema, boolean } from 'yup'
import { useGetHostsAdminQuery } from 'client/features/OneApi/host'
import { getPciDevices } from 'client/models/Host'
import {
  Field,
  arrayToOptions,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { uniqWith } from 'lodash'

const samePciDevice = (obj1, obj2) =>
  obj1.VENDOR === obj2.VENDOR &&
  obj1.DEVICE === obj2.DEVICE &&
  obj1.CLASS === obj2.CLASS &&
  obj1.SHORT_ADDRESS === obj2.SHORT_ADDRESS

/**
 * Transform a PCI device to String.
 *
 * @param {ObjectSchema} pciDevice - PCI device information
 * @returns {string} - DEVICE, VENDOR and CLASS separated by semicolon
 */
export const transformPciToString = (pciDevice = {}) => {
  const { DEVICE = '', VENDOR = '', CLASS = '' } = pciDevice

  return [DEVICE, VENDOR, CLASS].join(';')
}

/**
 * Obtain values from a PCI device String.
 *
 * @param {string} pciDevice - DEVICE, VENDOR and CLASS separated by semicolon
 * @returns {ObjectSchema} - PCI device information
 */
export const getPciAttributes = (pciDevice = '') => {
  const [DEVICE, VENDOR, CLASS] = pciDevice.split(';')

  return { DEVICE, VENDOR, CLASS }
}

/** @type {Field} Specific device PCI device field */
const SPECIFIC_DEVICE = {
  name: 'SPECIFIC_DEVICE',
  label: T.PCISpecificDevice,
  tooltip: T.PCISpecificDeviceHelp,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().notRequired(),
  grid: { sm: 12, md: 12 },
}

/** @type {Field} Name PCI device field */
const NAME_FIELD = {
  name: 'PCI_DEVICE_NAME',
  label: T.DeviceName,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: SPECIFIC_DEVICE.name,
  htmlType: (specificDevice) => specificDevice && INPUT_TYPES.HIDDEN,
  values: () => {
    const { data: hosts = [] } = useGetHostsAdminQuery()
    const pciDevices = hosts.map(getPciDevices).flat()

    return arrayToOptions(uniqWith(pciDevices, samePciDevice), {
      getText: ({ DEVICE_NAME } = {}) => DEVICE_NAME,
      getValue: transformPciToString,
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .afterSubmit(() => undefined),
  grid: { sm: 12, md: 3 },
}

/** @type {Field} PCI device field */
const DEVICE_FIELD = {
  name: 'DEVICE',
  label: T.Device,
  type: INPUT_TYPES.TEXT,
  dependOf: [NAME_FIELD.name, SPECIFIC_DEVICE.name],
  htmlType: ([_, specificDevice] = []) => specificDevice && INPUT_TYPES.HIDDEN,
  watcher: ([pciDevice] = []) => {
    if (pciDevice) {
      const { DEVICE: attribute } = getPciAttributes(pciDevice)

      return attribute
    }
  },
  fieldProps: { disabled: true },
  validation: string()
    .trim()
    .when(SPECIFIC_DEVICE.name, (type, schema) => {
      schema.afterSubmit((value, { context }) =>
        context?.SPECIFIC_DEVICE ? undefined : value
      )

      return type ? schema.notRequired() : schema.required()
    }),
  grid: { xs: 12, sm: 3, md: 2 },
}

/** @type {Field} PCI device field */
const VENDOR_FIELD = {
  name: 'VENDOR',
  label: T.Vendor,
  type: INPUT_TYPES.TEXT,
  dependOf: [NAME_FIELD.name, SPECIFIC_DEVICE.name],
  htmlType: ([_, specificDevice] = []) => specificDevice && INPUT_TYPES.HIDDEN,
  watcher: ([pciDevice] = []) => {
    if (pciDevice) {
      const { VENDOR: attribute } = getPciAttributes(pciDevice)

      return attribute
    }
  },
  fieldProps: { disabled: true },
  validation: string()
    .trim()
    .when(SPECIFIC_DEVICE.name, (type, schema) => {
      schema.afterSubmit((value, { context }) =>
        context?.SPECIFIC_DEVICE ? undefined : value
      )

      return type ? schema.notRequired() : schema.required()
    }),
  grid: { xs: 12, sm: 3, md: 2 },
}

/** @type {Field} PCI device field */
const CLASS_FIELD = {
  name: 'CLASS',
  label: T.Class,
  type: INPUT_TYPES.TEXT,
  dependOf: [NAME_FIELD.name, SPECIFIC_DEVICE.name],
  htmlType: ([_, specificDevice] = []) => specificDevice && INPUT_TYPES.HIDDEN,
  watcher: ([pciDevice] = []) => {
    if (pciDevice) {
      const { CLASS: attribute } = getPciAttributes(pciDevice)

      return attribute
    }
  },
  fieldProps: { disabled: true },
  validation: string()
    .trim()
    .when(SPECIFIC_DEVICE.name, (type, schema) => {
      schema.afterSubmit((value, { context }) =>
        context?.SPECIFIC_DEVICE ? undefined : value
      )

      return type ? schema.notRequired() : schema.required()
    }),
  grid: { xs: 12, sm: 3, md: 2 },
}

/** @type {Field} PCI device field */
const SHORT_ADDRESS = {
  name: 'SHORT_ADDRESS',
  label: T.ShortAddress,
  tooltip: T.ShortAddressConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: SPECIFIC_DEVICE.name,
  htmlType: (specificDevice) => !specificDevice && INPUT_TYPES.HIDDEN,
  values: () => {
    const { data: hosts = [] } = useGetHostsAdminQuery()
    const pciDevices = hosts.map(getPciDevices).flat()

    return arrayToOptions(uniqWith(pciDevices, samePciDevice), {
      addEmpty: false,
      getText: ({ SHORT_ADDRESS: ADDRESS, DEVICE_NAME } = {}) =>
        `${DEVICE_NAME}: ${ADDRESS}`,
      getValue: ({ SHORT_ADDRESS: ADDRESS } = {}) => ADDRESS,
    })
  },
  fieldProps: {
    freeSolo: true,
  },
  validation: string().when(SPECIFIC_DEVICE.name, (type, schema) => {
    schema.afterSubmit((value, { context }) =>
      !context?.SPECIFIC_DEVICE ? undefined : value
    )

    return !type ? schema.notRequired() : schema.required()
  }),
}

/**
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of Graphic inputs fields
 */
export const PCI_FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [
      SPECIFIC_DEVICE,
      NAME_FIELD,
      DEVICE_FIELD,
      VENDOR_FIELD,
      CLASS_FIELD,
      SHORT_ADDRESS,
    ],
    'PCI',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} PCI devices object schema */
export const PCI_SCHEMA = getObjectSchemaFromFields([
  SPECIFIC_DEVICE,
  NAME_FIELD,
  DEVICE_FIELD,
  VENDOR_FIELD,
  CLASS_FIELD,
  SHORT_ADDRESS,
])
