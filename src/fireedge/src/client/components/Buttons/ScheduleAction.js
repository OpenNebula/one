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
import { memo, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Trash, Edit, ClockOutline } from 'iconoir-react'

import { useGetSunstoneConfigQuery } from 'client/features/OneApi/system'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import {
  CreateCharterForm,
  CreateRelativeCharterForm,
  CreateSchedActionForm,
  CreateRelativeSchedActionForm,
} from 'client/components/Forms/Vm'

import { Tr, Translate } from 'client/components/HOC'
import { sentenceCase } from 'client/utils'
import {
  T,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
  ScheduleAction,
} from 'client/constants'

/**
 * Returns a button to trigger form to create a scheduled action.
 *
 * @param {object} props - Props
 * @param {object} props.vm - Vm resource
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const CreateSchedButton = memo(({ vm, relative, onSubmit }) => (
  <ButtonToTriggerForm
    buttonProps={{
      color: 'secondary',
      'data-cy': VM_ACTIONS.SCHED_ACTION_CREATE,
      label: T.AddAction,
      variant: 'outlined',
    }}
    options={[
      {
        name: T.PunctualAction,
        dialogProps: {
          title: T.ScheduleAction,
          dataCy: 'modal-sched-actions',
        },
        form: () =>
          relative
            ? CreateRelativeSchedActionForm(vm)
            : CreateSchedActionForm(vm),
        onSubmit,
      },
    ]}
  />
))

/**
 * Returns a button to trigger form to update a scheduled action.
 *
 * @param {object} props - Props
 * @param {object} props.vm - Vm resource
 * @param {ScheduleAction} props.schedule - Schedule action
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const UpdateSchedButton = memo(({ vm, schedule, relative, onSubmit }) => {
  const { ID, ACTION } = schedule
  const titleAction = `#${ID} ${sentenceCase(ACTION)}`

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SCHED_ACTION_UPDATE}-${ID}`,
        icon: <Edit />,
        tooltip: <Translate word={T.Edit} />,
      }}
      options={[
        {
          dialogProps: {
            title: (
              <Translate word={T.UpdateScheduleAction} values={[titleAction]} />
            ),
            dataCy: 'modal-sched-actions',
          },
          form: () =>
            relative
              ? CreateRelativeSchedActionForm(vm, schedule)
              : CreateSchedActionForm(vm, schedule),
          onSubmit,
        },
      ]}
    />
  )
})

/**
 * Returns a button to trigger modal to delete a scheduled action.
 *
 * @param {object} props - Props
 * @param {ScheduleAction} props.schedule - Schedule action
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const DeleteSchedButton = memo(({ onSubmit, schedule }) => {
  const { ID, ACTION } = schedule
  const titleAction = `#${ID} ${sentenceCase(ACTION)}`

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`,
        icon: <Trash />,
        tooltip: <Translate word={T.Delete} />,
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate word={T.DeleteScheduleAction} values={[titleAction]} />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit,
        },
      ]}
    />
  )
})

/**
 * Returns a button to trigger form to create a charter.
 *
 * @param {object} props - Props
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const CharterButton = memo(({ relative, onSubmit }) => {
  const { data: config } = useGetSunstoneConfigQuery()

  const leases = useMemo(
    () =>
      // filters if exists in the VM actions for charters
      Object.entries(config?.leases ?? {}).filter(([action]) =>
        VM_ACTIONS_IN_CHARTER.includes(action)
      ),
    [config?.leases]
  )

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': VM_ACTIONS.CHARTER_CREATE,
        icon: <ClockOutline />,
        tooltip: <Translate word={T.Charter} />,
        disabled: leases.length <= 0,
      }}
      options={[
        {
          dialogProps: {
            title: T.ScheduleAction,
            dataCy: 'modal-sched-actions',
          },
          form: () =>
            relative
              ? CreateRelativeCharterForm(leases, leases)
              : CreateCharterForm(leases, leases),
          onSubmit,
        },
      ]}
    />
  )
})

const ButtonPropTypes = {
  vm: PropTypes.object,
  relative: PropTypes.bool,
  onSubmit: PropTypes.func,
  schedule: PropTypes.object,
}

CreateSchedButton.propTypes = ButtonPropTypes
CreateSchedButton.displayName = 'CreateSchedButton'
UpdateSchedButton.propTypes = ButtonPropTypes
UpdateSchedButton.displayName = 'UpdateSchedButton'
DeleteSchedButton.propTypes = ButtonPropTypes
DeleteSchedButton.displayName = 'DeleteSchedButton'
CharterButton.propTypes = ButtonPropTypes
CharterButton.displayName = 'CharterButton'

export {
  CreateSchedButton,
  DeleteSchedButton,
  UpdateSchedButton,
  CharterButton,
}
