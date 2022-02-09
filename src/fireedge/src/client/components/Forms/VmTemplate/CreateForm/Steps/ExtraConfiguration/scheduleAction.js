/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Stack } from '@mui/material'
import { Calendar as ActionIcon } from 'iconoir-react'
import { useFieldArray } from 'react-hook-form'

import { ScheduleActionCard } from 'client/components/Cards'
import { CreateSchedButton, CharterButton } from 'client/components/Buttons'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { T } from 'client/constants'

export const TAB_ID = 'SCHED_ACTION'

const mapNameFunction = mapNameByIndex('SCHED_ACTION')

const ScheduleAction = () => {
  const {
    fields: scheduleActions,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
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

  const handleUpdateAction = (action, index) => {
    update(index, mapNameFunction(action, index))
  }

  const handleRemoveAction = (index) => {
    remove(index)
  }

  return (
    <>
      <Stack flexDirection="row" gap="1em">
        <CreateSchedButton relative onSubmit={handleCreateAction} />
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

          return (
            <ScheduleActionCard
              key={ID ?? NAME}
              relative
              schedule={{ ...schedule, ID: index }}
              handleUpdate={(newAction) => handleUpdateAction(newAction, index)}
              handleRemove={() => handleRemoveAction(index)}
            />
          )
        })}
      </Stack>
    </>
  )
}

/** @type {TabType} */
const TAB = {
  id: 'sched_action',
  name: T.ScheduledAction,
  icon: ActionIcon,
  Content: ScheduleAction,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
