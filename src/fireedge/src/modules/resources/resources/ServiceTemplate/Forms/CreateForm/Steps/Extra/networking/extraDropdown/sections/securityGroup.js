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

import { useEffect, useRef } from 'react'
import { useFieldArray } from 'react-hook-form'
import { Stack } from '@mui/material'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'
import { SECTION_ID as EXTRA_SECTION_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown'

import { ChangeForm as AddSgForm } from '@modules/resources/resources/SecurityGroups/Forms'

import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { Plus as AddIcon, Trash as TrashIcon } from 'iconoir-react'

import { SecurityGroupAPI, useModalsApi } from '@FeaturesModule'

import { SubmitButton, Table } from '@ComponentsV2Module'

const SECTION_ID = 'SECURITY_GROUPS'
const FORM_DIALOG_SIZE = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '960px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
}

const SecurityGroups = ({ selectedNetwork }) => {
  const { showModal } = useModalsApi()

  const loadedInitial = useRef(false)
  const { data: fetchedGroups, isSuccess: fetchedSecGroups } =
    SecurityGroupAPI.useGetSecGroupsQuery()

  const {
    fields: secGroups,
    append,
    replace,
    remove,
  } = useFieldArray({
    name: `${EXTRA_ID}.${EXTRA_SECTION_ID}.${selectedNetwork}.${SECTION_ID}`,
  })

  const handleAdd = ({ secgroups }) =>
    secgroups.forEach(async (group) => {
      const foundGroup = fetchedGroups?.find(({ ID }) => ID === group)
      foundGroup && append(foundGroup)
    })

  useEffect(() => {
    if (loadedInitial.current) return

    if (!fetchedSecGroups) return

    if (!secGroups) return

    const validateKeys = ['NAME', 'GNAME', 'UNAME']

    const invalidGroups = secGroups?.filter(
      (group) => !validateKeys?.some((key) => Object.hasOwn(group, key))
    )

    const patchedGroups = invalidGroups?.map(({ ID }) =>
      fetchedGroups?.find((group) => group?.ID === ID)
    )

    if (patchedGroups?.length) {
      replace(patchedGroups)
    }

    loadedInitial.current = true
  }, [secGroups, fetchedGroups])

  const handleOpenForm = () =>
    showModal({
      id: `add-network-security-group-${selectedNetwork}`,
      dialogProps: {
        title: T.SecurityGroup,
        dataCy: 'modal-add-sg',
        ...FORM_DIALOG_SIZE,
      },

      onSubmit: handleAdd,
      form: AddSgForm(),
    })

  const getTotalOfResources = (resources) =>
    [resources?.ID ?? []].flat().length || 0

  const columns = [
    { accessorKey: 'ID', header: T.ID, grow: false },
    { accessorKey: 'NAME', header: T.Name, truncate: true },
    { accessorKey: 'UNAME', header: T.Owner, grow: false },
    { accessorKey: 'GNAME', header: T.Group, grow: false },
    {
      id: 'updated_vms',
      header: T.TotalUpdatedVms,
      accessorFn: (row) => getTotalOfResources(row?.UPDATED_VMS),
      grow: false,
    },
    {
      id: 'outdated_vms',
      header: T.TotalOutdatedVms,
      accessorFn: (row) => getTotalOfResources(row?.OUTDATED_VMS),
      grow: false,
    },
    {
      id: 'error_vms',
      header: T.TotalErrorVms,
      accessorFn: (row) => getTotalOfResources(row?.ERROR_VMS),
      grow: false,
    },
    {
      header: '',
      id: 'actions',
      enableSorting: false,
      grow: false,
      cell: ({ row }) => (
        <Stack direction="row" justifyContent="flex-end">
          <SubmitButton
            data-cy={`delete-sg-${row.original?.INDEX}`}
            iconOnly={<TrashIcon />}
            tooltip={T.Delete}
            type={STYLE_BUTTONS.TYPE.TRANSPARENT}
            isDestructive
            onClick={() => remove(row.original?.INDEX)}
          />
        </Stack>
      ),
    },
  ]

  const secGroupRows = secGroups.map((securityGroup, index) => ({
    ...securityGroup,
    INDEX: index,
  }))

  return (
    <Stack direction="column" spacing={2}>
      <SubmitButton
        data-cy={'add-sg'}
        startIcon={<AddIcon />}
        label={T.SecurityGroup}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        onClick={handleOpenForm}
      />
      <Table
        columns={columns}
        data={secGroupRows}
        getRowId={(row) => `${row.id ?? row.ID ?? row.INDEX}`}
        isDisablePagination
        isRowsSelectable={false}
        onRowClick={() => undefined}
      />
    </Stack>
  )
}

export const SG = {
  Section: SecurityGroups,
  id: SECTION_ID,
}
