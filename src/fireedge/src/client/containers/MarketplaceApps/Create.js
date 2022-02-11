/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'
import { Container } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import {
  useAllocateAppMutation,
  useImportAppMutation,
} from 'client/features/OneApi/marketplaceApp'
import { CreateForm } from 'client/components/Forms/MarketplaceApp'
import { jsonToXml } from 'client/models/Helper'
import { RESOURCE_NAMES } from 'client/constants'

/**
 * Displays the creation or modification form to a Marketplace App.
 *
 * @returns {ReactElement} Marketplace App form
 */
function CreateMarketplaceApp() {
  const history = useHistory()
  const { state: [resourceName, { ID } = {}] = [] } = useLocation()
  const initialValues = useMemo(() => ({ type: resourceName, id: ID }), [])

  const { enqueueSuccess } = useGeneralApi()
  const [create] = useAllocateAppMutation()
  const [importApp] = useImportAppMutation()

  const onSubmit = async ({ type, ...formData }) => {
    try {
      const createApp = {
        [RESOURCE_NAMES.IMAGE]: async () => {
          const { id: imageId, marketId, name, image } = formData
          const xml = jsonToXml({ ORIGIN_ID: imageId, NAME: name, ...image })

          return await create({ id: marketId, template: xml })
        },
        [RESOURCE_NAMES.VM]: async () =>
          await importApp({ resource: 'vm', ...formData }),
        [RESOURCE_NAMES.VM_TEMPLATE]: async () =>
          await importApp({ resource: 'vm-template', ...formData }),
      }[String(type).toLowerCase()]

      const response = await createApp?.()?.unwrap?.()
      response && enqueueSuccess(`Marketplace App created: ${response}`)
      history.goBack()
    } catch {}
  }

  return (
    <Container sx={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <CreateForm initialValues={initialValues} onSubmit={onSubmit} />
    </Container>
  )
}

export default CreateMarketplaceApp
