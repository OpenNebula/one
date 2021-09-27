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
/* eslint-disable jsdoc/require-jsdoc */
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  ListItemIcon
} from '@material-ui/core'
import { NavArrowDown } from 'iconoir-react'

import { useDialog } from 'client/hooks'
import { DialogConfirmation, DialogForm, DialogPropTypes } from 'client/components/Dialogs'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import SubmitButton, { SubmitButtonPropTypes } from 'client/components/FormControl/SubmitButton'
import FormStepper from 'client/components/FormStepper'
import { Translate } from 'client/components/HOC'

const ButtonToTriggerForm = ({
  buttonProps = {},
  options = []
}) => {
  const buttonId = buttonProps['data-cy'] ?? 'main-button-form'
  const isGroupButton = options.length > 1

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const { display, show, hide, values: Form } = useDialog()
  const { onSubmit: handleSubmit, form, isConfirmDialog = false, dialogProps = {} } = Form ?? {}

  const formConfig = useMemo(() => form?.() ?? {}, [form])
  const { steps, defaultValues, resolver, fields, transformBeforeSubmit } = formConfig

  const handleTriggerSubmit = async formData => {
    try {
      const data = transformBeforeSubmit?.(formData) ?? formData
      await handleSubmit?.(data)
    } finally {
      hide()
    }
  }

  const openDialogForm = formParams => {
    show(formParams)
    handleClose()
  }

  const handleToggle = evt => setAnchorEl(prev => prev ? null : evt.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <SubmitButton
        aria-describedby={buttonId}
        disabled={!options.length}
        endicon={isGroupButton ? <NavArrowDown /> : undefined}
        onClick={evt => !isGroupButton
          ? openDialogForm(options[0])
          : handleToggle(evt)
        }
        {...buttonProps}
      />

      {isGroupButton && (
        <Popper
          anchorEl={anchorEl}
          disablePortal
          id={buttonId}
          open={open}
          transition
          style={{ zIndex: 2 }}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} >
              <Paper variant='outlined'>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList variant='menu' disablePadding dense>
                    {options.map(({ cy, disabled, icon: Icon, name, ...option }) => (
                      <MenuItem
                        key={name}
                        disabled={disabled}
                        data-cy={cy}
                        onClick={() => openDialogForm(option)}
                      >
                        {Icon && (
                          <ListItemIcon>
                            <Icon size={18} />
                          </ListItemIcon>
                        )}
                        <Translate word={name} />
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}

      {display && (
        isConfirmDialog ? (
          <DialogConfirmation
            handleAccept={handleTriggerSubmit}
            handleCancel={hide}
            {...dialogProps}
          />
        ) : (
          <DialogForm
            resolver={resolver}
            values={defaultValues}
            handleSubmit={!steps ? handleTriggerSubmit : undefined}
            dialogProps={{ handleCancel: hide, ...dialogProps }}
          >
            {steps ? (
              <FormStepper
                steps={steps}
                schema={resolver}
                onSubmit={handleTriggerSubmit}
              />
            ) : (
              <FormWithSchema cy='form-dg' fields={fields} />
            )}
          </DialogForm>
        )
      )}
    </>
  )
}

export const ButtonToTriggerFormPropTypes = {
  buttonProps: PropTypes.shape(SubmitButtonPropTypes),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      cy: PropTypes.string,
      isConfirmDialog: PropTypes.bool,
      dialogProps: PropTypes.shape(DialogPropTypes),
      name: PropTypes.string,
      icon: PropTypes.any,
      form: PropTypes.func,
      onSubmit: PropTypes.func
    })
  )
}

ButtonToTriggerForm.propTypes = ButtonToTriggerFormPropTypes

ButtonToTriggerForm.displayName = 'ButtonToTriggerForm'

export default ButtonToTriggerForm
