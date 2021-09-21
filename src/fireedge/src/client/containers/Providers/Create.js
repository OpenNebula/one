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
import { useEffect, useState } from 'react'
import { Redirect, useParams, useHistory } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'

import { useFetchAll } from 'client/hooks'
import { useAuth } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useProviderApi } from 'client/features/One'
import { CreateForm } from 'client/components/Forms/Provider'
import { isValidProviderTemplate, getConnectionEditable, getConnectionFixed } from 'client/models/ProviderTemplate'
import { PATH } from 'client/apps/provision/routes'
import { isDevelopment, deepmerge } from 'client/utils'

function ProviderCreateForm () {
  const [initialValues, setInitialValues] = useState(null)
  const history = useHistory()
  const { id } = useParams()

  const { providerConfig } = useAuth()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const { getProvider, getProviderConnection, createProvider, updateProvider } = useProviderApi()
  const { data: preloadedData, fetchRequestAll, loading, error } = useFetchAll()

  const onSubmit = async formData => {
    try {
      if (id !== undefined) {
        const [provider = {}, connection = []] = preloadedData ?? []
        const providerId = provider?.ID

        const formatData = deepmerge({ connection }, formData)

        await updateProvider(id, formatData)
        enqueueSuccess(`Provider updated - ID: ${providerId}`)
      } else {
        if (!isValidProviderTemplate(formData, providerConfig)) {
          enqueueError('The template selected has a bad format. Ask your cloud administrator')
          history.push(PATH.PROVIDERS.LIST)
        }

        const connectionFixed = getConnectionFixed(formData, providerConfig)
        const formatData = deepmerge(formData, { connection: connectionFixed })

        const responseId = await createProvider(formatData)
        enqueueSuccess(`Provider created - ID: ${responseId}`)
      }

      history.push(PATH.PROVIDERS.LIST)
    } catch (err) {
      isDevelopment() && console.error(err)
    }
  }

  useEffect(() => {
    const preloadFetchData = async () => {
      const data = await fetchRequestAll([
        getProvider(id),
        getProviderConnection(id)
      ])

      if (data) {
        const [provider = {}, connection = []] = data

        const {
          PLAIN: { provider: plainProvider } = {},
          // remove encrypted connection from body template
          PROVISION_BODY: { description, connection: _, ...currentBodyTemplate }
        } = provider?.TEMPLATE

        const connectionEditable = getConnectionEditable(
          { provider: plainProvider, connection },
          providerConfig
        )

        setInitialValues({
          template: [currentBodyTemplate],
          connection: connectionEditable,
          configuration: { description }
        })
      }
    }

    id && preloadFetchData()
  }, [])

  if (error) {
    return <Redirect to={PATH.PROVIDERS.LIST} />
  }

  return (id && !initialValues) || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <CreateForm
        stepProps={{ isUpdate: id !== undefined }}
        onSubmit={onSubmit}
        initialValues={initialValues}
      />
    </Container>
  )
}

export default ProviderCreateForm
