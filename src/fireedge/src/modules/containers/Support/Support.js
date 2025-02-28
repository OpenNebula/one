/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import {
  TranslateProvider,
  Translate,
  Tr,
  SupportTabs,
  SupportTable,
  SplitGrid,
  SubmitButton,
} from '@ComponentsModule'
import { T, Ticket } from '@ConstantsModule'

import {
  SupportAPI,
  useGeneralApi,
  useSupportAuth,
  useSupportAuthApi,
} from '@FeaturesModule'
import { AuthenticationForm as AuthForm } from '@modules/containers/Support/Authentication'
import { InformationSettings as Information } from '@modules/containers/Support/Information'
import { DocumentationSettings as Documentation } from '@modules/containers/Support/Documentation'

import GotoIcon from 'iconoir-react/dist/Pin'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import Cancel from 'iconoir-react/dist/Cancel'

/** @returns {ReactElement} Support container */
export const Support = () => {
  const [login, loginState] = SupportAPI.useLoginSupportMutation()
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

  return (
    <TranslateProvider>
      {!userState ? (
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
      )}
    </TranslateProvider>
  )
}

/**
 * Displays a list of VMs with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VMs list and selected row(s)
 */
function SupportTickets() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])
  const actions = SupportTable.Actions()

  const hasSelectedRows = selectedRows?.length > 0

  return (
    <TranslateProvider>
      <SplitGrid gridTemplateRows="1fr auto 1fr">
        {({ getGridProps, GutterComponent }) => (
          <Box height={1} {...(hasSelectedRows && getGridProps())}>
            <SupportTable.Table
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
      </SplitGrid>
    </TranslateProvider>
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
  const [getComments, { isFetching }] =
    SupportAPI.useLazyGetTicketCommentsQuery()
  const { id, subject: name } = ticket

  return (
    <TranslateProvider>
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
    </TranslateProvider>
  )
})

InfoTabs.propTypes = {
  ticket: PropTypes.object,
  gotoPage: PropTypes.func,
  unselect: PropTypes.func,
}

InfoTabs.displayName = 'InfoTabs'
