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
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useUpdateVNetMutation,
  useAllocateVnetMutation,
  useGetVNetworkQuery,
} from 'client/features/OneApi/network'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/VNetwork'
import { PATH } from 'client/apps/sunstone/routesOne'

import { useSystemData } from 'client/features/Auth'
import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the creation or modification form to a Virtual Network.
 *
 * @returns {ReactElement} Virtual Network form
 */
function CreateVirtualNetwork() {
  const history = useHistory()
  const { state: { ID: vnetId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [update] = useUpdateVNetMutation()
  const [allocate] = useAllocateVnetMutation()
  const { adminGroup, oneConfig } = useSystemData()

  const { data } = useGetVNetworkQuery(
    { id: vnetId, extended: true },
    { skip: vnetId === undefined }
  )

  const onSubmit = async (xml) => {
    try {
      if (!vnetId) {
        const newVnetId = await allocate({ template: xml }).unwrap()
        enqueueSuccess(T.SuccessVnetCreated, newVnetId)
      } else {
        await update({ id: vnetId, template: xml }).unwrap()
        enqueueSuccess(T.SuccessVnetUpdated, [vnetId, NAME])
      }

      history.push(PATH.NETWORK.VNETS.LIST)
    } catch {}
  }

  return !_.isEmpty(oneConfig) && ((vnetId && data) || !vnetId) ? (
    <CreateForm
      initialValues={data}
      stepProps={{
        data,
        oneConfig,
        adminGroup,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  ) : (
    <SkeletonStepsForm />
  )
}

export default CreateVirtualNetwork
