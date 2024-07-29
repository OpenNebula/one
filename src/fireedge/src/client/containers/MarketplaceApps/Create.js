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
  useAllocateAppMutation,
  useImportAppMutation,
} from 'client/features/OneApi/marketplaceApp'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/MarketplaceApp'
import { jsonToXml } from 'client/models/Helper'
import { RESOURCE_NAMES, T } from 'client/constants'

/**
 * Displays the creation or modification form to a Marketplace App.
 *
 * @returns {ReactElement} Marketplace App form
 */
function CreateMarketplaceApp() {
  const history = useHistory()
  const { state: [resourceName, { ID } = {}] = [] } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [create] = useAllocateAppMutation()
  const [importApp] = useImportAppMutation()

  const handleTriggerSubmit = async ({ type, ...restOfData }) => {
    try {
      const createApp = {
        [RESOURCE_NAMES.IMAGE]: async () => {
          const { id: imageId, marketId, name, image } = restOfData
          const xml = jsonToXml({ ORIGIN_ID: imageId, NAME: name, ...image })

          return await create({ id: marketId, template: xml })
        },
        [RESOURCE_NAMES.VM]: async () =>
          await importApp({ resource: 'vm', ...restOfData }),
        [RESOURCE_NAMES.VM_TEMPLATE]: async () =>
          await importApp({ resource: 'vm-template', ...restOfData }),
      }[String(type).toLowerCase()]

      const response = await createApp?.()?.unwrap?.()
      response && enqueueSuccess(T.SuccessMarketplaceAppCreated, response)
      history.goBack()
    } catch {}
  }

  return (
    <CreateForm
      initialValues={{ type: resourceName, id: ID }}
      onSubmit={handleTriggerSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateMarketplaceApp
