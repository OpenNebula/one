/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import { Row } from 'react-table'

import { Action } from 'client/components/Cards/SelectCard'
import { ButtonToTriggerForm } from 'client/components/Forms'
import { Tr } from 'client/components/HOC'
// eslint-disable-next-line no-unused-vars
import { DialogPropTypes, DialogProps } from 'client/components/Dialogs'
// eslint-disable-next-line no-unused-vars
import { CreateStepsCallback, CreateFormCallback } from 'client/utils'

/**
 * @typedef {object} Option
 * @property {string} cy - Cypress selector
 * @property {string} name - Label of option
 * @property {JSXElementConstructor} [icon] - Icon
 * @property {boolean} isConfirmDialog
 * - If `true`, the form will be a dialog with confirmation buttons
 * @property {function(object, Row[])} onSubmit - Function to handle after finish the form
 * @property {function():CreateStepsCallback|CreateFormCallback} form - Form
 */

/**
 * @typedef {object} GlobalAction
 * @property {string} accessor - Accessor action (id)
 * @property {string} [tooltip] - Tooltip
 * @property {string} [label] - Label
 * @property {string} [color] - Color
 * @property {string} [icon] - Icon
 * @property {DialogProps} [dialogProps] - Dialog properties
 * @property {Option[]} [options] - Group of actions
 * @property {function(Row[])} [action] - Singular action without form
 * @property {boolean|{min: number, max: number}} [selected] - Condition for selected rows
 * @property {boolean} [disabled] - If `true`, action will be disabled
 */

/**
 * Render global action.
 *
 * @param {object} props - Props
 * @param {GlobalAction[]} props.item - Item action
 * @param {Row[]} props.selectedRows - Selected rows
 * @returns {JSXElementConstructor} Component JSX
 */
const ActionItem = memo(({ item, selectedRows }) => {
  const {
    accessor,
    tooltip,
    label,
    color,
    variant = 'contained',
    icon: Icon,
    options,
    action,
    disabled
  } = item

  const buttonProps = {
    color,
    variant,
    'data-cy': accessor && `action.${accessor}`,
    disabled: typeof disabled === 'function' ? disabled(selectedRows) : disabled,
    icon: Icon && <Icon />,
    label: label && Tr(label),
    title: tooltip && Tr(tooltip)
  }

  return action ? (
    <Action {...buttonProps} handleClick={() => action?.(selectedRows)} />
  ) : (
    <ButtonToTriggerForm
      buttonProps={buttonProps}
      options={options?.map(option => {
        const { accessor, form, onSubmit, dialogProps, disabled: optionDisabled } = option ?? {}
        const { description, subheader, title, children } = dialogProps ?? {}

        return {
          ...option,
          cy: accessor && `action.${accessor}`,
          disabled: typeof optionDisabled === 'function'
            ? optionDisabled(selectedRows)
            : optionDisabled,
          dialogProps: {
            ...dialogProps,
            description: typeof description === 'function' ? description(selectedRows) : description,
            subheader: typeof subheader === 'function' ? subheader(selectedRows) : subheader,
            title: typeof title === 'function' ? title(selectedRows) : title,
            children: typeof children === 'function' ? children(selectedRows) : children
          },
          form: form ? () => form(selectedRows) : undefined,
          onSubmit: data => onSubmit(data, selectedRows)
        }
      })}
    />
  )
}, (prev, next) => {
  const prevStates = prev.selectedRows?.map?.(({ values }) => values?.STATE)
  const nextStates = next.selectedRows?.map?.(({ values }) => values?.STATE)

  return (
    prev.selectedRows?.length === next.selectedRows?.length &&
    prevStates?.every(prevState => nextStates?.includes(prevState))
  )
})

export const ActionPropTypes = PropTypes.shape({
  accessor: PropTypes.string,
  variant: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  label: PropTypes.string,
  tooltip: PropTypes.string,
  icon: PropTypes.any,
  disabled: PropTypes.bool,
  selected: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    })
  ]),
  action: PropTypes.func,
  isConfirmDialog: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      accessor: PropTypes.string,
      name: PropTypes.string,
      icon: PropTypes.any,
      form: PropTypes.func,
      onSubmit: PropTypes.func,
      dialogProps: PropTypes.shape(DialogPropTypes)
    })
  )
})

ActionItem.propTypes = {
  item: ActionPropTypes,
  selectedRows: PropTypes.array
}

ActionItem.displayName = 'ActionItem'

export default ActionItem
