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
import { Redirect, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'

import { useAuth } from 'client/features/Auth'
import { useFetchAll } from 'client/hooks'
import { useProviderApi } from 'client/features/One'
import ProviderForm from 'client/containers/Providers/Form/ProviderForm'
import { getConnectionEditable } from 'client/models/ProviderTemplate'
import { PATH } from 'client/apps/provision/routes'

function ProviderCreateForm () {
  const { id } = useParams()
  const [initialValues, setInitialValues] = useState(null)

  const { providerConfig } = useAuth()
  const { getProvider, getProviderConnection } = useProviderApi()
  const { data: preloadedData, fetchRequestAll, loading, error } = useFetchAll()

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
          PROVISION_BODY: { description, ...currentBodyTemplate }
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
      <ProviderForm {...{ id, preloadedData, initialValues }} />
    </Container>
  )
}

export default ProviderCreateForm
