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
import { memo, useContext } from 'react'
import PropTypes from 'prop-types'

import { Trash, Edit, ClockOutline } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { PunctualForm, RelativeForm } from 'client/components/Forms/Vm'
import * as Helper from 'client/models/Helper'

import { Tr, Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const CreateSchedAction = memo(() => {
  const { addScheduledAction } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleCreateSchedAction = async formData => {
    const data = { template: Helper.jsonToXml({ SCHED_ACTION: formData }) }
    const response = await addScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        color: 'secondary',
        'data-cy': 'create-sched-action',
        label: Tr(T.AddAction)
      }}
      options={[{
        cy: 'create-sched-action-punctual',
        name: 'Punctual action',
        dialogProps: { title: T.ScheduledAction },
        form: () => PunctualForm(vm),
        onSubmit: handleCreateSchedAction
      },
      {
        cy: 'create-sched-action-relative',
        name: 'Relative action',
        dialogProps: { title: T.ScheduledAction },
        form: () => RelativeForm(vm),
        onSubmit: handleCreateSchedAction
      }]}
    />
  )
})

const UpdateSchedAction = memo(({ schedule, name }) => {
  const { ID, TIME } = schedule
  const isRelative = String(TIME).includes('+')
  const { updateScheduledAction } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleUpdate = async formData => {
    const data = {
      id_sched: ID,
      template: Helper.jsonToXml({ SCHED_ACTION: formData })
    }

    const response = await updateScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SCHED_ACTION_UPDATE}-${ID}`,
        icon: <Edit size={18} />,
        tooltip: <Translate word={T.Edit} />
      }}
      options={[{
        dialogProps: {
          title: <Translate word={T.UpdateScheduledAction} values={[name]} />
        },
        form: () => isRelative
          ? RelativeForm(vm, schedule)
          : PunctualForm(vm, schedule),
        onSubmit: handleUpdate
      }]}
    />
  )
})

const DeleteSchedAction = memo(({ schedule, name }) => {
  const { ID } = schedule
  const { deleteScheduledAction } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleDelete = async () => {
    const data = { id_sched: ID }
    const response = await deleteScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`,
        icon: <Trash size={18} />,
        tooltip: <Translate word={T.Delete} />
      }}
      options={[{
        isConfirmDialog: true,
        dialogProps: {
          title: <Translate word={T.DeleteScheduledAction} values={[name]} />,
          children: <p>{Tr(T.DoYouWantProceed)}</p>
        },
        onSubmit: handleDelete
      }]}
    />
  )
})

const CharterAction = memo(() => {
  const { config } = useAuth()
  const { addScheduledAction } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const leases = Object.entries(config?.leases ?? {})

  const handleCreateCharter = async () => {
    const schedActions = leases
      .map(([action, { time, warning: { time: warningTime } = {} } = {}]) => ({
        TIME: `+${+time}`,
        ACTION: action,
        ...(warningTime && { WARNING: `-${+warningTime}` })
      }))

    const response = await Promise.all(
      schedActions.map(schedAction => {
        const data = { template: Helper.jsonToXml({ SCHED_ACTION: schedAction }) }
        return addScheduledAction(vm.ID, data)
      })
    )

    response.some(res => String(res) === String(vm?.ID)) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'create-charter',
        icon: <ClockOutline />,
        tooltip: Tr(T.Charter)
      }}
      options={[{
        isConfirmDialog: true,
        dialogProps: {
          title: Tr(T.ScheduledAction),
          children: (
            <>
              {leases.map(([action, { time } = {}], idx) => {
                const allPeriods = {
                  years: time / 365 / 24 / 3600,
                  months: time / 30 / 24 / 3600,
                  weeks: time / 7 / 24 / 3600,
                  days: time / 24 / 3600,
                  hours: time / 3600,
                  minutes: time / 60
                }

                const [period, parsedTime] = Object
                  .entries(allPeriods)
                  .find(([_, time]) => time >= 1)

                return (
                  <p key={`${action}-${idx}`}>
                    {`${action} - ${parsedTime} ${period}`}
                  </p>
                )
              })}
              <hr />
              <p>{Tr(T.DoYouWantProceed)}</p>
            </>
          )
        },
        onSubmit: handleCreateCharter
      }]}
    />
  )
})

const ActionPropTypes = {
  schedule: PropTypes.object,
  name: PropTypes.string
}

CreateSchedAction.propTypes = ActionPropTypes
CreateSchedAction.displayName = 'CreateSchedActionButton'
UpdateSchedAction.propTypes = ActionPropTypes
UpdateSchedAction.displayName = 'UpdateSchedActionButton'
DeleteSchedAction.propTypes = ActionPropTypes
DeleteSchedAction.displayName = 'DeleteSchedActionButton'
CharterAction.propTypes = ActionPropTypes
CharterAction.displayName = 'CharterActionButton'

export {
  CharterAction,
  CreateSchedAction,
  DeleteSchedAction,
  UpdateSchedAction
}
