import React, { useEffect, useMemo, useState } from 'react'

import { Container, Box, Typography, Divider } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Autorenew'

import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import SubmitButton from 'client/components/FormControl/SubmitButton'
import ListCards from 'client/components/List/ListCards'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationCard, EmptyCard } from 'client/components/Cards'

import { DONE } from 'client/constants/states'
import { APPLICATION_STATES } from 'client/constants/flow'
import { Tr } from 'client/components/HOC'
import {
  ApplicationsInstances as ApplicationsInstancesLabel,
  CannotConnectOneFlow
} from 'client/constants/translates'

function ApplicationsInstances () {
  const { applications, getApplications } = useApplication()
  const [showDialog, setShowDialog] = useState(false)
  const { error, fetchRequest, loading, reloading } = useFetch(getApplications)

  useEffect(() => { fetchRequest() }, [])

  const list = useMemo(() => (
    applications.length > 0
      ? applications?.filter(({ TEMPLATE: { BODY: { state } } }) =>
        APPLICATION_STATES[state]?.name !== DONE
      )
      : applications
  ), [applications])

  return (
    <Container disableGutters>
      <Box p={3} display="flex" alignItems="center">
        <SubmitButton
          fab
          onClick={() => fetchRequest(undefined, { reload: true, delay: 500 })}
          isSubmitting={loading || reloading}
          label={<RefreshIcon />}
        />
        <Typography variant="h5" style={{ marginLeft: 8 }}>
          {Tr(ApplicationsInstancesLabel)}
        </Typography>
      </Box>
      <Divider />
      <Box p={3}>
        {error ? (
          <AlertError>
            {Tr(CannotConnectOneFlow)}
          </AlertError>
        ) : (
          <ListCards
            list={list}
            isLoading={list.length === 0 && loading}
            EmptyComponent={
              <EmptyCard title={'Your applications instances list is empty'} />
            }
            CardComponent={ApplicationCard}
            cardsProps={({ value }) => ({
              handleShow: () => setShowDialog(value)
            })}
            breakpoints={{ xs: 12, sm: 6, md: 4 }}
          />
        )}
        {showDialog !== false && (
          <DialogInfo
            info={showDialog}
            handleClose={() => setShowDialog(false)}
          />
        )}
      </Box>
    </Container>
  )
}

export default ApplicationsInstances
