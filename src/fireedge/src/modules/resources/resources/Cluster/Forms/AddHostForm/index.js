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
import { createForm } from '@UtilsModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/Cluster/Forms/AddHostForm/schema'

const AddHostFormContent = (props) => (
  <FormWithSchema
    cy="form-dg"
    fields={FIELDS(props)}
    rootProps={{
      sx: {
        boxSizing: 'border-box',
        px: 0.5,
      },
    }}
    gridContainerSx={{
      m: 0,
      width: '100%',
    }}
    gridItemSx={{
      p: 0,
    }}
  />
)

AddHostFormContent.propTypes = {
  filter: PropTypes.func,
  formType: PropTypes.string,
}

const AddHostForm = createForm(SCHEMA, FIELDS, {
  ContentForm: AddHostFormContent,
  transformInitialValue: (hosts, schema) => ({
    ...schema.cast({ hosts }, { stripUnknown: true }),
  }),
})

export default AddHostForm
