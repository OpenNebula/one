/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { Calendar as ActionIcon, Edit, Trash } from 'iconoir-react'
import { useFieldArray } from 'react-hook-form'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { PunctualForm, RelativeForm } from 'client/components/Forms/Vm'
import { Translate } from 'client/components/HOC'

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
  })

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-sched-action',
          label: T.AddAction,
          variant: 'outlined',
        }}
        options={[
          {
            cy: 'add-sched-action-punctual',
            name: 'Punctual action',
            dialogProps: { title: T.ScheduledAction },
            form: () => PunctualForm(),
            onSubmit: (action) =>
              append(mapNameFunction(action, scheduleActions.length)),
          },
          {
            cy: 'add-sched-action-relative',
            name: 'Relative action',
            dialogProps: { title: T.ScheduledAction },
            form: () => RelativeForm(),
            onSubmit: (action) =>
              append(mapNameFunction(action, scheduleActions.length)),
          },
        ]}
      />
      <Stack
        pb="1em"
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(300px, 0.5fr))"
        gap="1em"
        mt="1em"
      >
        {scheduleActions?.map((item, index) => {
          const { id, NAME, ACTION, TIME } = item
          const isRelative = String(TIME).includes('+')

          return (
            <SelectCard
              key={id ?? NAME}
              title={`${NAME} - ${ACTION}`}
              action={
                <>
                  <Action
                    data-cy={`remove-${NAME}`}
                    handleClick={() => remove(index)}
                    icon={<Trash />}
                  />
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit />,
                      tooltip: <Translate word={T.Edit} />,
                    }}
                    options={[
                      {
                        dialogProps: {
                          title: (
                            <>
                              <Translate word={T.Edit} />
                              {`: ${NAME}`}
                            </>
                          ),
                        },
                        form: () =>
                          isRelative
                            ? RelativeForm(undefined, item)
                            : PunctualForm(undefined, item),
                        onSubmit: (updatedAction) =>
                          update(index, mapNameFunction(updatedAction, index)),
                      },
                    ]}
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
  hypervisor: PropTypes.string,
  control: PropTypes.object,
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
