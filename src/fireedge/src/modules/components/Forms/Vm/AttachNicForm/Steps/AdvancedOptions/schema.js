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
import { boolean, string, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
  arrayToOptions,
  disableFields,
} from '@UtilsModule'
import {
  T,
  INPUT_TYPES,
  HYPERVISORS,
  VN_DRIVERS,
  Nic,
  NIC_HARDWARE,
  NIC_HARDWARE_STR,
  PCI_TYPES,
} from '@ConstantsModule'
import { HostAPI } from '@FeaturesModule'
import { getPciDevices } from '@ModelsModule'
import {
  getPciAttributes,
  transformPciToString,
} from '@modules/components/Forms/Vm/AttachPciForm/schema.js'

const { lxc } = HYPERVISORS
const PCI_TYPE_NAME = 'PCI_TYPE'
const DEVICE_LIST = 'DEVICE_LIST'
const VENDOR = 'VENDOR'
const DEVICE = 'DEVICE'
const CLASS = 'CLASS'

const filterByHypAndDriver = (fields, { hypervisor, driver }) =>
  filterFieldsByDriver(filterFieldsByHypervisor(fields, hypervisor), driver)

const fillPCIAtributes =
  (nameAttr) =>
  ([_, pciDevice = ''] = []) => {
    if (pciDevice) {
      const { [nameAttr]: attribute } = getPciAttributes(pciDevice)

      return attribute
    }
  }

/**
 * @param {object} [data] - VM or VM Template data
 * @param {boolean} [data.isAlias] - If it's an alias
 * @param {boolean} [data.disableNetworkAutoMode] - Disable the switch to enable network auto mode
 * @returns {Field[]} List of general fields
 */
const GENERAL_FIELDS = ({
  isAlias = false,
  disableNetworkAutoMode = false,
} = {}) =>
  [
    isAlias && {
      name: 'EXTERNAL',
      label: T.SkipNetworkContextualization,
      tooltip: T.SkipNetworkContextualizationConcept,
      type: INPUT_TYPES.SWITCH,
      validation: boolean().yesOrNo(),
      grid: { sm: 6 },
    },
    !isAlias &&
      !disableNetworkAutoMode && {
        name: 'NETWORK_MODE',
        label: T.AutomaticNetworkMode,
        tooltip: T.NetworkMoeConcept,
        type: INPUT_TYPES.SWITCH,
        validation: boolean()
          .yesOrNo()
          .afterSubmit((value) => (value ? 'auto' : '')),
        grid: { sm: 6 },
        stepControl: [
          {
            condition: (value) => value === true,
            steps: ['network'],
          },
          {
            condition: (value) => value === false,
            steps: ['network-auto'],
          },
        ],
      },
  ].filter(Boolean)

const GUACAMOLE_CONNECTIONS = [
  {
    name: 'RDP',
    label: T.RdpConnection,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().yesOrNo(),
    grid: { md: 12 },
  },
  {
    name: 'RDP_SERVER_LAYOUT',
    label: T.RdpLayout,
    type: INPUT_TYPES.AUTOCOMPLETE,
    dependOf: 'RDP',
    values: [
      { text: T.PortugueseBr, value: 'pt-br-qwerty' },
      { text: T.EnglishGB, value: 'en-gb-qwerty' },
      { text: T.EnglishUS, value: 'en-us-qwerty' },
      { text: T.French, value: 'fr-fr-azerty' },
      { text: T.FrenchBe, value: 'fr-be-azerty' },
      { text: T.FrenchSw, value: 'fr-ch-qwertz' },
      { text: T.German, value: 'de-de-qwertz' },
      { text: T.GermanSw, value: 'de-ch-qwertz' },
      { text: T.Hungarian, value: 'hu-hu-qwertz' },
      { text: T.Italian, value: 'it-it-qwerty' },
      { text: T.Japanese, value: 'ja-jp-qwerty' },
      { text: T.SpanishEs, value: 'es-es-qwerty' },
      { text: T.SpanishLatam, value: 'es-latam-qwerty' },
      { text: T.Swedish, value: 'sv-se-qwerty' },
      { text: T.Turkish, value: 'tr-tr-qwerty' },
      { text: T.Other, value: 'failsafe' },
    ],
    validation: string().trim().notRequired().default(undefined),
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    grid: { sm: 6 },
  },
  {
    name: 'RDP_RESIZE_METHOD',
    label: T.RdpRizeMethod,
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    dependOf: 'RDP',
    values: [
      { text: '-', value: undefined },
      { text: T.DisplayUpdate, value: 'display-update' },
      { text: T.Reconnect, value: 'reconnect' },
    ],
    validation: string().trim().notRequired().default(undefined),
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    grid: { sm: 6 },
  },
  {
    name: 'RDP_DISABLE_AUDIO',
    label: T.DisableAudio,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_AUDIO_INPUT',
    label: T.EnableAudioInput,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_WALLPAPER',
    label: T.EnableWallpaper,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_THEMING',
    label: T.EnableTheming,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_FONT_SMOOTHING',
    label: T.EnableFontSmoothing,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_FULL_WINDOW_DRAG',
    label: T.EnableFullWindowDrag,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_DESKTOP_COMPOSITION',
    label: T.EnableDesktopComposition,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_ENABLE_MENU_ANIMATIONS',
    label: T.EnableMenuAnimations,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_DISABLE_BITMAP_CACHING',
    label: T.DisableBitmapCaching,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_DISABLE_OFFSCREEN_CACHING',
    label: T.DisableOffscreenCaching,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'RDP_DISABLE_GLYPH_CACHING',
    label: T.DisableGlyphCaching,
    type: INPUT_TYPES.SWITCH,
    dependOf: 'RDP',
    htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
    validation: boolean().yesOrNo(),
    grid: { sm: 6 },
  },
  {
    name: 'SSH',
    label: T.SshConnection,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().yesOrNo(),
    grid: { md: 12 },
  },
]

/** @type {Field[]} List of hardware fields */
const HARDWARE_FIELDS = (
  defaultData = {},
  hasAlias = false,
  isAlias = false
) => [
  {
    name: PCI_TYPE_NAME,
    label: T.VirtualNicHardwareMode,
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: arrayToOptions(Object.values(NIC_HARDWARE), {
      addEmpty: false,
      getText: (key) => NIC_HARDWARE_STR[key],
      getValue: (type) => type,
    }),
    fieldProps: {
      disabled: hasAlias || isAlias,
    },
    validation: string()
      .trim()
      .default(() => {
        if (defaultData?.SHORT_ADDRESS) {
          return NIC_HARDWARE.PCI_PASSTHROUGH_MANUAL
        }
        if (defaultData?.CLASS && defaultData?.VENDOR && defaultData?.DEVICE) {
          return NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC
        }

        return NIC_HARDWARE.EMULATED
      }),
    grid: { md: 12 },
  },
  // Emulated mode fields
  {
    name: 'MODEL',
    label: T.HardwareModelToEmulate,
    dependOf: PCI_TYPE_NAME,
    htmlType: (value) => value !== NIC_HARDWARE.EMULATED && INPUT_TYPES.HIDDEN,
    type: INPUT_TYPES.TEXT,
    fieldProps: {
      disabled: hasAlias || isAlias,
    },
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
    grid: { md: 5 },
  },
  {
    name: 'VIRTIO_QUEUES',
    label: T.TransmissionQueue,
    tooltip: T.OnlySupportedForVirtioDriver,
    type: INPUT_TYPES.TEXT,
    fieldProps: ([_, AUTO] = []) => ({
      disabled: AUTO || hasAlias || isAlias,
    }),
    dependOf: [PCI_TYPE_NAME, 'AUTO_VIRTIO_QUEUES'],
    value: (_, form) => {
      if (form?.getValues(`advanced.AUTO_VIRTIO_QUEUES`) && form?.setValue) {
        form?.setValue(`advanced.VIRTIO_QUEUES`, 'auto')
      }
    },
    validation: string()
      .trim()
      .default(() => undefined),
    htmlType: ([value, _] = []) =>
      value !== NIC_HARDWARE.EMULATED ? INPUT_TYPES.HIDDEN : 'number',
    grid: { md: 4.5 },
  },
  {
    name: 'AUTO_VIRTIO_QUEUES',
    label: T.Auto,
    tooltip: T.AutoVirtioQueues,
    type: INPUT_TYPES.SWITCH,
    dependOf: PCI_TYPE_NAME,
    htmlType: (value) =>
      value !== NIC_HARDWARE.EMULATED ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SWITCH,
    validation: boolean()
      .notRequired()
      .default(() => false)
      .afterSubmit(() => undefined),
    grid: { md: 1.5 },
  },
  // PCI Passthrough Automatic mode fields
  {
    name: DEVICE_LIST,
    label: T.DeviceName,
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: () => {
      const { data: hosts = [] } = HostAPI.useGetHostsAdminQuery()
      const pciDevices = hosts
        .map(getPciDevices)
        .flat()
        .reduce(
          (currentPCIS, newDevice) =>
            currentPCIS.some((pci) => pci.ADDRESS === newDevice.ADDRESS) // Filter out devices with the same address
              ? currentPCIS
              : [...currentPCIS, newDevice],
          []
        )

      return arrayToOptions(pciDevices, {
        getText: ({ DEVICE_NAME } = {}) => DEVICE_NAME,
        getValue: transformPciToString,
      })
    },
    validation: string()
      .trim()
      .default(() => {
        const {
          DEVICE: dataDevice = undefined,
          VENDOR: dataVendor = undefined,
          CLASS: dataClass = undefined,
          PROFILES: dataProfile = undefined,
        } = defaultData

        return (
          dataDevice &&
          dataVendor &&
          dataClass &&
          [dataDevice, dataVendor, dataClass, dataProfile].join(';')
        )
      })
      .afterSubmit(() => undefined),
    dependOf: PCI_TYPE_NAME,
    htmlType: (pciTypeValue) =>
      pciTypeValue !== NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC &&
      INPUT_TYPES.HIDDEN,
    grid: { md: 3 },
  },
  {
    name: VENDOR,
    label: T.Vendor,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [lxc],
    dependOf: [PCI_TYPE_NAME, DEVICE_LIST],
    watcher: fillPCIAtributes(VENDOR),
    htmlType: (_, context) => {
      const values = context?.getValues() || {}

      return (
        values?.advanced?.PCI_TYPE !== NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC &&
        INPUT_TYPES.HIDDEN
      )
    },
    validation: string()
      .when('PCI_TYPE', (type, schema) =>
        type === NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC
          ? schema.required()
          : schema.notRequired()
      )
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    fieldProps: {
      disabled: true,
    },
  },
  {
    name: DEVICE,
    label: T.Device,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [lxc],
    dependOf: [PCI_TYPE_NAME, DEVICE_LIST],
    watcher: fillPCIAtributes(DEVICE),
    htmlType: (_, context) => {
      const values = context?.getValues() || {}

      return (
        values?.advanced?.PCI_TYPE !== NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC &&
        INPUT_TYPES.HIDDEN
      )
    },
    validation: string()
      .when('PCI_TYPE', (type, schema) =>
        type === NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC
          ? schema.required()
          : schema.notRequired()
      )
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    fieldProps: {
      disabled: true,
    },
  },
  {
    name: CLASS,
    label: T.Class,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [lxc],
    dependOf: [PCI_TYPE_NAME, DEVICE_LIST],
    watcher: fillPCIAtributes(CLASS),
    htmlType: (_, context) => {
      const values = context?.getValues() || {}

      return (
        values?.advanced?.PCI_TYPE !== NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC &&
        INPUT_TYPES.HIDDEN
      )
    },
    validation: string()
      .when('PCI_TYPE', (type, schema) =>
        type === NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC
          ? schema.required()
          : schema.notRequired()
      )
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    fieldProps: {
      disabled: true,
    },
  },
  // PCI Passthrough Manual mode fields
  {
    name: 'SHORT_ADDRESS',
    label: T.ShortAddress,
    tooltip: T.ShortAddressConcept,
    type: INPUT_TYPES.AUTOCOMPLETE,
    notOnHypervisors: [lxc],
    dependOf: PCI_TYPE_NAME,
    htmlType: (value) =>
      value !== NIC_HARDWARE.PCI_PASSTHROUGH_MANUAL && INPUT_TYPES.HIDDEN,
    values: () => {
      const { data: hosts = [] } = HostAPI.useGetHostsAdminQuery()
      const pciDevices = hosts
        .map(getPciDevices)
        .flat()
        .reduce(
          (currentPCIS, newDevice) =>
            currentPCIS.some((pci) => pci.ADDRESS === newDevice.ADDRESS) // Filter out devices with the same address
              ? currentPCIS
              : [...currentPCIS, newDevice],
          []
        )

      return arrayToOptions(pciDevices, {
        addEmpty: false,
        getText: ({ SHORT_ADDRESS, DEVICE_NAME } = {}) =>
          `${DEVICE_NAME}: ${SHORT_ADDRESS}`,
        getValue: ({ SHORT_ADDRESS } = {}) => SHORT_ADDRESS,
      })
    },
    validation: string()
      .when('PCI_TYPE', (type, schema) =>
        type === NIC_HARDWARE.PCI_PASSTHROUGH_MANUAL
          ? schema.required()
          : schema.notRequired()
      )
      .default(() => defaultData?.SHORT_ADDRESS)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.MANUAL ? value : undefined
      ),
  },
]

/** @type {Field[]} List of guest option fields */
const GUEST_FIELDS = [
  {
    name: 'GUEST_MTU',
    label: T.GuestMTU,
    tooltip: T.GuestMTUConcept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
]

/**
 * @param {object} data - VM or VM Template data
 * @param {Nic[]} [data.nics] - Current nics on resource
 * @param {VN_DRIVERS} [data.driver] - Virtual network driver
 * @param {HYPERVISORS} [data.hypervisor] - VM Hypervisor
 * @param {object} data.defaultData - VM or VM Template data
 * @param {object} data.oneConfig - Config of oned.conf
 * @param {boolean} data.adminGroup - User is admin or not
 * @param {boolean} [data.hasAlias] - If has an alias
 * @param {boolean} [data.isPci] - If it's a PCI
 * @param {boolean} [data.isAlias] - If it's an alias
 * @param {boolean} [data.disableNetworkAutoMode] - Disable the switch to enable network auto mode
 * @returns {Section[]} Sections
 */
const SECTIONS = ({
  nics,
  driver,
  hypervisor = HYPERVISORS.kvm,
  defaultData,
  oneConfig,
  adminGroup,
  hasAlias,
  isPci,
  isAlias,
  disableNetworkAutoMode,
} = {}) => {
  const filters = { driver, hypervisor }

  let general = []

  general = [
    {
      id: 'general',
      legend: T.General,
      fields: disableFields(
        filterByHypAndDriver(
          GENERAL_FIELDS({
            nics,
            hasAlias,
            isPci,
            isAlias,
            disableNetworkAutoMode,
          }),
          filters
        ),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
  ]

  const sections = general.concat([
    {
      id: 'guacamole-connections',
      legend: T.GuacamoleConnections,
      fields: disableFields(
        filterByHypAndDriver(GUACAMOLE_CONNECTIONS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'guest',
      legend: T.GuestOptions,
      fields: disableFields(
        filterByHypAndDriver(GUEST_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
  ])

  if (!isAlias) {
    // Add hardware section before the guest section
    sections.splice(sections.length - 1, 0, {
      id: 'hardware',
      legend: T.Hardware,
      fields: disableFields(
        filterByHypAndDriver(
          HARDWARE_FIELDS(defaultData, hasAlias, isAlias),
          filters
        ),
        'NIC',
        oneConfig,
        adminGroup
      ),
    })
  }

  return sections
}

/**
 * @param {object} data - VM or VM Template data
 * @returns {Field[]} Advanced options schema
 */
const FIELDS = (data) =>
  SECTIONS(data)
    .map(({ fields }) => fields)
    .flat()

/**
 * @param {object} data - VM or VM Template data
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = (data) => getObjectSchemaFromFields(FIELDS(data))

export { SECTIONS, FIELDS, SCHEMA }
