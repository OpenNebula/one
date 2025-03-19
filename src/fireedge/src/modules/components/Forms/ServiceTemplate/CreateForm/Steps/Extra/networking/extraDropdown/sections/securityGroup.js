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

import { useEffect, useRef } from 'react'
import { useFieldArray } from 'react-hook-form'
import { Stack } from '@mui/material'
import { SecurityGroupCard } from '@modules/components/Cards'
import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'
import { SECTION_ID as EXTRA_SECTION_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'

import { ChangeForm as AddSgForm } from '@modules/components/Forms/SecurityGroups'

import { Plus as AddIcon } from 'iconoir-react/dist'

import { SecurityGroupAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'

const SECTION_ID = 'SECURITY_GROUPS'

const SecurityGroups = ({ selectedNetwork }) => {
  const loadedInitial = useRef(false)
  const { data: fetchedGroups, isSuccess: fetchedSecGroups } =
    SecurityGroupAPI.useGetSecGroupsQuery()

  const {
    fields: secGroups,
    append,
    replace,
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

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-sg',
          startIcon: <AddIcon />,
          label: T.SecurityGroup,
          variant: 'outlined',
        }}
        options={[
          {
            dialogProps: {
              title: T.SecurityGroup,
              dataCy: 'modal-add-sg',
            },
            form: () => AddSgForm(),
            onSubmit: handleAdd,
          },
        ]}
      />
      <Stack direction="column" spacing={1}>
        {secGroups.map((sg, idx) => (
          <SecurityGroupCard key={`sg-${idx}`} securityGroup={sg} />
        ))}
      </Stack>
    </>
  )
}

export const SG = {
  Section: SecurityGroups,
  id: SECTION_ID,
}
