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
/* eslint-disable react/prop-types */
import { ReactElement, useState, memo, useEffect } from 'react'
import { Box, Typography, Divider, Stack, Chip } from '@mui/material'
import PropTypes from 'prop-types'
import {
  TranslateProvider,
  Translate,
  Tr,
  SupportTabs,
  SupportTable,
  SubmitButton,
  MultipleTags,
  ResourcesBackButton,
} from '@ComponentsModule'
import { T, Ticket, SERVER_CONFIG } from '@ConstantsModule'

import {
  SupportAPI,
  useGeneralApi,
  useSupportAuth,
  useSupportAuthApi,
  useGeneral,
  useAuth,
} from '@FeaturesModule'
import { AuthenticationForm as AuthForm } from '@modules/containers/Support/Authentication'
import { InformationSettings as Information } from '@modules/containers/Support/Information'
import { DocumentationSettings as Documentation } from '@modules/containers/Support/Documentation'

import {
  Cancel,
  RefreshDouble,
  Expand,
  Collapse,
  NavArrowLeft,
} from 'iconoir-react'

import { MuiProvider, SunstoneTheme } from '@ProvidersModule'
import { Row } from 'opennebula-react-table'

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

  return (
    <MuiProvider theme={SunstoneTheme}>
      <TranslateProvider>
        <ResourcesBackButton
          selectedRows={selectedRows}
          setSelectedRows={onSelectedRowsChange}
          actions={actions}
          table={(props) => (
            <SupportTable.Table
              onSelectedRowsChange={props.setSelectedRows}
              globalActions={props.actions}
              useUpdateMutation={props.useUpdateMutation}
              onRowClick={props.resourcesBackButtonClick}
              zoneId={props.zone}
              initialState={{
                selectedRowIds: props.selectedRowsTable,
              }}
              singleSelect
            />
          )}
          simpleGroupsTags={(props) => (
            <GroupedTags
              tags={props.selectedRows}
              handleElement={props.handleElement}
              onDelete={props.handleUnselectRow}
            />
          )}
          info={(props) => {
            const propsInfo = {
              ticket: props?.selectedRows?.[0]?.original,
              selectedRows: props?.selectedRows,
            }
            props?.gotoPage && (propsInfo.gotoPage = props.gotoPage)
            props?.unselect && (propsInfo.unselect = props.unselect)

            return <InfoTabs {...propsInfo} />
          }}
        />
      </TranslateProvider>
    </MuiProvider>
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
  const id = ticket?.id

  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { FULL_SCREEN_INFO } = fireedge
  const { fullViewMode } = SERVER_CONFIG
  const fullModeDefault =
    FULL_SCREEN_INFO !== undefined ? FULL_SCREEN_INFO === 'true' : fullViewMode
  const { isFullMode } = useGeneral()
  const { setFullMode } = useGeneralApi()

  useEffect(() => {
    !isFullMode && gotoPage()
  }, [])

  return (
    <Stack overflow="auto">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        mx={1}
        mb={1}
      >
        <Stack direction="row">
          {fullModeDefault && (
            <SubmitButton
              data-cy="detail-back"
              icon={<NavArrowLeft />}
              tooltip={Tr(T.Back)}
              isSubmitting={isFetching}
              onClick={() => unselect()}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
          {!fullModeDefault && (
            <SubmitButton
              data-cy="detail-full-mode"
              icon={isFullMode ? <Collapse /> : <Expand />}
              tooltip={Tr(T.FullScreen)}
              isSubmitting={isFetching}
              onClick={() => {
                setFullMode(!isFullMode)
              }}
            />
          )}
          <SubmitButton
            data-cy="detail-refresh"
            icon={<RefreshDouble />}
            tooltip={Tr(T.Refresh)}
            isSubmitting={isFetching}
            onClick={() => getComments({ id })}
          />
          {typeof unselect === 'function' && (
            <SubmitButton
              data-cy="unselect"
              icon={<Cancel />}
              tooltip={Tr(T.Close)}
              onClick={() => unselect()}
            />
          )}
        </Stack>
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

/**
 * Displays a list of tags that represent the selected rows.
 *
 * @param {Row[]} tags - Row(s) to display as tags
 * @returns {ReactElement} List of tags
 */
const GroupedTags = ({
  tags = [],
  handleElement = true,
  onDelete = () => undefined,
}) => (
  <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
    <MultipleTags
      limitTags={10}
      tags={tags?.map((props) => {
        const { original, id, toggleRowSelected, gotoPage } = props
        const clickElement = handleElement
          ? {
              onClick: gotoPage,
              onDelete: () => onDelete(id) || toggleRowSelected(false),
            }
          : {}

        return <Chip key={id} label={original?.NAME ?? id} {...clickElement} />
      })}
    />
  </Stack>
)

GroupedTags.propTypes = {
  tags: PropTypes.array,
  handleElement: PropTypes.bool,
  onDelete: PropTypes.func,
}
GroupedTags.displayName = 'GroupedTags'
