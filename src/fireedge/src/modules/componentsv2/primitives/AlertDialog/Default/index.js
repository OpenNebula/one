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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import {
  useDialogStyles,
  useContentWrapperStyles,
  useHeaderStyles,
  useDescriptionStyles,
  useActionsStyles,
} from '@modules/componentsv2/primitives/AlertDialog/Default/styles'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.open - Controls dialog visibility
 * @param {string} root0.title - Dialog header text
 * @param {string|object} root0.description - Dialog description
 * @param {string} root0.confirmLabel - Confirm button label
 * @param {string} root0.cancelLabel - Cancel button label
 * @param {Function} root0.onSubmit - Confirm action handler
 * @param {Function} root0.onCancel - Cancel action handler
 * @param {boolean} root0.isConfirmDisabled - Disable confirm button
 * @param {boolean} root0.isCancelDisabled - Disable cancel button
 * @param {boolean} root0.hideActions - Hide dialog action buttons
 * @param {object} root0.confirmButtonProps - Additional props for confirm button
 * @param {object} root0.cancelButtonProps - Additional props for cancel button
 * @param {string|object} root0.dialogWidth - Dialog paper width
 * @param {string|object} root0.dialogMinWidth - Dialog paper min-width
 * @param {string|object} root0.dialogMaxWidth - Dialog paper max-width
 * @param {string|object} root0.dialogMaxHeight - Dialog paper max-height
 * @param {string} root0.dialogPaperOverflow - Dialog paper overflow
 * @param {string|object} root0.dialogContentMaxHeight - Dialog content max-height
 * @param {string} root0.dialogContentOverflowY - Dialog content overflow-y
 * @param {string} root0.dataCy - Dialog data-cy attribute
 * @param {object} root0.children - Component children
 * @returns {Component} - Custom MUI AlertDialog component
 */
export const AlertDialog = forwardRef(
  (
    {
      open = true,
      title,
      description,
      confirmLabel = 'Continue',
      cancelLabel = 'Cancel',
      onSubmit = () => {},
      onCancel = () => {},
      isConfirmDisabled = false,
      isCancelDisabled = false,
      hideActions = false,
      confirmButtonProps = {},
      cancelButtonProps = {},
      dialogWidth,
      dialogMinWidth,
      dialogMaxWidth,
      dialogMaxHeight,
      dialogPaperOverflow,
      dialogContentMaxHeight,
      dialogContentOverflowY,
      dataCy,
      children,
      ...opts
    },
    ref
  ) => {
    const headerText = title ?? T.DefaultConfirmationTitle
    const descriptionText = description ?? T.DefaultConfirmationBody
    const hasScrollableContent = dialogContentOverflowY
      ? dialogContentOverflowY !== 'visible'
      : Boolean(dialogContentMaxHeight)

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onCancel}
        sx={(theme) =>
          useDialogStyles({
            theme,
            dialogWidth,
            dialogMinWidth,
            dialogMaxWidth,
            dialogMaxHeight,
            dialogPaperOverflow,
          })
        }
        data-cy={dataCy}
        {...opts}
      >
        <Box sx={(theme) => useContentWrapperStyles({ theme })}>
          <DialogTitle sx={(theme) => useHeaderStyles({ theme })}>
            {headerText}
          </DialogTitle>
          <DialogContent
            sx={(theme) => ({
              padding: hasScrollableContent
                ? `${theme.scale[100]}px !important`
                : 0,
              margin: hasScrollableContent ? `-${theme.scale[100]}px` : 0,
              boxSizing: 'border-box',
              color: 'text.body',
              overflowY: hasScrollableContent
                ? dialogContentOverflowY ?? 'auto'
                : 'visible',
              ...(dialogContentMaxHeight && {
                maxHeight: dialogContentMaxHeight,
              }),
            })}
          >
            {children ??
              (typeof descriptionText === 'string' ? (
                <DialogContentText
                  sx={(theme) => useDescriptionStyles({ theme })}
                >
                  {descriptionText}
                </DialogContentText>
              ) : (
                <Box sx={(theme) => useDescriptionStyles({ theme })}>
                  {descriptionText}
                </Box>
              ))}
          </DialogContent>
          {!hideActions && (
            <DialogActions sx={(theme) => useActionsStyles({ theme })}>
              <Button
                type="secondary"
                onClick={onCancel}
                isDisabled={isCancelDisabled}
                data-cy="dg-cancel-button"
                {...cancelButtonProps}
              >
                {cancelLabel}
              </Button>
              <Button
                type="primary"
                onClick={onSubmit}
                isDisabled={isConfirmDisabled}
                data-cy="dg-accept-button"
                {...confirmButtonProps}
              >
                {confirmLabel}
              </Button>
            </DialogActions>
          )}
        </Box>
      </Dialog>
    )
  }
)

AlertDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.node,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isConfirmDisabled: PropTypes.bool,
  isCancelDisabled: PropTypes.bool,
  hideActions: PropTypes.bool,
  confirmButtonProps: PropTypes.object,
  cancelButtonProps: PropTypes.object,
  dialogWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  dialogMinWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  dialogMaxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  dialogMaxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  dialogPaperOverflow: PropTypes.string,
  dialogContentMaxHeight: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  dialogContentOverflowY: PropTypes.string,
  dataCy: PropTypes.string,
  children: PropTypes.node,
}

AlertDialog.displayName = 'AlertDialog'
