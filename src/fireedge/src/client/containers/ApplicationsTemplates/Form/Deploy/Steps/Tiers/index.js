import React, { useMemo, useCallback, useState } from 'react'

import { useFormContext } from 'react-hook-form'
import { useTheme, AppBar, Tabs, Tab } from '@material-ui/core'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import { ID, FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'tiers'

const Tiers = ({ tiers, vmTemplates }) => {
  const userInputsFields = useMemo(() => vmTemplates.reduce(
    (list, { ID, TEMPLATE: { USER_INPUTS = {} } }) => ({
      ...list, [ID]: FORM_FIELDS(USER_INPUTS)
    }), {})
  , [vmTemplates])

  return {
    id: STEP_ID,
    label: T.ConfigureTiers,
    resolver: STEP_FORM_SCHEMA({ tiers, vmTemplates }),
    optionsValidate: { abortEarly: false },
    content: useCallback(() => {
      const [tabSelected, setTab] = useState(tiers?.[0]?.id)

      const theme = useTheme()
      const { errors } = useFormContext()

      return (
        <>
          <AppBar position='static'>
            <Tabs value={tabSelected} onChange={(_, tab) => setTab(tab)}>
              {tiers?.map(({ id, tier }, idx) => (
                <Tab
                  key={id}
                  value={id}
                  label={tier?.name}
                  id={`tab-${id}`}
                  icon={ errors[STEP_ID]?.[idx] && (
                    <WarningIcon color={theme.palette.error.main} />
                  )}
                />
              ))}
            </Tabs>
          </AppBar>
          {useMemo(() => tiers?.map(({ id, template }, index) => (
            <div key={id} hidden={tabSelected !== id}>
              <FormWithSchema
                cy='deploy-tiers-id'
                fields={[ID]}
                id={`${STEP_ID}[${index}]`}
              />
              <FormWithSchema
                cy='deploy-tiers'
                fields={userInputsFields[template?.id]}
                id={`${STEP_ID}[${index}].user_inputs_values`}
              />
            </div>
          )), [tiers, userInputsFields, tabSelected])}
        </>
      )
    }, [tiers, userInputsFields])
  }
}

export default Tiers
