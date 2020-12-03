import React, { useEffect, useMemo, useState } from 'react'

import { Container, Box } from '@material-ui/core'

import { useApplication, useFetch } from 'client/hooks'
import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationCard, EmptyCard } from 'client/components/Cards'
import { T, DONE, APPLICATION_STATES } from 'client/constants'

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
      <ListHeader
        title={T.ApplicationsInstances}
        hasReloadButton
        reloadButtonProps={{
          onClick: () => fetchRequest(undefined, { reload: true, delay: 500 }),
          isSubmitting: Boolean(loading || reloading)
        }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneFlow}</AlertError>
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
