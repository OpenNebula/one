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
import { useHistory, useLocation } from 'react-router'

import { useSystemData, useGeneralApi, VnAPI } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  Form,
  TranslateProvider,
} from '@ComponentsModule'

import { T } from '@ConstantsModule'
const { Vn } = Form

const _ = require('lodash')

/**
 * Displays the creation or modification form to a Virtual Network.
 *
 * @returns {ReactElement} Virtual Network form
 */
export function CreateVirtualNetwork() {
  const history = useHistory()
  const { state: { ID: vnetId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [update] = VnAPI.useUpdateVNetMutation()
  const [allocate] = VnAPI.useAllocateVnetMutation()
  const { adminGroup, oneConfig } = useSystemData()

  const { data } = VnAPI.useGetVNetworkQuery(
    { id: vnetId, extended: true },
    { skip: vnetId === undefined }
  )

  const onSubmit = async (formResult) => {
    try {
      if (!vnetId) {
        const newVnetId = await allocate(formResult).unwrap()
        enqueueSuccess(T.SuccessVnetCreated, newVnetId)
      } else {
        const template =
          typeof formResult === 'string' ? formResult : formResult.template
        await update({ id: vnetId, template }).unwrap()
        enqueueSuccess(T.SuccessVnetUpdated, [vnetId, NAME])
      }

      history.push(PATH.NETWORK.VNETS.LIST)
    } catch {}
  }

  return (
    <TranslateProvider>
      {!_.isEmpty(oneConfig) && ((vnetId && data) || !vnetId) ? (
        <Vn.CreateForm
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
        </Vn.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}
