/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

/**
 * @returns {ReactElement} IO section component
 */
const Backup = () => (
  <Stack
    display="grid"
    gap="1em"
    sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
  >
    {SECTIONS.map(({ id, ...section }) => (
      <FormWithSchema
        key={id}
        cy="backups-conf"
        legend={T.Backup}
        {...section}
      />
    ))}
  </Stack>
)

Backup.displayName = 'Backup'

export default Backup
