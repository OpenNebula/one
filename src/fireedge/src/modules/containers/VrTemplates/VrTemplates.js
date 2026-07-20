/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { FormDialog, List, Table, ResourceContainer } from '@ComponentsV2Module'

import {
  T,
  DEFAULT_TEMPLATE_LOGO,
  TABLE_VIEW_MODE,
  RESOURCE_NAMES,
} from '@ConstantsModule'
import {
  MarketplaceAppAPI,
  useFunctionalityApi,
  useFunctionality,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useMemo, useCallback, useState } from 'react'
import { CloudDownload } from 'iconoir-react'
import { getActionsAvailable, timeFromMilliseconds } from '@UtilsModule'
import { DetailsDrawer } from '@modules/containers/VrTemplates/Details'
import { vrtemplateTable } from '@ModelsModule'
import { MarketplaceApp, VrTemplate } from '@ResourcesModule'

/**
 * Displays a list of VM Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VM Templates list and selected row(s)
 */
export function VrTemplates() {
  const [isDownloadOpen, setDownloadOpen] = useState(false)
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.VROUTER_TEMPLATE)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView),
    [resourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isFetchingTemplates,
    refetch: refresh,
  } = vrtemplateTable.useData()
  const { data: defaultVrApp, isFetching: isFetchingDefaultVrApp } =
    MarketplaceAppAPI.useGetMarketplaceAppsQuery(undefined, {
      selectFromResult: ({ data: apps = [], isFetching }) => ({
        data: apps.find(
          ({ MARKETPLACE, NAME }) =>
            MARKETPLACE === 'OpenNebula Public' &&
            NAME === 'Service Virtual Router'
        ),
        isFetching,
      }),
    })
  const [exportApp] = MarketplaceAppAPI.useExportAppMutation()
  const isRefreshing =
    isFetchingTemplates || (!data.length && isFetchingDefaultVrApp)

  const filterOptions = useMemo(
    () => vrtemplateTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter(({ ID, NAME, REGTIME, UNAME, GNAME } = {}) =>
          [
            ID,
            NAME,
            REGTIME && timeFromMilliseconds(+REGTIME).toRelative(),
            UNAME,
            GNAME,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        )
      : data

    const filteredByFilters = vrtemplateTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return vrtemplateTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedTemplates = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(ID)) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((id) => [id, true])),
    [selectedItems]
  )

  const handleClose = () => setSelectedItems([])
  const handleSelect = (ID) =>
    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === ID ? [] : [ID]
    )
  const handleDeselect = (ID) =>
    setSelectedItems(selectedItems.filter((id) => id !== ID))

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater
      setSelectedItems(Object.keys(next).filter((id) => next[id]))
    },
    [rowSelection, setSelectedItems]
  )

  const handleDownloadDefault = () => setDownloadOpen(true)
  const handleExportDefault = async (formData) => {
    await exportApp({ id: defaultVrApp.ID, ...formData }).unwrap()
    setDownloadOpen(false)
    refresh()
  }

  return (
    <>
      <ResourceContainer
        dataCy={vrtemplateTable.dataCy}
        resourceName={T.Templates}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        sortOptions={vrtemplateTable.sortOptions()}
        filterOptions={filterOptions}
        searchPlaceholder={T.SearchTemplates}
        count={items?.length}
        selectedCount={selectedItems?.length}
        onSelectAll={(checked) =>
          setSelectedItems(checked ? items?.map(({ ID }) => ID) : [])
        }
        emptyContentProps={
          !data.length && defaultVrApp
            ? {
                action: handleDownloadDefault,
                actionTitle: T.DownloadDefaultImage,
                actionProps: {
                  dataCy: 'download-vr-app',
                  startIcon: CloudDownload,
                },
              }
            : undefined
        }
      >
        {(() => {
          switch (containerView) {
            case TABLE_VIEW_MODE.LIST:
              return (
                <Table
                  dataCy={vrtemplateTable.dataCy}
                  columns={vrtemplateTable.columns()}
                  data={items}
                  isLoading={isRefreshing}
                  isRowsSelectable
                  isMultiRowSelection
                  isCopyColumn
                  rowSelection={rowSelection}
                  onRowSelectionChange={handleRowSelectionChange}
                  getRowId={(row) => row.ID}
                  onRowClick={(row) => handleSelect(row.ID)}
                  size="medium"
                  defaultPageSize={25}
                  isFullHeight
                />
              )
            case TABLE_VIEW_MODE.CARD:
            default:
              return (
                <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                  {items?.map(
                    ({
                      NAME,
                      ID,
                      GNAME,
                      UNAME,
                      REGTIME,
                      LOCK = false,
                      LABELS,
                      TEMPLATE: { LOGO = DEFAULT_TEMPLATE_LOGO } = {},
                    }) => (
                      <VrTemplate.Card
                        key={ID}
                        NAME={NAME}
                        ID={ID}
                        GNAME={GNAME}
                        UNAME={UNAME}
                        REGTIME={REGTIME}
                        LOCK={LOCK}
                        LOGO={LOGO}
                        LABELS={LABELS}
                        isSelected={selectedItems?.includes(ID)}
                        onCheck={() =>
                          setSelectedItems(
                            selectedItems?.includes(ID)
                              ? selectedItems.filter((id) => id !== ID)
                              : [...(selectedItems ?? []), ID]
                          )
                        }
                        onClick={() => handleSelect(ID)}
                      />
                    )
                  )}
                </List>
              )
          }
        })()}
        <DetailsDrawer
          selectedTemplates={selectedTemplates}
          handleClose={handleClose}
          handleSelect={handleSelect}
          handleDeselect={handleDeselect}
          actions={availableActions}
        />
      </ResourceContainer>
      {isDownloadOpen && (
        <FormDialog
          title={T.DownloadDefaultImage}
          dataCy="modal-download-vr-app"
          steps={MarketplaceApp.Forms.ExportForm}
          initialValues={defaultVrApp}
          stepProps={defaultVrApp}
          onClose={() => setDownloadOpen(false)}
          onSubmit={handleExportDefault}
        />
      )}
    </>
  )
}
