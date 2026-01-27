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

import { useGeneralApi, ProviderAPI, DriverAPI } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  Form,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'

const _ = require('lodash')
const { Provider } = Form

/**
 * Displays the creation or modification form to a Provider.
 *
 * @returns {ReactElement} Provider form
 */
export function CreateProvider() {
  const history = useHistory()
  const { state: { ID: providerId, NAME } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [update] = ProviderAPI.useUpdateProviderMutation()
  const [allocate] = ProviderAPI.useCreateProviderMutation()

  const { data: apiTemplateData } = ProviderAPI.useGetProviderQuery({
    id: providerId,
  })

  const { data: drivers } = DriverAPI.useGetDriversQuery()

  const dataTemplate = _.cloneDeep(apiTemplateData)

  const onSubmit = async (jsonTemplate) => {
    try {
      if (!providerId) {
        const {
          DOCUMENT: { ID: newProviderId, NAME: providerName },
        } = await allocate({
          template: jsonTemplate,
        }).unwrap()

        history.push(PATH.INFRASTRUCTURE.PROVIDERS.LIST)
        enqueueSuccess(T.SuccessProviderCreated, [newProviderId, providerName])
      } else {
        await update({
          id: providerId,
          template: jsonTemplate,
          merge: false,
        }).unwrap()
        history.push(PATH.INFRASTRUCTURE.PROVIDERS.LIST)
        enqueueSuccess(T.SuccessProviderUpdated, [providerId, NAME])
      }
    } catch {
      enqueueError(T.ErrorProviderCreated)
    }
  }

  return (
    <TranslateProvider>
      {!drivers || (providerId && !dataTemplate) ? (
        <SkeletonStepsForm />
      ) : (
        <Provider.CreateForm
          initialValues={dataTemplate}
          stepProps={{
            dataTemplate,
            drivers,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Provider.CreateForm>
      )}
    </TranslateProvider>
  )
}
