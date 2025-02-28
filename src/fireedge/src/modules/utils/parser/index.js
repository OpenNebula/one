/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import templateToObject from '@modules/utils/parser/templateToObject'
import {
  parseNetworkString,
  parseCustomInputString,
  convertKeysToCase,
} from '@modules/utils/parser/parseServiceTemplate'
import parseVmTemplateContents from '@modules/utils/parser/parseVmTemplateContents'
import { parseAcl } from '@modules/utils/parser/parseACL'
import parseTouchedDirty from '@modules/utils/parser/parseTouchedDirty'
import isDeeplyEmpty from '@modules/utils/parser/isDeeplyEmpty'
import {
  filterTemplateData,
  transformActionsCreate,
  transformActionsInstantiate,
} from '@modules/utils/parser/vmTemplateFilter'
import parsePayload from '@modules/utils/parser/parseTemplatePayload'

export {
  convertKeysToCase,
  filterTemplateData,
  isDeeplyEmpty,
  parseAcl,
  parseCustomInputString,
  templateToObject,
  parseNetworkString,
  parsePayload,
  parseTouchedDirty,
  parseVmTemplateContents,
  transformActionsCreate,
  transformActionsInstantiate,
}
