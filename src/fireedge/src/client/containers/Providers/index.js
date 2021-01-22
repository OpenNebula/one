import React, { useState, useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Settings'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/router/provision'
import { useProvision, useFetch, useSearch } from 'client/hooks'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import Information from 'client/containers/Providers/Sections/info'
import { T } from 'client/constants'

function Providers () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)

  const { providers, getProviders, getProvider, deleteProvider } = useProvision()

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
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
        addButtonProps={{ 'data-cy': 'create-provider', onClick: () => history.push(PATH.PROVIDERS.CREATE) }}
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
                    title: `DELETE provider - #${ID} - ${NAME}`,
                    handleAccept: () => {
                      deleteProvider({ id: ID })
                      setShowDialog(false)
                    }
                  }),
                  icon: <DeleteIcon color='error' />,
                  cy: 'provider-delete'
                }
              ]
            })}
            breakpoints={{ xs: 12, sm: 6, md: 4 }}
          />
        )}
      </Box>
      {showDialog !== false && (
        <DialogRequest
          request={() => getProvider({ id: showDialog.id })}
          dialogProps={{ handleCancel, ...showDialog }}
        >
          {({ data }) => <Information data={data} />}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Providers
