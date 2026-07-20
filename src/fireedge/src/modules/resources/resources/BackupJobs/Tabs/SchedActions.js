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

import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { EditPencil, Plus, Trash } from 'iconoir-react'
import {
  Button,
  ResourceActionConfirmation,
  Table,
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { BackupJobAPI, useModalsApi } from '@FeaturesModule'
import { TEMPLATE_SCHEDULE_TYPE_STRING, T, VM_ACTIONS } from '@ConstantsModule'
import * as BackupJobs from '@modules/resources/resources/BackupJobs'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getScheduleActions,
  getTypeScheduleAction,
  isRelative,
} from '@ModelsModule'
import {
  getActionsAvailable,
  jsonToXml,
  sentenceCase,
  timeFromMilliseconds,
} from '@UtilsModule'

const { SCHED_ACTION_CREATE, SCHED_ACTION_UPDATE, SCHED_ACTION_DELETE } =
  VM_ACTIONS
const SCHED_ACTION_CREATE_ALIASES = [SCHED_ACTION_CREATE, 'sched_action_create']
const SCHED_ACTION_UPDATE_ALIASES = [SCHED_ACTION_UPDATE, 'sched_action_update']
const SCHED_ACTION_DELETE_ALIASES = [SCHED_ACTION_DELETE, 'sched_action_delete']
const hasAction = (actions = [], aliases = []) =>
  aliases.some((alias) => actions?.includes?.(alias))

const EMPTY_VALUE = '-'

const formatTuple = (value) =>
  Array.isArray(value) ? value.filter(Boolean).join(' ') : value

const formatTime = (time) => {
  if (!time) return EMPTY_VALUE

  if (isRelative(time)) {
    const periodicity = getPeriodicityByTimeInSeconds(+time)

    return [periodicity?.time, periodicity?.period].filter(Boolean).join(' ')
  }

  return timeFromMilliseconds(+time).toRelative()
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {ReactElement} BackupJob schedule actions tab
 */
export const SchedActions = ({ data, config }) => {
  const backupjob = [].concat(data?.selected).filter(Boolean)?.[0] ?? {}
  const { isActionsDisabled, isLocked } = data || {}
  const { actions = {} } = config || {}
  const { showModal } = useModalsApi()
  const [addScheduledAction] =
    BackupJobAPI.useAddScheduledActionBackupJobMutation()
  const [updateScheduledAction] =
    BackupJobAPI.useUpdateScheduledActionBackupJobMutation()
  const [deleteScheduledAction] =
    BackupJobAPI.useDeleteScheduledActionBackupJobMutation()

  const scheduling = useMemo(() => getScheduleActions(backupjob), [backupjob])
  const actionsAvailable = useMemo(
    () => getActionsAvailable(actions),
    [actions]
  )
  const isCreateEnabled = hasAction(
    actionsAvailable,
    SCHED_ACTION_CREATE_ALIASES
  )
  const isUpdateEnabled = hasAction(
    actionsAvailable,
    SCHED_ACTION_UPDATE_ALIASES
  )
  const isDeleteEnabled = hasAction(
    actionsAvailable,
    SCHED_ACTION_DELETE_ALIASES
  )
  const isDisabled = !!(isActionsDisabled || isLocked)

  const handleCreateSchedAction = async (formData) => {
    const template = jsonToXml({
      SCHED_ACTION: { ...formData, ACTION: 'backup' },
    })
    await addScheduledAction({ id: backupjob.ID, template })
  }

  const handleUpdate = async (formData, schedId) => {
    const template = jsonToXml({
      SCHED_ACTION: { ...formData, ACTION: 'backup' },
    })
    await updateScheduledAction({ id: backupjob.ID, schedId, template })
  }

  const handleRemove = async (schedId) => {
    await deleteScheduledAction({ id: backupjob.ID, schedId })
  }

  const getFormConfig = (schedule) => ({
    stepProps: { vm: backupjob },
    initialValues: schedule,
  })

  const backupJobsDialogSizeProps = {
    dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
    dialogMaxWidth: 'calc(100vw - 32px)',
    dialogMaxHeight: 'calc(100vh - 64px)',
    dialogPaperOverflow: 'visible',
    dialogContentMaxHeight: '50vh',
    dialogContentOverflowY: 'auto',
  }

  const handleOpenCreateForm = () =>
    showModal({
      name: T.PunctualAction,
      dialogProps: {
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
        ...backupJobsDialogSizeProps,
        validateOn: 'onSubmit',
      },
      onSubmit: handleCreateSchedAction,
      form: BackupJobs.Forms.CreateBackupJobSchedActionForm(getFormConfig()),
    })

  const handleOpenUpdateForm = (schedule) =>
    showModal({
      dialogProps: {
        title: `${T.Edit} ${T.ScheduleAction} #${schedule?.ID} ${sentenceCase(
          schedule?.ACTION
        )}`,
        dataCy: 'modal-sched-actions',
        ...backupJobsDialogSizeProps,
        validateOn: 'onSubmit',
      },
      onSubmit: (newAction) => handleUpdate(newAction, schedule?.ID),
      form: BackupJobs.Forms.CreateBackupJobSchedActionForm(
        getFormConfig(schedule)
      ),
    })

  const handleOpenDeleteForm = (schedule) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.ScheduleAction} #${schedule?.ID} ${sentenceCase(
          schedule?.ACTION
        )}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{
              ID: schedule?.ID,
              NAME: sentenceCase(schedule?.ACTION),
            }}
            resourceType={T.ScheduleAction}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemove(schedule?.ID),
    })

  const columns = useMemo(
    () => [
      {
        id: 'id',
        header: T.ID,
        accessorKey: 'ID',
        grow: false,
      },
      {
        id: 'action',
        header: T.Action,
        accessorFn: (schedule) => sentenceCase(schedule?.ACTION),
      },
      {
        id: 'type',
        header: T.Type,
        accessorFn: (schedule) =>
          TEMPLATE_SCHEDULE_TYPE_STRING?.[getTypeScheduleAction(schedule)] ??
          EMPTY_VALUE,
        cell: ({ row }) => {
          const type =
            TEMPLATE_SCHEDULE_TYPE_STRING?.[
              getTypeScheduleAction(row.original)
            ] ?? EMPTY_VALUE

          return type !== EMPTY_VALUE ? (
            <Tag title={type} status="default" />
          ) : (
            '-'
          )
        },
      },
      {
        id: 'time',
        header: T.Time,
        accessorFn: (schedule) => formatTime(schedule?.TIME),
        grow: false,
      },
      {
        id: 'repeat',
        header: 'Repeat',
        accessorFn: (schedule) =>
          formatTuple(getRepeatInformation(schedule)?.repeat) ?? EMPTY_VALUE,
      },
      {
        id: 'end',
        header: 'End',
        accessorFn: (schedule) =>
          formatTuple(getRepeatInformation(schedule)?.end) ?? EMPTY_VALUE,
      },
      {
        id: 'message',
        header: T.Message,
        accessorFn: (schedule) => schedule?.MESSAGE ?? EMPTY_VALUE,
        grow: false,
      },
      {
        id: 'actions',
        header: '',
        grow: false,
        cell: ({ row }) => (
          <ToggleGroup
            size="small"
            isOutlined={false}
            isSelectable={false}
            sx={(theme) => ({
              bgcolor: 'transparent',
              padding: '0px',
              gap: `${theme.scale[100]}px`,
              justifyContent: 'flex-end',
            })}
            options={[
              [
                isUpdateEnabled && {
                  startIcon: <EditPencil width="16px" height="16px" />,
                  onClick: () => handleOpenUpdateForm(row.original),
                  tooltip: T.Edit,
                  value: 'edit',
                  isDisabled,
                  sx: {
                    padding: '0 0 0 8px',
                    bgcolor: 'transparent',
                    '&:hover': {
                      color: 'icon.actionHover',
                    },
                  },
                },
                isDeleteEnabled && {
                  startIcon: <Trash width="16px" height="16px" />,
                  onClick: () => handleOpenDeleteForm(row.original),
                  tooltip: T.Delete,
                  value: 'delete',
                  isDestructive: true,
                  isDisabled,
                  sx: {
                    padding: '0 0 0 8px',
                    bgcolor: 'transparent',
                    '&:hover': {
                      color: 'icon.actionHover',
                    },
                  },
                },
              ].filter(Boolean),
            ]}
          />
        ),
      },
    ],
    [backupjob, isDeleteEnabled, isDisabled, isUpdateEnabled]
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isCreateEnabled && (
        <Box>
          <Button
            type="secondary"
            size="small"
            startIcon={<Plus width="16px" height="16px" />}
            onClick={handleOpenCreateForm}
            isDisabled={isDisabled}
          >
            {T.AddAction}
          </Button>
        </Box>
      )}

      <Table
        title={T.SchedActions}
        columns={columns}
        data={scheduling}
        isRowsSelectable={false}
        isEnableSearchBar={true}
        isEnableSort={true}
        isEnableFilters={true}
        isDisablePagination
        isFullHeight={false}
      />
    </Box>
  )
}

SchedActions.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

SchedActions.id = 'sched_actions'
SchedActions.title = T.SchedActions

export default SchedActions
