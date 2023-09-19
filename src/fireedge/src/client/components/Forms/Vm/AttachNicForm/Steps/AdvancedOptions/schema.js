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
import { boolean, number, string, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
  arrayToOptions,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  HYPERVISORS,
  VN_DRIVERS,
  Nic,
  NIC_HARDWARE,
  NIC_HARDWARE_STR,
  PCI_TYPES,
} from 'client/constants'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getPciDevices } from 'client/models/Host'
import {
  getPciAttributes,
  transformPciToString,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/pciDevicesSchema'

const { vcenter, firecracker, lxc } = HYPERVISORS
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
 * @param {Nic[]} [data.nics] - Current NICs
 * @returns {Field[]} List of general fields
 */
const GENERAL_FIELDS = ({ nics = [] } = {}) =>
  [
    !!nics?.length && {
      name: 'PARENT',
      label: T.AsAnAlias,
      dependOf: 'NAME',
      type: (name) => {
        const hasAlias = nics?.some((nic) => nic.PARENT === name)

        return name && hasAlias ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SELECT
      },
      values: (name) => [
        { text: '', value: '' },
        ...nics
          .filter(({ PARENT }) => !PARENT) // filter nic alias
          .filter(({ NAME }) => NAME !== name || !name) // filter it self
          .map((nic) => {
            const { NAME, IP = '', NETWORK = '', NIC_ID = '' } = nic
            const text = [NAME ?? NIC_ID, NETWORK, IP]
              .filter(Boolean)
              .join(' - ')

            return { text, value: NAME }
          }),
      ],
      validation: string()
        .trim()
        .notRequired()
        .default(() => undefined),
      grid: { sm: 6 },
    },
    {
      name: 'EXTERNAL',
      label: T.SkipNetworkContextualization,
      tooltip: T.SkipNetworkContextualizationConcept,
      type: INPUT_TYPES.SWITCH,
      dependOf: 'PARENT',
      htmlType: (parent) => !parent?.length && INPUT_TYPES.HIDDEN,
      validation: boolean().yesOrNo(),
      grid: { sm: 6 },
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
    type: INPUT_TYPES.SELECT,
    dependOf: 'RDP',
    values: [
      { text: T.DisplayUpdate, value: 'display-update' },
      { text: T.Reconnect, value: 'reconnect' },
    ],
    validation: string().trim().notRequired().default('display-update'),
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

/** @type {Field[]} List of IPv4 fields */
const OVERRIDE_IPV4_FIELDS = [
  {
    name: 'IP',
    label: T.IP,
    tooltip: T.IPv4Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'MAC',
    label: T.MAC,
    tooltip: T.MACConcept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'NETWORK_MASK',
    label: T.NetworkMask,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
    fieldProps: { placeholder: '255.255.255.0' },
  },
  {
    name: 'NETWORK_ADDRESS',
    label: T.NetworkAddress,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
    fieldProps: { placeholder: '192.168.1.0' },
  },
  {
    name: 'GATEWAY',
    label: T.Gateway,
    tooltip: T.GatewayConcept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'SEARCH_DOMAIN',
    label: T.SearchDomainForDNSResolution,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'METHOD',
    label: T.NetworkMethod,
    tooltip: T.NetworkMethod4Concept,
    type: INPUT_TYPES.SELECT,
    values: [
      { text: 'static (Based on context)', value: 'static' },
      { text: 'dhcp (DHCPv4)', value: 'dhcp' },
      { text: 'skip (Do not configure IPv4)', value: 'skip' },
    ],
    validation: string().trim().notRequired().default('static'),
  },
]

/** @type {Field[]} List of IPv6 fields */
const OVERRIDE_IPV6_FIELDS = [
  {
    name: 'IP6',
    label: T.IP,
    tooltip: T.IPv6Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'GATEWAY6',
    label: T.Gateway,
    tooltip: T.Gateway6Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'IP6_METHOD',
    label: T.NetworkMethod,
    tooltip: T.NetworkMethod6Concept,
    type: INPUT_TYPES.SELECT,
    values: [
      { text: 'static (Based on context)', value: 'static' },
      { text: 'auto (SLAAC)', value: 'auto' },
      { text: 'dhcp (SLAAC and DHCPv6)', value: 'dhcp' },
      { text: 'disable (Do not use IPv6)', value: 'disable' },
      { text: 'skip (Do not configure IPv4)', value: 'skip' },
    ],
    validation: string().trim().notRequired().default('static'),
  },
]

/** @type {Field[]} List of hardware fields */
const HARDWARE_FIELDS = (defaultData = {}) => [
  {
    name: PCI_TYPE_NAME,
    label: T.VirtualNicHardwareMode,
    type: INPUT_TYPES.SELECT,
    values: arrayToOptions(Object.values(NIC_HARDWARE), {
      addEmpty: false,
      getText: (key) => NIC_HARDWARE_STR[key],
      getValue: (type) => type,
    }),
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
    notOnHypervisors: [firecracker],
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'VIRTIO_QUEUES',
    label: T.TransmissionQueue,
    tooltip: T.OnlySupportedForVirtioDriver,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [firecracker],
    dependOf: PCI_TYPE_NAME,
    htmlType: (value) =>
      value !== NIC_HARDWARE.EMULATED ? INPUT_TYPES.HIDDEN : 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
  // PCI Passthrough Automatic mode fields
  {
    name: DEVICE_LIST,
    label: T.DeviceName,
    type: INPUT_TYPES.SELECT,
    values: () => {
      const { data: hosts = [] } = useGetHostsQuery()
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
    notOnHypervisors: [vcenter, lxc, firecracker],
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
      .notRequired()
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    readOnly: true,
  },
  {
    name: DEVICE,
    label: T.Device,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [vcenter, lxc, firecracker],
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
      .notRequired()
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    readOnly: true,
  },
  {
    name: CLASS,
    label: T.Class,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [vcenter, lxc, firecracker],
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
      .notRequired()
      .default(() => undefined)
      .afterSubmit((value, { context }) =>
        context?.advanced?.PCI_TYPE === PCI_TYPES.AUTOMATIC ? value : undefined
      ),
    grid: { md: 3 },
    readOnly: true,
  },
  // PCI Passthrough Manual mode fields
  {
    name: 'SHORT_ADDRESS',
    label: T.ShortAddress,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [vcenter, lxc, firecracker],
    dependOf: PCI_TYPE_NAME,
    htmlType: (value) =>
      value !== NIC_HARDWARE.PCI_PASSTHROUGH_MANUAL && INPUT_TYPES.HIDDEN,
    validation: string()
      .notRequired()
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
    notOnHypervisors: [firecracker],
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
 * @returns {Section[]} Sections
 */
const SECTIONS = ({
  nics,
  driver,
  hypervisor = HYPERVISORS.kvm,
  defaultData,
  oneConfig,
  adminGroup,
} = {}) => {
  const filters = { driver, hypervisor }

  let general = []

  if (nics?.length) {
    general = [
      {
        id: 'general',
        legend: T.General,
        fields: disableFields(
          filterByHypAndDriver(GENERAL_FIELDS({ nics }), filters),
          'NIC',
          oneConfig,
          adminGroup
        ),
      },
    ]
  }

  return general.concat([
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
      id: 'override-ipv4',
      legend: T.OverrideNetworkValuesIPv4,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_IPV4_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'override-ipv6',
      legend: T.OverrideNetworkValuesIPv6,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_IPV6_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'hardware',
      legend: T.Hardware,
      fields: disableFields(
        filterByHypAndDriver(HARDWARE_FIELDS(defaultData), filters),
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
