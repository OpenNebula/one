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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useState, useMemo } from 'react'

import { useFormContext } from 'react-hook-form'
import { useTheme, Box, Tab, Tabs, Fab, AppBar } from '@mui/material'
import {
  Plus as PlusIcon,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { PolicyCard } from 'client/components/Cards'
import { ListCards } from 'client/components/List'
import { useListForm } from 'client/hooks'
import { set } from 'client/utils'
import { T } from 'client/constants'

import {
  TAB_ID as ELASTICITY_ID,
  ELASTICITY_FORM_SCHEMA,
  ELASTICITY_FORM_FIELDS,
} from './schemas/elasticity'

import {
  TAB_ID as SCHEDULED_ID,
  SCHEDULED_FORM_FIELDS,
  SCHEDULED_FORM_SCHEMA,
} from './schemas/scheduled'

import { POLICIES_FORM_FIELDS, POLICIES_SCHEMA } from './schemas'

export const STEP_ID = 'policies'

const TABS = {
  elasticity: {
    name: ELASTICITY_ID,
    fields: ELASTICITY_FORM_FIELDS,
    schema: ELASTICITY_FORM_SCHEMA,
  },
  scheduled: {
    name: SCHEDULED_ID,
    fields: SCHEDULED_FORM_FIELDS,
    schema: SCHEDULED_FORM_SCHEMA,
  },
}

const Policies = () => ({
  id: STEP_ID,
  label: T.ConfigurePolicies,
  resolver: POLICIES_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(({ data, setFormData }) => {
    const [tabSelected, setTab] = useState(TABS.elasticity.name)

    const theme = useTheme()
    const {
      watch,
      formState: { errors },
    } = useFormContext()
    const { handleSetList } = useListForm({
      key: STEP_ID,
      setList: setFormData,
    })

    const handleRemove = (id) => {
      const policies = watch(STEP_ID)

      const newDataTab = policies?.[tabSelected]?.filter(
        (item) => item.id !== id
      )
      const newPolicies = set(policies, tabSelected, newDataTab)

      handleSetList(newPolicies)
    }

    const handleCreate = () => {
      const policies = watch(STEP_ID)

      const defaultValues = TABS[tabSelected]?.schema.default()
      const newDataTab = [...(policies?.[tabSelected] ?? [])].concat(
        defaultValues
      )
      const newPolicies = set(policies, tabSelected, newDataTab)

      handleSetList(newPolicies)
    }

    return (
      <>
        <Box p={1}>
          <FormWithSchema
            id={STEP_ID}
            cy="form-policy"
            fields={POLICIES_FORM_FIELDS}
          />
        </Box>
        {useMemo(
          () => (
            <AppBar position="static">
              <Tabs value={tabSelected} onChange={(_, tab) => setTab(tab)}>
                {Object.keys(TABS).map((key) => (
                  <Tab
                    key={`tab-${key}`}
                    id={`tab-${key}`}
                    value={key}
                    label={String(key).toUpperCase()}
                    icon={
                      errors[STEP_ID]?.[key] && (
                        <WarningIcon color={theme.palette.error.main} />
                      )
                    }
                  />
                ))}
              </Tabs>
            </AppBar>
          ),
          [
            tabSelected,
            errors[STEP_ID]?.[TABS.elasticity.name],
            errors[STEP_ID]?.[TABS.scheduled.name],
          ]
        )}
        <Box overflow="hidden" height={1} position="relative">
          <Fab
            color="primary"
            onClick={handleCreate}
            sx={{ position: 'absolute', zIndex: 1, bottom: 12, right: 28 }}
          >
            <PlusIcon />
          </Fab>
          {useMemo(
            () =>
              Object.keys(TABS).map((key) => (
                <Box
                  key={`tab-${key}`}
                  hidden={tabSelected !== key}
                  overflow="auto"
                  height={1}
                  p={2}
                >
                  <ListCards
                    list={data[key]}
                    breakpoints={{ xs: 12, sm: 6 }}
                    CardComponent={PolicyCard}
                    cardsProps={({ index, value: { id } }) => ({
                      id: `${STEP_ID}.${key}[${index}]`,
                      cy: `form-policy-${key}[${index}]`,
                      fields: TABS[key].fields,
                      handleRemove: () => handleRemove(id),
                    })}
                  />
                </Box>
              )),
            [handleRemove, tabSelected, data]
          )}
        </Box>
      </>
    )
  }, []),
})

export default Policies
