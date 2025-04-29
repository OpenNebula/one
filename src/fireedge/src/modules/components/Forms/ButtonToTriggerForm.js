/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { useState } from 'react'

import { Grow, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import { NavArrowDown } from 'iconoir-react'

import {
  DialogConfirmation,
  DialogForm,
  DialogPropTypes,
} from '@modules/components/Dialogs'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import FormStepper from '@modules/components/FormStepper'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { Translate } from '@modules/components/HOC'
import { useDialog } from '@HooksModule'
import { isDevelopment } from '@UtilsModule'

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
        onClick={(evt) => {
          if (options?.[0]?.onClick) {
            options?.[0]?.onClick?.(evt)
          } else {
            if (moreThanOneOption) {
              handleToggle(evt)
            } else {
              openDialogForm(options[0])
            }
          }
        }}
        {...buttonProps}
      />

      {moreThanOneOption && !buttonProps.disabled && (
        <Menu
          id={`${buttonId}-menu`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Grow}
          sx={(theme) => ({ zIndex: theme.zIndex.tooltip })}
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
              saveState,
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
                      saveState={saveState}
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
