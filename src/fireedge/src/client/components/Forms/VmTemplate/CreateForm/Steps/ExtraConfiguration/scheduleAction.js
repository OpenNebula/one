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
import { Stack } from '@mui/material'
import { Calendar as ActionIcon } from 'iconoir-react'
import { useFieldArray } from 'react-hook-form'
import { useEffect, useMemo } from 'react'

import { ScheduleActionCard } from 'client/components/Cards'
import {
  CreateSchedButton,
  CharterButton,
  UpdateSchedButton,
  DeleteSchedButton,
} from 'client/components/Buttons/ScheduleAction'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { T } from 'client/constants'

import { useGeneralApi } from 'client/features/General'
import PropTypes from 'prop-types'

export const TAB_ID = 'SCHED_ACTION'

const mapNameFunction = mapNameByIndex('SCHED_ACTION')

const ScheduleAction = ({ oneConfig, adminGroup }) => {
  const { setModifiedFields, setFieldPath, initModifiedFields } =
    useGeneralApi()
  useEffect(() => {
    setFieldPath(`extra.ScheduleAction`)
    initModifiedFields([...scheduleActions.map(() => ({}))])
  }, [])
  const {
    fields: scheduleActions,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
    keyName: 'ID',
  })

  const totalFieldsCount = useMemo(
    () => scheduleActions?.length,
    [scheduleActions]
  )

  // Delay execution until next event loop tick to ensure state updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFieldPath(`extra.ScheduleAction.${totalFieldsCount}`)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [totalFieldsCount])

  const handleCreateAction = (action) => {
    append(mapNameFunction(action, scheduleActions.length))
    setModifiedFields(action)
  }

  const handleCreateCharter = (actions) => {
    const mappedActions = actions?.map((action, idx) =>
      mapNameFunction(action, scheduleActions.length + idx)
    )

    append(mappedActions)
  }

  const handleUpdate = (action, index) => {
    setModifiedFields(action)
    update(index, mapNameFunction(action, index))
  }

  const handleRemove = (index) => {
    setModifiedFields({ __flag__: 'DELETE' })
    remove(index)
  }

  return (
    <>
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
    </>
  )
}

ScheduleAction.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'sched_action',
  name: T.ScheduleAction,
  icon: ActionIcon,
  Content: ScheduleAction,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
