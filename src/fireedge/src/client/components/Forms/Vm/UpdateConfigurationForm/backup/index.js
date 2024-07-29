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
import { ReactElement } from 'react'
import { Stack } from '@mui/material'

import { FormWithSchema } from 'client/components/Forms'

import { SECTIONS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/backup/schema'
import { T } from 'client/constants'
import PropTypes from 'prop-types'

/**
 * @param {object} props - Component props
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} IO section component
 */
const Backup = ({ oneConfig, adminGroup }) => (
  <Stack
    display="grid"
    gap="1em"
    sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
  >
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

Backup.displayName = 'Backup'

Backup.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default Backup
