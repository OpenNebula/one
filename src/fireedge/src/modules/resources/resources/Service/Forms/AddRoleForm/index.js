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
import { object } from 'yup'

import RoleStep, {
  STEP_ID,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles'
import { createForm, deepClean } from '@UtilsModule'

const { resolver: rolesResolver, content: RoleContent } = RoleStep()

const AddRoleContent = () => <RoleContent standaloneModal />

const SCHEMA = object().shape({
  [STEP_ID]: rolesResolver,
})

const AddRoleForm = createForm(SCHEMA, undefined, {
  ContentForm: AddRoleContent,
  transformBeforeSubmit: (formData = {}) => ({
    role: deepClean(formData?.[STEP_ID]?.[0]),
  }),
})

export default AddRoleForm
