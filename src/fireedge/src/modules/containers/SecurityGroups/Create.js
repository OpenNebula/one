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

import { jsonToXml } from '@ModelsModule'
import { SecurityGroupAPI, useGeneralApi } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { SecurityGroup } = Form

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
export function CreateSecurityGroup() {
  const history = useHistory()
  const { state: { ID: secID, NAME } = {} } = useLocation()

  const [allocate] = SecurityGroupAPI.useAllocateSecGroupMutation()
  const [update] = SecurityGroupAPI.useUpdateSecGroupMutation()
  const { enqueueSuccess } = useGeneralApi()

  const { data } = SecurityGroupAPI.useGetSecGroupQuery(
    { id: secID },
    { skip: secID === undefined }
  )

  const onSubmit = async ({ template }) => {
    try {
      if (!secID) {
        const newTemplateId = await allocate({
          template: jsonToXml(template),
        }).unwrap()
        history.push(PATH.NETWORK.SEC_GROUPS.LIST)
        enqueueSuccess(T.SuccessSecurityGroupCreated, newTemplateId)
      } else {
        await update({ id: secID, template: jsonToXml(template) }).unwrap()
        history.push(PATH.NETWORK.SEC_GROUPS.LIST)
        enqueueSuccess(T.SuccessSecurityGroupUpdated, [secID, NAME])
      }
    } catch {}
  }

  return (
    <TranslateProvider>
      {secID && !data ? (
        <SkeletonStepsForm />
      ) : (
        <SecurityGroup.CreateForm
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
          initialValues={data}
          stepProps={data}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </SecurityGroup.CreateForm>
      )}{' '}
    </TranslateProvider>
  )
}
