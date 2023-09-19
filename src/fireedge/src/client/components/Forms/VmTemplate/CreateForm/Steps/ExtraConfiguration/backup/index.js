/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { RefreshDouble as BackupIcon } from 'iconoir-react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import {
  SECTIONS,
  FIELDS,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/backup/schema'
import { T } from 'client/constants'

const Backup = ({ oneConfig, adminGroup }) => (
  <>
    {SECTIONS(oneConfig, adminGroup).map(({ id, ...section }) => (
      <FormWithSchema
        key={id}
        id={EXTRA_ID}
        cy={`${EXTRA_ID}-${id}`}
        {...section}
      />
    ))}
  </>
)

Backup.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

Backup.displayName = 'Backup'

/** @type {TabType} */
const TAB = {
  id: 'backup',
  name: T.Backup,
  icon: BackupIcon,
  Content: Backup,
  getError: (error) => FIELDS.some(({ name }) => error?.[name]),
}

export default TAB
