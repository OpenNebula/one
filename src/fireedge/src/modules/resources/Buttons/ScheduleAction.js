/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Clock, Edit, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import {
  CreateCharterForm,
  CreateRelativeCharterForm,
  CreateRelativeSchedActionForm,
  CreateSchedActionForm,
} from '@modules/resources/resources/VirtualMachine/Forms'
import { CreateBackupJobSchedActionForm } from '@modules/resources/resources/BackupJobs/Forms'

import { CreatePerformAction } from '@modules/resources/Forms/Service'

import {
  SERVER_CONFIG,
  ScheduleAction,
  T,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
} from '@ConstantsModule'
import { Translate, useTranslation } from '@ProvidersModule'
import { hasRestrictedAttributes, sentenceCase } from '@UtilsModule'

import { useModalsApi } from '@FeaturesModule'
import { SubmitButton } from '@ComponentsV2Module'

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
    const { showModal } = useModalsApi()

    const formConfig = {
      stepProps: { vm, oneConfig, adminGroup },
    }

    const handleOpenForm = () =>
      showModal({
        name: T.PunctualAction,

        dialogProps: {
          title: T.ScheduleAction,
          dataCy: 'modal-sched-actions',
          ...(backupjobs && { validateOn: 'onSubmit' }),
        },

        onSubmit,

        form: relative
          ? CreateRelativeSchedActionForm(formConfig)
          : backupjobs
          ? CreateBackupJobSchedActionForm(formConfig)
          : CreateSchedActionForm(formConfig),
      })

    return (
      <SubmitButton
        data-cy={VM_ACTIONS.SCHED_ACTION_CREATE}
        label={T.AddAction}
        onClick={handleOpenForm}
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
    const { showModal } = useModalsApi()

    const { ID, ACTION } = schedule
    const titleAction = `#${ID} ${sentenceCase(ACTION)}`
    const formConfig = {
      stepProps: { vm, oneConfig, adminGroup },
      initialValues: schedule,
    }

    const handleOpenForm = () =>
      showModal({
        dialogProps: {
          title: (
            <Translate word={T.UpdateScheduleAction} values={[titleAction]} />
          ),
          dataCy: 'modal-sched-actions',
          ...(backupjobs && { validateOn: 'onSubmit' }),
        },

        onSubmit,

        form: relative
          ? CreateRelativeSchedActionForm(formConfig)
          : backupjobs
          ? CreateBackupJobSchedActionForm(formConfig)
          : CreateSchedActionForm(formConfig),
      })

    return (
      <SubmitButton
        data-cy={`${VM_ACTIONS.SCHED_ACTION_UPDATE}-${ID}`}
        iconOnly={<Edit />}
        tooltip={<Translate word={T.Edit} />}
        onClick={handleOpenForm}
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
 * @param {number} props.vmId - VM id
 * @returns {ReactElement} Button
 */
const DeleteSchedButton = memo(
  ({ onSubmit, schedule, oneConfig, adminGroup, vmId }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()

    const { ID, ACTION } = schedule
    const titleAction = `#${ID} ${sentenceCase(ACTION)}`

    // Disable action if is a regular user and is deleting a sched action in a template and if the sched action has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      !vmId &&
      hasRestrictedAttributes(
        schedule,
        'SCHED_ACTION',
        oneConfig?.VM_RESTRICTED_ATTR
      )

    const handleOpenForm = () =>
      showModal({
        isConfirmDialog: true,

        dialogProps: {
          title: (
            <Translate word={T.DeleteScheduleAction} values={[titleAction]} />
          ),
          children: <p>{translate(T.DoYouWantProceed)}</p>,
        },

        onSubmit,
      })

    return (
      <SubmitButton
        data-cy={`${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`}
        iconOnly={<Trash />}
        tooltip={
          !disabledAction ? translate(T.Delete) : translate(T.DetachRestricted)
        }
        disabled={disabledAction}
        onClick={handleOpenForm}
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
  const { showModal } = useModalsApi()

  const leases = useMemo(
    () =>
      // filters if exists in the VM actions for charters
      Object.entries(SERVER_CONFIG?.leases ?? {}).filter(([action]) =>
        VM_ACTIONS_IN_CHARTER.includes(action)
      ),
    []
  )

  const formConfig = { stepProps: leases, initialValues: leases }

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
      },

      onSubmit,

      form: relative
        ? CreateRelativeCharterForm(formConfig)
        : CreateCharterForm(formConfig),
    })

  return (
    <SubmitButton
      data-cy={VM_ACTIONS.CHARTER_CREATE}
      iconOnly={<Clock />}
      tooltip={<Translate word={T.Charter} />}
      disabled={leases.length <= 0}
      onClick={handleOpenForm}
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
    const { showModal } = useModalsApi()

    const formConfig = {
      stepProps: { service, oneConfig, adminGroup, roles },
    }

    const handleOpenForm = () =>
      showModal({
        name: T.PerformAction,

        dialogProps: {
          title: T.PerformAction,
          dataCy: 'modal-perform-action',
        },

        onSubmit,
        form: CreatePerformAction(formConfig),
      })

    return (
      <SubmitButton
        data-cy={VM_ACTIONS.PERFORM_ACTION}
        label={T.PerformAction}
        onClick={handleOpenForm}
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
  vmId: PropTypes.number,
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
  PerformActionButton,
  UpdateSchedButton,
}
