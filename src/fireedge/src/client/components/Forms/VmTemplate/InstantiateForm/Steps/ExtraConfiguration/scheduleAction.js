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
import makeStyles from '@mui/styles/makeStyles'
import { Edit, Trash } from 'iconoir-react'
import { useWatch } from 'react-hook-form'

import { useListForm } from 'client/hooks'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { PunctualForm, RelativeForm } from 'client/components/Forms/Vm'
import { Tr, Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    paddingBlock: '1em',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, auto))',
    gap: '1em'
  }
})

export const TAB_ID = 'SCHED_ACTION'

const ScheduleAction = ({ setFormData, control }) => {
  const classes = useStyles()
  const scheduleActions = useWatch({ name: `${EXTRA_ID}.${TAB_ID}`, control })

  const { handleRemove, handleSave } = useListForm({
    parent: EXTRA_ID,
    key: TAB_ID,
    list: scheduleActions,
    setList: setFormData,
    getItemId: item => item.NAME,
    addItemId: (item, _, itemIndex) => ({ ...item, NAME: `${TAB_ID}${itemIndex}` })
  })

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-sched-action',
          label: Tr(T.AddAction)
        }}
        options={[{
          cy: 'add-sched-action-punctual',
          name: 'Punctual action',
          dialogProps: { title: T.ScheduledAction },
          form: () => PunctualForm(),
          onSubmit: handleSave
        },
        {
          cy: 'add-sched-action-relative',
          name: 'Relative action',
          dialogProps: { title: T.ScheduledAction },
          form: () => RelativeForm(),
          onSubmit: handleSave
        }]}
      />
      <div className={classes.root}>
        {scheduleActions?.map(item => {
          const { NAME, ACTION, TIME } = item
          const isRelative = String(TIME).includes('+')

          return (
            <SelectCard
              key={NAME}
              title={`${NAME} - ${ACTION}`}
              action={
                <>
                  <Action
                    data-cy={`remove-${NAME}`}
                    handleClick={() => handleRemove(NAME)}
                    icon={<Trash />}
                  />
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit />,
                      tooltip: <Translate word={T.Edit} />
                    }}
                    options={[{
                      dialogProps: {
                        title: <><Translate word={T.Edit} />{`: ${NAME}`}</>
                      },
                      form: () => isRelative
                        ? RelativeForm(undefined, item)
                        : PunctualForm(undefined, item),
                      onSubmit: newValues => handleSave(newValues, NAME)
                    }]}
                  />
                </>
              }
            />
          )
        })}
      </div>
    </>
  )
}

ScheduleAction.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

ScheduleAction.displayName = 'ScheduleAction'

export default ScheduleAction
