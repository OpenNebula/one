import React, { useState, useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Settings'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/apps/provision/routes'
import { useProvider, useProviderApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { useFetch, useSearch } from 'client/hooks'

import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'
import { DialogRequest } from 'client/components/Dialogs'
import Information from 'client/containers/Providers/Sections/info'
import { T } from 'client/constants'

function Providers () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)

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
            cardsProps={({ value: { ID, NAME } }) => ({
              isProvider: true,
              handleClick: () => setShowDialog({
                id: ID,
                title: NAME,
                subheader: `#${ID}`
              }),
              actions: [
                {
                  handleClick: () =>
                    history.push(PATH.PROVIDERS.EDIT.replace(':id', ID)),
                  icon: <EditIcon />,
                  cy: 'provider-edit'
                },
                {
                  handleClick: () => setShowDialog({
                    id: ID,
                    title: `DELETE - ${NAME}`,
                    subheader: `#${ID}`,
                    handleAccept: () => {
                      setShowDialog(false)

                      return deleteProvider(ID)
                        .then(() => enqueueSuccess(`Provider deleted - ID: ${ID}`))
                        .then(() => fetchRequest(undefined, { reload: true }))
                    }
                  }),
                  icon: <DeleteIcon color='error' />,
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
          dialogProps={{ handleCancel, ...showDialog }}
        >
          {fetchProps => <Information {...fetchProps} />}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Providers
