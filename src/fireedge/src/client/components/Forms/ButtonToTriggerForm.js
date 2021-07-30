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
import * as React from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList
} from '@material-ui/core'
import { NavArrowDown } from 'iconoir-react'

import { useDialog } from 'client/hooks'
import { DialogForm } from 'client/components/Dialogs'
import { FormWithSchema } from 'client/components/Forms'
import FormStepper from 'client/components/FormStepper'
import { Translate } from 'client/components/HOC'

const ButtonToTriggerForm = ({ buttonProps = {}, title, options = [] }) => {
  const isGroupButton = options.length > 1

  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)

  const { display, show, hide, values: Form } = useDialog()
  const { steps, defaultValues, resolver, fields, onSubmit: handleSubmit } = Form ?? {}

  const handleTriggerSubmit = async formData => {
    await handleSubmit(formData)
    hide()
  }

  const openDialogForm = form => {
    show(form)
    handleClose()
  }

  const handleToggle = evt => setAnchorEl(prev => prev ? null : evt.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <Button
        color='secondary'
        size='small'
        variant='contained'
        aria-describedby={buttonProps.cy ?? 'main-button-form'}
        disabled={!options.length}
        endIcon={isGroupButton && <NavArrowDown />}
        onClick={evt =>
          !isGroupButton ? openDialogForm(options[0].form) : handleToggle(evt)
        }
        {...buttonProps}
      >
        <Translate word={title} />
      </Button>

      {isGroupButton && (
        <Popper
          open={open}
          anchorEl={anchorEl}
          id={buttonProps.cy ?? 'main-button-form'}
          transition
          disablePortal
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps}>
              <Paper variant='outlined'>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList disablePadding>
                    {options.map(({ cy, name, form = {}, onSubmit }) => (
                      <MenuItem
                        key={name}
                        data-cy={cy}
                        onClick={() => openDialogForm({ ...form, onSubmit })}
                      >
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
        <DialogForm
          resolver={resolver}
          values={defaultValues}
          handleSubmit={!steps ? handleTriggerSubmit : undefined}
          dialogProps={{ title, handleCancel: hide }}
        >
          {steps ? (
            <FormStepper steps={steps} schema={resolver} onSubmit={handleTriggerSubmit}/>
          ) : (
            <FormWithSchema cy='form-dg' fields={fields} />
          )}
        </DialogForm>
      )}
    </>
  )
}

ButtonToTriggerForm.propTypes = {
  buttonProps: PropTypes.object,
  title: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      cy: PropTypes.string,
      name: PropTypes.string,
      form: PropTypes.object
    })
  ),
  handleSubmit: PropTypes.func
}

ButtonToTriggerForm.displayName = 'VmStorageTab'

export default ButtonToTriggerForm
