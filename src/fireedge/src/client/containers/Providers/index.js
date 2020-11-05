import React, { useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Box, LinearProgress } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

// import DeployForm from 'client/containers/Applications/Form'
import ListCards from 'client/components/List/ListCards'
import { ProviderCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

const Providers = () => {
  const history = useHistory()
  // const [showDialog, setShowDialog] = useState(false)
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
    <Box p={3}>
      <ListCards
        list={providers}
        handleCreate={() => history.push(PATH.PROVIDERS.CREATE)}
        CardComponent={ProviderCard}
        cardsProps={({ value: { ID } }) => ({
          handleEdit: () =>
            history.push(PATH.PROVIDERS.EDIT.replace(':id', ID)),
          // handleShow: () => setShowDialog(ID),
          handleRemove: undefined
        })}
      />
      {/* {showDialog !== false && (
        <DeployForm id={showDialog} handleCancel={() => setShowDialog(false)} />
      )} */}
    </Box>
  )
}

export default Providers
