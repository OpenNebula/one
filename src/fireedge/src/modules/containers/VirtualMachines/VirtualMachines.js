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
import {
  MultipleTags,
  ResourcesBackButton,
  SubmitButton,
  Tr,
  TranslateProvider,
  VmsTable,
  VmTabs,
} from '@ComponentsModule'
import { T, VM } from '@ConstantsModule'
import {
  setSelectedIds,
  useGeneral,
  VmAPI,
  useAuth,
  useGeneralApi,
} from '@FeaturesModule'
import { ButtonClearErrors } from '@modules/containers/VirtualMachines/ButtonClearErrors'
import { Chip, Stack } from '@mui/material'
import {
  Cancel,
  RefreshDouble,
  Expand,
  Collapse,
  NavArrowLeft,
} from 'iconoir-react'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

/**
 * Displays a list of VMs with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VMs list and selected row(s)
 */
export function VirtualMachines() {
  const [dismissError] = VmAPI.useUpdateUserTemplateMutation()
  const dispatch = useDispatch()
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = VmsTable.Actions(selectedRows)
  const { zone } = useGeneral()

  useEffect(() => {
    const selectedIds = selectedRows.map((row) => row.original.ID)
    dispatch(setSelectedIds(selectedIds))
  }, [selectedRows, dispatch])

  const handleDismissError = useCallback(
    async (id, xml) => dismissError({ id, template: xml, replace: 0 }),
    []
  )

  return (
    <TranslateProvider>
      <ResourcesBackButton
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        useUpdateMutation={VmAPI.useUpdateUserTemplateMutation}
        zone={zone}
        actions={actions}
        handleDismissError={handleDismissError}
        table={(props) => (
          <VmsTable.Table
            onSelectedRowsChange={props.setSelectedRows}
            globalActions={props.actions}
            onRowClick={props.resourcesBackButtonClick}
            useUpdateMutation={props.useUpdateMutation}
            zoneId={props.zone}
            initialState={{
              selectedRowIds: props.selectedRowsTable,
            }}
          />
        )}
        simpleGroupsTags={(props) => {
          const propsSimpleGroups = {
            tags: props.selectedRows,
            handleElement: props.handleElement,
            onDelete: props.handleUnselectRow,
          }
          props.moreThanOneSelected &&
            props.handleDismissError &&
            (propsSimpleGroups.handleDismissError = props.handleDismissError)

          return <GroupedTags {...propsSimpleGroups} />
        }}
        info={(props) => {
          const propsInfo = {
            vm: props?.selectedRows?.[0]?.original,
            selectedRows: props?.selectedRows,
          }
          props?.selectedRows && (propsInfo.tags = props.tags)
          props?.gotoPage && (propsInfo.gotoPage = props.gotoPage)
          props?.unselect && (propsInfo.unselect = props.unselect)
          props.moreThanOneSelected &&
            props.handleDismissError &&
            (propsInfo.handleDismissError = props.handleDismissError)

          return <InfoTabs {...propsInfo} />
        }}
      />
    </TranslateProvider>
  )
}

/**
 * Displays details of a VM.
 *
 * @param {VM} vm - VM to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a VM
 * @param {Function} [unselect] - Function to unselect a VM
 * @returns {ReactElement} VM details
 */
const InfoTabs = memo(
  ({ vm, gotoPage, unselect, handleDismissError, tags }) => {
    const [getVm, { data: lazyData, isFetching }] = VmAPI.useLazyGetVmQuery()
    const id = vm?.ID ?? lazyData?.ID

    const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
    const { FULL_SCREEN_INFO } = fireedge
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
            {FULL_SCREEN_INFO === 'true' && (
              <SubmitButton
                data-cy="detail-back"
                icon={<NavArrowLeft />}
                tooltip={Tr(T.Back)}
                isSubmitting={isFetching}
                onClick={() => unselect()}
              />
            )}
          </Stack>

          <ButtonClearErrors
            tags={tags}
            handleDismissError={handleDismissError}
          />

          <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
            {FULL_SCREEN_INFO === 'false' && (
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
              onClick={() => getVm({ id })}
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
        <VmTabs id={id} />
      </Stack>
    )
  }
)

InfoTabs.propTypes = {
  selectedRows: PropTypes.array,
  vm: PropTypes.object,
  gotoPage: PropTypes.func,
  unselect: PropTypes.func,
  handleDismissError: PropTypes.func,
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
  handleDismissError,
}) => (
  <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
    <ButtonClearErrors tags={tags} handleDismissError={handleDismissError} />
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
  handleDismissError: PropTypes.func,
}
GroupedTags.displayName = 'GroupedTags'
