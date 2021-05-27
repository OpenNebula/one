import React, { useEffect, useState } from 'react'

import { Container, Box } from '@material-ui/core'

import { useFetch } from 'client/hooks'
import { useApplication, useApplicationApi } from 'client/features/One'

import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationCard } from 'client/components/Cards'

import { T } from 'client/constants'

function ApplicationsInstances () {
  const [showDialog, setShowDialog] = useState(false)

  const applications = useApplication()
  const { getApplications } = useApplicationApi()

  const { error, fetchRequest, loading, reloading } = useFetch(getApplications)

  useEffect(() => { fetchRequest() }, [])

  // const list = useMemo(() => (
  //   applications.length > 0
  //     ? applications?.filter(({ TEMPLATE: { BODY: { state } } }) =>
  //       APPLICATION_STATES[state]?.name !== DONE
  //     )
  //     : applications
  // ), [applications])

  return (
    <Container disableGutters>
      <ListHeader
        title={T.ApplicationsInstances}
        hasReloadButton
        reloadButtonProps={{
          'data-cy': 'refresh-application-list',
          onClick: () => fetchRequest(undefined, { reload: true, delay: 500 }),
          isSubmitting: Boolean(loading || reloading)
        }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneFlow}</AlertError>
        ) : (
          <ListCards
            list={applications}
            isLoading={applications.length === 0 && loading}
            gridProps={{ 'data-cy': 'applications' }}
            CardComponent={ApplicationCard}
            cardsProps={({ value }) => ({
              handleShow: () => setShowDialog(value)
            })}
          />
        )}
      </Box>
      {showDialog !== false && (
        <DialogInfo
          info={showDialog}
          handleClose={() => setShowDialog(false)}
        />
      )}
    </Container>
  )
}

export default ApplicationsInstances
