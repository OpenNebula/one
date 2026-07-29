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
import { forwardRef, Component, isValidElement, useMemo, useState } from 'react'
import { T } from '@ConstantsModule'
import { Table } from '@modules/componentsv2/primitives/Tables/Default'
import { Box } from '@mui/material'
import { Cancel, Check, Copy, EditPencil, Trash, Plus } from 'iconoir-react'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { ToggleGroup } from '@modules/componentsv2/primitives/Buttons/Toggle/Group'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import {
  ACTION_GROUP_STYLES,
  ACTION_STYLES,
  ADD_BUTTON_STYLES,
  CONFIRM_ACTION_STYLES,
  DESTRUCTIVE_ACTION_STYLES,
  EDIT_CONTAINER_STYLES,
  EDIT_INPUT_STYLES,
  getFooterStyles,
  getKeyStyles,
  getTableStyles,
  HIDDEN_ACTION_GROUP_STYLES,
  VALUE_CONTAINER_STYLES,
  VALUE_TEXT_STYLES,
} from '@modules/componentsv2/composed/Panels/Attributes/styles'
import { useClipboard } from '@HooksModule'
import { useModalsApi } from '@FeaturesModule'

const EMPTY_VALUE = '-'
const DEFAULT_EMPTY_CONTENT_PROPS = {
  size: 'small',
  title: T.NoAttributes,
  subtitle: T.NoAttributesDescription,
}

const isNestedValue = (value) =>
  value !== null && typeof value === 'object' && !isValidElement(value)

const getRawValue = ({ rawValue, value } = {}) =>
  rawValue === undefined ? value : rawValue

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') return EMPTY_VALUE

  return isNestedValue(value) ? JSON.stringify(value) : String(value)
}

const formatEditValue = (value) => {
  if (value === undefined || value === null) return ''

  return isNestedValue(value) ? JSON.stringify(value) : String(value)
}

const getAttributeRows = (attributes = []) => {
  const sourceAttributes = Array.isArray(attributes)
    ? attributes
    : Object.entries(attributes ?? {}).map(([key, value]) => ({ key, value }))

  const rows = []

  const addAttributeRows = (
    attribute = {},
    parentPath = '',
    depth = 0,
    originalIndex = 0
  ) => {
    const key = attribute.key ?? attribute.name

    if (!key) return

    const value = getRawValue(attribute)
    const path = attribute.path ?? [parentPath, key].filter(Boolean).join('.')
    const isParent = isNestedValue(value)
    const rowDepth = attribute.depth ?? depth

    rows.push({
      ...attribute,
      key,
      path,
      value,
      isParent,
      depth: rowDepth,
      originalIndex,
      displayValue: isParent ? '' : formatValue(value),
    })

    isParent &&
      Object.entries(value).forEach(([childKey, childValue]) =>
        addAttributeRows(
          { key: childKey, value: childValue },
          path,
          rowDepth + 1,
          originalIndex
        )
      )
  }

  sourceAttributes.forEach((attribute, index) =>
    addAttributeRows(
      attribute,
      '',
      attribute?.depth ?? 0,
      attribute?.originalIndex ?? index
    )
  )

  return rows
}

/**
 * Editable value cell.
 *
 * @param {object} props - Props
 * @param {object} props.attribute - Attribute row
 * @param {Function} props.onAccept - Called with the edited value
 * @param {Function} props.onCancel - Called to exit edit mode
 * @returns {Component} Editable cell
 */
const EditableValueCell = ({ attribute, onAccept, onCancel }) => {
  const [value, setValue] = useState(() => formatEditValue(attribute?.value))

  return (
    <Box sx={EDIT_CONTAINER_STYLES}>
      <Box sx={EDIT_INPUT_STYLES}>
        <InputField
          value={value}
          onChange={setValue}
          inputProps={{ 'aria-label': attribute?.path }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onAccept(value)
            if (event.key === 'Escape') onCancel()
          }}
        />
      </Box>
      <ToggleGroup
        size="small"
        isOutlined={false}
        isSelectable={false}
        sx={ACTION_GROUP_STYLES}
        options={[
          [
            {
              startIcon: <Check width="16px" height="16px" />,
              onClick: () => onAccept(value),
              tooltip: T.Accept,
              value: 'accept',
              sx: CONFIRM_ACTION_STYLES,
            },
            {
              startIcon: <Cancel width="16px" height="16px" />,
              onClick: onCancel,
              tooltip: T.Cancel,
              value: 'cancel',
              sx: CONFIRM_ACTION_STYLES,
            },
          ],
        ]}
      />
    </Box>
  )
}

EditableValueCell.propTypes = {
  attribute: PropTypes.object,
  onAccept: PropTypes.func,
  onCancel: PropTypes.func,
}

/**
 * Displays an editable key/value attributes table.
 *
 * @returns {Component} Attributes panel
 */
export const AttributesPanel = forwardRef(
  (
    {
      actions,
      title,
      attributes = [],
      handleAdd,
      handleEdit,
      handleDelete,
      isDisabled = false,
      size = 'medium',
      isLoading = false,
      isFullHeight = true,
      enableEdit = () => true,
      emptyContentProps,
      dataCy,
    },
    ref
  ) => {
    const { showModal } = useModalsApi()
    const { copy, isCopied } = useClipboard()
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [editingPath, setEditingPath] = useState('')

    const attributeRows = useMemo(
      () => getAttributeRows(attributes),
      [attributes]
    )
    const isEmpty = !isLoading && attributeRows.length === 0
    const mergedEmptyContentProps = useMemo(
      () => ({ ...DEFAULT_EMPTY_CONTENT_PROPS, ...emptyContentProps }),
      [emptyContentProps]
    )

    const handleReset = () => {
      setNewKey('')
      setNewValue('')
    }

    const handleAcceptEdit = async (attribute, value) => {
      if (!attribute?.path) return

      await handleEdit?.({
        key: attribute.path,
        path: attribute.path,
        value,
        row: attribute,
      })
      setEditingPath('')
    }

    const canUseAction = (attribute, action) => {
      if (actions?.[action] !== true) return false

      if (action === 'edit') {
        return (
          !!handleEdit &&
          !attribute?.isParent &&
          enableEdit(attribute?.key, attribute)
        )
      }

      if (action === 'delete') {
        return !!handleDelete && (!attribute?.depth || handleDelete.length > 1)
      }

      return true
    }

    const handleOpenDeleteForm = (attribute) =>
      showModal({
        isConfirmDialog: true,
        dialogProps: {
          title: `${T.Delete} ${T.Attribute}`,
          description: T['attribute.delete.confirmation'],
        },
        onSubmit: async () => {
          await handleDelete(attribute?.originalIndex, attribute)
        },
      })

    const getActionOptions = (attribute) => {
      const copyValue = `"${attribute?.path}": "${formatValue(
        attribute?.value
      )}"`

      return [
        {
          startIcon: <Copy width="16px" height="16px" />,
          onClick: () => copy(copyValue),
          value: 'copy',
          tooltip: !isCopied(copyValue) ? T.Copy : T.Copied,
          sx: ACTION_STYLES,
        },
        {
          startIcon: <EditPencil width="16px" height="16px" />,
          onClick: () => setEditingPath(attribute?.path),
          tooltip: T.Edit,
          value: 'edit',
          sx: ACTION_STYLES,
        },
        {
          startIcon: <Trash width="16px" height="16px" />,
          onClick: () => handleOpenDeleteForm(attribute),
          tooltip: T.Delete,
          value: 'delete',
          sx: DESTRUCTIVE_ACTION_STYLES,
        },
      ].filter(({ value }) => canUseAction(attribute, value))
    }

    const columns = useMemo(
      () => [
        {
          accessorKey: 'key',
          header: '',
          width: '40%',
          cell: ({ row }) => (
            <Box component="span" sx={getKeyStyles(row?.original)}>
              {row?.original?.key}
            </Box>
          ),
        },
        {
          id: 'value',
          header: '',
          width: '60%',
          cell: ({ row }) => {
            const attribute = row?.original

            if (editingPath === attribute?.path) {
              return (
                <EditableValueCell
                  attribute={attribute}
                  onAccept={(value) => handleAcceptEdit(attribute, value)}
                  onCancel={() => setEditingPath('')}
                />
              )
            }

            const actionOptions = getActionOptions(attribute)

            return (
              <Box sx={VALUE_CONTAINER_STYLES}>
                <Tooltip title={attribute?.displayValue} followCursor>
                  <Box component="span" sx={VALUE_TEXT_STYLES}>
                    {attribute?.displayValue}
                  </Box>
                </Tooltip>
                {actionOptions?.length > 0 && (
                  <ToggleGroup
                    size="small"
                    isOutlined={false}
                    isSelectable={false}
                    sx={HIDDEN_ACTION_GROUP_STYLES}
                    options={[actionOptions]}
                  />
                )}
              </Box>
            )
          },
        },
      ],
      [editingPath, handleEdit, handleDelete, actions, enableEdit]
    )

    return (
      <Table
        ref={ref}
        title={title}
        data={attributeRows}
        columns={columns}
        size={size}
        dataCy={dataCy}
        sx={getTableStyles({ isEmpty })}
        isDisabled={isDisabled}
        isDisablePagination={false}
        emptyContentProps={mergedEmptyContentProps}
        topRow={
          actions?.add === true &&
          handleAdd && (
            <Box sx={(theme) => getFooterStyles({ theme })}>
              <InputField
                placeholder={T.Key}
                value={newKey}
                onChange={(key) => setNewKey(key)}
                inputProps={{ 'data-cy': dataCy && `${dataCy}-key` }}
              />
              <InputField
                placeholder={T.Value}
                value={newValue}
                onChange={(value) => setNewValue(value)}
                inputProps={{ 'data-cy': dataCy && `${dataCy}-value` }}
              />
              <Button
                size="medium"
                type="primary"
                onClick={() => {
                  if (!newKey) return
                  handleAdd?.({ key: newKey, value: newValue })
                  handleReset()
                }}
                iconOnly={<Plus width={'24px'} height={'24px'} />}
                isDisabled={!newKey}
                data-cy={dataCy && `${dataCy}-add`}
                sx={ADD_BUTTON_STYLES}
              />
            </Box>
          )
        }
        isFullHeight={isFullHeight && !isEmpty}
        isLoading={isLoading}
      />
    )
  }
)

AttributesPanel.propTypes = {
  actions: PropTypes.object,
  title: PropTypes.string,
  attributes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  handleAdd: PropTypes.func,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  isDisabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  isLoading: PropTypes.bool,
  isFullHeight: PropTypes.bool,
  enableEdit: PropTypes.func,
  emptyContentProps: PropTypes.object,
  dataCy: PropTypes.string,
}

AttributesPanel.displayName = 'AttributesPanel'
