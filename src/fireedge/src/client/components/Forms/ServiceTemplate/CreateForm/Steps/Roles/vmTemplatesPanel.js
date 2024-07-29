/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useState, useEffect, Component } from 'react'
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
  Typography,
  Paper,
  useTheme,
} from '@mui/material'
import { useGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import { useGeneralApi } from 'client/features/General'
import { DateTime } from 'luxon'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const convertTimestampToDate = (timestamp) =>
  DateTime.fromSeconds(parseInt(timestamp)).toFormat('dd/MM/yyyy HH:mm:ss')

/**
 * VmTemplatesPanel component.
 *
 * @param {object} props - The props that are passed to this component.
 * @param {Array} props.roles - The roles available for selection.
 * @param {number} props.selectedRoleIndex - The index of the currently selected role.
 * @param {Function} props.onChange - Callback to be called when affinity settings are changed.
 * @param {Array} props.vmTemplates - VM Templates array
 * @param {object} props.error - Error object
 * @returns {Component} The VmTemplatesPanel component.
 */
const VmTemplatesPanel = ({
  roles,
  selectedRoleIndex,
  onChange,
  vmTemplates,
  error,
}) => {
  const theme = useTheme()
  const { enqueueError } = useGeneralApi()
  const templateID = roles?.[selectedRoleIndex]?.SELECTED_VM_TEMPLATE_ID ?? []
  const templates = vmTemplates || (useGetTemplatesQuery()?.data ?? [])

  useEffect(() => {
    if (error) {
      enqueueError(T.ErrorVmTemplateFetching, error?.message ?? error)
    }
  }, [error, enqueueError])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (_event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const isDisabled = !roles?.[selectedRoleIndex] || roles?.length <= 0

  return (
    <Box
      sx={{
        my: 2,
        p: 2,
        borderRadius: 2,
        maxHeight: '40%',
        pointerEvents: isDisabled ? 'none' : 'auto',
        opacity: isDisabled ? '50%' : '100%',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {Tr(T.VMTemplates)}
      </Typography>
      <Paper sx={{ overflow: 'auto', marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>{Tr(T.ID)}</TableCell>
              <TableCell>{Tr(T.Name)}</TableCell>
              <TableCell>{Tr(T.Owner)}</TableCell>
              <TableCell>{Tr(T.Group)}</TableCell>
              <TableCell>{Tr(T.RegistrationTime)}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates
              ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              ?.map((vmTemplate) => (
                <TableRow
                  key={vmTemplate.ID}
                  hover
                  sx={{
                    '&:hover': {
                      filter: 'brightness(85%)',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() =>
                    onChange({
                      ...roles[selectedRoleIndex],
                      SELECTED_VM_TEMPLATE_ID: [vmTemplate.ID],
                    })
                  }
                  name="SELECTED_VM_TEMPLATE_ID"
                  role="checkbox"
                  aria-checked={templateID.includes(vmTemplate.ID)}
                  style={{
                    backgroundColor: templateID?.includes(vmTemplate.ID)
                      ? theme?.palette?.action?.selected
                      : theme?.palette.action?.disabledBackground,
                  }}
                  data-cy={`role-vmtemplate-${vmTemplate.ID}`}
                  tabIndex={-1}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={templateID.includes(vmTemplate.ID)} />
                  </TableCell>
                  <TableCell>{vmTemplate.ID}</TableCell>
                  <TableCell>{vmTemplate.NAME}</TableCell>
                  <TableCell>{vmTemplate.UNAME}</TableCell>
                  <TableCell>{vmTemplate.GNAME}</TableCell>
                  <TableCell>
                    {convertTimestampToDate(vmTemplate.REGTIME)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={templates?.length ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={Tr(T.RowsPerPage)}
      />
    </Box>
  )
}

VmTemplatesPanel.propTypes = {
  roles: PropTypes.array,
  selectedRoleIndex: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  vmTemplates: PropTypes.array,
  error: PropTypes.object,
  templateID: PropTypes.array,
}

export default VmTemplatesPanel
