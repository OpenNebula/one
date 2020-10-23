import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { useFormContext } from 'react-hook-form'
import { Box, Tab, Tabs, Fab, AppBar } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { PolicyCard } from 'client/components/Cards'
import ListCards from 'client/components/List/ListCards'
import useListForm from 'client/hooks/useListForm'
import { set } from 'client/utils/helpers'

import {
  TAB_ID as ELASTICITY_ID,
  ELASTICITY_FORM_SCHEMA,
  ELASTICITY_FORM_FIELDS
} from './schemas/elasticity'

import {
  TAB_ID as SCHEDULED_ID,
  SCHEDULED_FORM_FIELDS,
  SCHEDULED_FORM_SCHEMA
} from './schemas/scheduled'

import { POLICIES_FORM_FIELDS, POLICIES_SCHEMA } from './schemas'

export const STEP_ID = 'policies'

const TABS = {
  elasticity: {
    name: ELASTICITY_ID,
    fields: ELASTICITY_FORM_FIELDS,
    schema: ELASTICITY_FORM_SCHEMA
  },
  scheduled: {
    name: SCHEDULED_ID,
    fields: SCHEDULED_FORM_FIELDS,
    schema: SCHEDULED_FORM_SCHEMA
  }
}

const Policies = () => ({
  id: STEP_ID,
  label: 'Policies',
  resolver: POLICIES_SCHEMA,
  content: useCallback(
    ({ setFormData }) => {
      const [tab, setTab] = useState(TABS.elasticity.name)
      const { handleSetList } = useListForm({
        key: STEP_ID,
        setList: setFormData
      })

      const { watch } = useFormContext()
      const policies = watch('policies')

      useEffect(() => () => {
        handleSetList(policies)
      }, [])

      const handleRemove = id => {
        const newDataTab = policies?.[tab]?.filter(item => item.id !== id)
        const newPolicies = set(policies, tab, newDataTab)

        handleSetList(newPolicies)
      }

      const handleCreate = () => {
        const defaultValues = TABS[tab]?.schema.default()
        const newDataTab = [...policies?.[tab] ?? []].concat(defaultValues)
        const newPolicies = set(policies, tab, newDataTab)

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
          {useMemo(() => (
            <AppBar position="static">
              <Tabs value={tab} onChange={(_, tab) => setTab(tab)}>
                {Object.keys(TABS).map(key =>
                  <Tab
                    key={`tab-${key}`}
                    id={`tab-${key}`}
                    value={key}
                    label={String(key).toUpperCase()}
                  />
                )}
              </Tabs>
            </AppBar>
          ), [tab])}
          <Box overflow="hidden" height={1} position="relative">
            <Fab
              color="primary"
              onClick={handleCreate}
              style={{ position: 'absolute', zIndex: 1, bottom: 12, right: 28 }}
            >
              <AddIcon />
            </Fab>
            {useMemo(() => (
              Object.keys(TABS).map(key => (
                <Box key={`tab-${key}`} hidden={tab !== key} overflow="auto" height={1} p={2}>
                  <ListCards
                    list={policies[key]}
                    breakpoints={{ xs: 12, sm: 6 }}
                    CardComponent={PolicyCard}
                    cardsProps={({ index, value: { id } }) => ({
                      id: `${STEP_ID}.${key}[${index}]`,
                      cy: `form-policy-${key}[${index}]`,
                      fields: TABS[key].fields,
                      handleRemove: () => handleRemove(id)
                    })}
                  />
                </Box>
              ))
            ), [handleRemove])}
          </Box>
        </>
      )
    },
    []
  )
})

export default Policies
