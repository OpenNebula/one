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
import ContentForm, {
  CUSTOM_ATTRS_ID,
} from 'client/components/Forms/VNetwork/AddRangeForm/content'
import { SCHEMA } from 'client/components/Forms/VNetwork/AddRangeForm/schema'
import { createForm } from 'client/utils'

// List of attributes that can't be changed in update operation
const IMMUTABLE_ATTRS = [
  'AR_ID',
  'TYPE',
  'IP',
  'IP_END',
  'IP6',
  'IP6_END',
  'MAC',
  'MAC_END',
  'IP6_GLOBAL',
  'IP6_GLOBAL_END',
  'GLOBAL_PREFIX',
  'ULA_PREFIX',
  'USED_LEASES',
  'PARENT_NETWORK_AR_ID',
  'LEASES',
  'IPAM_MAD',
]

const AddRangeForm = createForm(SCHEMA, undefined, {
  ContentForm,
  transformInitialValue: (addressRange) => {
    if (!addressRange) return {}

    const mutableAttrs = {}
    for (const attr of Object.keys(addressRange)) {
      !IMMUTABLE_ATTRS[attr] && (mutableAttrs[attr] = addressRange[attr])
    }

    return { ...mutableAttrs }
  },
  transformBeforeSubmit: (formData) => {
    const { [CUSTOM_ATTRS_ID]: customAttrs = {}, ...rest } = formData ?? {}

    return { ...customAttrs, ...rest }
  },
})

export default AddRangeForm
