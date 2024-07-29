/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import {
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
} from '@mui/material'
import { Box } from '@mui/system'
import { Cancel as CancelIcon } from 'iconoir-react'

import { Action } from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * @typedef {object} DialogProps
 * @property {boolean} [open] - If `true`, the component is shown
 * @property {string|JSXElementConstructor} title - Title
 * @property {string|JSXElementConstructor} [subheader] - Subtitle
 * @property {object} [contentProps] - Content properties
 * @property {function():Promise} handleAccept - Accept action
 * @property {Function} handleCancel - Cancel action
 * @property {object} [acceptButtonProps] - Accept button properties
 * @property {object} [cancelButtonProps] - Cancel button properties
 * @property {boolean} [fixedWidth] - Fix minimum with to dialog
 * @property {boolean} [fixedHeight] - Fix minimum height to dialog
 * @property {object} [dataCy] - identifier for cypress tests
 * @property {JSXElementConstructor} [children] - Fix minimum height
 */

/**
 * @param {DialogProps} props - Dialog properties
 * @returns {JSXElementConstructor} - Dialog with confirmation basic buttons
 */
const DialogConfirmation = memo(
  ({
    open = true,
    title = '',
    subheader,
    contentProps,
    handleAccept,
    acceptButtonProps,
    handleCancel,
    cancelButtonProps,
    handleEntering,
    fixedWidth,
    fixedHeight,
    children,
    dataCy,
  }) => {
    const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

    return (
      <Dialog
        fullScreen={isMobile}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: fixedWidth ? '80vw' : 'auto',
            minHeight: fixedHeight ? '80vh' : 'auto',
            maxWidth: fixedWidth ? '80vw' : 'auto',
            maxHeight: fixedHeight ? '80vh' : 'auto',
          },
        }}
        open={open}
        onClose={handleCancel}
        maxWidth="lg"
        scroll="paper"
        TransitionProps={{
          onEntering: handleEntering,
        }}
        {...(dataCy && { 'data-cy': dataCy })}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'center',
            gap: '2em',
          }}
        >
          <Box flexGrow={1}>
            {title && (
              <Typography variant="h6">
                {typeof title === 'string' ? Tr(title) : title}
              </Typography>
            )}
            {subheader && (
              <Typography variant="body1">
                {typeof subheader === 'string' ? Tr(subheader) : subheader}
              </Typography>
            )}
          </Box>
          {handleCancel && (
            <IconButton
              aria-label="close"
              onClick={handleCancel}
              data-cy="dg-cancel-button"
              {...cancelButtonProps}
              size="large"
            >
              <CancelIcon />
            </IconButton>
          )}
        </DialogTitle>
        {children && (
          <DialogContent
            dividers
            sx={{ display: 'flex', flexDirection: 'column' }}
            {...contentProps}
          >
            {children}
          </DialogContent>
        )}
        {handleAccept && (
          <DialogActions>
            <Action
              aria-label="accept"
              color="secondary"
              data-cy="dg-accept-button"
              handleClick={handleAccept}
              label={T.Accept}
              {...acceptButtonProps}
            />
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

export const DialogPropTypes = {
  open: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subheader: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  contentProps: PropTypes.object,
  handleAccept: PropTypes.func,
  acceptButtonProps: PropTypes.object,
  handleCancel: PropTypes.func,
  cancelButtonProps: PropTypes.object,
  dataCy: PropTypes.string,
  handleEntering: PropTypes.func,
  fixedWidth: PropTypes.bool,
  fixedHeight: PropTypes.bool,
  children: PropTypes.any,
}

DialogConfirmation.propTypes = DialogPropTypes

DialogConfirmation.displayName = 'DialogConfirmation'

export default DialogConfirmation
