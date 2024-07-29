/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useState } from 'react'
import { Box } from '@mui/material'

import { useGetServicesQuery } from 'client/features/OneApi/service'
import DialogInfo from 'client/containers/ApplicationsInstances/DialogInfo'
import AlertError from 'client/components/Alerts/Error'
import { ListHeader, ListCards } from 'client/components/List'
import { ApplicationCard } from 'client/components/Cards'
import { T } from 'client/constants'

function ApplicationsInstances() {
  const [showDialog, setShowDialog] = useState(false)

  const {
    data: applications = [],
    refetch,
    error,
    isLoading,
  } = useGetServicesQuery()

  return (
    <>
      <ListHeader
        title={T.ApplicationsInstances}
        hasReloadButton
        reloadButtonProps={{
          'data-cy': 'refresh-application-list',
          onClick: () => refetch(),
          isSubmitting: isLoading,
        }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneFlow}</AlertError>
        ) : (
          <ListCards
            list={applications}
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
    </>
  )
}

export default ApplicationsInstances
