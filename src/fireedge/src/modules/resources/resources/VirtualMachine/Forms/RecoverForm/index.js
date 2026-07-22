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
import {
  SCHEMA,
  FIELDS,
} from '@modules/resources/resources/VirtualMachine/Forms/RecoverForm/schema'
import { createForm } from '@UtilsModule'
import { Text } from '@ComponentsV2Module'

import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const RecoverForm = createForm(SCHEMA, FIELDS, {
  description: (
    <Text
      value={T.RecoverDescription}
      variant={TEXT_VARIANTS.BODY_MEDIUM}
      weight={TEXT_WEIGHTS.REGULAR}
      sx={{ p: '1rem' }}
    />
  ),
})

export default RecoverForm
