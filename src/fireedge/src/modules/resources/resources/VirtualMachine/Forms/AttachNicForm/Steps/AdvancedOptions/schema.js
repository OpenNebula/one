/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { AlertNotification } from '@ComponentsV2Module'
import { uniqWith } from 'lodash'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
  disableFields,
} from '@UtilsModule'
import { T, INPUT_TYPES, HYPERVISORS, VN_DRIVERS, Nic } from '@ConstantsModule'
import { HostAPI } from '@FeaturesModule'

const filterByHypAndDriver = (fields, { hypervisor, driver }) =>
  filterFieldsByDriver(filterFieldsByHypervisor(fields, hypervisor), driver)

const isNicPciDevice = (device) => device?.CLASS?.startsWith('02')

const getPciRowId = (row) => {
  const deviceClassVendor = [row?.DEVICE, row?.CLASS, row?.VENDOR]?.filter(
    Boolean
  )
  const shortAddr = row?.SHORT_ADDRESS

  return `${
    deviceClassVendor?.length < 3 ? row?.TYPE : deviceClassVendor?.join(':')
  }@${shortAddr}`
}

const getFilteredPcis = (hosts = [], filterOn, hostId) => {
  const data = []
    .concat(hosts)
    ?.filter((host) => !hostId || String(host?.ID) === String(hostId))
    ?.map((host) => [].concat(host?.HOST_SHARE?.PCI_DEVICES?.PCI))
    ?.flat()
    ?.filter((device) => !filterOn || isNicPciDevice(device))

  const [filterType, filterMode] = filterOn ?? []
  if (!filterType) return [].concat(data)?.filter(Boolean)

  const filtered = []
    .concat(data)
    ?.filter(
      (device) =>
        (filterType === 'pf'
          ? (device?.SRIOV === 'pf' &&
              (device?.SRIOV_NUM === '0' ||
                device?.SRIOV_NUM === 0 ||
                !device?.SRIOV_NUM)) ||
            device?.SRIOV === 'no'
          : device?.SRIOV === filterType) &&
        (!device?.VMID || device?.VMID === '-1' || device?.VMID === -1)
    )

  return filterMode === 'automatic'
    ? (() => {
        const countMap =
          filterType === 'vf' || filterType === 'pf'
            ? filtered.reduce((acc, device) => {
                const key = `${device?.DEVICE}:${device?.CLASS}:${device?.VENDOR}`
                acc[key] = (acc[key] ?? 0) + 1

                return acc
              }, {})
            : {}

        return uniqWith(
          filtered.map((device) => ({
            ...device,
            SHORT_ADDRESS: `${device?.BUS}:${device?.SLOT}.x`,
            AVAILABILITY:
              device?.SRIOV === 'vf'
                ? String(
                    countMap[
                      `${device?.DEVICE}:${device?.CLASS}:${device?.VENDOR}`
                    ]
                  )
                : String(
                    countMap[
                      `${device?.DEVICE}:${device?.CLASS}:${device?.VENDOR}`
                    ] ?? 1
                  ),
          })),
          (a, b) =>
            a?.DEVICE === b?.DEVICE &&
            a?.CLASS === b?.CLASS &&
            a?.VENDOR === b?.VENDOR
        )
      })()
    : filtered
}

const getPciModel = ({ columns, filterOn, hostId }) => ({
  columns: () => columns,
  dataCy: 'pcis',
  useData: (_args, options) =>
    HostAPI.useGetHostsAdminQuery(undefined, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getFilteredPcis(data, filterOn, hostId),
        isFetching,
        isLoading,
      }),
    }),
})

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
 * @param {number} data.hostId - Currenty scheduled host ID for the VM
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
  hostId,
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

  const GET_PCI_FIELDS = () => {
    const getTableHeaders = (filterType, mode) => {
      const headerMap = {
        automatic: [
          {
            header:
              mode === 'automatic'
                ? filterType === 'vf'
                  ? T.AvailableFunctions
                  : T.AvailableDevices
                : T.InterfaceName,

            id: 'ifname',
            accessorKey: mode === 'automatic' ? 'AVAILABILITY' : 'IFNAME',
          },
          {
            header: T.Vendor,
            id: 'vendorName',
            accessorKey: 'VENDOR_NAME',
          },
          {
            header: T.Device,
            id: 'deviceName',
            accessorKey: 'DEVICE_NAME',
          },
        ],

        manual: [
          {
            header: T.PciDevice,
            id: 'shortAddress',
            accessorKey: 'SHORT_ADDRESS',
          },
          {
            header:
              mode === 'automatic'
                ? filterType === 'vf'
                  ? T.AvailableFunctions
                  : T.AvailableDevices
                : T.InterfaceName,

            id: 'ifname',
            accessorKey: mode === 'automatic' ? 'AVAILABILITY' : 'IFNAME',
          },
          {
            header: T.Vendor,
            id: 'vendorName',
            accessorKey: 'VENDOR_NAME',
          },
          {
            header: T.Device,
            id: 'deviceName',
            accessorKey: 'DEVICE_NAME',
          },
        ],
      }

      return headerMap?.[mode] ?? headerMap?.manual
    }

    const getInlineDescription = (mode) => {
      if (mode === 'automatic') {
        return (
          <AlertNotification
            type="primary"
            status="information"
            description="The scheduler picks the best available function on the selected device. Addresses show the device without the function suffix (.x). Leave unselected to let the scheduler choose freely."
            isDismissible={false}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        )
      }

      if (mode === 'manual') {
        return (
          <AlertNotification
            type="primary"
            status="warning"
            description="Pins this NIC to a specific function on a specific device. Select a full PCI address from the list."
            isDismissible={false}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        )
      }
    }

    return [
      {
        name: 'PCI_TYPE',
        label: T.DeviceType,
        type: INPUT_TYPES.RADIO,
        optionsOnly: true,
        values: [
          {
            text: T.Emulated,
            value: 'emulated',
            description: T.EmulatedConcept,
          },
          {
            text: T.SrIov,
            value: 'vf',
            description: T.SrIovConcept,
          },
          {
            text: T.PciPassthrough,
            value: 'pf',
            description: T.PciPassthroughConcept,
          },
        ],
        validation: string()
          .trim()
          .required()
          .default(() => 'automatic'),
        grid: { md: 12 },
      },

      {
        name: 'PCI_SELECTION_MODE',
        label: T.SchedulingMode,
        type: INPUT_TYPES.TOGGLE,
        optionsOnly: true,
        notNull: true,
        dependOf: 'PCI_TYPE',
        htmlType: (PCI_TYPE = '') =>
          PCI_TYPE === 'emulated' && INPUT_TYPES.HIDDEN,
        values: [
          {
            text: T.Automatic,
            value: 'automatic',
            description: T.AutomaticConcept,
          },
          {
            text: T.Manual,
            value: 'manual',
            description: T.ManualConcept,
          },
        ],
        validation: string()
          .trim()
          .nullable(false)
          .required()
          .default(() => 'automatic'),
        grid: { md: 12 },
      },

      {
        name: 'PCI_ADDRESS',
        label: '',
        type: INPUT_TYPES.TABLE,
        dependOf: ['PCI_TYPE', 'PCI_SELECTION_MODE'],
        model: (deps = []) =>
          getPciModel({
            columns: getTableHeaders(deps?.[0], deps?.[1]),
            filterOn: deps,
            hostId,
          }),
        getRowId: getPciRowId,
        singleSelect: true,
        selectOnRowClick: true,
        htmlType: (deps = []) => deps?.[0] === 'emulated' && INPUT_TYPES.HIDDEN,
        validation: string()
          .trim()
          .notRequired()
          .default(() => undefined),
        grid: { md: 12 },
        fieldProps: (deps) => ({
          preserveState: true,
          defaultPageSize: 5,
          footer: getInlineDescription(deps?.[1]),
          isCopyColumn: false,
          isEnableSearchBar: true,
          isEnableSort: true,
          isEnableFilters: true,
          isMultiRowSelection: false,
          isRowsSelectable: true,
          pageSizeOptions: [5, 10, 20],
          size: 'small',
        }),
      },

      // Emulated mode fields
      {
        name: 'MODEL',
        label: T.HardwareModelToEmulate,
        dependOf: ['PCI_TYPE'],
        htmlType: (deps = []) => deps?.[0] !== 'emulated' && INPUT_TYPES.HIDDEN,
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
        dependOf: ['PCI_TYPE'],
        htmlType: (deps = []) => deps?.[0] !== 'emulated' && INPUT_TYPES.HIDDEN,
        value: (_, form) => {
          if (
            form?.getValues(`advanced.AUTO_VIRTIO_QUEUES`) &&
            form?.setValue
          ) {
            form?.setValue(`advanced.VIRTIO_QUEUES`, 'auto')
          }
        },
        validation: string()
          .trim()
          .default(() => undefined),
        grid: { md: 4.5 },
      },
      {
        name: 'AUTO_VIRTIO_QUEUES',
        label: T.Auto,
        tooltip: T.AutoVirtioQueues,
        type: INPUT_TYPES.SWITCH,
        dependOf: ['PCI_TYPE'],
        htmlType: (deps = []) => deps?.[0] !== 'emulated' && INPUT_TYPES.HIDDEN,
        validation: boolean()
          .notRequired()
          .default(() => false)
          .afterSubmit(() => undefined),
        grid: { md: 1.5 },
      },
    ]
  }

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

    {
      id: 'hardware',
      legend: T.Hardware,
      fields: disableFields(
        filterByHypAndDriver(GET_PCI_FIELDS(), filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
  ])

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
