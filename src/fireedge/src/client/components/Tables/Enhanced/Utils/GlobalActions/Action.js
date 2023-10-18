/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo, useCallback, useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { Row } from 'react-table'

import QueryButton from 'client/components/Buttons/QueryButton'
import { Action } from 'client/components/Cards/SelectCard'
import { ButtonToTriggerForm } from 'client/components/Forms'
import { Tr } from 'client/components/HOC'
// eslint-disable-next-line no-unused-vars
import { DialogProps } from 'client/components/Dialogs'
// eslint-disable-next-line no-unused-vars
import { CreateFormCallback, CreateStepsCallback } from 'client/utils'

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
  /** @type {GlobalAction} */
  const {
    accessor,
    dataCy,
    tooltip,
    label,
    color,
    variant = 'contained',
    icon: Icon,
    options,
    action,
    disabled,
    useQuery,
    selected,
  } = item

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
    icon: Icon && <Icon />,
    label: label && Tr(label),
    title: tooltip && Tr(tooltip),
  }

  const addRowsToFn = useCallback(
    (fn) => (typeof fn === 'function' ? fn(selectedRows) : fn),
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

  return action ? (
    <Action {...buttonProps} handleClick={() => addRowsToFn(action)} />
  ) : useQuery ? (
    <QueryButton {...buttonProps} useQuery={() => addRowsToFn(useQuery)} />
  ) : (
    <ButtonToTriggerForm
      buttonProps={buttonProps}
      actionAccessor={accessor}
      onSelectedRowsChange={onSelectedRowsChange}
      options={options?.map((option) => {
        const {
          form,
          accessor: optionAccessor,
          dialogProps = {},
          ...restOfOption
        } = option ?? {}

        return {
          ...addRowsToEntries(restOfOption),
          form: form ? () => addRowsToFn(form) : undefined,
          cy: optionAccessor && `action-${optionAccessor}`,
          dialogProps: addRowsToEntries(dialogProps),
        }
      })}
    />
  )
})

ActionItem.propTypes = {
  item: PropTypes.object,
  selectedRows: PropTypes.array,
  onSelectedRowsChange: PropTypes.func,
}

ActionItem.displayName = 'ActionItem'

export { ActionItem as Action }
