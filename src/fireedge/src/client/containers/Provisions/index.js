import React, { useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import { ProviderCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

const Provisions = () => {
  const history = useHistory()
  const { provisions, getProvisions } = useProvision()
  const { fetchRequest, loading, error } = useFetch(getProvisions)

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

  return (
    <Container disableGutters>
      <Box p={3}>
        <ListCards
          list={provisions}
          isLoading={provisions.length === 0 && loading}
          handleCreate={() => history.push(PATH.PROVISIONS.CREATE)}
          CardComponent={ProviderCard}
          cardsProps={({ value: { ID } }) => ({
            handleEdit: () =>
              history.push(PATH.PROVISIONS.EDIT.replace(':id', ID)),
            handleRemove: undefined
          })}
        />
      </Box>
    </Container>
  )
}

export default Provisions
