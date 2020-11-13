import React, { useEffect } from 'react'

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

import { Tr } from 'client/components/HOC'
import { Providers as ProvidersLabel } from 'client/constants/translates'

function Providers () {
  const history = useHistory()
  const { providers, getProviders } = useProvision()
  const {
    error,
    fetchRequest,
    loading,
    reloading
  } = useFetch(getProviders)

  useEffect(() => {
    fetchRequest()
  }, [])

  return (
    <Container disableGutters>
      <Box p={3} display="flex" alignItems="center">
        <SubmitButton
          fab
          onClick={() => fetchRequest(undefined, true)}
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
          <AlertError>
            {Tr('Cannot connect to OneProvision server')}
          </AlertError>
        ) : (
          <ListCards
            list={providers}
            isLoading={providers.length === 0 && loading}
            handleCreate={() => history.push(PATH.PROVIDERS.CREATE)}
            CardComponent={ProviderCard}
            cardsProps={({ value: { ID } }) => ({
              handleEdit: () =>
                history.push(PATH.PROVIDERS.EDIT.replace(':id', ID)),
              handleRemove: undefined
            })}
          />
        )}
      </Box>
    </Container>
  )
}

export default Providers
