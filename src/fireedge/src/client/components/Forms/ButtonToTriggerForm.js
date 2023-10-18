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
/* eslint-disable jsdoc/require-jsdoc */
import { useState } from 'react'
import PropTypes from 'prop-types'

import { Grow, Menu, MenuItem, Typography, ListItemIcon } from '@mui/material'
import { NavArrowDown } from 'iconoir-react'

import { useDialog } from 'client/hooks'
import {
  DialogConfirmation,
  DialogForm,
  DialogPropTypes,
} from 'client/components/Dialogs'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import SubmitButton from 'client/components/FormControl/SubmitButton'
import FormStepper from 'client/components/FormStepper'
import { Translate } from 'client/components/HOC'
import { isDevelopment } from 'client/utils'

const ButtonToTriggerForm = ({
  buttonProps = {},
  options = [],
  actionAccessor = '',
  onSelectedRowsChange = () => {},
}) => {
  const buttonId = buttonProps['data-cy'] ?? 'main-button'
  const moreThanOneOption = options.length > 1

  const [anchorEl, setAnchorEl] = useState(() => null)
  const open = Boolean(anchorEl)

  const { display, show, hide, values: Form } = useDialog()
  const {
    onSubmit: handleSubmit,
    form: FormConfig,
    isConfirmDialog = false,
    dialogProps = {},
  } = Form ?? {}

  const openDialogForm = (formParams) => {
    const formConfig = formParams?.form?.()

    show({ ...formParams, form: formConfig })
    handleClose()
  }

  const handleToggle = (evt) => setAnchorEl(evt.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleTriggerSubmit = async (formData) => {
    try {
      await handleSubmit?.(formData)
      actionAccessor === 'delete' && onSelectedRowsChange([]) // dereference the deleted rows from the container view
    } catch (error) {
      isDevelopment() && console.error(error)
    } finally {
      hide()
    }
  }

  return (
    <>
      <SubmitButton
        id={buttonId}
        aria-describedby={buttonId}
        aria-controls={open ? `${buttonId}-button` : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup={moreThanOneOption ? 'true' : false}
        disabled={!options.length}
        endicon={moreThanOneOption ? <NavArrowDown /> : undefined}
        onClick={(evt) =>
          moreThanOneOption ? handleToggle(evt) : openDialogForm(options[0])
        }
        {...buttonProps}
      />

      {moreThanOneOption && !buttonProps.disabled && (
        <Menu
          id={`${buttonId}-menu`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Grow}
          sx={{ zIndex: 2 }}
        >
          {options.map(({ cy, disabled, icon: Icon, name, ...option }) => (
            <MenuItem
              key={name}
              disableRipple
              disabled={disabled}
              data-cy={cy}
              onClick={() => openDialogForm(option)}
            >
              {Icon && (
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
              )}
              <Typography variant="inherit" noWrap>
                <Translate word={name} />
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}

      {display &&
        (isConfirmDialog ? (
          <DialogConfirmation
            handleAccept={handleTriggerSubmit}
            handleCancel={hide}
            {...dialogProps}
          />
        ) : (
          <FormConfig onSubmit={handleTriggerSubmit}>
            {({
              steps,
              defaultValues,
              resolver,
              description,
              fields,
              ContentForm,
              onSubmit,
            }) =>
              resolver && (
                <DialogForm
                  resolver={resolver}
                  values={defaultValues}
                  handleSubmit={!steps ? onSubmit : undefined}
                  dialogProps={{ handleCancel: hide, ...dialogProps }}
                >
                  {steps ? (
                    <FormStepper
                      steps={steps}
                      schema={resolver}
                      onSubmit={onSubmit}
                    />
                  ) : ContentForm ? (
                    <ContentForm />
                  ) : (
                    <>
                      {description}
                      <FormWithSchema cy="form-dg" fields={fields} />
                    </>
                  )}
                </DialogForm>
              )
            }
          </FormConfig>
        ))}
    </>
  )
}

export const ButtonToTriggerFormPropTypes = {
  buttonProps: PropTypes.shape({ ...SubmitButton.propTypes }),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      cy: PropTypes.string,
      isConfirmDialog: PropTypes.bool,
      dialogProps: PropTypes.shape(DialogPropTypes),
      name: PropTypes.string,
      icon: PropTypes.any,
      form: PropTypes.func,
      onSubmit: PropTypes.func,
    })
  ),
  actionAccessor: PropTypes.string,
  onSelectedRowsChange: PropTypes.func,
}

ButtonToTriggerForm.propTypes = ButtonToTriggerFormPropTypes
ButtonToTriggerForm.displayName = 'ButtonToTriggerForm'

export default ButtonToTriggerForm
