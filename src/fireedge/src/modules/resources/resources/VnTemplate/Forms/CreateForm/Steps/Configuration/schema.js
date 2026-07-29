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
import { object, ObjectSchema } from 'yup'

import { SCHEMA as AR_SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/addresses/schema'
import { SCHEMA as CLUSTER_SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/clusters/schema'
import { SCHEMA as CONTEXT_SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/context/schema'
import { SCHEMA as QOS_SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/qos/schema'
import { SCHEMA as SECURITY_SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/security/schema'
import {
  SCHEMA as CONFIGURATION_SCHEMA,
  SCHEMA_INSTANTIATE as INSTANTIATE_CONFIGURATION_SCHEMA,
} from '@modules/resources/Forms/Commons/VNetwork/Tabs/configuration/schema'

const DEFAULT_TABS = [
  'configuration',
  'clusters',
  'addresses',
  'security',
  'qos',
  'context',
]

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @param {boolean} isVnet - User is creating a vnet
 * @param {string[]} tabIds - Configuration tabs included in the step
 * @param {boolean} isInstantiate - User is instantiating a template
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = (
  isUpdate,
  oneConfig,
  adminGroup,
  isVnet,
  tabIds,
  isInstantiate
) => {
  const enabledTabs = tabIds ?? DEFAULT_TABS
  const isEnabled = (tabId) => enabledTabs.includes(tabId)
  let schema = object()

  isEnabled('security') && (schema = schema.concat(SECURITY_SCHEMA))
  isEnabled('configuration') &&
    (schema = schema.concat(
      isInstantiate
        ? INSTANTIATE_CONFIGURATION_SCHEMA(oneConfig, adminGroup)
        : CONFIGURATION_SCHEMA(oneConfig, adminGroup, isVnet)
    ))
  isEnabled('clusters') && (schema = schema.concat(CLUSTER_SCHEMA))
  isEnabled('context') &&
    (schema = schema.concat(CONTEXT_SCHEMA(oneConfig, adminGroup)))
  isEnabled('qos') &&
    (schema = schema.concat(QOS_SCHEMA(oneConfig, adminGroup)))
  isEnabled('addresses') && (schema = schema.concat(AR_SCHEMA))

  return schema
}
