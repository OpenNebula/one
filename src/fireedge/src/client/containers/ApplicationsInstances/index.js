import React, { useEffect, useState } from 'react'

import { Box, LinearProgress } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'

import { ApplicationCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

function ApplicationsInstances () {
  const { applications, getApplications } = useApplication()
  const [showDialog, setShowDialog] = useState(false)
  const { fetchRequest, loading, error } = useFetch(getApplications)

  useEffect(() => {
    fetchRequest()
  }, [])

  if (error) {
    return (
      <Box pt={3} display="flex" justifyContent="center">
        <Alert severity="error" icon={false} variant="filled">
          {Tr('Cannot connect to OneFlow server')}
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
        list={applications}
        CardComponent={ApplicationCard}
        cardsProps={({ value }) => ({
          handleShow: () => setShowDialog(value)
        })}
      />
      {showDialog !== false && (
        <DialogInfo info={showDialog} handleClose={() => setShowDialog(false)} />
      )}
    </Box>
  )
}

export default ApplicationsInstances
