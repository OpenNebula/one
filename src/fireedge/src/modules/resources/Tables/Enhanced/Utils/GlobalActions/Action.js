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
// eslint-disable-next-line no-unused-vars
import { ReactElement, memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { Row } from 'opennebula-react-table'
import { Action } from '@modules/resources/Cards/SelectCard'
import { SubmitButton } from '@ComponentsV2Module'
// eslint-disable-next-line no-unused-vars
import { CreateFormCallback, CreateStepsCallback } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
// eslint-disable-next-line no-unused-vars
import { DialogProps } from '@modules/resources/Dialogs'

import { Menu, MenuItem } from '@mui/material'
import { useModalsApi } from '@FeaturesModule'
import { v4 as uuidv4 } from 'uuid'

/**
 * @typedef {object} Option
 * @property {string} name - Label of option
 * @property {DialogProps} [dialogProps] - Dialog properties
 * @property {ReactElement} [icon] - Icon
 * @property {boolean} [isConfirmDialog] - If `true`, the form will be a dialog with confirmation buttons
 * @property {boolean|function(Row[]):boolean} [disabled] - If `true`, option will be disabled
 * @property {function(object, Row[])} onSubmit - Function to handle after finish the form
 * @property {function(Row[]):(CreateStepsCallback|CreateFormCallback)} form - Form
 */

/**
 * @typedef {object} GlobalAction
 * @property {string} accessor - Accessor action (id)
 * @property {string} [tooltip] - Tooltip
 * @property {string} [label] - Label
 * @property {string} [color] - Color
 * @property {string} [icon] - Icon
 * @property {'text'|'outlined'|'contained'} [variant] - Button variant
 * @property {Option[]} [options] - Group of actions
 * @property {function(Row[])} [action] - Singular action without form
 * @property {boolean|{min: number, max: number}} [selected] - If `true`, the action is always active. If it is an object, it contains the conditions for selected rows
 * @property {boolean|function(Row[]):boolean} [disabled] - If `true`, action will be disabled
 * @property {function(Row[]):object} [useQuery] - Function to get rtk query result
 */

const ActionItem = memo(({ item, selectedRows, onSelectedRowsChange }) => {
  const { translate } = useTranslation()
  /** @type {GlobalAction} */
  const {
    accessor,
    dataCy,
    tooltip,
    label,
    color,
    variant = 'primary',
    startIcon,
    endIcon,
    iconOnly,
    options = [],
    action,
    disabled,
    useQuery,
    selected,
    sx,
    size,
    type,
  } = item

  const modalId = useMemo(() => uuidv4(), [])
  const { showModal } = useModalsApi()

  const [menuAnchor, setMenuAnchor] = useState(null)
  const menuOpen = Boolean(menuAnchor)

  const handleOpenMenu = (event) => setMenuAnchor(event.currentTarget)
  const handleCloseMenu = () => setMenuAnchor(null)

  const handleOpenForm = (option) => {
    const {
      form,
      accessor: optionAccessor,
      dialogProps = {},
      ...restOfOption
    } = option ?? {}

    return showModal({
      ...addRowsToEntries(restOfOption),
      id: modalId,
      form: form ? addRowsToFn(form) : undefined,
      cy: optionAccessor && `action-${optionAccessor}`,
      dialogProps: addRowsToEntries(dialogProps),
    })
  }

  const handleOnClick = (event, option) =>
    [].concat(options).flat().length > 1
      ? handleOpenMenu(event)
      : handleOpenForm(option)

  const isDisabledByNumberOfSelectedRows = useMemo(() => {
    const numberOfRowSelected = selectedRows.length
    const min = selected?.min ?? 1
    const max = selected?.max ?? Number.MAX_SAFE_INTEGER

    return (
      (selected === true && !numberOfRowSelected) ||
      (selected && (numberOfRowSelected < min || numberOfRowSelected > max))
    )
  }, [selectedRows.length, selected])

  const buttonProps = {
    color,
    variant,
    'data-cy':
      (dataCy && `action-${dataCy}`) ?? (accessor && `action-${accessor}`),
    disabled:
      isDisabledByNumberOfSelectedRows ||
      (typeof disabled === 'function' ? disabled(selectedRows) : disabled),
    startIcon: startIcon,
    endIcon: endIcon,
    iconOnly: iconOnly,
    label: label && translate(label),
    title: tooltip && translate(tooltip),
    sx,
    size,
    type,
  }

  const addRowsToFn = useCallback(
    (fn) => {
      const strippedRows = selectedRows?.map(({ id, original }) => ({
        id,
        original,
      })) // Removes react-table proxy props to avoid infinite recursion

      return typeof fn === 'function' ? fn(strippedRows) : fn
    },
    [selectedRows]
  )

  const addRowsToEntries = useCallback(
    (entries) =>
      Object.entries(entries).reduce(
        (res, [prop, value]) => ({ ...res, [prop]: addRowsToFn(value) }),
        {}
      ),
    [addRowsToFn]
  )

  const { refetch, isFetching } = addRowsToFn(useQuery?.() ?? {})

  return (
    <>
      {action ? (
        <Action {...buttonProps} handleClick={() => addRowsToFn(action)} />
      ) : useQuery ? (
        <SubmitButton
          {...buttonProps}
          isSubmitting={isFetching}
          onClick={refetch}
        />
      ) : (
        <SubmitButton
          {...buttonProps}
          onSelectedRowsChange={onSelectedRowsChange}
          onClick={(event) =>
            handleOnClick(event, [].concat(options)?.flat()?.[0])
          }
        />
      )}

      <Menu
        id={`${label}-table-menu`}
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleCloseMenu}
      >
        {options.map((option, oIdx) => {
          const { accessor: optionAccessor } = option ?? {}

          return (
            <MenuItem
              key={oIdx}
              onClick={() => handleOpenForm(option)}
              {...(optionAccessor && { 'data-cy': `action-${optionAccessor}` })}
            >
              {option?.name ?? option?.label ?? option?.title ?? oIdx}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
})

ActionItem.propTypes = {
  item: PropTypes.object,
  selectedRows: PropTypes.array,
  onSelectedRowsChange: PropTypes.func,
}

ActionItem.displayName = 'ActionItem'

export { ActionItem as Action }
