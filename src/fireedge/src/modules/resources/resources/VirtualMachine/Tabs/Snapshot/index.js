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

import { T, VM_ACTION_ENUM, STYLE_BUTTONS } from '@ConstantsModule'
import { Table, MenuButton, Button, Tooltip } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Snapshot/styles'
import { VirtualMachine } from '@modules/resources/resources'
import { MoreVert } from 'iconoir-react'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import { vmsnapshotsTable } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Snapshot = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { selectedVm } = data || {}
  const handleActionSuccess = (message) =>
    message && enqueueSuccess(message, [selectedVm?.ID])

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

  const { data: snapshots = [], isFetching: isFetchingSnapshots } =
    vmsnapshotsTable.useData({ id: selectedVm?.ID }, { skip: !selectedVm?.ID })

  const columns = [
    ...vmsnapshotsTable.columns(),
    {
      header: '',
      id: 'actions',
      grow: false,
      cell: ({ row }) => {
        const snapshotOptions =
          VirtualMachine.Actions.Utils.generateMenuOptions({
            keys: VirtualMachine.Actions.Groups.Snapshot,
            actions,
            vm: selectedVm,
            paramsContext: row?.original,
            formContext: row?.original,
            viewConfig: config,
            showModal,
            onSuccess: handleActionSuccess,
          })

        return (
          <MenuButton iconOnly={<MoreVert />} options={[snapshotOptions]} />
        )
      },
    },
  ]

  const [createVmSnapshotOption] =
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [VM_ACTION_ENUM.SNAPSHOT_CREATE],
      actions,
      vm: selectedVm,
      viewConfig: config,
      showModal,
      onSuccess: handleActionSuccess,
    })
  const { tooltip: createVmSnapshotTooltip, ...createVmSnapshotButtonProps } =
    createVmSnapshotOption ?? {}

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Tooltip title={createVmSnapshotTooltip}>
        <Box
          component="span"
          sx={{ alignSelf: 'flex-start', display: 'inline-flex' }}
        >
          <Button
            {...createVmSnapshotButtonProps}
            type={STYLE_BUTTONS.TYPE.SECONDARY}
          />
        </Box>
      </Tooltip>
      <Box className="table-container">
        <Table
          columns={columns}
          data={snapshots}
          isLoading={isFetchingSnapshots || isPerformingAction}
          emptyContentProps={{
            title: T.NoSnapshots,
            subtitle: T.VmSnapshotsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
    </Box>
  )
}

Snapshot.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Snapshot.id = 'snapshot'
Snapshot.title = T.Snapshot
