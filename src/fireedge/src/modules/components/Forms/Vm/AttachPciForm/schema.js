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
import { string, ObjectSchema, boolean } from 'yup'
import { HostAPI } from '@FeaturesModule'
import { getPciDevices } from '@ModelsModule'
import {
  Field,
  arrayToOptions,
  getObjectSchemaFromFields,
  disableFields,
} from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'
import { uniqWith } from 'lodash'
import { useFormContext } from 'react-hook-form'

const samePciDevice = (a, b) =>
  a &&
  b &&
  ['DEVICE', 'VENDOR', 'CLASS'].every((k) => a[k] === b[k]) &&
  a.SHORT_ADDRESS?.split('.')[0] === b.SHORT_ADDRESS?.split('.')[0]

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
    const { data: hosts = [] } = HostAPI.useGetHostsAdminQuery()
    const pciDevices = hosts.map(getPciDevices).flat()

    return arrayToOptions(uniqWith(pciDevices, samePciDevice), {
      getText: ({ DEVICE_NAME } = {}) => DEVICE_NAME,
      addDescription: true,
      getDescription: (opt) => opt?.TYPE,
      getValue: transformPciToString,
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .afterSubmit(() => undefined),
  grid: { sm: 12, md: 4 },
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
  grid: { xs: 12, md: 2 },
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
  grid: { xs: 12, md: 2 },
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
  grid: { xs: 12, md: 2 },
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
    const { data: hosts = [] } = HostAPI.useGetHostsAdminQuery()
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

/** @type {Field} Name PCI device field */
const PROFILE_FIELD = {
  name: 'PROFILE',
  label: T.Profile,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: (dependencies = []) => {
    const [selectedPciDevice] = dependencies
    const { data = [] } = HostAPI.useGetHostsAdminQuery({
      skip: selectedPciDevice === undefined,
    })
    if (selectedPciDevice && data) {
      const pciDevices = data.map(getPciDevices).flat()
      const [DEVICE, VENDOR, CLASS] = selectedPciDevice?.split(';')
      const selectedDevice = pciDevices.find(
        (device) =>
          device?.DEVICE === DEVICE &&
          device?.VENDOR === VENDOR &&
          device?.CLASS === CLASS
      )

      const profiles = selectedDevice?.PROFILES?.split(',') || []

      if (!profiles?.length) {
        const { setValue } = useFormContext()
        setValue(PROFILE_FIELD.name, '')
      }

      return arrayToOptions(profiles)
    }

    return arrayToOptions([])
  },
  dependOf: [NAME_FIELD.name, SPECIFIC_DEVICE.name],
  htmlType: ([_, specificDevice] = []) => specificDevice && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => ''),
  grid: { md: 6 },
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
      PROFILE_FIELD,
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
  PROFILE_FIELD,
])
