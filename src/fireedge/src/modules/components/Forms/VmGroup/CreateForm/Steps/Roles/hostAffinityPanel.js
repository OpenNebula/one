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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material'
import { HostAPI, useGeneralApi } from '@FeaturesModule'
import { HOST_STATES, T, STYLE_BUTTONS } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

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
  const [fetch, { data, error }] = HostAPI.useLazyGetHostsQuery()
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
      enqueueError(T.ErrorHostFetching, [error?.message ?? error])
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
        {Tr(T.HostAffinity)}
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
            {Tr(T.Affined)}
          </ToggleButton>
          <ToggleButton value="Anti-Affined" aria-label="Anti-Affined">
            {Tr(T.AntiAffined)}
          </ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={Tr(T.AddRoleAffinity)} placement="right">
          <span>
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              onClick={handleSubmit}
              sx={{ ml: 2 }}
              disabled={isDisabled || selectedHostIds?.length < 1}
              label={T.Add}
            />
          </span>
        </Tooltip>
      </Box>
      <Paper sx={{ overflow: 'auto', marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>{Tr(T.ID)}</TableCell>
              <TableCell>{Tr(T.Name)}</TableCell>
              <TableCell>{Tr(T.Cluster)}</TableCell>
              <TableCell>{Tr(T.Status)}</TableCell>
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
        labelRowsPerPage={Tr(T.RowsPerPage)}
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
