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

import Permissions, {
  STEP_ID as PERMISSIONS_ID,
} from '@modules/resources/Group/Forms/CreateForm/Steps/Permissions'

import Views, {
  STEP_ID as VIEWS_ID,
} from '@modules/resources/Group/Forms/CreateForm/Steps/Views'

import System, {
  STEP_ID as SYSTEM_ID,
} from '@modules/resources/Group/Forms/CreateForm/Steps/System'

import { createSteps } from '@UtilsModule'
import { getGroupPermissionFormValues } from '@ModelsModule'
import { ACL_RESOURCES } from '@ConstantsModule'

/**
 * Create steps for Groups Update Form:
 * 1. Permissions: Set permissions about some resources for the group
 * 2. Advanced options: Options that will be set on group template
 * 2.1. Views: Views of the group
 * 2.2. Default options
 */
const Steps = createSteps([Permissions, Views, System], {
  transformInitialValue: (initialValues, schema) => {
    const group = initialValues?.group ?? initialValues
    const acls = initialValues?.acls ?? []
    const objectSchema = {
      [PERMISSIONS_ID]: getGroupPermissionFormValues(acls, group?.ID),
      [VIEWS_ID]: {
        VIEWS: group?.TEMPLATE?.FIREEDGE?.VIEWS?.split(',').reduce(
          (acc, view) => ({ ...acc, [view]: true }),
          {}
        ),
        DEFAULT_VIEW: group?.TEMPLATE?.FIREEDGE?.DEFAULT_VIEW,
        GROUP_ADMIN_VIEWS: group?.TEMPLATE?.FIREEDGE?.GROUP_ADMIN_VIEWS?.split(
          ','
        ).reduce((acc, view) => ({ ...acc, [view]: true }), {}),
        GROUP_ADMIN_DEFAULT_VIEW:
          group?.TEMPLATE?.FIREEDGE?.GROUP_ADMIN_DEFAULT_VIEW,
      },
      [SYSTEM_ID]: {
        OPENNEBULA: group?.TEMPLATE?.OPENNEBULA,
      },
    }

    const knownGroup = schema.cast(objectSchema, {
      stripUnknown: true,
    })

    return knownGroup
  },

  transformBeforeSubmit: (formData) => {
    // Get data from steps
    const { [PERMISSIONS_ID]: permissionsData } = formData
    const { [VIEWS_ID]: views } = formData
    const { [SYSTEM_ID]: system } = formData

    const response = {}

    // Permissions
    const createResources = Object.entries(permissionsData?.create ?? {})
      .filter((resource) => resource[1])
      .map((resource) => ACL_RESOURCES[resource[0]])
      .filter(Boolean)
    const viewResources = Object.entries(permissionsData?.view ?? {})
      .filter((resource) => resource[1])
      .map((resource) => ACL_RESOURCES[resource[0]])
      .filter(Boolean)

    response.permissions = {
      view: viewResources,
      create: createResources,
    }

    // Views
    response.views = {
      FIREEDGE: {
        VIEWS: Object.entries(views?.VIEWS)
          .filter((resource) => resource[1])
          .map((resource) => resource[0])
          .join(','),
        DEFAULT_VIEW: views?.DEFAULT_VIEW,
        GROUP_ADMIN_VIEWS: Object.entries(views?.GROUP_ADMIN_VIEWS)
          .filter((resource) => resource[1])
          .map((resource) => resource[0])
          .join(','),
        GROUP_ADMIN_DEFAULT_VIEW: views?.GROUP_ADMIN_DEFAULT_VIEW,
      },
    }

    // System
    response.system = {
      OPENNEBULA: system?.OPENNEBULA,
    }

    return response
  },
})

export default Steps
