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
/* eslint-disable jsdoc/require-jsdoc */
import { useParams, useHistory } from 'react-router'
import { Container } from '@mui/material'

import { useAuth } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useProviderApi } from 'client/features/One'
import { CreateForm } from 'client/components/Forms/Provider'
import { isValidProviderTemplate } from 'client/models/ProviderTemplate'
import { PATH } from 'client/apps/provision/routes'
import { isDevelopment } from 'client/utils'

function ProviderCreateForm () {
  const history = useHistory()
  const { id } = useParams()

  const { providerConfig } = useAuth()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const { createProvider, updateProvider } = useProviderApi()

  const onSubmit = async formData => {
    try {
      if (id !== undefined) {
        await updateProvider(id, formData)
        enqueueSuccess(`Provider updated - ID: ${id}`)
      } else {
        if (!isValidProviderTemplate(formData, providerConfig)) {
          enqueueError('The template selected has a bad format. Ask your cloud administrator')
          history.push(PATH.PROVIDERS.LIST)
        }

        const responseId = await createProvider(formData)
        enqueueSuccess(`Provider created - ID: ${responseId}`)
      }

      history.push(PATH.PROVIDERS.LIST)
    } catch (err) {
      isDevelopment() && console.error(err)
    }
  }

  return (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <CreateForm providerId={id} onSubmit={onSubmit} />
    </Container>
  )
}

export default ProviderCreateForm
