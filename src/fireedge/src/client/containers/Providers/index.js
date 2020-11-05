import React, { useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { LinearProgress, Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import { ProviderCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

const Providers = () => {
  const history = useHistory()
  const { providers, getProviders } = useProvision()
  const { fetchRequest, loading, error } = useFetch(getProviders)

  useEffect(() => {
    fetchRequest()
  }, [])

  if (error) {
    return (
      <Box pt={3} display="flex" justifyContent="center">
        <Alert severity="error" icon={false} variant="filled">
          {Tr('Cannot connect to OneProvision server')}
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Container disableGutters>
      <Box p={3}>
        <ListCards
          list={providers}
          handleCreate={() => history.push(PATH.PROVIDERS.CREATE)}
          CardComponent={ProviderCard}
          cardsProps={({ value: { ID } }) => ({
            handleEdit: () =>
              history.push(PATH.PROVIDERS.EDIT.replace(':id', ID)),
            handleRemove: undefined
          })}
        />
      </Box>
    </Container>
  )
}

export default Providers
