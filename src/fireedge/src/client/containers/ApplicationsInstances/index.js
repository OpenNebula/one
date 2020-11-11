import React, { useEffect, useMemo, useState } from 'react'

import { Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import { ApplicationCard, EmptyCard } from 'client/components/Cards'

import { DONE, APPLICATION_STATES } from 'client/constants/states'
import { CannotConnectOneFlow } from 'client/constants/translates'
import { Tr } from 'client/components/HOC'

const Error = () => (
  <Box pt={3} display="flex" justifyContent="center">
    <Alert severity="error" icon={false} variant="filled">
      {Tr(CannotConnectOneFlow)}
    </Alert>
  </Box>
)

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
    return <Error />
  }

  return (
    <Container disableGutters>
      <Box p={3}>
        <ListCards
          list={list}
          isLoading={list.length === 0 && loading}
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
