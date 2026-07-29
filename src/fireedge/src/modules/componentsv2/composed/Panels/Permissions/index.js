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
import { forwardRef, Component } from 'react'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons/Checkbox'
import { T, ACTIONS } from '@ConstantsModule'
import { stringToBoolean } from '@UtilsModule'
import { Table } from '@modules/componentsv2/primitives/Tables'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { Box } from '@mui/material'

const PERMISSION_TOOLTIPS = {
  ownerUse: { title: T.OwnerUseTitle, desc: T.OwnerUseDesc },
  ownerManage: { title: T.OwnerManageTitle, desc: T.OwnerManageDesc },
  ownerAdmin: { title: T.OwnerAdminTitle, desc: T.OwnerAdminDesc },
  groupUse: { title: T.GroupUseTitle, desc: T.GroupUseDesc },
  groupManage: { title: T.GroupManageTitle, desc: T.GroupManageDesc },
  groupAdmin: { title: T.GroupAdminTitle, desc: T.GroupAdminDesc },
  otherUse: { title: T.OtherUseTitle, desc: T.OtherUseDesc },
  otherManage: { title: T.OtherManageTitle, desc: T.OtherManageDesc },
  otherAdmin: { title: T.OtherAdminTitle, desc: T.OtherAdminDesc },
}

/**
 * Displays a permissions table with toggleable Use/Manage/Admin checkboxes per ownership category.
 *
 * @param {object} props - Component props
 * @param {string} [props.title] - Table title
 * @param {Function} [props.handleEdit] - Callback fired with `{ [permissionKey]: '0' | '1' }` on change
 * @param {object} [props.actions] - Available actions; include `ACTIONS.CHANGE_MODE` to enable editing
 * @param {object} [props.options] - Current permission values keyed by camelCase name (e.g. `ownerUse`)
 * @param {'small'|'medium'|'large'} [props.size] - Table size variant
 * @param {boolean} [props.isDisabled] - Checkboxes disabled
 * @param {object} ref - Forwarded ref
 * @returns {Component} Permissions table
 */
export const PermissionsTab = forwardRef(
  (
    {
      title,
      handleEdit,
      actions,
      options = {},
      size = 'medium',
      isDisabled = false,
    },
    ref
  ) => {
    const canEdit = actions?.[ACTIONS.CHANGE_MODE]
    const handleChange = async (key, currentValue) => {
      await handleEdit?.({
        [key]: stringToBoolean(currentValue) ? '0' : '1',
      })
    }
    const data = [
      { label: T.Owner, prefix: 'owner' },
      { label: T.Group, prefix: 'group' },
      { label: T.Other, prefix: 'other' },
    ]
    const columns = [
      { accessorKey: 'label', header: '' },
      ...['Use', 'Manage', 'Admin'].map((type) => ({
        accessorKey: type.toLowerCase(),
        header: T[type],
        cell: ({ row }) => {
          const key = `${row.original.prefix}${type}`
          const value = options?.[key]
          const checked = value === null ? null : stringToBoolean(value)
          const { title: tooltipTitle, desc } = PERMISSION_TOOLTIPS[key]

          return (
            <Tooltip
              title={
                <Box sx={{ maxWidth: 220 }}>
                  <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>{tooltipTitle}</Box>
                  {desc}
                </Box>
              }
              placement="top"
            >
              <Checkbox
                size="medium"
                inputProps={{ 'data-cy': `permission-${key}` }}
                checked={checked}
                onChange={() => canEdit && handleChange(key, options?.[key])}
                isDisabled={!canEdit || isDisabled}
              />
            </Tooltip>
          )
        },
      })),
    ]

    return (
      <Table
        title={title}
        ref={ref}
        data={data}
        columns={columns}
        size={size}
        isDisabled={isDisabled}
        isDisablePagination
      />
    )
  }
)

PermissionsTab.propTypes = {
  title: PropTypes.string,
  handleEdit: PropTypes.func,
  actions: PropTypes.object,
  options: PropTypes.shape({
    ownerUse: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    ownerManage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    ownerAdmin: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    groupUse: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    groupManage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    groupAdmin: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    otherUse: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    otherManage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    otherAdmin: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
  }),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  isDisabled: PropTypes.bool,
}

PermissionsTab.displayName = 'PermissionsTab'
