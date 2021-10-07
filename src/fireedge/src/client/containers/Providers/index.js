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
import { useState, useEffect } from 'react'

import { useHistory, generatePath } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import { Trash as DeleteIcon, Settings as EditIcon } from 'iconoir-react'

import { PATH } from 'client/apps/provision/routes'
import { useProvider, useProviderApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { useFetch, useSearch } from 'client/hooks'
import { useAuth } from 'client/features/Auth'

import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'
import { DialogRequest } from 'client/components/Dialogs'
import Information from 'client/containers/Providers/Sections/info'
import { T } from 'client/constants'

function Providers () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)

  const { providerConfig } = useAuth()
  const providers = useProvider()
  const { getProviders, getProvider, deleteProvider } = useProviderApi()
  const { enqueueSuccess } = useGeneralApi()

  const { error, fetchRequest, loading, reloading } = useFetch(getProviders)

  const { result, handleChange } = useSearch({
    list: providers,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] }
  })

  useEffect(() => { fetchRequest() }, [])

  const handleCancel = () => setShowDialog(false)

  return (
    <Container disableGutters>
      <ListHeader
        title={T.Providers}
        reloadButtonProps={{
          'data-cy': 'refresh-provider-list',
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
        addButtonProps={{
          'data-cy': 'create-provider',
          onClick: () => history.push(PATH.PROVIDERS.CREATE)
        }}
        searchProps={{ handleChange }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneProvision}</AlertError>
        ) : (
          <ListCards
            list={result ?? providers}
            isLoading={providers.length === 0 && loading}
            gridProps={{ 'data-cy': 'providers' }}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME, TEMPLATE } }) => ({
              image: providerConfig[TEMPLATE?.PLAIN?.provider]?.image,
              isProvider: true,
              handleClick: () => setShowDialog({
                id: ID,
                title: `#${ID} ${NAME}`
              }),
              actions: [
                {
                  handleClick: () =>
                    history.push(generatePath(PATH.PROVIDERS.EDIT, { id: ID })),
                  icon: <EditIcon />,
                  cy: 'provider-edit'
                },
                {
                  handleClick: () => setShowDialog({
                    id: ID,
                    title: `DELETE | #${ID} ${NAME}`,
                    handleAccept: () => {
                      setShowDialog(false)

                      return deleteProvider(ID)
                        .then(() => enqueueSuccess(`Provider deleted - ID: ${ID}`))
                        .then(() => fetchRequest(undefined, { reload: true }))
                    }
                  }),
                  icon: <DeleteIcon />,
                  color: 'error',
                  cy: 'provider-delete'
                }
              ]
            })}
          />
        )}
      </Box>
      {showDialog !== false && (
        <DialogRequest
          request={() => getProvider(showDialog.id)}
          dialogProps={{ fixedWidth: true, handleCancel, ...showDialog }}
        >
          {fetchProps => <Information {...fetchProps} />}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Providers
