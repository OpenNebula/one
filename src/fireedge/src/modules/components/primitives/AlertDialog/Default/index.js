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

import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { Button } from '@modules/components/primitives/Buttons'
import { getStyles } from '@modules/components/primitives/AlertDialog/Default/styles'
import { T } from '@ConstantsModule'

/**
 * Renders a text title or custom dialog header.
 *
 * @param {object} props - Header properties
 * @param {*} props.children - Header content; strings use DialogTitle
 * @param {object} props.rest - Additional properties forwarded to DialogTitle or Box
 * @returns {object} Dialog header
 */
const AlertDialogHeader = ({ children, ...rest }) => {
  const Container = typeof children === 'string' ? DialogTitle : Box

  return (
    <Container className="alert-dialog-header" {...rest}>
      {children}
    </Container>
  )
}

AlertDialogHeader.propTypes = {
  children: PropTypes.node,
}

/**
 * Renders dialog content, wrapping strings in DialogContentText.
 *
 * @param {object} props - Content properties
 * @param {*} props.children - Dialog body
 * @param {object} props.rest - Additional properties forwarded to DialogContent
 * @returns {object} Dialog content
 */
const AlertDialogContent = ({ children, ...rest }) => {
  const Container = typeof children === 'string' ? DialogContentText : Box

  return (
    <DialogContent className="alert-dialog-content" {...rest}>
      <Container>{children}</Container>
    </DialogContent>
  )
}

AlertDialogContent.propTypes = {
  children: PropTypes.node,
}

/**
 * Renders custom actions or the configured cancel and confirm buttons.
 *
 * @param {object} props - Action properties
 * @param {*} [props.children] - Custom content replacing the default buttons
 * @param {boolean} [props.hide] - Whether to omit the actions section
 * @param {object} props.cancel - Cancel button properties, used without custom actions
 * @param {*} [props.cancel.label=T.Cancel] - Cancel button label
 * @param {Function} [props.cancel.onClick] - Cancel button handler
 * @param {object} props.confirm - Confirm button properties, used without custom actions
 * @param {*} [props.confirm.label=T.Continue] - Confirm button label
 * @param {Function} [props.confirm.onClick] - Confirm button handler
 * @param {object} props.rest - Default button configuration
 * @returns {object|null} Dialog actions, or null when hidden
 */
const AlertDialogActions = ({ children, hide, ...rest }) => {
  if (hide) {
    return null
  }

  if (children) {
    return (
      <DialogActions className="alert-dialog-actions" disableSpacing {...rest}>
        {children}
      </DialogActions>
    )
  }

  const { cancel = {}, confirm = {}, ...others } = rest
  const { label: confirmLabel = T.Continue, ...confirmProps } = confirm
  const { label: cancelLabel = T.Cancel, ...cancelProps } = cancel

  return (
    <DialogActions className="alert-dialog-actions" disableSpacing {...others}>
      <Button type="secondary" data-cy="dg-cancel-button" {...cancelProps}>
        {cancelLabel}
      </Button>

      <Button type="primary" data-cy="dg-accept-button" {...confirmProps}>
        {confirmLabel}
      </Button>
    </DialogActions>
  )
}

AlertDialogActions.propTypes = {
  children: PropTypes.node,
  hide: PropTypes.bool,
  cancel: PropTypes.shape({
    label: PropTypes.node,
    onClick: PropTypes.func,
    isDisabled: PropTypes.bool,
  }),
  confirm: PropTypes.shape({
    label: PropTypes.node,
    onClick: PropTypes.func,
    isDisabled: PropTypes.bool,
  }),
}

/**
 * Renders a dialog with configurable header, content and actions.
 *
 * @param {object} props - Dialog properties
 * @param {boolean} [props.open=true] - Controls dialog visibility
 * @param {string} [props.title=T.DefaultConfirmationTitle] - Fallback header text
 * @param {*} [props.header] - Custom header taking precedence over title
 * @param {string} [props.content=T.DefaultConfirmationBody] - Fallback dialog body
 * @param {*} [props.children] - Body content taking precedence over content
 * @param {*} [props.actions] - Custom content replacing the default action buttons
 * @param {string} [props.dataCy] - Dialog data-cy attribute
 * @param {object} [props.actionsProps={}] - Action section and button configuration
 * @param {boolean} [props.actionsProps.hide] - Whether to omit the actions section
 * @param {object} [props.actionsProps.cancel] - Cancel button properties
 * @param {*} [props.actionsProps.cancel.label=T.Cancel] - Cancel button label
 * @param {Function} [props.actionsProps.cancel.onClick] - Cancel button handler
 * @param {object} [props.actionsProps.confirm] - Confirm button properties
 * @param {*} [props.actionsProps.confirm.label=T.Continue] - Confirm button label
 * @param {Function} [props.actionsProps.confirm.onClick] - Confirm button handler
 * @param {object} [props.headerProps={}] - Properties forwarded to the header container
 * @param {object} [props.contentProps={}] - Properties forwarded to DialogContent
 * @param {object} [props.sx] - Paper styles and section-specific style overrides
 * @param {object} [props.sx.header] - Header style overrides
 * @param {object} [props.sx.content] - Content style overrides
 * @param {object} [props.sx.actions] - Action section style overrides
 * @param {Function} [props.onClose] - Close handler; defaults to the cancel button handler or a no-op
 * @param {object} props.rest - Additional properties forwarded to MUI Dialog
 * @param {object|Function} ref - Ref forwarded to MUI Dialog
 * @returns {object} Alert dialog
 */
export const AlertDialog = forwardRef(
  (
    {
      open = true,
      title = T.DefaultConfirmationTitle,
      header,
      content = T.DefaultConfirmationBody,
      children,
      actions,
      dataCy,
      actionsProps = {},
      headerProps = {},
      contentProps = {},
      sx = {},
      onClose = actionsProps?.cancel?.onClick ?? (() => {}),
      ...rest
    },
    ref
  ) => (
    <Dialog
      ref={ref}
      open={open}
      onClose={onClose}
      data-cy={dataCy}
      sx={(theme) => getStyles({ theme, sx })}
      {...rest}
    >
      <AlertDialogHeader {...headerProps}>{header ?? title}</AlertDialogHeader>

      <AlertDialogContent {...contentProps}>
        {children ?? content}
      </AlertDialogContent>

      <AlertDialogActions {...actionsProps}>{actions}</AlertDialogActions>
    </Dialog>
  )
)

AlertDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  header: PropTypes.node,
  content: PropTypes.node,
  actions: PropTypes.node,
  dataCy: PropTypes.string,
  children: PropTypes.node,
  actionsProps: PropTypes.shape(AlertDialogActions.propTypes),
  headerProps: PropTypes.object,
  contentProps: PropTypes.object,
  sx: PropTypes.shape({
    header: PropTypes.object,
    content: PropTypes.object,
    actions: PropTypes.object,
  }),
  onClose: PropTypes.func,
}

AlertDialog.displayName = 'AlertDialog'
