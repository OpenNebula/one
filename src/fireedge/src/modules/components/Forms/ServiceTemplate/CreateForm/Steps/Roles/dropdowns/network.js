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
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable react/prop-types */

import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  TextField,
  Checkbox,
} from '@mui/material'

import { Legend } from '@modules/components/Forms'

import { STEP_ID as ROLES_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'

import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'

import { TAB_ID as NETWORKS_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

const SECTION_ID = 'NIC'

export const NetworksDropdown = ({ roles, selectedRole }) => {
  const { getValues } = useFormContext()
  const isVr = roles?.[selectedRole]?.type === 'vr'

  const {
    fields: NICs,
    replace,
    update,
  } = useFieldArray({
    name: `${ROLES_ID}.${selectedRole}.template_contents.${SECTION_ID}`,
  })

  const networks = getValues(`${EXTRA_ID}.${NETWORKS_ID}`).map((network) => ({
    ...network,
    id: `$${network?.name}`,
  }))

  const handleSelect = (selectedRows) => {
    const existingSelections = NICs || []
    replace(
      selectedRows?.map((row, idx) => {
        const { NIC_ALIAS, ...nic } = existingSelections?.find(
          (existing) => existing?.NETWORK_ID === row
        ) || { NETWORK_ID: row }

        if (NIC_ALIAS && !selectedRows?.includes(NIC_ALIAS)) {
          return { nic, NAME: `NIC_${idx}` }
        }

        return { ...nic, ...(NIC_ALIAS || {}), NAME: `NIC_${idx}` }
      })
    )
  }

  const handleAlias = (rowId, newAlias) => {
    const nicIndex = NICs?.findIndex((nic) => nic?.NETWORK_ID === rowId)

    if (nicIndex === -1) return

    const updatedNIC = { ...NICs[nicIndex] }

    if (newAlias == null) {
      delete updatedNIC.NIC_ALIAS
    } else {
      updatedNIC.NIC_ALIAS = newAlias
    }

    update(nicIndex, updatedNIC)
  }

  const handleFloatingIp = (rowId, toggle, type) => {
    const nicIndex = NICs?.findIndex((nic) => nic?.NETWORK_ID === rowId)

    if (nicIndex === -1) return

    const updatedNIC = { ...NICs[nicIndex] }

    if (!toggle) {
      delete updatedNIC[type]
    } else {
      updatedNIC[type] = 'yes'
    }

    update(nicIndex, updatedNIC)
  }

  // Clears floating IP fields
  useEffect(() => {
    if (!isVr) {
      replace(
        NICs?.map(({ FLOATING_IP, FLOATING_ONLY, ...nic }) => ({ ...nic }))
      )
    }
  }, [isVr])

  const columns = [
    {
      field: 'name',
      headerName: 'Network',
      flex: isVr ? 8 / 24 : 12 / 24,
    },

    ...(isVr
      ? [
          {
            field: 'floating_ip',
            headerName: 'Floating IP',
            flex: 4 / 24,
            renderCell: (params) => {
              if (!isVr) return null

              return (
                <Checkbox
                  onChange={(_, value) =>
                    handleFloatingIp(params.row.id, value, 'FLOATING_IP')
                  }
                  checked={
                    NICs?.find((nic) => nic?.NETWORK_ID === params?.row?.id)
                      ?.FLOATING_IP === 'yes'
                  }
                />
              )
            },
          },
          {
            field: 'floating_only',
            headerName: 'Floating Only',
            flex: 4 / 24,
            renderCell: (params) => {
              if (!isVr) return null

              return (
                <Checkbox
                  onChange={(_, value) =>
                    handleFloatingIp(params.row.id, value, 'FLOATING_ONLY')
                  }
                  checked={
                    NICs?.find((nic) => nic?.NETWORK_ID === params?.row?.id)
                      ?.FLOATING_ONLY === 'yes'
                  }
                />
              )
            },
          },
        ]
      : []),

    {
      field: 'NIC_ALIAS',
      headerName: 'As NIC Alias',
      flex: isVr ? 8 / 24 : 12 / 24,
      renderCell: (params) => {
        const isSelected = NICs?.find(
          (NIC) => NIC?.NETWORK_ID === params?.row.id
        )

        const availableAliases = NICs.filter(
          (NIC) =>
            NIC.NETWORK_ID !== params.row.id &&
            !NICs?.some((nic) => nic?.NIC_ALIAS?.NETWORK_ID === params.row.id)
        )

        if (!isSelected || !availableAliases?.length) return null

        return (
          <Autocomplete
            options={availableAliases}
            getOptionLabel={(option) => option?.NETWORK_ID?.replace('$', '')}
            value={
              NICs.find((NIC) => NIC.NETWORK_ID === params.row.id)?.NIC_ALIAS ||
              null
            }
            onChange={(_, newValue) => handleAlias(params.row.id, newValue)}
            renderInput={(args) => (
              <TextField
                {...args}
                label="Select alias"
                variant="standard"
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    '&:hover:before': {
                      borderBottom: 'none !important',
                    },
                  },
                  '& .MuiInput-underline:before': {
                    borderBottom: 'none',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottom: 'none',
                  },
                }}
              />
            )}
            fullWidth
          />
        )
      },
    },
  ]

  return (
    <Accordion
      key={`networks`}
      variant="transparent"
      defaultExpanded={networks?.length}
      TransitionProps={{ unmountOnExit: false }}
      sx={{
        width: '100%',
      }}
    >
      <AccordionSummary sx={{ width: '100%' }}>
        <Legend disableGutters title={'Networks'} />
      </AccordionSummary>

      <AccordionDetails>
        <DataGrid
          key={isVr}
          checkboxSelection
          disableSelectionOnClick
          onSelectionModelChange={handleSelect}
          selectionModel={NICs?.map((NIC) => NIC?.NETWORK_ID)}
          rows={networks}
          columns={columns}
          disableColumnMenu
          autoHeight
        />
      </AccordionDetails>
    </Accordion>
  )
}
