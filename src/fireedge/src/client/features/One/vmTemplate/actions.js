/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { createAction } from 'client/features/One/utils'
import { vmTemplateService } from 'client/features/One/vmTemplate/services'
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.template}  */
const TEMPLATE = 'template'

export const getVmTemplate = createAction(
  `${TEMPLATE}/detail`,
  vmTemplateService.getVmTemplate
)

export const getVmTemplates = createAction(
  `${TEMPLATE}/pool`,
  vmTemplateService.getVmTemplates,
  (response) => ({ [RESOURCES.template]: response })
)

export const instantiate = createAction(
  `${TEMPLATE}/instantiate`,
  vmTemplateService.instantiate
)
export const allocate = createAction(
  `${TEMPLATE}/allocate`,
  vmTemplateService.allocate
)
export const clone = createAction(`${TEMPLATE}/clone`, vmTemplateService.clone)
export const remove = createAction(
  `${TEMPLATE}/delete`,
  vmTemplateService.delete
)
export const update = createAction(
  `${TEMPLATE}/update`,
  vmTemplateService.update
)
export const changePermissions = createAction(
  `${TEMPLATE}/chmod`,
  vmTemplateService.changePermissions
)
export const changeOwnership = createAction(
  `${TEMPLATE}/chown`,
  vmTemplateService.changeOwnership
)
export const rename = createAction(
  `${TEMPLATE}/rename`,
  vmTemplateService.rename
)
export const lock = createAction(`${TEMPLATE}/lock`, vmTemplateService.lock)
export const unlock = createAction(
  `${TEMPLATE}/unlock`,
  vmTemplateService.unlock
)
