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
import { T } from '@ConstantsModule'
import { FormWithSchema } from '@modules/components/Forms'
import { SECTIONS } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/backup/schema'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

/**
 * @param {object} props - Component properties
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Form content component
 */
const Content = ({ oneConfig, adminGroup }) => (
  <Stack display="grid" gap="1em" sx={{ gridTemplateColumns: '1fr' }}>
    {SECTIONS(oneConfig, adminGroup).map(({ id, ...section }) => (
      <FormWithSchema
        key={id}
        cy="backup-configuration"
        legend={T.Backup}
        {...section}
      />
    ))}
  </Stack>
)

Content.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default Content
