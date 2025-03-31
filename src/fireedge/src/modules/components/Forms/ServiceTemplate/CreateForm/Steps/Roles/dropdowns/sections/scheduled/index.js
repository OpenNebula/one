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

import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  Stack,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { STEP_ID as ROLES_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'

import { Tr } from '@modules/components/HOC'

import { Cancel } from 'iconoir-react'

import { Legend, FormWithSchema } from '@modules/components/Forms'

import { useEffect, useState } from 'react'

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'

import {
  SCHEDULED_POLICY_FIELDS,
  SCHED_TYPES,
  SECTION_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/dropdowns/sections/scheduled/schema'

const ScheduledPolicies = ({ roles, selectedRole }) => {
  const { watch } = useFormContext()

  const wPolicies = watch(`${ROLES_ID}.${selectedRole}.${SECTION_ID}`)

  const [selectedPolicy, setSelectedPolicy] = useState(-1)
  const [shift, setShift] = useState(0)

  const {
    fields: policies,
    append,
    remove,
  } = useFieldArray({
    name: `${ROLES_ID}.${selectedRole}.${SECTION_ID}`,
  })

  const handleRemove = (event, idx) => {
    event.stopPropagation()

    // Calculates shift & releases current reference in case it goes oob
    setSelectedPolicy((prev) => {
      setShift(prev + (policies?.length === 2 ? -+prev : idx < prev ? -1 : 0))

      return null
    })

    remove(idx)
  }

  const handleAppend = (event) => {
    event?.stopPropagation?.()

    setSelectedPolicy(() => {
      setShift(null)

      return null
    })

    append({
      adjust: '',
      cooldown: '',
      expression: '',
      min: '',
      period: '',
      period_number: '',
      type: '',
    })
  }

  useEffect(() => {
    if (selectedPolicy === null) {
      if (shift === null) {
        setSelectedPolicy(policies?.length - 1)
      } else {
        setSelectedPolicy(shift)
      }
    }
  }, [policies])

  return (
    <Accordion
      key={`policies-${roles?.[selectedRole]?.id}`}
      variant="transparent"
      defaultExpanded
      TransitionProps={{ unmountOnExit: false }}
      sx={{
        width: '100%',
      }}
    >
      <AccordionSummary sx={{ width: '100%' }}>
        <Legend disableGutters title={T.ScheduledPolicies} />
      </AccordionSummary>

      <AccordionDetails>
        <Grid container spacing={4}>
          <Grid key={`scheduled-section`} item md={12}>
            {selectedPolicy != null && (
              <>
                <Stack
                  key={`epolicy-${policies?.[selectedPolicy]?.id}`}
                  direction="column"
                  spacing={1}
                >
                  {wPolicies?.length > 0 && (
                    <FormWithSchema
                      id={`${ROLES_ID}.${selectedRole}.${SECTION_ID}.${selectedPolicy}`}
                      cy={`${ROLES_ID}`}
                      fields={SCHEDULED_POLICY_FIELDS}
                    />
                  )}
                  <SubmitButton
                    importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
                    size={STYLE_BUTTONS.SIZE.MEDIUM}
                    type={STYLE_BUTTONS.TYPE.FILLED}
                    data-cy={'roles-add-scheduled-policy'}
                    onClick={handleAppend}
                    label={T.AddPolicy}
                    sx={{ maxWidth: 'fit-content' }}
                  />
                  <List>
                    {policies?.map((policy, idx) => {
                      const { type, adjust, min, format, expression } =
                        wPolicies?.[idx] ?? policy

                      const timeFormatTrans = Tr(format)

                      const secondaryFields = [
                        type && `${Tr(T.Type)}: ${Tr(SCHED_TYPES?.[type])}`,
                        adjust && `${Tr(T.Adjust)}: ${adjust}`,
                        min && `${Tr(T.Min)}: ${min}`,
                        timeFormatTrans &&
                          `${Tr(T.TimeFormat)}: ${timeFormatTrans}`,
                        expression && `${Tr(T.TimeExpression)}: ${expression}`,
                      ].filter(Boolean)

                      return (
                        <ListItem
                          key={`epolicy-${idx}-${policy.id}`}
                          onClick={() => setSelectedPolicy(idx)}
                          sx={{
                            display: 'flex',
                            alignitems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '4px',
                            minHeight: '92px',
                            my: 0.5,
                            overflowX: 'hidden',
                            padding: 2,

                            bgcolor:
                              idx === selectedPolicy
                                ? 'action.selected'
                                : 'inherit',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText
                            sx={{
                              flex: '1 1 auto',
                              maxWidth: '100%',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '1em',
                            }}
                            primary={`Policy #${idx}`}
                            primaryTypographyProps={{ variant: 'body1' }}
                            secondary={secondaryFields.join(' | ')}
                          />

                          <SubmitButton
                            aria-label="delete"
                            onClick={(event) => handleRemove(event, idx)}
                            icon={<Cancel />}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </Stack>
              </>
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export const SCHEDULED = {
  Section: ScheduledPolicies,
  id: SECTION_ID,
}
