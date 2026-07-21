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
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable react/prop-types */

import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { Checkbox, CollapsiblePanel, Table } from '@ComponentsV2Module'

import { STEP_ID as ROLES_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles'

import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'

import { TAB_ID as NETWORKS_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking'

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

  const networks = []
    .concat(getValues(`${EXTRA_ID}.${NETWORKS_ID}`) ?? [])
    .filter(Boolean)
    .map((network) => ({
      ...network,
      id: `$${network?.name}`,
    }))

  const selectedNetworks = NICs?.map((NIC) => NIC?.NETWORK_ID) ?? []

  const rowSelection = selectedNetworks.reduce(
    (selection, networkId) => ({
      ...selection,
      [networkId]: true,
    }),
    {}
  )

  const handleSelect = (selectedRows) => {
    const existingSelections = NICs || []
    replace(
      selectedRows?.map((row, idx) => {
        const { NIC_ALIAS, ...nic } = existingSelections?.find(
          (existing) => existing?.NETWORK_ID === row
        ) || { NETWORK_ID: row }

        if (NIC_ALIAS && !selectedRows?.includes(NIC_ALIAS?.NETWORK_ID)) {
          return { ...nic, NAME: `NIC_${idx}` }
        }

        return {
          ...nic,
          ...(NIC_ALIAS ? { NIC_ALIAS } : {}),
          NAME: `NIC_${idx}`,
        }
      })
    )
  }

  const handleRowSelectionChange = (updater) => {
    const nextSelection =
      typeof updater === 'function' ? updater(rowSelection) : updater

    handleSelect(
      networks
        .map(({ id }) => id)
        .filter((networkId) => nextSelection?.[networkId])
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
      accessorKey: 'name',
      header: 'Network',
      truncate: true,
    },

    ...(isVr
      ? [
          {
            accessorKey: 'floating_ip',
            header: 'Floating IP',
            meta: { disableCellTooltip: true },
            cell: ({ row }) => {
              if (!isVr) return null

              return (
                <Checkbox
                  onClick={(event) => event.stopPropagation()}
                  onChange={(value) =>
                    handleFloatingIp(row.original.id, value, 'FLOATING_IP')
                  }
                  checked={
                    NICs?.find((nic) => nic?.NETWORK_ID === row.original.id)
                      ?.FLOATING_IP === 'yes'
                  }
                />
              )
            },
          },
          {
            accessorKey: 'floating_only',
            header: 'Floating Only',
            meta: { disableCellTooltip: true },
            cell: ({ row }) => {
              if (!isVr) return null

              return (
                <Checkbox
                  onClick={(event) => event.stopPropagation()}
                  onChange={(value) =>
                    handleFloatingIp(row.original.id, value, 'FLOATING_ONLY')
                  }
                  checked={
                    NICs?.find((nic) => nic?.NETWORK_ID === row.original.id)
                      ?.FLOATING_ONLY === 'yes'
                  }
                />
              )
            },
          },
        ]
      : []),

    {
      accessorKey: 'NIC_ALIAS',
      header: 'As NIC Alias',
      meta: { disableCellTooltip: true },
      cell: ({ row }) => {
        const rowId = row.original.id
        const isSelected = NICs?.find((NIC) => NIC?.NETWORK_ID === rowId)

        const availableAliases = NICs.filter(
          (NIC) =>
            NIC.NETWORK_ID !== rowId &&
            !NICs?.some((nic) => nic?.NIC_ALIAS?.NETWORK_ID === rowId)
        )

        if (!isSelected || !availableAliases?.length) return null

        return (
          <Autocomplete
            options={availableAliases}
            getOptionLabel={(option) => option?.NETWORK_ID?.replace('$', '')}
            value={
              NICs.find((NIC) => NIC.NETWORK_ID === rowId)?.NIC_ALIAS || null
            }
            onChange={(_, newValue) => handleAlias(rowId, newValue)}
            onClick={(event) => event.stopPropagation()}
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
    <CollapsiblePanel
      key={`networks`}
      title="Networks"
      tag={NICs?.length ?? 0}
      isDefaultCollapsed={!networks?.length}
      summaryProps={{ 'data-cy': 'accordion-role-network-table' }}
      contentProps={{ 'data-cy': 'role-network-table' }}
    >
      <Table
        key={isVr}
        data={networks}
        columns={columns}
        getRowId={(row) => row.id}
        isCopyColumn
        isRowsSelectable
        isMultiRowSelection
        isDisablePagination
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        onRowClick={() => undefined}
      />
    </CollapsiblePanel>
  )
}
