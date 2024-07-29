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
import templateToObject from 'client/utils/parser/templateToObject'
import parseApplicationToForm from 'client/utils/parser/parseApplicationToForm'
import parseFormToApplication from 'client/utils/parser/parseFormToApplication'
import parseFormToDeployApplication from 'client/utils/parser/parseFormToDeployApplication'
import {
  parseNetworkString,
  parseCustomInputString,
  convertKeysToCase,
} from 'client/utils/parser/parseServiceTemplate'
import parseVmTemplateContents from 'client/utils/parser/parseVmTemplateContents'
import { parseAcl } from 'client/utils/parser/parseACL'
import parseTouchedDirty from 'client/utils/parser/parseTouchedDirty'
import isDeeplyEmpty from 'client/utils/parser/isDeeplyEmpty'
import {
  filterTemplateData,
  transformActionsCreate,
  transformActionsInstantiate,
} from 'client/utils/parser/vmTemplateFilter'
import parsePayload from 'client/utils/parser/parseTemplatePayload'

export {
  templateToObject,
  parseApplicationToForm,
  parseFormToApplication,
  parseFormToDeployApplication,
  parseAcl,
  parseNetworkString,
  parseCustomInputString,
  convertKeysToCase,
  parseVmTemplateContents,
  parseTouchedDirty,
  isDeeplyEmpty,
  filterTemplateData,
  parsePayload,
  transformActionsCreate,
  transformActionsInstantiate,
}
