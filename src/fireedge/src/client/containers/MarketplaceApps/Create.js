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
import { useMemo, JSXElementConstructor } from 'react'
import { useHistory, useLocation } from 'react-router'
import { Container } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
// import { useMarketplaceAppApi } from 'client/features/One'
import { CreateForm } from 'client/components/Forms/MarketplaceApp'
import { isDevelopment } from 'client/utils'

/**
 * Displays the creation or modification form to a Marketplace App.
 *
 * @returns {JSXElementConstructor} Marketplace App form
 */
function CreateMarketplaceApp() {
  const history = useHistory()
  const { state: [resourceName, { ID } = {}] = [] } = useLocation()
  const initialValues = useMemo(() => ({ type: resourceName, id: ID }), [])

  const { enqueueSuccess } = useGeneralApi()
  // const { } = useMarketplaceAppApi()

  const onSubmit = async (template) => {
    try {
      isDevelopment() && console.log({ template })
      history.goBack()
      enqueueSuccess('TODO: Marketplace app request')
    } catch (err) {
      isDevelopment() && console.error(err)
    }
  }

  return (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <CreateForm initialValues={initialValues} onSubmit={onSubmit} />
    </Container>
  )
}

export default CreateMarketplaceApp
