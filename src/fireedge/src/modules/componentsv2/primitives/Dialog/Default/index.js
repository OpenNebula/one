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

import {
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import PropTypes from 'prop-types'
import { forwardRef, Component } from 'react'
import { getStyles } from '@modules/componentsv2/primitives/Dialog/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Props
 * @param {string} root0.title - Dialog title
 * @param {Component} root0.children - Dialog content
 * @param {Component} root0.actions - Dialog actions
 * @param {string} root0.dataCy - Cypress selector
 * @param {object} root0.opt - Other props to pass to the dialog
 * @returns {Component} - Dialog component
 */
export const Dialog = forwardRef(
  ({ title, children, actions, dataCy, ...opt }, ref) => {
    const { translate } = useTranslation()

    return (
      <MuiDialog
        ref={ref}
        {...opt}
        data-cy={dataCy}
        sx={(theme) => getStyles({ theme })}
      >
        {title && <DialogTitle>{translate(title)}</DialogTitle>}
        <DialogContent>{children}</DialogContent>
        <DialogActions>{actions}</DialogActions>
      </MuiDialog>
    )
  }
)

Dialog.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  dataCy: PropTypes.string,
  opt: PropTypes.object,
}

Dialog.displayName = 'Dialog'
