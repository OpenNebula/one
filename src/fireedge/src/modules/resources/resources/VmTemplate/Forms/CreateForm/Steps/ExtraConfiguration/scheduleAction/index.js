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
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Calendar as ActionIcon, Clock, Plus } from 'iconoir-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray } from 'react-hook-form'

import {
  Button,
  CardBlock,
  EmptyContent,
  LabelSlot,
  MetadataSlot,
  ResourceActionConfirmation,
  TitleSlot,
} from '@ComponentsV2Module'

import {
  SERVER_CONFIG,
  SCHEDULE_TYPE,
  STYLE_BUTTONS,
  T,
  TEMPLATE_SCHEDULE_TYPE_STRING,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
} from '@ConstantsModule'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getTypeScheduleAction,
  isRelative,
} from '@ModelsModule'
import * as VirtualMachine from '@modules/resources/resources/VirtualMachine'
import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'
import { useTranslation } from '@ProvidersModule'
import {
  dateToMilliseconds,
  hasRestrictedAttributes,
  isDate,
  sentenceCase,
  timeFromMilliseconds,
} from '@UtilsModule'

export const TAB_ID = 'SCHED_ACTION'
const mapNameFunction = mapNameByIndex(TAB_ID)

const SCHED_ACTION_FORM_DIALOG_PROPS = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '760px',
    lg: '840px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogContentMaxHeight: '70vh',
  dialogContentOverflowY: 'auto',
}

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') return '-'

  if (typeof value === 'object') {
    const values = Object.values(value).filter(Boolean)

    return values.length ? values.join(',') : '-'
  }

  return String(value)
}

const formatActionTime = (time, translate) => {
  if (!time) return '-'

  if (isDate(time)) {
    const formattedTime = timeFromMilliseconds(dateToMilliseconds(time))

    return formattedTime.isValid
      ? formattedTime.toFormat('ff')
      : formatValue(time)
  }

  if (time?.isValid && typeof time.toJSDate === 'function') {
    const formattedTime = timeFromMilliseconds(
      dateToMilliseconds(time.toJSDate())
    )

    return formattedTime.isValid
      ? formattedTime.toFormat('ff')
      : formatValue(time)
  }

  if (isRelative(time)) {
    const seconds = Math.abs(+time)

    if (!Number.isFinite(seconds)) return formatValue(time)

    try {
      const { period, time: periodicityTime } =
        getPeriodicityByTimeInSeconds(seconds)

      return `${periodicityTime} ${translate(period)}`
    } catch {
      return `${seconds} ${translate(T.Seconds)}`
    }
  }

  const dateTime = timeFromMilliseconds(+time)

  return dateTime.isValid ? dateTime.toFormat('ff') : formatValue(time)
}

const cleanScheduleActionFormValues = (schedule) => {
  if (!schedule) return schedule

  const { id, SCHED_ACTION_ID, ...scheduleAction } = schedule

  return scheduleAction
}

const getScheduleActionType = (schedule) =>
  getTypeScheduleAction(cleanScheduleActionFormValues(schedule)) ||
  SCHEDULE_TYPE.ONETIME

const getScheduleActionResourceName = (schedule) => {
  const titleName = schedule?.NAME ? ` (${schedule.NAME})` : ''

  return `${sentenceCase(schedule?.ACTION)}${titleName}`
}

const getScheduleActionName = (schedule) =>
  `#${schedule?.SCHED_ACTION_ID} ${getScheduleActionResourceName(schedule)}`

const getScheduleActionMetadata = (schedule, translate) => {
  const { repeat, end } = getRepeatInformation(schedule)

  return [
    [T.ID, formatValue(schedule?.SCHED_ACTION_ID)],
    [T.Action, formatValue(sentenceCase(schedule?.ACTION))],
    [T.Time, formatActionTime(schedule?.TIME, translate)],
    [T.Arguments, formatValue(schedule?.ARGS)],
    repeat && [T.Repeat, Array.isArray(repeat) ? repeat.join(' ') : repeat],
    end && [T.Ends, Array.isArray(end) ? end.join(' ') : end],
  ].filter(Boolean)
}

const getScheduleActionTitleTags = (schedule) => {
  const type = getScheduleActionType(schedule)
  const typeText = TEMPLATE_SCHEDULE_TYPE_STRING?.[type]

  return typeText ? [[typeText, 'information']] : []
}

const getScheduleActionTags = (schedule) =>
  [
    schedule?.WARNING && [T.WarningBefore, 'miscellaneous1'],
    schedule?.DONE && [T.Done, 'miscellaneous4'],
    schedule?.MESSAGE && [schedule.MESSAGE, 'miscellaneous2'],
  ].filter(Boolean)

const ScheduleActionTitleSlot = ({ labels = [], title }) => (
  <Box
    sx={(theme) => ({
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${theme.scale[100]}px`,
      maxWidth: '100%',
    })}
  >
    <TitleSlot title={title} />
    {labels.length > 0 && <LabelSlot labels={labels} />}
  </Box>
)

ScheduleActionTitleSlot.propTypes = {
  labels: PropTypes.array,
  title: PropTypes.string,
}

const VmTemplateScheduleActionCard = ({ actions, schedule }) => {
  const { translate } = useTranslation()
  const tags = getScheduleActionTags(schedule)
  const slots = [
    [
      ScheduleActionTitleSlot,
      {
        labels: getScheduleActionTitleTags(schedule),
        title: getScheduleActionName(schedule),
      },
    ],
    [MetadataSlot, { labels: getScheduleActionMetadata(schedule, translate) }],
    tags.length > 0 && [LabelSlot, { labels: tags }],
  ].filter(Boolean)

  return (
    <CardBlock
      actions={actions}
      dataCy={`sched-${schedule?.SCHED_ACTION_ID}`}
      isSelectable={false}
      slots={slots}
    />
  )
}

VmTemplateScheduleActionCard.propTypes = {
  actions: PropTypes.array,
  schedule: PropTypes.object,
}

const ScheduleAction = ({ oneConfig, adminGroup }) => {
  const {
    enqueueSuccess,
    setModifiedFields,
    setFieldPath,
    initModifiedFields,
  } = useGeneralApi()
  const { showModal } = useModalsApi()

  const {
    fields: scheduleActions = [],
    append,
    update,
    replace,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const totalFieldsCount = useMemo(
    () => scheduleActions?.length ?? 0,
    [scheduleActions]
  )

  const leases = useMemo(
    () =>
      Object.entries(SERVER_CONFIG?.leases ?? {}).filter(([action]) =>
        VM_ACTIONS_IN_CHARTER.includes(action)
      ),
    []
  )

  useEffect(() => {
    setFieldPath(`extra.ScheduleAction`)
    initModifiedFields([...scheduleActions.map(() => ({}))])
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFieldPath(`extra.ScheduleAction.${totalFieldsCount}`)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [totalFieldsCount])

  const cardScheduleActions = useMemo(
    () =>
      scheduleActions?.map(({ id, ...schedule }, index) => ({
        ...schedule,
        id,
        ID: index,
        SCHED_ACTION_ID: index,
      })) ?? [],
    [scheduleActions]
  )

  const notifyScheduleActionSuccess = (message, schedule) =>
    setTimeout(
      () => enqueueSuccess(message, [getScheduleActionName(schedule)]),
      0
    )

  const prepareScheduleAction = (schedule, index) => {
    setModifiedFields(schedule)

    const { id, ID, SCHED_ACTION_ID, ...scheduleAction } = schedule

    return mapNameFunction(scheduleAction, index)
  }

  const handleCreateAction = (action) => {
    setFieldPath(`extra.ScheduleAction.${scheduleActions.length}`)

    const scheduleAction = prepareScheduleAction(action, scheduleActions.length)

    append(scheduleAction)
    notifyScheduleActionSuccess(T.SuccessVMTemplateScheduleActionCreated, {
      ...scheduleAction,
      SCHED_ACTION_ID: scheduleActions.length,
    })
  }

  const handleCreateCharter = (actions) => {
    setFieldPath(`extra.ScheduleAction.${scheduleActions.length}`)

    const mappedActions = actions?.map((action, index) =>
      prepareScheduleAction(action, scheduleActions.length + index)
    )

    append(mappedActions)
    notifyScheduleActionSuccess(T.SuccessVMTemplateScheduleActionCreated, {
      ...(mappedActions?.[0] ?? {}),
      SCHED_ACTION_ID: scheduleActions.length,
    })
  }

  const handleUpdateAction = (index) => (action) => {
    setFieldPath(`extra.ScheduleAction.${index}`)

    const scheduleAction = prepareScheduleAction(action, index)

    update(index, scheduleAction)
    notifyScheduleActionSuccess(T.SuccessVMTemplateScheduleActionUpdated, {
      ...scheduleAction,
      SCHED_ACTION_ID: index,
    })
  }

  const handleRemoveAction = (schedule) => {
    const index = schedule?.SCHED_ACTION_ID

    setFieldPath(`extra.ScheduleAction.${index}`)
    setModifiedFields({ __flag__: 'DELETE' })

    const updatedScheduleActions = scheduleActions
      .filter(({ id }) => id !== schedule?.id)
      .map(({ id, ...item }, scheduleIndex) =>
        mapNameFunction(item, scheduleIndex)
      )

    replace(updatedScheduleActions)
    notifyScheduleActionSuccess(
      T.SuccessVMTemplateScheduleActionDeleted,
      schedule
    )
  }

  const getScheduleFormConfig = (schedule) => ({
    initialValues: cleanScheduleActionFormValues(schedule),
    stepProps: { oneConfig, adminGroup },
  })

  const openCreateScheduleActionForm = () => {
    setFieldPath(`extra.ScheduleAction.${scheduleActions.length}`)

    showModal({
      name: T.ScheduleAction,
      dialogProps: {
        ...SCHED_ACTION_FORM_DIALOG_PROPS,
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
      },
      form: VirtualMachine.Forms.CreateRelativeSchedActionForm(
        getScheduleFormConfig()
      ),
      onSubmit: handleCreateAction,
    })
  }

  const openCreateCharterForm = () =>
    showModal({
      name: T.Charter,
      dialogProps: {
        ...SCHED_ACTION_FORM_DIALOG_PROPS,
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions-charter',
      },
      form: VirtualMachine.Forms.CreateRelativeCharterForm({
        initialValues: leases,
        stepProps: leases,
      }),
      onSubmit: handleCreateCharter,
    })

  const openEditScheduleActionForm = (schedule) => {
    setFieldPath(`extra.ScheduleAction.${schedule?.SCHED_ACTION_ID}`)

    showModal({
      name: T.UpdateScheduleAction,
      dialogProps: {
        ...SCHED_ACTION_FORM_DIALOG_PROPS,
        title: `${T.Edit}: ${getScheduleActionName(schedule)}`,
        dataCy: 'modal-sched-actions',
      },
      form: VirtualMachine.Forms.CreateRelativeSchedActionForm(
        getScheduleFormConfig(schedule)
      ),
      onSubmit: handleUpdateAction(schedule?.SCHED_ACTION_ID),
    })
  }

  const openDeleteScheduleActionConfirm = (schedule) =>
    showModal({
      id: `vm-template-schedule-action-delete-${schedule?.SCHED_ACTION_ID}`,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DeleteScheduleAction.replace(
          '%s',
          getScheduleActionName(schedule)
        )}`,
        dataCy: 'modal-delete-sched-action',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{
              ID: schedule?.SCHED_ACTION_ID,
              NAME: getScheduleActionResourceName(schedule),
            }}
            resourceType={T.ScheduleAction}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemoveAction(schedule),
    })

  const getScheduleActionActions = (schedule) => {
    const disableDelete =
      !adminGroup &&
      hasRestrictedAttributes(schedule, TAB_ID, oneConfig?.VM_RESTRICTED_ATTR)

    return [
      {
        title: T.Edit,
        tooltip: T.Edit,
        dataCy: `sched-update-${schedule?.SCHED_ACTION_ID}`,
        onClick: () => openEditScheduleActionForm(schedule),
      },
      {
        title: T.Delete,
        dataCy: `sched-delete-${schedule?.SCHED_ACTION_ID}`,
        isDestructive: true,
        tooltip: disableDelete ? T.DetachRestricted : T.Delete,
        isDisabled: disableDelete,
        onClick: () => openDeleteScheduleActionConfirm(schedule),
      },
    ]
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1em',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5em',
        }}
      >
        <Button
          data-cy={VM_ACTIONS.SCHED_ACTION_CREATE}
          startIcon={<Plus />}
          title={T.AddAction}
          type={STYLE_BUTTONS.TYPE.SECONDARY}
          onClick={openCreateScheduleActionForm}
        />
        <Button
          data-cy={VM_ACTIONS.CHARTER_CREATE}
          iconOnly={<Clock />}
          isDisabled={leases.length <= 0}
          title={T.Charter}
          type={STYLE_BUTTONS.TYPE.TRANSPARENT}
          onClick={openCreateCharterForm}
        />
      </Box>
      {cardScheduleActions.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: '1em',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          {cardScheduleActions.map((schedule) => (
            <VmTemplateScheduleActionCard
              key={schedule.id}
              actions={getScheduleActionActions(schedule)}
              schedule={schedule}
            />
          ))}
        </Box>
      ) : (
        <EmptyContent
          actionLabel={T.AddAction}
          description={T.ScheduleActionsWillAppearHere}
          icon={ActionIcon}
          title={T.NoScheduleActions}
          onAction={openCreateScheduleActionForm}
        />
      )}
    </Box>
  )
}

ScheduleAction.propTypes = {
  adminGroup: PropTypes.bool,
  oneConfig: PropTypes.object,
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
