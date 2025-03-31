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

import { useGeneralApi, MarketplaceAppAPI } from '@FeaturesModule'
import {
  TranslateProvider,
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
} from '@ComponentsModule'
import { jsonToXml } from '@ModelsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
const { MarketplaceApp } = Form

/**
 * Displays the creation or modification form to a Marketplace App.
 *
 * @returns {ReactElement} Marketplace App form
 */
export function CreateMarketplaceApp() {
  const history = useHistory()
  const { state: [resourceName, { ID } = {}] = [] } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [create] = MarketplaceAppAPI.useAllocateAppMutation()
  const [importApp] = MarketplaceAppAPI.useImportAppMutation()

  const handleTriggerSubmit = async ({ type, ...restOfData }) => {
    try {
      const createApp = {
        [RESOURCE_NAMES.IMAGE]: async () => {
          const { id: imageId, marketId, vmname, image } = restOfData
          const xml = jsonToXml({ ORIGIN_ID: imageId, NAME: vmname, ...image })

          return await create({ id: marketId, template: xml })
        },
        [RESOURCE_NAMES.VM]: async () =>
          await importApp({ resource: 'vm', ...restOfData }),
        [RESOURCE_NAMES.VM_TEMPLATE]: async () =>
          await importApp({ resource: 'vm-template', ...restOfData }),
      }[String(type).toLowerCase()]

      const response = await createApp?.()
      response && enqueueSuccess(T.SuccessMarketplaceAppCreated)
      history.goBack()
    } catch {}
  }

  return (
    <TranslateProvider>
      <MarketplaceApp.CreateForm
        initialValues={{ type: resourceName, id: ID }}
        onSubmit={handleTriggerSubmit}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </MarketplaceApp.CreateForm>
    </TranslateProvider>
  )
}
