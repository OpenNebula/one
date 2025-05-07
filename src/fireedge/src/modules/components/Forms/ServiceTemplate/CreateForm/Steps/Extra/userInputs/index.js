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
import { InputField as UserInputsIcon, Cancel } from 'iconoir-react'
import { USER_INPUTS_FIELDS } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/userInputs/schema'
import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'
import { FormWithSchema } from '@modules/components/Forms'
import { Stack, Grid, List, ListItem } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'

export const TAB_ID = 'user_inputs'

const Content = () => {
  const [selectedUInput, setSelectedUInput] = useState(0)
  const [shift, setShift] = useState(0)

  const { watch } = useFormContext()

  const wUserInputs = watch(`${EXTRA_ID}.${TAB_ID}`)

  const {
    fields: userinputs,
    remove,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const handleRemove = (event, idx) => {
    event.stopPropagation()

    // Calculates shift & releases current reference in case it goes oob
    setSelectedUInput((prev) => {
      setShift(
        prev +
          (userinputs?.length - 1 === prev
            ? -1
            : userinputs?.length === 2
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

    setSelectedUInput(() => {
      setShift(null)

      return null
    })

    append({
      type: '',
      mandatory: false,
      name: '',
      description: '',
      options: '',
      default: '',
    })
  }

  useEffect(() => {
    if (selectedUInput === null) {
      if (shift === null) {
        setSelectedUInput(userinputs?.length - 1)
      } else {
        setSelectedUInput(shift)
      }
    }
  }, [userinputs])

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
            borderRight: userinputs && userinputs.length > 0 ? 1 : 0,
            padding: 1,
          }}
        >
          <SubmitButton
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            data-cy={'extra-add-userinput'}
            onClick={handleAppend}
            label={T.AddUserInput}
          />
          <List
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {userinputs?.map((userinput, idx) => {
              const userinputName = watch(`${EXTRA_ID}.${TAB_ID}.${idx}.name`)

              return (
                <ListItem
                  key={`${idx}-${userinput?.id}-${userinput?.name}`}
                  onClick={() => setSelectedUInput(idx)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    minHeight: '70px',
                    my: 0.5,
                    overflowX: 'hidden',
                    padding: 2,

                    bgcolor:
                      idx === selectedUInput ? 'action.selected' : 'inherit',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {
                    <SubmitButton
                      aria-label="delete"
                      onClick={(event) => handleRemove(event, idx)}
                      icon={<Cancel />}
                    />
                  }
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
                    {userinputName || T.NewUserInput}
                  </div>
                </ListItem>
              )
            })}
          </List>
        </Grid>
        <Grid item md={9}>
          {selectedUInput != null && wUserInputs?.length > 0 && (
            <Stack
              key={`inputs-${userinputs?.[selectedUInput]?.id}`}
              direction="column"
              alignItems="flex-start"
              gap="0.5rem"
              component="form"
              width="100%"
            >
              <FormWithSchema
                key={`inputs-table-${userinputs?.[selectedUInput]?.id}`}
                cy={`${TAB_ID}`}
                id={`${EXTRA_ID}.${TAB_ID}.${selectedUInput}`}
                legend={T.Type}
                fields={USER_INPUTS_FIELDS}
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
  name: T.UserInputs,
  icon: UserInputsIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
