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

import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import { T } from '@ConstantsModule'
import { ImageAPI } from '@FeaturesModule'
import { getSnapshots } from '@ModelsModule'
import { Table } from '@ComponentsV2Module'
import {
  prettyBytes,
  stringToBoolean,
  timeFromMilliseconds,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

import {
  SnapshotDeleteAction,
  SnapshotFlattenAction,
  SnapshotRevertAction,
} from './Actions'
import { getActionsStyles, getTableStyles } from './styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {ReactElement} - Image snapshots tab
 */
export const Snapshots = ({ data, config }) => {
  const { translate } = useTranslation()
  const selectedImage = [].concat(data?.selected).filter(Boolean)?.[0] ?? {}
  const id =
    selectedImage?.ID === undefined ? undefined : String(selectedImage.ID)
  const { isActionsDisabled = false } = data || {}
  const { actions = {} } = config || {}

  const { data: image = selectedImage, isFetching } = ImageAPI.useGetImageQuery(
    { id },
    { skip: id === undefined }
  )

  const snapshotRows = useMemo(
    () =>
      [].concat(getSnapshots(image) ?? []).map((snapshot) => {
        const {
          ACTIVE,
          DATE,
          SIZE: SNAPSHOT_SIZE,
          MONITOR_SIZE: SNAPSHOT_MONITOR_SIZE,
        } = snapshot

        const hasDate = DATE !== undefined && !Number.isNaN(+DATE)
        const time = hasDate ? timeFromMilliseconds(+DATE) : undefined
        const size = +SNAPSHOT_SIZE ? prettyBytes(+SNAPSHOT_SIZE, 'MB') : '-'
        const monitorSize = +SNAPSHOT_MONITOR_SIZE
          ? prettyBytes(+SNAPSHOT_MONITOR_SIZE, 'MB')
          : '-'

        return {
          ...snapshot,
          NAME: snapshot.NAME || `${translate(T.Snapshot)} #${snapshot.ID}`,
          ACTIVE_LABEL: stringToBoolean(ACTIVE) ? translate(T.Active) : '-',
          DATE_LABEL: time?.toRelative?.() ?? '-',
          SIZE_LABEL: size,
          MONITOR_SIZE_LABEL: monitorSize,
        }
      }),
    [image, translate]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'ID',
        header: T.ID,
        grow: false,
      },
      {
        accessorKey: 'NAME',
        header: T.Name,
        truncate: true,
      },
      {
        accessorKey: 'ACTIVE_LABEL',
        header: T.Active,
        grow: false,
      },
      {
        accessorKey: 'DATE_LABEL',
        header: T.Date,
        grow: false,
      },
      {
        accessorKey: 'MONITOR_SIZE_LABEL',
        header: T.Monitoring,
        grow: false,
      },
      {
        accessorKey: 'SIZE_LABEL',
        header: T.DiskSize,
        grow: false,
      },
      {
        id: 'actions',
        header: '',
        grow: false,
        cell: ({ row }) => {
          const snapshot = row.original
          const disabled = isFetching || isActionsDisabled

          return (
            <Box sx={(theme) => getActionsStyles({ theme })}>
              {actions.snapshot_flatten && (
                <SnapshotFlattenAction
                  id={id}
                  snapshot={snapshot}
                  isDisabled={disabled}
                />
              )}
              {actions.snapshot_revert && (
                <SnapshotRevertAction
                  id={id}
                  snapshot={snapshot}
                  isDisabled={disabled}
                />
              )}
              {actions.snapshot_delete && (
                <SnapshotDeleteAction
                  id={id}
                  snapshot={snapshot}
                  isDisabled={disabled}
                />
              )}
            </Box>
          )
        },
      },
    ],
    [actions, id, isActionsDisabled, isFetching]
  )

  return (
    <Table
      columns={columns}
      data={snapshotRows}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      sx={(theme) => getTableStyles({ theme })}
    />
  )
}

Snapshots.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Snapshots.id = 'snapshot'
Snapshots.title = T.Snapshot

export default Snapshots
