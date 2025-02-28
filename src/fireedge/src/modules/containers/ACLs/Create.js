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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { createAclObjectFromString } from '@ModelsModule'

import { useHistory, useLocation } from 'react-router'

import {
  AclAPI,
  UserAPI,
  GroupAPI,
  ClusterAPI,
  ZoneAPI,
  SystemAPI,
  useSystemData,
  useGeneralApi,
} from '@FeaturesModule'

import { T } from '@ConstantsModule'
const { ACLs } = Form

const _ = require('lodash')

/**
 * Displays the creation form for a ACL rule.
 *
 * @returns {ReactElement} - The ACL form component
 */
export function CreateACL() {
  const { state: fromString } = useLocation()

  // General api for enqueue
  const { enqueueSuccess, enqueueError } = useGeneralApi()

  // Get ONE config
  const { oneConfig } = useSystemData()

  // Get version to show links to documentation
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  // Get list of all users to add in the acl info the name of the user
  const { data: users } = UserAPI.useGetUsersQuery()

  // Get list of all groups to add in the acl info the name of the group
  const { data: groups } = GroupAPI.useGetGroupsQuery()

  // Get list of all clusters to add in the acl info the name of the cluster
  const { data: clusters } = ClusterAPI.useGetClustersQuery()

  // Get list of all zones to add in the acl info the name of the zone
  const { data: zones } = ZoneAPI.useGetZonesQuery()

  // Operation to create ACL
  const [createAcl] = AclAPI.useAllocateAclMutation()

  const history = useHistory()

  const onSubmit = async (props) => {
    try {
      // Create acl rule
      const idAcl = await createAcl(
        createAclObjectFromString(props?.string)
      ).unwrap()

      if (idAcl) {
        // Success message
        enqueueSuccess(T.SuccessACLCreated, idAcl)

        // Go to ACL list
        history.push(PATH.SYSTEM.ACLS.LIST)
      }
    } catch (error) {
      enqueueError(T.ErrorACLCreated)
    }
  }

  return (
    <TranslateProvider>
      {version &&
      users &&
      groups &&
      clusters &&
      zones &&
      !_.isEmpty(oneConfig) ? (
        <ACLs.CreateForm
          onSubmit={onSubmit}
          stepProps={{
            version,
            fromString,
            users,
            groups,
            clusters,
            zones,
            oneConfig,
          }}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </ACLs.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}

CreateACL.propTypes = {
  string: PropTypes.string,
}
