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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/ACLs'
import { createAclObjectFromString } from 'client/models/ACL'

import systemApi from 'client/features/OneApi/system'
import { useAllocateAclMutation } from 'client/features/OneApi/acl'
import { useGeneralApi } from 'client/features/General'
import { PATH } from 'client/apps/sunstone/routesOne'
import { useHistory, useLocation } from 'react-router'

import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { useGetClustersQuery } from 'client/features/OneApi/cluster'
import { useGetZonesQuery } from 'client/features/OneApi/zone'

import { useSystemData } from 'client/features/Auth'

import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the creation form for a ACL rule.
 *
 * @returns {ReactElement} - The ACL form component
 */
function CreateACLs() {
  const { state: fromString } = useLocation()

  // General api for enqueue
  const { enqueueSuccess, enqueueError } = useGeneralApi()

  // Get ONE config
  const { oneConfig } = useSystemData()

  // Get version to show links to documentation
  const { data: version } = systemApi.useGetOneVersionQuery()

  // Get list of all users to add in the acl info the name of the user
  const { data: users } = useGetUsersQuery()

  // Get list of all groups to add in the acl info the name of the group
  const { data: groups } = useGetGroupsQuery()

  // Get list of all clusters to add in the acl info the name of the cluster
  const { data: clusters } = useGetClustersQuery()

  // Get list of all zones to add in the acl info the name of the zone
  const { data: zones } = useGetZonesQuery()

  // Operation to create ACL
  const [createAcl] = useAllocateAclMutation()

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

  return version &&
    users &&
    groups &&
    clusters &&
    zones &&
    !_.isEmpty(oneConfig) ? (
    <CreateForm
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
    </CreateForm>
  ) : (
    <SkeletonStepsForm />
  )
}

CreateACLs.propTypes = {
  string: PropTypes.string,
}

export default CreateACLs
