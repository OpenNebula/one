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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useHistory } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { MoreVert, Plus } from 'iconoir-react'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
  Tag,
} from '@ComponentsModule'
import {
  PATH,
  RESOURCE_NAMES,
  T,
  VN_ACTIONS,
  VN_DRIVERS,
} from '@ConstantsModule'
import { VnAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { useResourceSingleViewContext } from '@ProvidersModule'
import { mirrorList } from '@modules/resources/VirtualNetwork/Forms/MirrorForm/helpers'
import { MIRROR_TYPES } from '@modules/resources/VirtualNetwork/Forms/MirrorForm/schema'

const destination = (mirror) =>
  mirror.TYPE === 'RSPAN'
    ? `VLAN ${mirror.OUTPUT_VLAN}`
    : mirror.TYPE === 'ERSPAN'
    ? `${mirror.REMOTE_IP} · ${T.MirrorERSPANKey} ${mirror.ERSPAN_KEY}`
    : mirror.REMOTE_IP || '-'

/**
 * Lists mirrors and opens their details in the resource drawer stack.
 *
 * @param {object} props - Props
 * @param {object} props.data - Network details
 * @param {object} props.config - Tab visibility and actions
 * @returns {object} Port Mirroring tab
 */
export const PortMirroring = ({ data = {}, config = {} }) => {
  const {
    vnet = {},
    handleRefresh,
    isLoadingVNet,
    isActionsDisabled,
    isLocked,
    mirrorId,
    handleClose,
  } = data
  const history = useHistory()
  const {
    closeResourceSingleView,
    openResourceSingleView,
    goBackResourceSingleView,
    stack,
  } = useResourceSingleViewContext()
  const [deleteMirror] = VnAPI.useRemoveVNetMirrorMutation()
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const [isSaving, setIsSaving] = useState(false)
  const submitting = useRef(false)
  const returnedMirror = useRef()
  const mirrors = useMemo(
    () =>
      [vnet.TEMPLATE?.MIRROR ?? []]
        .flat()
        .filter((mirror) => mirror && typeof mirror === 'object'),
    [vnet.TEMPLATE?.MIRROR]
  )
  const activeEntry = stack.entries[stack.activeIndex]
  const activeMirror =
    activeEntry?.resource === RESOURCE_NAMES.VNET_MIRROR &&
    String(activeEntry.data.VNET_ID) === String(vnet.ID)
      ? activeEntry.data
      : undefined
  const selectedId = activeMirror?.MIRROR_ID
  const supportedDriver = [
    VN_DRIVERS.ovswitch,
    VN_DRIVERS.ovswitch_vxlan,
  ].includes(vnet.VN_MAD ?? vnet.TEMPLATE?.VN_MAD)
  const disabled = isActionsDisabled || isLocked || isSaving || !supportedDriver
  const actions = config.actions ?? {}
  const canCreate = actions[VN_ACTIONS.MIRROR_CREATE] === true
  const canEdit = actions[VN_ACTIONS.MIRROR_UPDATE] === true
  const canDelete = actions[VN_ACTIONS.MIRROR_DELETE] === true

  const openForm = useCallback(
    (mirror) => {
      const path = mirror
        ? PATH.NETWORK.VNETS.MIRROR_UPDATE
        : PATH.NETWORK.VNETS.MIRROR_CREATE
      handleClose?.()
      closeResourceSingleView()
      history.push(
        generatePath(path, { id: vnet.ID, mirrorId: mirror?.MIRROR_ID }),
        { ID: vnet.ID, NAME: vnet.NAME }
      )
    },
    [closeResourceSingleView, handleClose, history, vnet.ID, vnet.NAME]
  )

  const openMirror = useCallback(
    (mirror) =>
      openResourceSingleView(
        RESOURCE_NAMES.VNET_MIRROR,
        { ...mirror, ID: `${vnet.ID}:${mirror.MIRROR_ID}`, VNET_ID: vnet.ID },
        {
          onEdit: openForm,
          breadcrumbs: [
            {
              label: vnet.NAME ?? String(vnet.ID),
              onClick: goBackResourceSingleView,
            },
            { label: mirror.NAME },
          ],
        }
      ),
    [
      goBackResourceSingleView,
      openForm,
      openResourceSingleView,
      vnet.ID,
      vnet.NAME,
    ]
  )

  useEffect(() => {
    if (mirrorId == null) {
      returnedMirror.current = undefined

      return
    }
    const key = `${vnet.ID}:${mirrorId}`
    if (returnedMirror.current === key) return
    if (activeMirror?.ID === key) {
      returnedMirror.current = key

      return
    }
    const mirror = mirrors.find(
      (item) => String(item.MIRROR_ID) === String(mirrorId)
    )
    if (mirror && !isLoadingVNet) openMirror(mirror)
  }, [activeMirror, isLoadingVNet, mirrorId, mirrors, openMirror, vnet.ID])

  const runOperation = async (callback, message) => {
    if (submitting.current || disabled) return false
    submitting.current = true
    setIsSaving(true)

    try {
      const result = await callback()
      message && enqueueSuccess(message)
      await handleRefresh?.()

      return { result }
    } finally {
      submitting.current = false
      setIsSaving(false)
    }
  }

  const askDelete = (mirror) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.MirrorDelete,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: mirror.MIRROR_ID, NAME: mirror.NAME }}
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
            deleteMirror({ id: vnet.ID, mirrorId: mirror.MIRROR_ID }).unwrap(),
          T.MirrorDeleted
        )
        if (!result) return false
      },
    })

  const columns = [
    { accessorKey: 'NAME', header: T.Name },
    {
      accessorKey: 'TYPE',
      header: T.Type,
      cell: ({ row }) => <Tag title={row.original.TYPE} status="default" />,
    },
    {
      id: 'source',
      header: T.MirrorTrafficSource,
      accessorFn: (mirror) =>
        [
          `${mirrorList(mirror.PORTS).length} · ${T.MirrorSourceInterfaces}`,
          mirrorList(mirror.VLANS).length
            ? `VLANs ${mirrorList(mirror.VLANS).join(', ')}`
            : undefined,
          mirror.DIRECTION || 'BOTH',
        ]
          .filter(Boolean)
          .join(' · '),
    },
    { id: 'destination', header: T.MirrorDestination, accessorFn: destination },
    {
      id: 'actions',
      header: '',
      grow: false,
      cell: ({ row }) => (
        <Box onClick={(event) => event.stopPropagation()}>
          <MenuButton
            iconOnly={<MoreVert />}
            options={[
              [
                {
                  title: T.Edit,
                  isDisabled:
                    disabled ||
                    !canEdit ||
                    !MIRROR_TYPES.includes(row.original.TYPE),
                  onClick: () => openForm(row.original),
                },
                {
                  title: T.Delete,
                  isDestructive: true,
                  isDisabled: disabled || !canDelete,
                  onClick: () => askDelete(row.original),
                },
              ],
            ]}
          />
        </Box>
      ),
    },
  ]

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {!supportedDriver && (
        <Typography color="text.body">{T.MirrorUnsupportedDriver}</Typography>
      )}
      {canCreate && (
        <Box>
          <Button
            type="secondary"
            startIcon={<Plus />}
            dataCy="mirror-create"
            isDisabled={disabled}
            onClick={() => openForm()}
          >
            {T.MirrorCreate}
          </Button>
        </Box>
      )}
      <TablePanel
        dataCy="mirrors"
        columns={columns}
        data={mirrors}
        isLoading={isLoadingVNet}
        onRowClick={openMirror}
        getRowId={(mirror) => String(mirror.MIRROR_ID)}
        isRowsSelectable={(row) => row.original.MIRROR_ID != null}
        rowSelection={selectedId != null ? { [selectedId]: true } : {}}
        onRowSelectionChange={() => undefined}
        isCopyColumn={false}
      />
    </Box>
  )
}

PortMirroring.propTypes = { data: PropTypes.object, config: PropTypes.object }
PortMirroring.id = 'port_mirroring'
PortMirroring.title = T.PortMirroring
