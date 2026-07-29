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
import { useState, useEffect, useMemo, useCallback, Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { HostAPI, useGeneralApi } from '@FeaturesModule'
import { HOST_STATES, T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import {
  Button,
  ButtonGroup,
  CollapsiblePanel,
  StatusTag,
  Table,
  Tooltip,
} from '@ComponentsV2Module'

/**
 * HostAffinityPanel component.
 *
 * @param {object} props - The props that are passed to this component.
 * @param {Array} props.roles - The roles available for selection.
 * @param {number} props.selectedRoleIndex - The index of the currently selected role.
 * @param {Function} props.onChange - Callback to be called when affinity settings are changed.
 * @returns {Component} The HostAffinityPanel component.
 */
const HostAffinityPanel = ({ roles, selectedRoleIndex, onChange }) => {
  const { translate } = useTranslation()
  const { enqueueError } = useGeneralApi()
  const { data, error, isFetching, isLoading } = HostAPI.useGetHostsQuery()
  const [selectedHostIds, setSelectedHostIds] = useState([])
  const [affinityType, setAffinityType] = useState('Affined')

  const formatKey = useCallback(
    (type) => 'HOST_' + type?.toUpperCase()?.split('-')?.join('_'),
    []
  )

  const handleSubmit = () => {
    const affinityKey =
      affinityType === 'Affined' ? 'HOST_AFFINED' : 'HOST_ANTI_AFFINED'
    onChange(affinityKey, selectedHostIds)
    setSelectedHostIds([])
  }

  const processHosts = useMemo(
    () =>
      data?.filter((host) => {
        const role = roles?.[selectedRoleIndex]
        const antiAffinityType =
          affinityType === 'Affined' ? 'Anti-Affined' : 'Affined'
        const hostId = String(host.ID)
        const antiAffinedHostIds = [].concat(
          role?.[formatKey(antiAffinityType)] ?? []
        )
        const affinedHostIds = [].concat(role?.[formatKey(affinityType)] ?? [])

        return (
          !antiAffinedHostIds.map(String).includes(hostId) &&
          !affinedHostIds.map(String).includes(hostId)
        )
      }) ?? [],
    [data, roles, selectedRoleIndex, affinityType, formatKey]
  )

  useEffect(() => {
    if (error) {
      enqueueError(T.ErrorHostFetching, [error?.message ?? error])
    }
  }, [error, enqueueError])

  useEffect(() => {
    setSelectedHostIds([])
  }, [processHosts])

  const rowSelection = useMemo(
    () =>
      selectedHostIds.reduce(
        (acc, hostId) => ({ ...acc, [String(hostId)]: true }),
        {}
      ),
    [selectedHostIds]
  )

  const isDisabled =
    roles?.[selectedRoleIndex]?.NAME === '' ||
    roles?.[selectedRoleIndex]?.NAME === undefined

  const handleRowSelectionChange = useCallback(
    (updater) => {
      if (isDisabled) return

      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater

      setSelectedHostIds(Object.keys(nextSelection))
    },
    [isDisabled, rowSelection]
  )

  const handleAffinitySelectionChange = useCallback((selected) => {
    const nextAffinityType = Array.from(selected ?? [])[0]
    nextAffinityType && setAffinityType(nextAffinityType)
  }, [])

  const idLabel = translate(T.ID)
  const nameLabel = translate(T.Name)
  const clusterLabel = translate(T.Cluster)
  const statusLabel = translate(T.Status)
  const affinedLabel = translate(T.Affined)
  const antiAffinedLabel = translate(T.AntiAffined)
  const hostAffinityLabel = translate(T.HostAffinity)
  const addRoleAffinityLabel = translate(T.AddRoleAffinity)
  const addLabel = translate(T.Add)

  const columns = useMemo(
    () => [
      { accessorKey: 'ID', header: idLabel, grow: false },
      { accessorKey: 'NAME', header: nameLabel, truncate: true },
      { accessorKey: 'CLUSTER', header: clusterLabel, truncate: true },
      {
        accessorKey: 'STATE',
        header: statusLabel,
        cell: ({ row }) => {
          const { color, name } =
            HOST_STATES[Number(row.original?.STATE) || 0] ?? {}

          return <StatusTag statusColor={color} statusName={name} />
        },
      },
    ],
    [clusterLabel, idLabel, nameLabel, statusLabel]
  )

  return (
    <CollapsiblePanel
      title={hostAffinityLabel}
      isDefaultCollapsed={false}
      summaryProps={{ 'data-cy': 'accordion-host-affinity' }}
      contentProps={{ 'data-cy': 'host-affinity-panel' }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mt: 2,
          mb: 2,
        }}
      >
        <ButtonGroup
          selected={affinityType}
          onSelectionChange={handleAffinitySelectionChange}
          buttons={[
            { title: affinedLabel, value: 'Affined' },
            { title: antiAffinedLabel, value: 'Anti-Affined' },
          ]}
        />
        <Tooltip title={addRoleAffinityLabel} placement="right">
          <span>
            <Button
              type="primary"
              onClick={handleSubmit}
              isDisabled={isDisabled || selectedHostIds?.length < 1}
            >
              {addLabel}
            </Button>
          </span>
        </Tooltip>
      </Box>
      <Table
        columns={columns}
        data={processHosts}
        getRowId={(host) => String(host.ID)}
        isCopyColumn
        isRowsSelectable={!isDisabled}
        isMultiRowSelection
        isDisabled={isDisabled}
        isLoading={isLoading || isFetching}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        defaultPageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />
    </CollapsiblePanel>
  )
}

HostAffinityPanel.propTypes = {
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      NAME: PropTypes.string,
      POLICY: PropTypes.string,
    })
  ),
  selectedRoleIndex: PropTypes.number,
  onChange: PropTypes.func.isRequired,
}

export default HostAffinityPanel
