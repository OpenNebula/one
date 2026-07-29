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

import { VM_ACTION_ENUM, VM_ACTIONS, T } from '@ConstantsModule'
import { Button, Table, MenuButton, Tag } from '@ComponentsV2Module'
import { Box, Dialog, Stack, Typography } from '@mui/material'
import { isVmAvailableAction, vmdisksTable } from '@ModelsModule'
import PropTypes from 'prop-types'
import { Component, useCallback, useMemo, useState } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Storage/styles'
import Graphs from '@modules/resources/resources/VirtualMachine/Tabs/Storage/graphs'
import { VirtualMachine } from '@modules/resources/resources'
import { Cancel, MoreVert } from 'iconoir-react'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import {
  prettyBytes,
  stringToBoolean,
  timeFromMilliseconds,
} from '@UtilsModule'

const isImageDisk = (disk) => disk?.IMAGE_ID !== undefined
const isContextDisk = (disk) => stringToBoolean(disk?.IS_CONTEXT)

const getDiskSnapshots = (disk) =>
  [].concat(disk?.SNAPSHOTS ?? []).filter(Boolean)

const getDiskActionKeys = (disk) =>
  [
    isImageDisk(disk) && VM_ACTION_ENUM.DISK_SAVEAS,
    isImageDisk(disk) && VM_ACTION_ENUM.SNAPSHOT_DISK_CREATE,
    VM_ACTION_ENUM.RESIZE_DISK,
    VM_ACTION_ENUM.DETACH_DISK,
  ].filter(Boolean)

const getSnapshotActionKeys = (disk) =>
  [
    isImageDisk(disk) && VM_ACTION_ENUM.DISK_SAVEAS,
    ...VirtualMachine.Actions.Groups.StorageSnapshot,
  ].filter(Boolean)

const getSnapshotContext = (disk, snapshot) => ({
  ...snapshot,
  DISK_ID: disk?.DISK_ID,
  SNAPSHOT_ID: snapshot?.ID,
})

const getAttachDiskActionKeys = () => [
  VM_ACTION_ENUM.ATTACH_DISK_VOLATILE,
  VM_ACTION_ENUM.ATTACH_DISK_IMAGE,
]

const getAttachDiskOptions = ({
  actions,
  config,
  selectedVm,
  showModal,
  onSuccess,
}) =>
  getAttachDiskActionKeys().map((eACTION) => {
    const action = actions?.[eACTION]
    const actionType = VM_ACTIONS?.[eACTION]
    const title = T?.[eACTION]

    return {
      eACTION,
      title,
      tooltip: action?.tooltip ?? title,
      isDisabled:
        action?.isDisabled ||
        !config?.actions?.[actionType] ||
        !isVmAvailableAction(actionType, selectedVm),
      onClick: () =>
        showModal({
          name: title,
          isFormDialog: true,
          dialogProps: {
            title,
            dataCy: `modal-${actionType}`,
            steps: action?.form,
          },
          onSubmit: async (formData) => {
            const result = await action?.mutate?.(formData)

            if (result?.error) return false
            action?.success && onSuccess?.(action.success)

            return result
          },
        }),
    }
  })

const closeAfterRun = (options, onClose) =>
  options.map((option) => ({
    ...option,
    onClick: (...args) => {
      option?.onClick?.(...args)
      setTimeout(onClose)
    },
  }))

const formatDate = (value) => {
  if (!value) return '-'

  const date = timeFromMilliseconds(+value)

  return date.toRelative()
}

const formatSize = (value) => (+value ? prettyBytes(+value, 'MB') : '-')

const formatSnapshotUsage = ({ MONITOR_SIZE, SIZE } = {}) =>
  `${formatSize(MONITOR_SIZE)}/${formatSize(SIZE)}`

const SnapshotStatus = ({ snapshot = {} }) => {
  if (!stringToBoolean(snapshot?.ACTIVE)) return null

  return <Tag title={T.Active} status="success" isInteractive={false} />
}

SnapshotStatus.propTypes = {
  snapshot: PropTypes.object,
}

const SnapshotDialog = ({
  actions,
  config,
  disk,
  isLoading,
  onClose,
  selectedVm,
  showModal,
  snapshots,
  onSuccess,
}) => {
  const columns = useMemo(
    () => [
      { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
      {
        header: T.Name,
        id: 'name',
        accessorKey: 'NAME',
        truncate: true,
      },
      {
        header: T.Status,
        id: 'status',
        cell: ({ row }) => <SnapshotStatus snapshot={row?.original} />,
      },
      {
        header: `${T.Monitoring} / ${T.DiskSize}`,
        id: 'usage',
        cell: ({ row }) => formatSnapshotUsage(row?.original),
      },
      {
        header: T.Created,
        id: 'date',
        grow: false,
        cell: ({ row }) => formatDate(row?.original?.DATE),
      },
      {
        header: '',
        id: 'actions',
        grow: false,
        cell: ({ row }) => {
          const snapshotContext = getSnapshotContext(disk, row?.original)
          const snapshotOptions =
            VirtualMachine.Actions.Utils.generateMenuOptions({
              keys: getSnapshotActionKeys(disk),
              actions,
              vm: selectedVm,
              paramsContext: snapshotContext,
              formContext: snapshotContext,
              viewConfig: config,
              showModal,
              onSuccess,
            })

          return (
            <MenuButton
              iconOnly={<MoreVert />}
              options={[closeAfterRun(snapshotOptions, onClose)]}
            />
          )
        },
      },
    ],
    [actions, config, disk, onClose, onSuccess, selectedVm, showModal]
  )

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <Stack
        direction="column"
        sx={(theme) => ({
          gap: `${theme.scale[300]}px`,
          padding: `${theme.scale[500]}px`,
        })}
      >
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
        >
          <Stack direction="column">
            <Typography variant="h5">{T.Snapshots}</Typography>
            <Typography color="text.secondary">
              {`${T.Disk} #${disk?.DISK_ID}`}
            </Typography>
          </Stack>
          <Button
            aria-label={T.Close}
            iconOnly={<Cancel />}
            onClick={onClose}
            title={T.Close}
            type="transparent"
          />
        </Stack>
        <Table
          columns={columns}
          data={snapshots}
          isLoading={isLoading}
          emptyContentProps={{
            title: T.NoDiskSnapshots,
            subtitle: T.DiskSnapshotsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Stack>
    </Dialog>
  )
}

SnapshotDialog.propTypes = {
  actions: PropTypes.object,
  config: PropTypes.object,
  disk: PropTypes.object,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func,
  selectedVm: PropTypes.object,
  showModal: PropTypes.func,
  snapshots: PropTypes.array,
  onSuccess: PropTypes.func,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Storage = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { selectedVm } = data || {}
  const [snapshotDialog, setSnapshotDialog] = useState()

  const handleActionSuccess = useCallback(
    (message) => {
      message && enqueueSuccess(message, [selectedVm?.ID])
    },
    [enqueueSuccess, selectedVm?.ID]
  )

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: selectedVm?.ID,
            ...params,
          }),
    })

  const { data: disks = [], isFetching: isFetchingDisks } =
    vmdisksTable.useData({ id: selectedVm?.ID }, { skip: !selectedVm?.ID })

  const openSnapshotDialog = useCallback((disk) => {
    setSnapshotDialog({
      disk,
      snapshots: getDiskSnapshots(disk),
    })
  }, [])

  const closeSnapshotDialog = useCallback(() => setSnapshotDialog(), [])

  const columns = useMemo(
    () => [
      ...vmdisksTable.columns(),
      {
        header: '',
        id: 'actions',
        grow: false,
        cell: ({ row }) => {
          const disk = row?.original

          if (isContextDisk(disk)) return null

          const snapshots = getDiskSnapshots(disk)
          const storageOptions =
            VirtualMachine.Actions.Utils.generateMenuOptions({
              keys: getDiskActionKeys(disk),
              actions,
              vm: selectedVm,
              paramsContext: disk,
              formContext: disk,
              viewConfig: config,
              showModal,
              onSuccess: handleActionSuccess,
            })
          const snapshotOption =
            snapshots.length > 0
              ? {
                  title: T.ViewSnapshots,
                  tooltip: T.ViewSnapshots,
                  onClick: () => openSnapshotDialog(disk),
                }
              : undefined

          return (
            <MenuButton
              iconOnly={<MoreVert />}
              options={[[snapshotOption, ...storageOptions].filter(Boolean)]}
            />
          )
        },
      },
    ],
    [
      actions,
      config,
      handleActionSuccess,
      openSnapshotDialog,
      selectedVm,
      showModal,
    ]
  )

  const attachDiskOptions = getAttachDiskOptions({
    actions,
    config,
    onSuccess: handleActionSuccess,
    selectedVm,
    showModal,
  })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <MenuButton placeholder={T.AttachDisk} options={[attachDiskOptions]} />
      <Box className="table-container">
        <Table
          columns={columns}
          data={disks}
          isLoading={isFetchingDisks || isPerformingAction}
          emptyContentProps={{
            title: T.NoDisks,
            subtitle: T.AttachedDisksWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
      <Box className="graph-container">
        <Graphs id={selectedVm?.ID} />
      </Box>
      {!!snapshotDialog && (
        <SnapshotDialog
          actions={actions}
          config={config}
          disk={snapshotDialog.disk}
          isLoading={isPerformingAction}
          onClose={closeSnapshotDialog}
          selectedVm={selectedVm}
          showModal={showModal}
          snapshots={snapshotDialog.snapshots}
          onSuccess={handleActionSuccess}
        />
      )}
    </Box>
  )
}

Storage.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Storage.id = 'storage'
Storage.title = T.Storage
