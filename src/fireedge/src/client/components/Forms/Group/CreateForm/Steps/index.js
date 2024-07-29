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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/General'

import Permissions, {
  STEP_ID as PERMISSIONS_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/Permissions'

import Views, {
  STEP_ID as VIEWS_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/Views'

import System, {
  STEP_ID as SYSTEM_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/System'

import { createSteps } from 'client/utils'

import { ACL_RESOURCES } from 'client/constants'

/**
 * Create steps for Groups Create Form:
 * 1. General: Name of the group and create or not admin user
 * 2. Permissions: Set permissions about some resources for the group
 * 3. Advanced options: Options that will be set on group template
 * 3.1. Views: Views of the group
 * 3.2. Default options
 */
const Steps = createSteps([General, Permissions, Views, System], {
  transformBeforeSubmit: (formData) => {
    // Get data from steps
    const { [GENERAL_ID]: generalData } = formData
    const { [PERMISSIONS_ID]: permissionsData } = formData
    const { [VIEWS_ID]: views } = formData
    const { [SYSTEM_ID]: system } = formData

    const response = {}

    // General info
    response.group = {
      name: generalData?.name,
    }

    // Admin user
    if (generalData?.adminUser) {
      response.groupAdmin = {
        adminUser: generalData?.adminUser,
        username: generalData?.username,
        password: generalData?.password,
        authType: generalData?.authType,
      }
    }

    // Permissions
    const formCreateResources = permissionsData.create
    const formViewResources = permissionsData.view

    const createResources = Object.entries(formCreateResources)
      .filter((resource) => resource[1])
      .map((resource) => ACL_RESOURCES[resource[0]])
    const viewResources = Object.entries(formViewResources)
      .filter((resource) => resource[1])
      .map((resource) => ACL_RESOURCES[resource[0]])

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
