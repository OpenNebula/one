import React, { useEffect, useMemo, useState } from 'react'

import { LinearProgress, Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import { ApplicationCard, EmptyCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

import { DONE, APPLICATION_STATES } from 'client/constants/states'

function ApplicationsInstances () {
  const { applications, getApplications } = useApplication()
  const [showDialog, setShowDialog] = useState(false)
  const { fetchRequest, loading, error } = useFetch(getApplications)

  useEffect(() => {
    fetchRequest()
  }, [])

  const list = useMemo(() => (
    applications.length > 0
      ? applications?.filter(({ TEMPLATE: { BODY: { state } } }) =>
        APPLICATION_STATES[state]?.name !== DONE
      )
      : applications
  ), [applications])

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
    <Container disableGutters>
      <Box p={3}>
        <ListCards
          list={list}
          EmptyComponent={<EmptyCard name={'applications instances'} />}
          CardComponent={ApplicationCard}
          cardsProps={({ value }) => ({
            handleShow: () => setShowDialog(value)
          })}
        />
        {showDialog !== false && (
          <DialogInfo info={showDialog} handleClose={() => setShowDialog(false)} />
        )}
      </Box>
    </Container>
  )
}

export default ApplicationsInstances
