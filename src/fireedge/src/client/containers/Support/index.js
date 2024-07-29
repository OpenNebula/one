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
import { ReactElement, useState, memo } from 'react'
import { Box, Typography, Divider, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { Translate, Tr } from 'client/components/HOC'
import { T, Ticket } from 'client/constants'

import {
  useLoginSupportMutation,
  useLazyGetTicketCommentsQuery,
} from 'client/features/OneApi/support'
import AuthForm from 'client/containers/Support/Authentication'
import Information from 'client/containers/Support/Information'
import Documentation from 'client/containers/Support/Documentation'

import SupportTabs from 'client/components/Tabs/Support'
import { SupportTable } from 'client/components/Tables'
import SupportActions from 'client/components/Tables/Support/actions'
import SplitPane from 'client/components/SplitPane'

import GotoIcon from 'iconoir-react/dist/Pin'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import Cancel from 'iconoir-react/dist/Cancel'

import { SubmitButton } from 'client/components/FormControl'
import { useGeneralApi } from 'client/features/General'
import { useSupportAuth, useSupportAuthApi } from 'client/features/SupportAuth'

/** @returns {ReactElement} Support container */
const Support = () => {
  const [login, loginState] = useLoginSupportMutation()
  const isLoading = loginState.isLoading
  const [dataUserForm] = useState(undefined)
  const { enqueueError } = useGeneralApi()
  const { user: userState } = useSupportAuth()
  const { changeSupportAuthUser } = useSupportAuthApi()

  const handleSubmit = async (dataForm) => {
    try {
      const { user } = await login({
        ...dataUserForm,
        ...dataForm,
      }).unwrap()

      if (user) {
        changeSupportAuthUser(user)
      } else {
        enqueueError(T.ErrorSupportCredentials)
      }
    } catch {}
  }

  return !userState ? (
    <>
      <Typography variant="h5">
        <Translate word={T.CommercialSupportRequests} />
      </Typography>

      <Divider sx={{ my: '1em' }} />

      <Box
        display="grid"
        gridTemplateColumns={{
          sm: '1fr',
          md: 'repeat(2, minmax(49%, 1fr))',
        }}
        gap="1em"
      >
        <Information />

        <AuthForm onSubmit={handleSubmit} isLoading={isLoading} />

        <Documentation />
      </Box>
    </>
  ) : (
    <SupportTickets />
  )
}

/**
 * Displays a list of VMs with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VMs list and selected row(s)
 */
function SupportTickets() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])
  const actions = SupportActions()

  const hasSelectedRows = selectedRows?.length > 0

  return (
    <SplitPane gridTemplateRows="1fr auto 1fr">
      {({ getGridProps, GutterComponent }) => (
        <Box height={1} {...(hasSelectedRows && getGridProps())}>
          <SupportTable
            onSelectedRowsChange={onSelectedRowsChange}
            globalActions={actions}
            singleSelect={true}
          />

          {hasSelectedRows && (
            <>
              <GutterComponent direction="row" track={1} />

              <InfoTabs
                ticket={selectedRows[0]?.original}
                gotoPage={selectedRows[0]?.gotoPage}
                unselect={() => selectedRows[0]?.toggleRowSelected(false)}
              />
            </>
          )}
        </Box>
      )}
    </SplitPane>
  )
}

/**
 * Displays details of a support ticket.
 *
 * @param {Ticket} ticket - Support ticket to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a support tickets
 * @param {Function} [unselect] - Function to unselect a support ticket
 * @returns {ReactElement} Ticket details
 */
const InfoTabs = memo(({ ticket, gotoPage, unselect }) => {
  const [getComments, { isFetching }] = useLazyGetTicketCommentsQuery()
  const { id, subject: name } = ticket

  return (
    <Stack overflow="auto">
      <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
        <Typography color="text.primary" noWrap flexGrow={1}>
          {`#${id} | ${name}`}
        </Typography>

        {/* -- ACTIONS -- */}
        <SubmitButton
          data-cy="detail-refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isFetching}
          onClick={() => getComments({ id })}
        />
        {typeof gotoPage === 'function' && (
          <SubmitButton
            data-cy="locate-on-table"
            icon={<GotoIcon />}
            tooltip={Tr(T.LocateOnTable)}
            onClick={() => gotoPage()}
          />
        )}
        {typeof unselect === 'function' && (
          <SubmitButton
            data-cy="unselect"
            icon={<Cancel />}
            tooltip={Tr(T.Close)}
            onClick={() => unselect()}
          />
        )}
        {/* -- END ACTIONS -- */}
      </Stack>
      <SupportTabs ticket={ticket} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  ticket: PropTypes.object,
  gotoPage: PropTypes.func,
  unselect: PropTypes.func,
}

InfoTabs.displayName = 'InfoTabs'

export default Support
