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
import { useState, useEffect, useMemo, useCallback, Component } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material'
import { useLazyGetHostsQuery } from 'client/features/OneApi/host'
import { HOST_STATES } from 'client/constants'
import { useGeneralApi } from 'client/features/General'

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
  const { enqueueError } = useGeneralApi()
  const [hosts, setHosts] = useState([])
  const [fetch, { data, error }] = useLazyGetHostsQuery()
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

        return (
          !role?.[formatKey(antiAffinityType)]?.includes(host.ID) &&
          !role?.[formatKey(affinityType)]?.includes(host.ID)
        )
      }) ?? [],
    [data, roles, selectedRoleIndex, affinityType, formatKey]
  )

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (error) {
      enqueueError(`Error fetching host data: ${error?.message ?? error}`)
    }
  }, [error, enqueueError])

  useEffect(() => {
    setHosts(processHosts)
    setSelectedHostIds([])
  }, [processHosts])

  const handleHostSelect = (hostId) => {
    setSelectedHostIds((prevSelectedHostIds) => {
      const isSelected = prevSelectedHostIds.includes(hostId)
      if (isSelected) {
        return prevSelectedHostIds.filter((id) => id !== hostId)
      } else {
        return [...prevSelectedHostIds, hostId]
      }
    })
  }

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const isDisabled =
    roles?.[selectedRoleIndex]?.NAME === '' ||
    roles?.[selectedRoleIndex]?.NAME === undefined

  return (
    <Box
      sx={{
        my: 2,
        p: 2,
        borderRadius: 2,
        maxHeight: '40%',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Host Affinity
      </Typography>
      <Box>
        <ToggleButtonGroup
          value={affinityType}
          exclusive
          onChange={(e, newValue) => !!newValue && setAffinityType(newValue)}
          aria-label="affinity type"
          sx={{ marginBottom: 2 }}
        >
          <ToggleButton value="Affined" aria-label="Affined">
            Affined
          </ToggleButton>
          <ToggleButton value="Anti-Affined" aria-label="Anti-Affined">
            Anti-Affined
          </ToggleButton>
        </ToggleButtonGroup>
        <Tooltip
          title="Add a role name to assign Host-VM affinity"
          placement="right"
        >
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              size="large"
              sx={{ ml: 2 }}
              disabled={isDisabled || selectedHostIds?.length < 1}
            >
              Add
            </Button>
          </span>
        </Tooltip>
      </Box>
      <Paper sx={{ overflow: 'auto', marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Cluster</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hosts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((host) => (
                <TableRow
                  key={host.ID}
                  hover
                  onClick={() => !isDisabled && handleHostSelect(host.ID)}
                  role="checkbox"
                  aria-checked={selectedHostIds.includes(host.ID)}
                  tabIndex={-1}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedHostIds.includes(host.ID)}
                      disabled={
                        roles?.[selectedRoleIndex]?.NAME === '' ||
                        roles?.[selectedRoleIndex]?.NAME === undefined
                      }
                    />
                  </TableCell>
                  <TableCell>{host.ID}</TableCell>
                  <TableCell>{host.NAME}</TableCell>
                  <TableCell>{host.CLUSTER}</TableCell>
                  <TableCell>{HOST_STATES[+host?.STATE ?? 0].name}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={hosts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
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
