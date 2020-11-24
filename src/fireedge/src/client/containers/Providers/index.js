import React, { useState, useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box, Typography, Divider } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Autorenew'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import ListCards from 'client/components/List/ListCards'
import AlertError from 'client/components/Alerts/Error'
import { ProviderCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import Information from 'client/containers/Providers/Sections/info'

import { ProvidersLabel, CannotConnectOneProvision } from 'client/constants/translates'
import { Tr } from 'client/components/HOC'

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
      <Box p={3} display="flex" alignItems="center">
        <SubmitButton
          fab
          onClick={() => fetchRequest(undefined, { reload: true })}
          isSubmitting={loading || reloading}
          label={<RefreshIcon />}
        />
        <Typography variant="h5" style={{ marginLeft: 8 }}>
          {Tr(ProvidersLabel)}
        </Typography>
      </Box>
      <Divider />
      <Box p={3}>
        {error ? (
          <AlertError>{Tr(CannotConnectOneProvision)}</AlertError>
        ) : (
          <ListCards
            list={providers}
            isLoading={providers.length === 0 && loading}
            handleCreate={() => history.push(PATH.PROVIDERS.CREATE)}
            CardComponent={ProviderCard}
            cardsProps={({ value }) => ({
              handleEdit: () =>
                history.push(PATH.PROVIDERS.EDIT.replace(':id', value.ID)),
              handleShow: () => setShowDialog({
                id: value.ID,
                title: `(ID: ${value.ID}) ${value.NAME}`
              }),
              handleDelete: () => setShowDialog({
                id: value.ID,
                title: `DELETE provider - (ID: ${value.ID}) ${value.NAME}`,
                handleAccept: () => {
                  deleteProvider({ id: value.ID })
                  setShowDialog(false)
                }
              })
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
