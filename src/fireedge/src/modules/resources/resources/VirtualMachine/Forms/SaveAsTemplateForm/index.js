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
import { FormWithSchema } from '@ComponentsV2Module'
import { createForm } from '@UtilsModule'
import {
  SCHEMA,
  FIELDS,
} from '@modules/resources/resources/VirtualMachine/Forms/SaveAsTemplateForm/schema'

const SaveAsTemplateFormContent = () => (
  <FormWithSchema
    cy="form-dg"
    fields={FIELDS}
    rootProps={{
      sx: {
        boxSizing: 'border-box',
        px: 0.5,
        width: '100%',
      },
    }}
    gridContainerSx={{
      m: 0,
      width: '100%',
    }}
    gridItemSx={{
      p: 0.5,
      width: '100%',
    }}
  />
)

const SaveAsTemplateForm = createForm(SCHEMA, FIELDS, {
  ContentForm: SaveAsTemplateFormContent,
})

export default SaveAsTemplateForm
