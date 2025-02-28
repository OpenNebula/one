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

import { useGeneralApi, VnTemplateAPI, useSystemData } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'

import { T } from '@ConstantsModule'

const _ = require('lodash')
const { VnTemplate } = Form

/**
 * Displays the creation or modification form to a Virtual Network.
 *
 * @returns {ReactElement} Virtual Network form
 */
export const CreateVnTemplate = () => {
  const history = useHistory()
  const { state: { ID: vnetId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [update] = VnTemplateAPI.useUpdateVNTemplateMutation()
  const [allocate] = VnTemplateAPI.useAllocateVNTemplateMutation()
  const { adminGroup, oneConfig } = useSystemData()

  const { data } = VnTemplateAPI.useGetVNTemplateQuery(
    { id: vnetId, extended: true },
    { skip: vnetId === undefined }
  )

  const onSubmit = async (xml) => {
    try {
      if (!vnetId) {
        const newVnetId = await allocate({ template: xml }).unwrap()
        enqueueSuccess(T.SuccessVNetTemplateCreated, newVnetId)
      } else {
        await update({ id: vnetId, template: xml }).unwrap()
        enqueueSuccess(T.SuccessVNetTemplateUpdated, [vnetId, NAME])
      }

      history.push(PATH.NETWORK.VN_TEMPLATES.LIST)
    } catch {}
  }

  return (
    <TranslateProvider>
      {!_.isEmpty(oneConfig) && ((vnetId && data) || !vnetId) ? (
        <VnTemplate.CreateForm
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
        </VnTemplate.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}
