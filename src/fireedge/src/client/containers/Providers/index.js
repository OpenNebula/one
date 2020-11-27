import React, { useState, useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Settings'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import Information from 'client/containers/Providers/Sections/info'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

function Providers () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)
  const { providers, getProviders, getProvider, deleteProvider } = useProvision()
  const {
    error,
    fetchRequest,
    loading,
    reloading
  } = useFetch(getProviders)

  useEffect(() => { fetchRequest() }, [])

  return (
    <Container disableGutters>
      <ListHeader
        title={Tr(T.Providers)}
        hasReloadButton
        reloadButtonProps={{
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{Tr(T.CannotConnectOneProvision)}</AlertError>
        ) : (
          <ListCards
            list={providers}
            isLoading={providers.length === 0 && loading}
            handleCreate={() => history.push(PATH.PROVIDERS.CREATE)}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME } }) => ({
              isProvider: true,
              handleClick: () => setShowDialog({
                id: ID,
                title: `(ID: ${ID}) ${NAME}`
              }),
              actions: [
                {
                  handleClick: () =>
                    history.push(PATH.PROVIDERS.EDIT.replace(':id', ID)),
                  icon: EditIcon,
                  cy: `provider-edit-${ID}`
                },
                {
                  handleClick: () => setShowDialog({
                    id: ID,
                    title: `DELETE provider - (ID: ${ID}) ${NAME}`,
                    handleAccept: () => {
                      deleteProvider({ id: ID })
                      setShowDialog(false)
                    }
                  }),
                  icon: DeleteIcon,
                  iconProps: { color: 'error' },
                  cy: `provider-delete-${ID}`
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
          dialogProps={{
            title: showDialog.title,
            handleCancel: () => setShowDialog(false),
            handleAccept: showDialog.handleAccept
          }}
        >
          {({ data }) => <Information data={data} />}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Providers
