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

import Views, {
  STEP_ID as VIEWS_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/Views'

import System, {
  STEP_ID as SYSTEM_ID,
} from 'client/components/Forms/Group/CreateForm/Steps/System'

import { createSteps } from 'client/utils'

/**
 * Create steps for Groups Update Form:
 * 1. Advanced options: Options that will be set on group template
 * 1.1. Views: Views of the group
 * 1.2. Default options
 */
const Steps = createSteps([Views, System], {
  transformInitialValue: (group, schema) => {
    const objectSchema = {
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
    const { [VIEWS_ID]: views } = formData
    const { [SYSTEM_ID]: system } = formData

    const response = {}

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
