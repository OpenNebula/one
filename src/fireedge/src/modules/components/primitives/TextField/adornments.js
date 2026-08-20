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
import { ReactNode, Component } from 'react'
import { renderIcon } from '@UtilsModule'
import { Typography, InputAdornment } from '@mui/material'

/**
 * @param {object} root0 - Props
 * @param {string|ReactNode}root0.startIcon - Starting icon
 * @param {string|ReactNode}root0.endIcon - Ending icon
 * @param {string} root0.preTab - Prettab text
 * @param {string} root0.postTab - Posttab text
 * @returns {Component} - Start/End adornment decorations
 */
export const adornments = ({ startIcon, endIcon, preTab, postTab }) => ({
  ...((startIcon || preTab) && {
    startAdornment: (
      <InputAdornment className="textfield-adornment-start" position="start">
        {renderIcon(startIcon, { key: 'start-icon' })}
        {preTab && (
          <Typography className="textfield-prettab">{preTab}</Typography>
        )}
      </InputAdornment>
    ),
  }),

  ...((endIcon || postTab) && {
    endAdornment: (
      <InputAdornment className="textfield-adornment-end" position="end">
        {postTab && (
          <Typography className="textfield-posttab">{postTab}</Typography>
        )}
        {renderIcon(endIcon, { key: 'end-icon' })}
      </InputAdornment>
    ),
  }),
})
