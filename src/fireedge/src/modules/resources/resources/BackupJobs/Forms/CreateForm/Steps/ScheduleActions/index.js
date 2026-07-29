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
import { Box, Stack, styled } from '@mui/material'
import { EditPencil, Plus, Trash } from 'iconoir-react'
import {
  Button,
  ResourceActionConfirmation,
  ToggleGroup,
} from '@ComponentsV2Module'
import { useModalsApi } from '@FeaturesModule'
import { ScheduleActionCard } from '@modules/resources/Cards'
import { T } from '@ConstantsModule'
import * as BackupJobs from '@modules/resources/resources/BackupJobs'
import { Step, cleanEmpty, sentenceCase } from '@UtilsModule'
import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { array } from 'yup'

export const STEP_ID = 'SCHED_ACTION'

const StyledContainer = styled(Box)(({ theme }) => ({
  marginTop: `${theme.spacing(0.5)}`,
}))

const actionButtonSx = {
  padding: '0 0 0 8px',
  bgcolor: 'transparent',
  '&:hover': {
    color: 'icon.actionHover',
  },
}

const Content = () => {
  const { setValue } = useFormContext()
  const { showModal } = useModalsApi()
  const scheduleActions = useWatch({
    name: STEP_ID,
    defaultValue: [],
  })

  const handleAction = useCallback(
    (type, action, index) => {
      const newScheduleActions = [...(scheduleActions ?? [])]
      const updatedScheduleAction = {
        ...action,
        ACTION: 'backup',
      }
      switch (type) {
        case 'create':
          newScheduleActions.push(updatedScheduleAction)
          break
        case 'update':
          newScheduleActions[index] = updatedScheduleAction
          break
        default:
          newScheduleActions.splice(index, 1)
          break
      }
      setValue(STEP_ID, cleanEmpty(newScheduleActions))
    },
    [scheduleActions]
  )

  const getFormConfig = (schedule) => ({
    stepProps: { vm: {} },
    initialValues: schedule,
  })

  const handleOpenCreateForm = () =>
    showModal({
      name: T.PunctualAction,
      dialogProps: {
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
        validateOn: 'onSubmit',
      },
      onSubmit: (newAction) => handleAction('create', newAction),
      form: BackupJobs.Forms.CreateBackupJobSchedActionForm(getFormConfig()),
    })

  const handleOpenUpdateForm = (schedule, index) =>
    showModal({
      dialogProps: {
        title: `${T.Edit} ${T.ScheduleAction} #${schedule?.ID} ${sentenceCase(
          schedule?.ACTION
        )}`,
        dataCy: 'modal-sched-actions',
        validateOn: 'onSubmit',
      },
      onSubmit: (newAction) => handleAction('update', newAction, index),
      form: BackupJobs.Forms.CreateBackupJobSchedActionForm(
        getFormConfig(schedule)
      ),
    })

  const handleOpenDeleteForm = (schedule, index) =>
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
      onSubmit: () => handleAction('delete', undefined, index),
    })

  const actions = scheduleActions ?? []

  return (
    <StyledContainer>
      <Stack flexDirection="row" gap="1em">
        <Button
          type="secondary"
          size="small"
          startIcon={<Plus width="16px" height="16px" />}
          onClick={handleOpenCreateForm}
        >
          {T.AddAction}
        </Button>
      </Stack>

      <Stack
        pb="1em"
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(300px, 0.5fr))"
        gap="1em"
        mt="1em"
      >
        {actions?.map((schedule, index) => {
          const { ID, NAME } = schedule
          const fakeValues = { ...schedule, ID: index }

          return (
            <ScheduleActionCard
              key={ID ?? NAME ?? index}
              schedule={fakeValues}
              actions={
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
                      {
                        startIcon: <EditPencil width="16px" height="16px" />,
                        onClick: () => handleOpenUpdateForm(fakeValues, index),
                        tooltip: T.Edit,
                        value: 'edit',
                        sx: actionButtonSx,
                      },
                      {
                        startIcon: <Trash width="16px" height="16px" />,
                        onClick: () => handleOpenDeleteForm(fakeValues, index),
                        tooltip: T.Delete,
                        value: 'delete',
                        isDestructive: true,
                        sx: actionButtonSx,
                      },
                    ],
                  ]}
                />
              }
            />
          )
        })}
      </Stack>
    </StyledContainer>
  )
}

/**
 * Step to select the Schedule Actions.
 *
 * @returns {Step} Schedule Action step
 */
const ScheduleActions = () => ({
  id: STEP_ID,
  label: T.ScheduleAction,
  resolver: array().ensure(),
  content: Content,
})

export default ScheduleActions
