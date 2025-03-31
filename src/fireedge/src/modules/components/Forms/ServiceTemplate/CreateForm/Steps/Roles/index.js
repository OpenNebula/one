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
import { Component, useState, useEffect } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Cancel } from 'iconoir-react'
import {
  FIELDS,
  SCHEMA,
  TEMPLATE_ID_FIELD,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/schemas'

import {
  PoliciesDropdown,
  NetworksDropdown,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/dropdowns'

import { FormWithSchema } from '@modules/components/Forms'

import { Skeleton, Stack, Grid, List, ListItem } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'

export const STEP_ID = 'roles'

const standaloneExcludedFields = ['parents']

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.standaloneModal - Render as AddRoleDialog
 *@returns {Component} - Role definitions step
 */
const Content = ({ standaloneModal = false }) => {
  const [selectedRole, setSelectedRole] = useState(0)
  const [shift, setShift] = useState(0)

  const { watch } = useFormContext()

  const wRoles = watch(`${STEP_ID}`)

  const isVr = wRoles?.[selectedRole]?.type === 'vr'

  const {
    fields: roles,
    remove,
    append,
  } = useFieldArray({
    name: `${STEP_ID}`,
  })

  const handleRemove = (event, idx) => {
    event.stopPropagation()

    // Calculates shift & releases current reference in case it goes oob
    setSelectedRole((prev) => {
      setShift(prev + (roles?.length === 2 ? -+prev : idx < prev ? -1 : 0))

      return null
    })

    remove(idx)
  }

  const handleAppend = (event) => {
    event?.stopPropagation?.()

    setSelectedRole(() => {
      setShift(null)

      return null
    })

    append({
      name: '',
      cardinality: 1,
      parents: [],
      template_id: '',
      type: '',
    })
  }

  useEffect(() => {
    if (selectedRole === null) {
      if (shift === null) {
        setSelectedRole(roles?.length - 1)
      } else {
        setSelectedRole(shift)
      }
    }
  }, [roles])

  if (!wRoles?.length) {
    handleAppend()

    return (
      <Stack direction="row" spacing={2}>
        <Skeleton variant="rectangular" width="25%" height={300} />
        <Skeleton variant="rectangular" width="75%" height={300} />
      </Stack>
    )
  }

  return (
    <Grid
      mt={1}
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
      {!standaloneModal && (
        <Grid
          item
          md={3}
          sx={{ borderRight: roles && roles.length > 0 ? 1 : 0, padding: 1 }}
        >
          <SubmitButton
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            data-cy={'extra-add-role'}
            onClick={handleAppend}
            label={T.AddRole}
          />
          <List
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {roles?.map((role, idx) => {
              const roleName = watch(`${STEP_ID}.${idx}.name`)

              return (
                <ListItem
                  key={`${idx}-${role?.id}-${role?.name}`}
                  onClick={() => setSelectedRole(idx)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    minHeight: '70px',
                    my: 0.5,
                    overflowX: 'hidden',
                    padding: 2,

                    bgcolor:
                      idx === selectedRole ? 'action.selected' : 'inherit',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {roles?.length > 1 && idx !== selectedRole && (
                    <SubmitButton
                      aria-label="delete"
                      onClick={(event) => handleRemove(event, idx)}
                      icon={<Cancel />}
                    />
                  )}
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
                    {roleName || T.NewRole}
                  </div>
                </ListItem>
              )
            })}
          </List>
        </Grid>
      )}
      <Grid item md={standaloneModal ? 12 : 9}>
        {selectedRole != null && (
          <Stack
            key={`roles-${roles?.[selectedRole]?.id}`}
            direction="column"
            alignItems="flex-start"
            gap="0.5rem"
            width="100%"
            sx={{ padding: standaloneModal ? 1 : 0 }}
          >
            <FormWithSchema
              id={`${STEP_ID}.${selectedRole}`}
              legend={T.Type}
              fields={FIELDS?.filter(
                ({ name }) =>
                  !standaloneModal || !standaloneExcludedFields?.includes(name)
              )}
            />

            {!standaloneModal && (
              <NetworksDropdown roles={wRoles} selectedRole={selectedRole} />
            )}
            {!isVr && (
              <PoliciesDropdown roles={roles} selectedRole={selectedRole} />
            )}
            <FormWithSchema
              id={`${STEP_ID}.${selectedRole}`}
              fields={[TEMPLATE_ID_FIELD]}
            />
          </Stack>
        )}
      </Grid>
    </Grid>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
  standaloneModal: PropTypes.bool,
}

/**
 *@returns {Component} - Roles definition step
 */
const Step = () => ({
  id: STEP_ID,
  content: (props) => Content(props),
  label: T.Roles,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
})

export default Step
