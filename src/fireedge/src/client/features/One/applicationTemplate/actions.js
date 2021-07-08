/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

export const getApplicationTemplate = createAction(
  'application-template',
  applicationTemplateService.getApplicationTemplate
)

export const getApplicationsTemplates = createAction(
  'application-template/pool',
  applicationTemplateService.getApplicationsTemplates,
  response => ({ [RESOURCES.document[101]]: response })
)

export const createApplicationTemplate = createAction(
  'application-template/create',
  applicationTemplateService.createApplicationTemplate
)

export const updateApplicationTemplate = createAction(
  'application-template/update',
  applicationTemplateService.updateApplicationTemplate
)

export const instantiateApplicationTemplate = createAction(
  'application-template/instantiate',
  applicationTemplateService.instantiateApplicationTemplate
)
