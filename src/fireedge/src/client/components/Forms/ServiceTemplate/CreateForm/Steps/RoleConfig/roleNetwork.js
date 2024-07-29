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

import PropTypes from 'prop-types'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useEffect, useState, useRef, useMemo, Component } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import makeStyles from '@mui/styles/makeStyles'
import { Box, Checkbox, TextField, Autocomplete } from '@mui/material'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'
import { Legend } from 'client/components/Forms'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'
import _ from 'lodash'

const useStyles = makeStyles({
  root: {
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
      outline: 'none !important',
    },
    '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus-within':
      {
        outline: 'none !important',
      },
    '& .MuiDataGrid-overlay': {
      top: '50% !important',
      left: '50% !important',
      transform: 'translate(-50%, -50%)',
      width: 'auto !important',
      height: 'auto !important',
    },
  },
})

const SECTION_ID = 'NETWORKS'

/**
 * @param {object} root0 - Props
 * @param {string} root0.stepId - Step ID
 * @param {number} root0.selectedRoleIndex - Active role index
 * @returns {Component} - Component
 */
const RoleNetwork = ({ stepId, selectedRoleIndex }) => {
  // Using a local state to keep track of the loading of initial row data
  // will overwrite modifications if stepId changes
  const loadInitialRowData = useRef({})
  const [networks, setNetworks] = useState([])
  const [fieldArrayLocation, setFieldArrayLocation] = useState('')

  useEffect(() => {
    setFieldArrayLocation(`${stepId}.${SECTION_ID}.${selectedRoleIndex}`)
  }, [selectedRoleIndex, SECTION_ID, stepId])

  const classes = useStyles()
  const { control, getValues, setValue } = useFormContext()

  const { fields, update } = useFieldArray({
    name: fieldArrayLocation,
  })

  const watchedRdpConfig = useWatch({
    control,
    name: `${stepId}.RDP`,
    defaultValue: {},
  })

  useEffect(() => {
    const networkDefinitions = getValues(EXTRA_ID)?.NETWORKING ?? []
    const networkMap = networkDefinitions.map((network) => ({
      name: network?.name,
      description: network?.description,
      id: network?.network,
      extra: network?.netextra,
      type: network?.type,
    }))

    setNetworks(networkMap)
  }, [getValues])

  const rows = useMemo(
    () =>
      networks.map((config, index) => ({
        ...config,
        id: index,
        idx: index, // RHF overwrites the ID prop with a UUID
        rowSelected: false,
        aliasSelected: false,
        aliasIdx: -1,
        network: config.name,
      })),
    [networks]
  )

  useEffect(() => {
    const existingRows = getValues(fieldArrayLocation)

    const mergedRows = rows?.map((row) => {
      const existingRow = existingRows?.find((er) => er?.name === row?.name)

      return existingRow ? _.merge({}, row, existingRow) : row
    })

    setValue(fieldArrayLocation, mergedRows)

    if (!loadInitialRowData.current?.[selectedRoleIndex] && rows?.length) {
      const reversedNetworkDefs = getValues(stepId)?.NETWORKDEFS ?? []

      if (reversedNetworkDefs?.[selectedRoleIndex]) {
        reversedNetworkDefs?.[selectedRoleIndex]?.forEach((def) => {
          const rowName = def.NETWORK_ID.slice(1).toLowerCase()
          const rowToSelect = rows.find(
            (row) => row?.name?.toLowerCase() === rowName
          )

          if (rowToSelect) {
            handleSelectRow(rowToSelect, true)

            if (def.PARENT) {
              handleSelectAlias(rowToSelect)
              const parentNetwork = reversedNetworkDefs[
                selectedRoleIndex
              ]?.find((network) => network?.NAME === def.PARENT)

              if (parentNetwork) {
                const parentNetworkName =
                  parentNetwork.NETWORK_ID.slice(1).toLowerCase()
                const parentRow = rows.find(
                  (row) => row?.name?.toLowerCase() === parentNetworkName
                )

                handleSetAlias(rowToSelect, parentRow?.name)
              }
            }
          }
        })
      }
      loadInitialRowData.current[selectedRoleIndex] = true
    }
  }, [fieldArrayLocation])

  const handleSetRdp = (row) => {
    const existing = getValues(`${stepId}.RDP`) || {}
    const updatedRdp = {
      ...existing,
      [selectedRoleIndex]:
        typeof row === 'object' && row !== null ? row?.name : '',
    }
    setValue(`${stepId}.RDP`, updatedRdp)
  }

  const handleSelectRow = (row, forceSelect = false) => {
    const fieldArray = getValues(fieldArrayLocation)
    const fieldArrayIndex = fieldArray?.findIndex((f) => f?.idx === row?.idx)
    const rowToggle = forceSelect
      ? true
      : !fieldArray?.[fieldArrayIndex]?.rowSelected

    if (
      // if rowSelected === true, its being deselected
      row?.rowSelected &&
      getValues(`${stepId}.RDP`)?.[selectedRoleIndex] === row?.name
    ) {
      handleSetRdp(null) // Deselect
    }

    const updatedFieldArray = fieldArray?.map((f, index) => {
      if (index === fieldArrayIndex) {
        return { ...f, rowSelected: rowToggle, aliasSelected: false }
      }

      return f
    })

    setValue(fieldArrayLocation, updatedFieldArray)
  }

  const handleSelectAlias = (row) => {
    const fieldArray = getValues(fieldArrayLocation)
    const fieldArrayIndex = fieldArray?.findIndex((f) => f?.idx === row?.idx)
    const aliasToggle = !fieldArray?.[fieldArrayIndex]?.aliasSelected
    const aliasIdx = !fieldArray?.[fieldArrayIndex]?.aliasIdx
    update(fieldArrayIndex, {
      ...fieldArray?.[fieldArrayIndex],
      aliasSelected: aliasToggle,
      aliasIdx: !aliasToggle ? -1 : aliasIdx,
    })
  }

  const handleSetAlias = (row, aliasName) => {
    const fieldArray = getValues(fieldArrayLocation)
    const aliasIndex = fieldArray?.findIndex((f) => f?.network === aliasName)
    const fieldArrayIndex = fieldArray?.findIndex((f) => f?.idx === row?.idx)
    update(fieldArrayIndex, {
      ...fieldArray?.[fieldArrayIndex],
      aliasIdx: aliasIndex,
    })
  }

  // Transalte before useMemo because Tr could not be inside useMemo
  const columnTranslations = {
    select: Tr(T.Select),
    network: Tr(T.Network),
    nicAlias: Tr(T.NICAlias),
    alias: Tr(T.Alias),
  }

  const columns = useMemo(
    () => [
      {
        field: 'select',
        disableColumnMenu: true,
        sortable: false,
        headerName: columnTranslations.select,
        width: 100,
        renderCell: (params) => (
          <Checkbox
            checked={params?.row?.rowSelected || false}
            onChange={() => handleSelectRow(params?.row)}
            inputProps={{
              'data-cy': `role-config-network-${params?.row?.idx}`,
            }}
          />
        ),
      },
      {
        field: 'network',
        disableColumnMenu: true,
        flex: 1,
        headerName: columnTranslations.network,
        width: 150,
      },
      {
        field: 'aliasToggle',
        disableColumnMenu: true,
        sortable: false,
        headerName: columnTranslations.nicAlias,
        width: 110,
        renderCell: (params) =>
          params?.row?.rowSelected && (
            <Checkbox
              checked={params?.row?.aliasSelected || false}
              onChange={() => handleSelectAlias(params?.row)}
              inputProps={{
                'data-cy': `role-config-network-alias-${params?.row?.idx}`,
              }}
            />
          ),
      },
      {
        field: 'alias',
        disableColumnMenu: true,
        flex: 1,
        headerName: columnTranslations.alias,
        width: 200,
        renderCell: (params) =>
          params?.row?.aliasSelected && (
            <Autocomplete
              id={`role-config-network-alias-name-${params?.row?.id}`}
              options={networks
                ?.filter((net, index) => {
                  const fieldArray = getValues(fieldArrayLocation)?.[index]

                  return (
                    net?.name !== params?.row?.network &&
                    fieldArray?.rowSelected &&
                    fieldArray?.aliasIdx === -1
                  )
                })

                ?.map((net) => net?.name)}
              renderOption={(props, option) => (
                <li
                  {...props}
                  data-cy={`role-config-network-aliasname-option-${option}`}
                >
                  {option}
                </li>
              )}
              renderInput={(props) => <TextField {...props} label="NIC" />}
              onChange={(_event, value) => handleSetAlias(params?.row, value)}
              value={
                getValues(fieldArrayLocation)?.[params?.row?.aliasIdx]?.name ??
                null
              }
              data-cy={`role-config-network-aliasname-${params?.row?.idx}`}
              sx={{ width: '100%', height: '100%' }}
            />
          ),
      },
    ],
    [networks, fieldArrayLocation]
  )

  return (
    <Box>
      <Legend title={T.RoleNetworks} />
      <DataGrid
        className={classes.root}
        rows={fields}
        columns={columns}
        localeText={{
          noRowsLabel: 'No networks have been defined',
          MuiTablePagination: {
            labelRowsPerPage: Tr(T.RowsPerPage),
          },
        }}
        autoHeight
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        disableSelectionOnClick
      />

      {networks?.length > 0 && (
        <Box sx={{ mb: 2, mt: 4 }}>
          <Autocomplete
            options={(getValues(fieldArrayLocation) || [])?.filter(
              (row) => row?.rowSelected
            )}
            value={watchedRdpConfig?.[selectedRoleIndex] ?? ''}
            getOptionLabel={(option) => option?.name || option || ''}
            onChange={(_event, value) => handleSetRdp(value)}
            renderInput={(params) => (
              <TextField {...params} name="RDP" placeholder={Tr(T.Rdp)} />
            )}
          />
        </Box>
      )}
    </Box>
  )
}

RoleNetwork.propTypes = {
  networks: PropTypes.array,
  roleConfigs: PropTypes.object,
  stepId: PropTypes.string,
  selectedRoleIndex: PropTypes.number,
}

export default RoleNetwork
