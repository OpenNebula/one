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

import PropTypes from 'prop-types'
import { Component, useCallback, useMemo } from 'react'
import { TablePanel } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { marketplaceAppTable } from '@ModelsModule'

/**
 * Marketplace apps tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Marketplace apps tab
 */
export const Apps = ({ data }) => {
  const marketplaces = data?.selected ?? data?.marketplace
  const marketplaceAppIds = useMemo(
    () =>
      new Set(
        []
          .concat(marketplaces ?? [])
          .flatMap(({ MARKETPLACEAPPS } = {}) =>
            [MARKETPLACEAPPS?.ID ?? []].flat()
          )
          .filter((id) => id !== undefined && id !== null)
          .map(String)
      ),
    [marketplaces]
  )

  const selectMarketplaceApps = useCallback(
    ({ data: apps = [], isFetching: fetching }) => ({
      data: apps.filter(({ ID }) => marketplaceAppIds.has(String(ID))),
      isFetching: fetching,
    }),
    [marketplaceAppIds]
  )
  const { data: marketplaceApps = [], isFetching } =
    marketplaceAppTable.useData(undefined, {
      selectFromResult: selectMarketplaceApps,
    })

  return (
    <TablePanel
      dataCy={marketplaceAppTable.dataCy}
      columns={marketplaceAppTable.columns()}
      data={marketplaceApps}
      isLoading={isFetching}
      isFullHeight
      isEnableSearchBar
      isEnableFilters
      isEnableSort
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.APP}
    />
  )
}

Apps.propTypes = {
  data: PropTypes.object,
}

Apps.id = 'apps'
Apps.title = T.Apps
