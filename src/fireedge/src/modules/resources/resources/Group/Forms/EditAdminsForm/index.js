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
import { createForm } from '@UtilsModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/Group/Forms/EditAdminsForm/schema'

const getUserId = (user) => (typeof user === 'object' ? user?.ID : user)

const normalizeUserIds = (users) =>
  []
    .concat(users ?? [])
    .map(getUserId)
    .filter((id) => id !== undefined && id !== null && id !== '')
    .map(String)

const EditAdminsForm = createForm(SCHEMA, FIELDS, {
  transformInitialValue: (admins, schema) => ({
    ...schema.cast(
      { admins: normalizeUserIds(admins) },
      { stripUnknown: false }
    ),
  }),
  transformBeforeSubmit: (formData, initialValues) => {
    const admins = normalizeUserIds(formData?.admins)
    const initialAdmins = normalizeUserIds(initialValues)
    const adminsToAdd = admins.filter((id) => !initialAdmins.includes(id))
    const adminsToRemove = initialAdmins.filter((id) => !admins.includes(id))

    return { adminsToAdd, adminsToRemove }
  },
})

export default EditAdminsForm
