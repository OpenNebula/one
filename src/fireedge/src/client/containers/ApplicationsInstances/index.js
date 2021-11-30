/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useState } from 'react'

import { Container, Box } from '@mui/material'

import { useFetch } from 'client/hooks'
import { useApplication, useApplicationApi } from 'client/features/One'

import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationCard } from 'client/components/Cards'

import { T } from 'client/constants'

function ApplicationsInstances() {
  const [showDialog, setShowDialog] = useState(false)

  const applications = useApplication()
  const { getApplications } = useApplicationApi()

  const { error, fetchRequest, loading, reloading } = useFetch(getApplications)

  useEffect(() => {
    fetchRequest()
  }, [])

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
          isSubmitting: Boolean(loading || reloading),
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
              handleShow: () => setShowDialog(value),
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
