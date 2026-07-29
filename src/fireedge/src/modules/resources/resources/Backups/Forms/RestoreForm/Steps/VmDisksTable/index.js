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
import PropTypes from 'prop-types'

import { FormWithSchema } from '@ComponentsV2Module'
import {
  FIELDS,
  SCHEMA,
  VM_DISK_FIELD,
} from '@modules/resources/resources/Backups/Forms/RestoreForm/Steps/VmDisksTable/schema'

import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'

export const STEP_ID = VM_DISK_FIELD

const Content = ({ app }) => (
  <FormWithSchema cy={STEP_ID} fields={FIELDS(app)} />
)

/**
 * Step to select the disk to restore.
 *
 * @param {object} app - Backupdisk ID's + VM id resource
 * @returns {Step} Individual disk step
 */
const IndividualDiskStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDisk,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
  defaultDisabled: {
    condition: () => true,
  },
})

Content.propTypes = {
  app: PropTypes.object,
}

export default IndividualDiskStep
