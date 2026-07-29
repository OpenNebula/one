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

import { DetailsCard } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'

const JsonContent = ({ value }) => (
  <Box
    component="pre"
    sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
  >
    <Box component="code">{JSON.stringify(value ?? {}, null, 2)}</Box>
  </Box>
)

JsonContent.propTypes = {
  value: PropTypes.any,
}

const createJsonTab = (id, title, property) => {
  const JsonTab = ({ data }) => (
    <DetailsCard
      title={title}
      options={[
        [
          title,
          <JsonContent key={property} value={data?.selected?.[property]} />,
        ],
      ]}
    />
  )

  JsonTab.propTypes = {
    data: PropTypes.object,
  }
  JsonTab.id = id
  JsonTab.title = title
  JsonTab.displayName = `${id}DriverTab`

  return JsonTab
}

export const Connection = createJsonTab(
  'connection',
  T.Connection,
  'connection'
)
export const DeploymentConfs = createJsonTab(
  'deployment_confs',
  T.Configuration,
  'deployment_confs'
)
export const UserInputs = createJsonTab(
  'user_inputs',
  T.UserInputs,
  'user_inputs'
)
