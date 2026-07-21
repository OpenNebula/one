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

import { T } from '@ConstantsModule'
import { TemplateTab } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Template/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Template = ({ data, config }) => {
  const { extendedVmData } = data || {}
  const { TEMPLATE = {}, USER_TEMPLATE = {} } = extendedVmData ?? {}
  const fTemplate = JSON.stringify(TEMPLATE, null, 2)
  const fUTemplate = JSON.stringify(USER_TEMPLATE, null, 2)

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="code-container">
        {fTemplate && <TemplateTab title={T.Template} code={fTemplate} />}
        {fUTemplate && <TemplateTab title={T.UserTemplate} code={fUTemplate} />}
      </Box>
    </Box>
  )
}

Template.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Template.id = 'template'
Template.title = T.Template
