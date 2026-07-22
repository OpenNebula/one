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
import { Box, Stack } from '@mui/material'
import { useFieldArray } from 'react-hook-form'
import { array, object } from 'yup'

import {
  CreateRelativeCharterForm,
  CreateRelativeSchedActionForm,
} from '@modules/resources/resources/VirtualMachine/Forms'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'

import PropTypes from 'prop-types'
import {
  SERVER_CONFIG,
  STYLE_BUTTONS,
  T,
  TEMPLATE_SCHEDULE_TYPE_STRING,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { sentenceCase, timeFromMilliseconds } from '@UtilsModule'

import { Component, memo, useMemo } from 'react'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getTypeScheduleAction,
  isRelative,
} from '@ModelsModule'

import { useModalsApi, useSystemData } from '@FeaturesModule'
import { Clock, Edit, MoreVert, Plus, Trash } from 'iconoir-react'
import {
  CollapsiblePanel,
  MenuButton,
  ResourceActionConfirmation,
  SubmitButton,
  Table,
  Tag,
  Text,
} from '@ComponentsV2Module'

export const TAB_ID = 'SCHED_ACTION'
export const STEP_ID = 'charter'

const mapNameFunction = mapNameByIndex(TAB_ID)

export const SCHED_ACTION_SCHEMA = object({
  SCHED_ACTION: array()
    .ensure()
    .transform((actions) => actions.map(mapNameByIndex(TAB_ID))),
})

const renderText = (value, fallback = '-') =>
  Array.isArray(value)
    ? value.filter(Boolean).join(' ')
    : value === undefined || value === null || value === ''
    ? fallback
    : value

const getRelativeTimeValue = (value) => {
  const { time, period } = getPeriodicityByTimeInSeconds(value)

  return { time, period }
}

const renderScheduleTime = ({ TIME } = {}) => {
  if (!TIME) return { text: '-' }

  if (isRelative(TIME)) {
    return { relative: getRelativeTimeValue(TIME) }
  }

  return { text: timeFromMilliseconds(+TIME)?.toRelative?.() ?? `${TIME}` }
}

const renderScheduleWarning = ({ WARNING } = {}) => {
  if (!WARNING) return { text: '-' }

  if (isRelative(WARNING)) {
    return {
      relative: getRelativeTimeValue(`${WARNING}`.replace(/^[+-]/, '')),
    }
  }

  return {
    text: timeFromMilliseconds(+WARNING)?.toRelative?.() ?? `${WARNING}`,
  }
}

const ScheduleTimeCell = ({ getValue }) => {
  const value = getValue()

  if (value?.relative) {
    return (
      <Text
        component="span"
        value={`${value.relative.time} ${value.relative.period}`}
        variant={TEXT_VARIANTS.BODY_SMALL}
        weight={TEXT_WEIGHTS.REGULAR}
      />
    )
  }

  return value?.text ?? '-'
}

const CreateScheduleActionButton = memo(function CreateScheduleActionButton({
  onSubmit,
  oneConfig,
  adminGroup,
}) {
  const { showModal } = useModalsApi()

  const handleOpenForm = () =>
    showModal({
      id: 'instantiate-schedule-action-create',
      name: T.PunctualAction,
      dialogProps: {
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
      },
      onSubmit,
      form: CreateRelativeSchedActionForm({
        stepProps: { vm: {}, oneConfig, adminGroup },
      }),
    })

  return (
    <SubmitButton
      data-cy={VM_ACTIONS.SCHED_ACTION_CREATE}
      label={T.AddAction}
      type={STYLE_BUTTONS.TYPE.SECONDARY}
      startIcon={<Plus width="16px" height="16px" />}
      onClick={handleOpenForm}
    />
  )
})

const ScheduleActionMenu = memo(function ScheduleActionMenu({
  schedule,
  onUpdate,
  onRemove,
  oneConfig,
  adminGroup,
}) {
  const { showModal } = useModalsApi()
  const { ID, ACTION } = schedule
  const titleAction = `#${ID} ${sentenceCase(ACTION)}`

  const handleOpenForm = () =>
    showModal({
      id: `instantiate-schedule-action-update-${ID}`,
      dialogProps: {
        title: (
          <Text
            component="span"
            value={T.UpdateScheduleAction}
            values={[titleAction]}
            variant={TEXT_VARIANTS.H6}
            weight={TEXT_WEIGHTS.SEMIBOLD}
          />
        ),
        dataCy: 'modal-sched-actions',
      },
      onSubmit: onUpdate,
      form: CreateRelativeSchedActionForm({
        stepProps: { vm: {}, oneConfig, adminGroup },
        initialValues: schedule,
      }),
    })

  const handleOpenConfirm = () =>
    showModal({
      id: `instantiate-schedule-action-delete-${ID}`,
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Text
            component="span"
            value={`${T.Delete} #${ID}`}
            variant={TEXT_VARIANTS.H6}
            weight={TEXT_WEIGHTS.SEMIBOLD}
          />
        ),
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID, NAME: sentenceCase(ACTION) }}
            resourceType={T.ScheduleAction}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: onRemove,
    })

  const options = [
    {
      'data-cy': `${VM_ACTIONS.SCHED_ACTION_UPDATE}-${ID}`,
      title: (
        <Text
          component="span"
          value={T.Edit}
          variant={TEXT_VARIANTS.BODY_SMALL}
          weight={TEXT_WEIGHTS.MEDIUM}
        />
      ),
      startIcon: <Edit width="16px" height="16px" />,
      onClick: handleOpenForm,
    },
    {
      'data-cy': `${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`,
      title: (
        <Text
          component="span"
          value={T.Delete}
          variant={TEXT_VARIANTS.BODY_SMALL}
          weight={TEXT_WEIGHTS.MEDIUM}
        />
      ),
      startIcon: <Trash width="16px" height="16px" />,
      onClick: handleOpenConfirm,
    },
  ]

  return (
    <MenuButton
      iconOnly={<MoreVert width="16px" height="16px" />}
      options={[options]}
    />
  )
})

const CreateCharterButton = memo(function CreateCharterButton({ onSubmit }) {
  const { showModal } = useModalsApi()

  const leases = useMemo(
    () =>
      Object.entries(SERVER_CONFIG?.leases ?? {}).filter(([action]) =>
        VM_ACTIONS_IN_CHARTER.includes(action)
      ),
    []
  )

  const handleOpenForm = () =>
    showModal({
      id: 'instantiate-charter-create',
      dialogProps: {
        title: T.ScheduleAction,
        dataCy: 'modal-sched-actions',
      },
      onSubmit,
      form: CreateRelativeCharterForm({
        stepProps: leases,
        initialValues: leases,
      }),
    })

  return (
    <SubmitButton
      data-cy={VM_ACTIONS.CHARTER_CREATE}
      iconOnly={<Clock width="16px" height="16px" />}
      tooltip={
        <Text
          component="span"
          value={T.Charter}
          variant={TEXT_VARIANTS.BODY_SMALL}
          weight={TEXT_WEIGHTS.REGULAR}
        />
      }
      isDisabled={leases.length <= 0}
      type={STYLE_BUTTONS.TYPE.SECONDARY}
      onClick={handleOpenForm}
    />
  )
})

const getScheduleActionColumns = ({
  handleUpdate,
  handleRemove,
  oneConfig,
  adminGroup,
}) => [
  {
    header: T.ID,
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T.Type,
    id: 'type',
    accessorFn: (row) =>
      TEMPLATE_SCHEDULE_TYPE_STRING?.[getTypeScheduleAction(row)],
    cell: ({ getValue }) => <Tag title={getValue() ?? '-'} status="default" />,
  },
  {
    header: T.Action,
    accessorKey: 'ACTION',
    cell: ({ getValue }) => (
      <Text
        component="span"
        value={sentenceCase(getValue())}
        variant={TEXT_VARIANTS.BODY_SMALL}
        weight={TEXT_WEIGHTS.REGULAR}
      />
    ),
  },
  {
    header: T.Repeat,
    id: 'repeat',
    accessorFn: (row) => renderText(getRepeatInformation(row)?.repeat, T.Once),
  },
  {
    header: T.Warning,
    id: 'warning',
    accessorFn: renderScheduleWarning,
    cell: ScheduleTimeCell,
  },
  {
    header: T.Scheduled,
    id: 'scheduled',
    accessorFn: renderScheduleTime,
    grow: false,
    cell: ScheduleTimeCell,
  },
  {
    header: T.Ends,
    id: 'ends',
    accessorFn: (row) => renderText(getRepeatInformation(row)?.end),
    grow: false,
  },
  {
    header: '',
    id: 'actions',
    enableSorting: false,
    grow: false,
    cell: ({ row }) => {
      const { original } = row
      const { _index, _fieldId, ...schedule } = original

      return (
        <Stack direction="row" justifyContent="flex-end">
          <ScheduleActionMenu
            schedule={schedule}
            onUpdate={(newAction) => handleUpdate(newAction, _index)}
            onRemove={() => handleRemove(_index)}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        </Stack>
      )
    },
  },
]

/**
 * @param {object} props - Props
 * @param {object} props.oneConfig - OpenNebula configuration
 * @param {boolean} props.adminGroup - If user belongs to oneadmin group
 * @returns {Component} Schedule actions section
 */
const ScheduleActionsSection = ({ oneConfig, adminGroup }) => {
  const { oneConfig: systemOneConfig, adminGroup: systemAdminGroup } =
    useSystemData()

  const resolvedOneConfig = oneConfig ?? systemOneConfig
  const resolvedAdminGroup = adminGroup ?? systemAdminGroup

  const {
    fields: scheduleActions,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${STEP_ID}.${TAB_ID}`,
    keyName: '_fieldId',
  })

  const scheduleActionRows = useMemo(
    () =>
      scheduleActions?.map((schedule, index) => ({
        ...schedule,
        ID: index,
        _index: index,
      })) ?? [],
    [scheduleActions]
  )

  const handleCreateAction = (action) => {
    append(mapNameFunction(action, scheduleActions.length))
  }

  const handleCreateCharter = (actions) => {
    const mappedActions = actions?.map((action, idx) =>
      mapNameFunction(action, scheduleActions.length + idx)
    )

    append(mappedActions)
  }

  const handleUpdate = (action, index) => {
    update(index, mapNameFunction(action, index))
  }

  const handleRemove = (index) => {
    remove(index)
  }

  const columns = useMemo(
    () =>
      getScheduleActionColumns({
        handleUpdate,
        handleRemove,
        oneConfig: resolvedOneConfig,
        adminGroup: resolvedAdminGroup,
      }),
    [resolvedOneConfig, resolvedAdminGroup, scheduleActions]
  )

  return (
    <Box mt={2}>
      <CollapsiblePanel
        title={T.AddChartes}
        tag={scheduleActionRows.length}
        isDefaultCollapsed={false}
      >
        <Stack flexDirection="row" gap={1} mb={2}>
          <CreateScheduleActionButton
            onSubmit={handleCreateAction}
            oneConfig={resolvedOneConfig}
            adminGroup={resolvedAdminGroup}
          />
          <CreateCharterButton onSubmit={handleCreateCharter} />
        </Stack>

        <Table
          columns={columns}
          data={scheduleActionRows}
          getRowId={(row) => row._fieldId ?? `${row._index}`}
          isDisablePagination
          isRowsSelectable={false}
          onRowClick={() => undefined}
        />
      </CollapsiblePanel>
    </Box>
  )
}

ScheduleActionsSection.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

CreateScheduleActionButton.propTypes = {
  onSubmit: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

ScheduleActionMenu.propTypes = {
  schedule: PropTypes.object,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

CreateCharterButton.propTypes = {
  onSubmit: PropTypes.func,
}

ScheduleTimeCell.propTypes = {
  getValue: PropTypes.func,
}

/**
 * @returns {Component} Schedule actions content
 */
const Content = () => <ScheduleActionsSection />

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

/**
 * @returns {Component} Charters step
 */
const Charter = () => ({
  id: STEP_ID,
  label: T.Charter,
  resolver: SCHED_ACTION_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default Charter
