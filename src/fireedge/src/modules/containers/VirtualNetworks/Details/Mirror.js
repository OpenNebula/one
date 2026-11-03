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
import PropTypes from 'prop-types'
import { useRef, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { Cancel, Edit, Plus, RefreshDouble, Trash } from 'iconoir-react'
import {
  AlertNotification,
  Button,
  ContentSlot,
  DetailsDrawer as Drawer,
  InfoSlot,
  ResourceActionConfirmation,
  ReviewTable,
  SummarySlot,
  TablePanel,
  Tag,
  Text,
  ToggleGroup,
} from '@ComponentsModule'
import {
  RESOURCE_NAMES,
  T,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
  VN_ACTIONS,
  VN_DRIVERS,
} from '@ConstantsModule'
import {
  VnAPI,
  VmAPI,
  useAuth,
  useGeneralApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import { useResourceSingleViewContext, useTranslation } from '@ProvidersModule'
import { VirtualNetwork } from '@ResourcesModule'

const {
  SourceSelector,
  mirrorList,
  networkNics,
  TRAFFIC_SCHEMA,
  MIRROR_TYPES,
} = VirtualNetwork.Forms

/**
 * Displays a mirror as a child of its Virtual Network details drawer.
 *
 * @param {object} props - Drawer props
 * @param {object[]} props.selectedData - Selected mirror and its network ID
 * @param {Function} props.onEdit - Open the full-page settings form
 * @returns {object} Mirror details drawer
 */
export const DetailsDrawer = ({ selectedData = [], onEdit }) => {
  const { VNET_ID: vnetId, MIRROR_ID: mirrorId } = selectedData[0] ?? {}
  const { palette } = useTheme()
  const { translateText } = useTranslation()
  const { settings: { ROW_SIZE = 10 } = {} } = useAuth()
  const { popResourceSingleView } = useResourceSingleViewContext()
  const { getResourceView } = useViews()
  const { showModal } = useModalsApi()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [addMirrorPorts] = VnAPI.useAddVNetMirrorPortsMutation()
  const [removeMirrorPorts] = VnAPI.useRemoveVNetMirrorPortsMutation()
  const [deleteMirror] = VnAPI.useRemoveVNetMirrorMutation()
  const [refreshVMs] = VmAPI.useLazyGetVmsQuery()
  const {
    data: vnet = {},
    isFetching,
    isError,
    refetch,
  } = VnAPI.useGetVNetworkQuery(
    { id: vnetId },
    { skip: vnetId == null, refetchOnMountOrArgChange: true }
  )
  const { data: vms = [] } = VmAPI.useGetVmsQuery(
    { extended: true },
    { skip: vnetId == null }
  )
  const [pendingSource, setPendingSource] = useState()
  const [sourceErrors, setSourceErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const submitting = useRef(false)
  const selected = [vnet.TEMPLATE?.MIRROR ?? []]
    .flat()
    .find((mirror) => String(mirror?.MIRROR_ID) === String(mirrorId))
  const supportedDriver = [
    VN_DRIVERS.ovswitch,
    VN_DRIVERS.ovswitch_vxlan,
  ].includes(vnet.VN_MAD ?? vnet.TEMPLATE?.VN_MAD)
  const disabled = isFetching || isSaving || !!vnet.LOCK || !supportedDriver
  const actions =
    getResourceView(RESOURCE_NAMES.VNET)?.['info-tabs']?.port_mirroring
      ?.actions ?? {}
  const canEdit = actions[VN_ACTIONS.MIRROR_UPDATE] === true
  const canDelete = actions[VN_ACTIONS.MIRROR_DELETE] === true
  const canAddSource = actions[VN_ACTIONS.MIRROR_ADDPORT] === true
  const canRemoveSource = actions[VN_ACTIONS.MIRROR_DELPORT] === true
  const isDeleteDisabled = disabled || !canDelete || !selected
  const direction =
    {
      IN: T.MirrorDirectionIn,
      OUT: T.MirrorDirectionOut,
      BOTH: T.MirrorDirectionBoth,
    }[selected?.DIRECTION || 'BOTH'] ?? selected?.DIRECTION
  const destination =
    selected?.TYPE === 'RSPAN'
      ? `VLAN ${selected.OUTPUT_VLAN}`
      : [
          selected?.REMOTE_IP,
          selected?.TYPE === 'ERSPAN' && selected.ERSPAN_KEY != null
            ? translateText(T.MirrorDestinationKey, [selected.ERSPAN_KEY])
            : undefined,
        ]
          .filter(Boolean)
          .join(' · ') || '-'
  const vlans = mirrorList(selected?.VLANS)
  const settingsRows = selected
    ? [
        { label: T.Type, value: <Tag title={selected.TYPE} /> },
        { label: T.MirrorDirection, value: direction },
        ...(selected.TYPE === 'RSPAN'
          ? [{ label: T.MirrorOutputVLAN, value: selected.OUTPUT_VLAN }]
          : []),
        ...(['GRE', 'ERSPAN'].includes(selected.TYPE)
          ? [
              { label: T.MirrorRemoteIP, value: selected.REMOTE_IP },
              {
                label: T.MirrorLocalIP,
                value: selected.LOCAL_IP,
                empty: T.MirrorNotSet,
              },
            ]
          : []),
        ...(selected.TYPE === 'ERSPAN'
          ? [
              { label: T.MirrorERSPANType, value: selected.ERSPAN_TYPE },
              { label: T.Key, value: selected.ERSPAN_KEY },
              ...(selected.ERSPAN_TYPE === 'II'
                ? [{ label: T.MirrorERSPANIndex, value: selected.ERSPAN_INDEX }]
                : []),
              ...(selected.ERSPAN_TYPE === 'III'
                ? [{ label: T.MirrorERSPANHWID, value: selected.ERSPAN_HWID }]
                : []),
            ]
          : []),
        { label: T.Description, value: selected.DESCRIPTION },
      ].map(({ label, value, empty = T.None }) => ({
        label: (
          <Text
            component="span"
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={label}
            sx={{ color: 'text.headings' }}
          />
        ),
        value:
          typeof value === 'object' && value !== null ? (
            value
          ) : (
            <Text
              variant={TEXT_VARIANTS.BODY_SMALL}
              value={value == null || value === '' ? empty : value}
              sx={{
                color:
                  value == null || value === ''
                    ? 'text.onDisabled'
                    : 'text.body',
              }}
            />
          ),
      }))
    : []

  const validateSources = async (ports) => {
    if (!ports.length) return true
    const currentVMs = await refreshVMs({ extended: true }).unwrap()
    const available = ports.every((port) => {
      const [vmId, nicId] = port.split(':')
      const vm = currentVMs.find(({ ID }) => String(ID) === vmId)

      return networkNics(vm, vnet.ID).some(
        ({ NIC_ID }) => String(NIC_ID) === nicId
      )
    })
    if (!available) enqueueError(T.MirrorSourceUnavailable)

    return available
  }

  const runOperation = async (callback, message) => {
    if (submitting.current || disabled) return false
    submitting.current = true
    setIsSaving(true)

    try {
      const result = await callback()
      message && enqueueSuccess(message)
      await refetch()

      return { result }
    } finally {
      submitting.current = false
      setIsSaving(false)
    }
  }

  const askDelete = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.MirrorDelete,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: selected.MIRROR_ID, NAME: selected.NAME }}
            resourceType={T.PortMirroring}
          />
        ),
        confirmLabel: T.Delete,
        cancelLabel: T.Cancel,
        confirmButtonProps: { isDestructive: true },
      },
      onSubmit: async () => {
        const result = await runOperation(
          () =>
            deleteMirror({
              id: vnet.ID,
              mirrorId: selected.MIRROR_ID,
            }).unwrap(),
          T.MirrorDeleted
        )
        if (!result) return false
        popResourceSingleView()
      },
    })

  const removeSource = (port) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.MirrorRemoveSource,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: port }}
            resourceType={T.MirrorSourceInterfaces}
          />
        ),
        confirmLabel: T.Remove,
        cancelLabel: T.Cancel,
        confirmButtonProps: { isDestructive: true },
      },
      onSubmit: () =>
        runOperation(() =>
          removeMirrorPorts({
            id: vnet.ID,
            mirrorId: selected.MIRROR_ID,
            ports: port,
          }).unwrap()
        ),
    })

  const addSource = async () => {
    try {
      const traffic = await TRAFFIC_SCHEMA.validate(
        { PORTS: pendingSource },
        { abortEarly: false }
      )
      const [{ VM_ID, NIC_ID }] = traffic.PORTS
      const port = `${VM_ID}:${NIC_ID}`

      if (mirrorList(selected.PORTS).includes(port)) {
        enqueueError(T.MirrorDuplicateSource)

        return
      }

      const result = await runOperation(async () => {
        if (!(await validateSources([port])))
          throw new Error(T.MirrorSourceUnavailable)

        return addMirrorPorts({
          id: vnet.ID,
          mirrorId: selected.MIRROR_ID,
          ports: port,
        }).unwrap()
      })
      if (result) setPendingSource(undefined)
    } catch (error) {
      if (error.name === 'ValidationError') {
        const rowErrors = {}
        error.inner.forEach(({ path, message }) => {
          const field = path?.match(/^PORTS\[0\]\.(.+)$/)?.[1]
          if (field) rowErrors[field] = { message }
        })
        setSourceErrors({ 0: rowErrors })
      }
    }
  }

  const sourceRows = mirrorList(selected?.PORTS).map((port) => {
    const [VM_ID, NIC_ID] = port.split(':')

    const vm = vms.find(({ ID }) => String(ID) === VM_ID)
    const nic = networkNics(vm, vnet.ID).find(
      (item) => String(item.NIC_ID) === NIC_ID
    )

    return {
      port,
      VM: vm ? `${vm.NAME} (#${VM_ID})` : `#${VM_ID}`,
      NIC: `NIC ${NIC_ID}`,
      details: [
        nic?.IP || nic?.IP6 || translateText(T.MirrorNoIPAddress),
        nic?.MAC,
      ]
        .filter(Boolean)
        .join(' · '),
    }
  })
  const sourceColumns = [
    { accessorKey: 'VM', header: T.MirrorVM },
    {
      accessorKey: 'NIC',
      header: T.MirrorInterface,
      cell: ({ row }) => (
        <Box>
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={row.original.NIC}
            sx={{ color: 'text.body' }}
          />
          <Text
            variant={TEXT_VARIANTS.CAPTION}
            value={row.original.details}
            sx={{ color: 'text.onDisabled' }}
          />
        </Box>
      ),
    },
    { accessorKey: 'port', header: 'VM ID : NIC ID' },
    {
      id: 'actions',
      header: '',
      grow: false,
      cell: ({ row }) => (
        <Button
          type="transparent"
          iconOnly={<Trash width="16px" height="16px" />}
          isDestructive
          tooltip={T.MirrorRemoveSource}
          dataCy={`mirror-remove-source-${row.original.port}`}
          isDisabled={disabled || !canRemoveSource}
          onClick={() => removeSource(row.original.port)}
        />
      ),
    },
  ]

  return (
    <Drawer
      isOpen={selectedData.length > 0}
      isLoading={isFetching}
      slots={[
        [
          InfoSlot,
          {
            title: selected?.NAME ?? T.PortMirroring,
            id: String(mirrorId),
            dataCy: 'mirror-details',
            labels: [
              [null, translateText(T.MirrorOnNetwork, [vnet.NAME, vnet.ID])],
            ],
            Toolbar: () => (
              <ToggleGroup
                size="medium"
                isSelectable={false}
                options={[
                  [
                    {
                      startIcon: <Edit width="16px" height="16px" />,
                      tooltip: T.MirrorEdit,
                      value: 'edit',
                      'data-cy': 'mirror-edit',
                      isDisabled:
                        disabled ||
                        !canEdit ||
                        !selected ||
                        !MIRROR_TYPES.includes(selected.TYPE),
                      onClick: () => onEdit?.(selected),
                    },
                    {
                      startIcon: <RefreshDouble width="16px" height="16px" />,
                      tooltip: T.Refresh,
                      value: 'refresh',
                      'data-cy': 'mirror-refresh',
                      onClick: refetch,
                      isDisabled: disabled,
                    },
                  ],
                  [
                    {
                      startIcon: (
                        <Trash
                          width="16px"
                          height="16px"
                          style={{
                            color: isDeleteDisabled
                              ? palette.text.disabled
                              : palette.icon.error,
                          }}
                        />
                      ),
                      tooltip: T.MirrorDelete,
                      value: 'delete',
                      'data-cy': 'mirror-delete',
                      isDestructive: true,
                      isDisabled: isDeleteDisabled,
                      onClick: askDelete,
                    },
                    {
                      startIcon: <Cancel width="16px" height="16px" />,
                      tooltip: T.Close,
                      value: 'close',
                      'data-cy': 'mirror-close',
                      onClick: popResourceSingleView,
                    },
                  ],
                ]}
              />
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [
                selected?.TYPE ? <Tag key="type" title={selected.TYPE} /> : '-',
                T.Type,
              ],
              [translateText(direction), T.MirrorDirection],
              [mirrorList(selected?.PORTS).length, T.MirrorSourceInterfaces],
              [destination, T.MirrorDestination],
            ],
          },
        ],
        [
          ContentSlot,
          {
            children: selected ? (
              <Box
                display="flex"
                flexDirection="column"
                gap={4}
                sx={(theme) => ({
                  '& .review-table-container .review-table tbody .review-table-row':
                    {
                      gridTemplateColumns: `minmax(${theme.scale[1700]}px, 15%) minmax(0, 1fr)`,
                    },
                })}
              >
                <ReviewTable
                  title={T.Settings}
                  rows={settingsRows}
                  dataCy="mirror-settings"
                />
                <Box
                  component="section"
                  display="flex"
                  flexDirection="column"
                  gap={2}
                >
                  <Text
                    variant={TEXT_VARIANTS.BODY_MEDIUM}
                    weight={TEXT_WEIGHTS.SEMIBOLD}
                    value={T.MirrorSourceInterfaces}
                    sx={{ color: 'text.headings' }}
                  />
                  {canAddSource && !pendingSource && (
                    <Box>
                      <Button
                        type="secondary"
                        startIcon={<Plus width="16px" height="16px" />}
                        isDisabled={disabled}
                        dataCy="mirror-add-source"
                        onClick={() => {
                          setSourceErrors({})
                          setPendingSource([{ VM_ID: '', NIC_ID: '' }])
                        }}
                      >
                        {T.MirrorAddSource}
                      </Button>
                    </Box>
                  )}
                  {pendingSource && (
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={2}
                      sx={(theme) => ({
                        bgcolor: 'surface.mute',
                        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
                        p: `${theme.scale[550]}px`,
                        borderRadius: `${theme.borderRadius['3xl']}px`,
                      })}
                    >
                      <SourceSelector
                        vnetId={vnet.ID}
                        single
                        value={pendingSource}
                        excludedPorts={mirrorList(selected.PORTS)}
                        errors={sourceErrors}
                        disabled={disabled}
                        onChange={(value) => {
                          setPendingSource(value)
                          setSourceErrors({})
                        }}
                      />
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                          type="secondary"
                          isDisabled={disabled}
                          onClick={() => setPendingSource(undefined)}
                        >
                          {T.Cancel}
                        </Button>
                        <Button
                          isDisabled={disabled}
                          onClick={addSource}
                          dataCy="mirror-confirm-add-source"
                        >
                          {T.MirrorAddSource}
                        </Button>
                      </Box>
                    </Box>
                  )}
                  {sourceRows.length ? (
                    <TablePanel
                      dataCy="mirror-ports"
                      columns={sourceColumns}
                      data={sourceRows}
                      isDisablePagination={
                        sourceRows.length <= (Number(ROW_SIZE) || 10)
                      }
                    />
                  ) : (
                    <Text
                      variant={TEXT_VARIANTS.BODY_SMALL}
                      value={T.MirrorNoSourceInterfaces}
                      sx={{ color: 'text.onDisabled' }}
                    />
                  )}
                </Box>
                <Box
                  component="section"
                  display="flex"
                  flexDirection="column"
                  gap={2}
                >
                  <Text
                    variant={TEXT_VARIANTS.BODY_MEDIUM}
                    weight={TEXT_WEIGHTS.SEMIBOLD}
                    value={T.MirrorSourceVLANsTitle}
                    sx={{ color: 'text.headings' }}
                  />
                  {vlans.length ? (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {vlans.map((vlan) => (
                        <Tag key={vlan} title={vlan} />
                      ))}
                    </Box>
                  ) : (
                    <Text
                      variant={TEXT_VARIANTS.BODY_SMALL}
                      value={T.None}
                      sx={{ color: 'text.onDisabled' }}
                    />
                  )}
                </Box>
              </Box>
            ) : (
              <AlertNotification
                type="primary"
                status="error"
                description={isError ? T.NotFound : T.MirrorGone}
                isDismissible={false}
              />
            ),
          },
          { flex: '1 1 0', minHeight: 0, overflow: 'auto' },
        ],
      ]}
    />
  )
}

DetailsDrawer.displayName = 'DetailsDrawer'
DetailsDrawer.propTypes = {
  selectedData: PropTypes.array,
  onEdit: PropTypes.func,
}
