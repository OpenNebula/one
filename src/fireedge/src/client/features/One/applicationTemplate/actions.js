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
import { applicationTemplateService } from 'client/features/One/applicationTemplate/services'
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.document}  */
const SERVICE_TEMPLATE = 'document[101]'

export const getApplicationTemplate = createAction(
  `${SERVICE_TEMPLATE}/detail`,
  applicationTemplateService.getApplicationTemplate
)

export const getApplicationsTemplates = createAction(
  `${SERVICE_TEMPLATE}/pool`,
  applicationTemplateService.getApplicationsTemplates,
  (response) => ({ [RESOURCES.document[101]]: response })
)

export const createApplicationTemplate = createAction(
  `${SERVICE_TEMPLATE}/create`,
  applicationTemplateService.createApplicationTemplate
)

export const updateApplicationTemplate = createAction(
  `${SERVICE_TEMPLATE}/update`,
  applicationTemplateService.updateApplicationTemplate
)

export const instantiateApplicationTemplate = createAction(
  `${SERVICE_TEMPLATE}/instantiate`,
  applicationTemplateService.instantiateApplicationTemplate
)
