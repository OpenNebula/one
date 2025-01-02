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
import { useHistory } from 'react-router'
//
import { HostAPI, useGeneralApi } from '@FeaturesModule'
//
import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  TranslateProvider,
  PATH,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'

const { Host } = Form

/**
 * Displays the creation or modification form to a Host.
 *
 * @returns {ReactElement} Host form
 */
export function CreateHost() {
  const history = useHistory()

  const { enqueueSuccess } = useGeneralApi()
  const [allocate] = HostAPI.useAllocateHostMutation()

  const onSubmit = async (props) => {
    try {
      const newHostId = await allocate(props).unwrap()
      history.push(PATH.INFRASTRUCTURE.HOSTS.LIST)
      enqueueSuccess(T.SuccessHostCreated, newHostId)
    } catch {}
  }

  return (
    <TranslateProvider>
      <Host.CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
        {(config) => <DefaultFormStepper {...config} />}
      </Host.CreateForm>
    </TranslateProvider>
  )
}
