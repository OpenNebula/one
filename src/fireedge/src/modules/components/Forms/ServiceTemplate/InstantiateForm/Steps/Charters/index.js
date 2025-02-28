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
import { Box, Stack, Divider } from '@mui/material'
import { useFieldArray } from 'react-hook-form'
import { array, object } from 'yup'

import { ScheduleActionCard } from '@modules/components/Cards'
import {
  CreateSchedButton,
  CharterButton,
  UpdateSchedButton,
  DeleteSchedButton,
} from '@modules/components/Buttons/ScheduleAction'

import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import { Legend } from '@modules/components/Forms'

import { mapNameByIndex } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'

import { Component, useMemo } from 'react'

export const TAB_ID = 'SCHED_ACTION'

const mapNameFunction = mapNameByIndex('SCHED_ACTION')

export const SCHED_ACTION_SCHEMA = object({
  SCHED_ACTION: array()
    .ensure()
    .transform((actions) => actions.map(mapNameByIndex('SCHED_ACTION'))),
})

const ScheduleActionsSection = ({ oneConfig, adminGroup }) => {
  const {
    fields: scheduleActions,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `charter.${TAB_ID}`,
    keyName: 'ID',
  })

  const handleCreateAction = (action) => {
    append(mapNameFunction(action, scheduleActions.length))
  }

  const handleCreateCharter = (actions) => {
    const mappedActions = actions?.map((action, idx) =>
      mapNameFunction(action, scheduleActions.length + idx)
    )

    append(mappedActions)
  }

  const handleUpdate = (action, index) => {
    update(index, mapNameFunction(action, index))
  }

  const handleRemove = (index) => {
    remove(index)
  }

  return (
    <Box mt={2}>
      <Legend title={Tr(T.AddChartes)} />
      <Box sx={{ width: '100%', gridColumn: '1 / -1' }}>
        <Stack flexDirection="row" gap="1em">
          <CreateSchedButton
            relative
            onSubmit={handleCreateAction}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
          <CharterButton relative onSubmit={handleCreateCharter} />
        </Stack>

        <Stack
          pb="1em"
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(300px, 0.5fr))"
          gap="1em"
          mt="1em"
        >
          {scheduleActions?.map((schedule, index) => {
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
                      onSubmit={(newAction) => handleUpdate(newAction, index)}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
                    />
                    <DeleteSchedButton
                      schedule={fakeValues}
                      onSubmit={() => handleRemove(index)}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
                    />
                  </>
                }
              />
            )
          })}
        </Stack>
        <Divider />
      </Box>
    </Box>
  )
}

ScheduleActionsSection.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}
export const STEP_ID = 'charter'

const Content = () => useMemo(() => <ScheduleActionsSection />, [STEP_ID])

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

/**
 *
 * @returns {Component} - Charters step
 */
const Charter = () => ({
  id: STEP_ID,
  label: T.Charter,
  resolver: SCHED_ACTION_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default Charter
