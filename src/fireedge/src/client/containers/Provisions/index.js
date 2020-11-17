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
import { Provisions as ProvisionsLabel } from 'client/constants/translates'

function Provisions () {
  const history = useHistory()
  const { provisions, getProvisions } = useProvision()
  const {
    error,
    fetchRequest,
    loading,
    reloading
  } = useFetch(getProvisions)

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
          {Tr(ProvisionsLabel)}
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
        )}
      </Box>
    </Container>
  )
}

export default Provisions
