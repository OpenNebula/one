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
import { Box, Stack, styled } from '@mui/material'
import {
  CreateSchedButton,
  DeleteSchedButton,
  UpdateSchedButton,
} from 'client/components/Buttons/ScheduleAction'
import { ScheduleActionCard } from 'client/components/Cards'
import { T } from 'client/constants'
import { Step, cleanEmpty } from 'client/utils'
import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { array } from 'yup'

import PropTypes from 'prop-types'

export const STEP_ID = 'SCHED_ACTION'

const StyledContainer = styled(Box)(({ theme }) => ({
  marginTop: `${theme.spacing(0.5)}`,
}))

const Content = ({ oneConfig, adminGroup }) => {
  const { setValue } = useFormContext()
  const scheduleActions = useWatch({
    name: STEP_ID,
    defaultValue: [],
  })

  const handleAction = useCallback(
    (type, action, index) => {
      const newScheduleActions = [...(scheduleActions ?? [])]
      const updatedScheduleAction = {
        ...action,
        ACTION: 'backup',
      }
      switch (type) {
        case 'create':
          newScheduleActions.push(updatedScheduleAction)
          break
        case 'update':
          newScheduleActions[index] = updatedScheduleAction
          break
        default:
          newScheduleActions.splice(index, 1)
          break
      }
      setValue(STEP_ID, cleanEmpty(newScheduleActions))
    },
    [scheduleActions]
  )

  const actions = scheduleActions ?? []

  return (
    <StyledContainer>
      <Stack flexDirection="row" gap="1em">
        <CreateSchedButton
          onSubmit={(newAction) => handleAction('create', newAction)}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
          backupjobs
        />
      </Stack>

      <Stack
        pb="1em"
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(300px, 0.5fr))"
        gap="1em"
        mt="1em"
      >
        {actions?.map((schedule, index) => {
          const { ID, NAME } = schedule
          const fakeValues = { ...schedule, ID: index }

          return (
            <ScheduleActionCard
              key={ID ?? NAME}
              schedule={fakeValues}
              actions={
                <>
                  <UpdateSchedButton
                    relative
                    vm={{}}
                    schedule={fakeValues}
                    onSubmit={(newAction) =>
                      handleAction('update', newAction, index)
                    }
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                  <DeleteSchedButton
                    schedule={fakeValues}
                    onSubmit={() => handleAction('delete', index)}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                </>
              }
            />
          )
        })}
      </Stack>
    </StyledContainer>
  )
}

/**
 * Step to select the Schedule Actions.
 *
 * @param {object} app - app resource
 * @returns {Step} Schedule Action step
 */
const ScheduleActions = (app) => ({
  id: STEP_ID,
  label: T.ScheduleAction,
  resolver: array().ensure(),
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default ScheduleActions
