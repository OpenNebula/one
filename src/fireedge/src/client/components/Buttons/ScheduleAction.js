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
import { ClockOutline, Edit, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import {
  CreateBackupJobSchedActionForm,
  CreateCharterForm,
  CreateRelativeCharterForm,
  CreateRelativeSchedActionForm,
  CreateSchedActionForm,
} from 'client/components/Forms/Vm'

import { CreatePerformAction } from 'client/components/Forms/Service'

import { Tr, Translate } from 'client/components/HOC'
import {
  SERVER_CONFIG,
  ScheduleAction,
  T,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
} from 'client/constants'
import { hasRestrictedAttributes, sentenceCase } from 'client/utils'

/**
 * Returns a button to trigger form to create a scheduled action.
 *
 * @param {object} props - Props
 * @param {object} props.vm - Vm resource
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const CreateSchedButton = memo(
  ({ vm, relative, onSubmit, oneConfig, adminGroup, backupjobs }) => {
    const formConfig = {
      stepProps: { vm, oneConfig, adminGroup },
    }

    return (
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
                ? CreateRelativeSchedActionForm(formConfig)
                : backupjobs
                ? CreateBackupJobSchedActionForm(formConfig)
                : CreateSchedActionForm(formConfig),
            onSubmit,
          },
        ]}
      />
    )
  }
)

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
const UpdateSchedButton = memo(
  ({ vm, schedule, relative, onSubmit, oneConfig, adminGroup, backupjobs }) => {
    const { ID, ACTION } = schedule
    const titleAction = `#${ID} ${sentenceCase(ACTION)}`
    const formConfig = {
      stepProps: { vm, oneConfig, adminGroup },
      initialValues: schedule,
    }

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
                <Translate
                  word={T.UpdateScheduleAction}
                  values={[titleAction]}
                />
              ),
              dataCy: 'modal-sched-actions',
            },
            form: () =>
              relative
                ? CreateRelativeSchedActionForm(formConfig)
                : backupjobs
                ? CreateBackupJobSchedActionForm(formConfig)
                : CreateSchedActionForm(formConfig),
            onSubmit,
          },
        ]}
      />
    )
  }
)

/**
 * Returns a button to trigger modal to delete a scheduled action.
 *
 * @param {object} props - Props
 * @param {ScheduleAction} props.schedule - Schedule action
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const DeleteSchedButton = memo(
  ({ onSubmit, schedule, oneConfig, adminGroup }) => {
    const { ID, ACTION } = schedule
    const titleAction = `#${ID} ${sentenceCase(ACTION)}`

    // Disable action if the nic has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(
        schedule,
        'SCHED_ACTION',
        oneConfig?.VM_RESTRICTED_ATTR
      )

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`,
          icon: <Trash />,
          tooltip: !disabledAction ? Tr(T.Delete) : Tr(T.DetachRestricted),
          disabled: disabledAction,
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: (
                <Translate
                  word={T.DeleteScheduleAction}
                  values={[titleAction]}
                />
              ),
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit,
          },
        ]}
      />
    )
  }
)

/**
 * Returns a button to trigger form to create a charter.
 *
 * @param {object} props - Props
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const CharterButton = memo(({ relative, onSubmit }) => {
  const leases = useMemo(
    () =>
      // filters if exists in the VM actions for charters
      Object.entries(SERVER_CONFIG?.leases ?? {}).filter(([action]) =>
        VM_ACTIONS_IN_CHARTER.includes(action)
      ),
    []
  )

  const formConfig = { stepProps: leases, initialValues: leases }

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
              ? CreateRelativeCharterForm(formConfig)
              : CreateCharterForm(formConfig),
          onSubmit,
        },
      ]}
    />
  )
})

/**
 * Returns a button to trigger form to perform an action.
 *
 * @param {object} props - Props
 * @param {object} props.service - Service resource
 * @param {boolean} [props.relative] - Applies to the form relative format
 * @param {function():Promise} props.onSubmit - Submit function
 * @returns {ReactElement} Button
 */
const PerformActionButton = memo(
  ({ service, onSubmit, oneConfig, adminGroup, roles }) => {
    const formConfig = {
      stepProps: { service, oneConfig, adminGroup, roles },
    }

    return (
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': VM_ACTIONS.PERFORM_ACTION,
          label: T.PerformAction,
          variant: 'outlined',
        }}
        options={[
          {
            name: T.PerformAction,
            dialogProps: {
              title: T.PerformAction,
              dataCy: 'modal-perform-action',
            },
            form: () => CreatePerformAction(formConfig),
            onSubmit,
          },
        ]}
      />
    )
  }
)

const ButtonPropTypes = {
  vm: PropTypes.object,
  relative: PropTypes.bool,
  onSubmit: PropTypes.func,
  schedule: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  backupjobs: PropTypes.bool,
  service: PropTypes.object,
  roles: PropTypes.object,
}

CreateSchedButton.propTypes = ButtonPropTypes
CreateSchedButton.displayName = 'CreateSchedButton'
UpdateSchedButton.propTypes = ButtonPropTypes
UpdateSchedButton.displayName = 'UpdateSchedButton'
DeleteSchedButton.propTypes = ButtonPropTypes
DeleteSchedButton.displayName = 'DeleteSchedButton'
CharterButton.propTypes = ButtonPropTypes
CharterButton.displayName = 'CharterButton'
PerformActionButton.propTypes = ButtonPropTypes
PerformActionButton.displayName = 'PerformActionButton'

export {
  CharterButton,
  CreateSchedButton,
  DeleteSchedButton,
  UpdateSchedButton,
  PerformActionButton,
}
