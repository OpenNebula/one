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
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Calendar as ActionIcon, Cancel } from 'iconoir-react'

import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'
import { FormWithSchema } from '@modules/components/Forms'

import { VM_SCHED_FIELDS } from '@modules/components/Forms/Vm/CreateSchedActionForm/schema'

import { Stack, Grid, List, ListItem } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'

export const TAB_ID = 'sched_actions'

const Content = () => {
  const [selectedSchedAction, setSelectedSchedAction] = useState(0)
  const [shift, setShift] = useState(0)

  const { watch } = useFormContext()

  const wSchedActions = watch(`${EXTRA_ID}.${TAB_ID}`)

  const {
    fields: schedActions,
    remove,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const handleRemove = (event, idx) => {
    event.stopPropagation()

    // Calculates shift & releases current reference in case it goes oob
    setSelectedSchedAction((prev) => {
      setShift(
        prev +
          (schedActions?.length - 1 === prev
            ? -1
            : schedActions?.length === 2
            ? -+prev
            : idx < prev
            ? -1
            : 0)
      )

      return null
    })

    remove(idx)
  }

  const handleAppend = (event) => {
    event?.stopPropagation?.()

    setSelectedSchedAction(() => {
      setShift(null)

      return null
    })

    append({
      ACTION: '',
      PERIODIC: '',
      TIME: '',
    })
  }

  useEffect(() => {
    if (selectedSchedAction === null) {
      if (shift === null) {
        setSelectedSchedAction(schedActions?.length - 1)
      } else {
        setSelectedSchedAction(shift)
      }
    }
  }, [schedActions])

  return (
    <>
      <Grid
        container
        direction="row"
        columnSpacing={1}
        rowSpacing={2}
        sx={{
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          height: '100%',
        }}
      >
        <Grid
          item
          md={3}
          sx={{
            borderRight: schedActions && schedActions.length > 0 ? 1 : 0,
            padding: 1,
          }}
        >
          <SubmitButton
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            data-cy={'extra-add-userinput'}
            onClick={handleAppend}
            label={T.AddScheduleAction}
          />
          <List
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {schedActions?.map((userinput, idx) => {
              const schedActionType = watch(
                `${EXTRA_ID}.${TAB_ID}.${idx}.ACTION`
              )

              return (
                <ListItem
                  key={`${idx}-${userinput?.id}-${userinput?.name}`}
                  onClick={() => setSelectedSchedAction(idx)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    minHeight: '70px',
                    my: 0.5,
                    overflowX: 'hidden',
                    padding: 2,

                    bgcolor:
                      idx === selectedSchedAction
                        ? 'action.selected'
                        : 'inherit',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <SubmitButton
                    aria-label="delete"
                    onClick={(event) => handleRemove(event, idx)}
                    icon={<Cancel />}
                  />
                  <Stack
                    direction="column"
                    alignItems="flex-start"
                    gap="0.2rem"
                    width="100%"
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '1em',
                      }}
                    >
                      {`${T.ScheduleAction}#${idx}`}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.85em',
                        opacity: '0.8',
                      }}
                    >
                      {schedActionType || `${T.No} ${T.Type}`}
                    </div>
                  </Stack>
                </ListItem>
              )
            })}
          </List>
        </Grid>
        <Grid item md={9}>
          {selectedSchedAction != null && wSchedActions?.length > 0 && (
            <Stack
              direction="column"
              alignItems="flex-start"
              gap="0.5rem"
              component="form"
              width="100%"
            >
              <FormWithSchema
                cy={`${TAB_ID}`}
                id={`${EXTRA_ID}.${TAB_ID}.${selectedSchedAction}`}
                key={`inputs-${selectedSchedAction}`}
                fields={VM_SCHED_FIELDS({ vm: {} })}
              />
            </Stack>
          )}
        </Grid>
      </Grid>
    </>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
}

const TAB = {
  id: TAB_ID,
  name: T.ScheduledActions,
  icon: ActionIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
