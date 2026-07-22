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

import { Component, useEffect, useMemo, useState } from 'react'
import { AlertNotification, Dropdown, Table } from '@ComponentsV2Module'
import { ALL_SELECTED, T } from '@ConstantsModule'
import { VdcAPI, ZoneAPI } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/resources/Icons'
import { LoadingDisplay } from '@modules/resources/LoadingState'
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'

const toArray = (value) =>
  []
    .concat(value ?? [])
    .flat()
    .filter((item) => item !== undefined && item !== null && item !== '')

const isSameId = (firstId, secondId) => String(firstId) === String(secondId)

const hasAllSelected = (ids = []) =>
  ids.some((id) => String(id) === ALL_SELECTED)

/**
 * @param {object} root0 - Params
 * @param {string|number} root0.vdcId - VDC ID
 * @param {object} root0.selected - Selected VDC
 * @returns {string} VDC ID
 */
export const getVdcId = ({ vdcId, selected } = {}) =>
  String(vdcId ?? selected?.ID ?? '')

/**
 * @param {object} root0 - Params
 * @param {string} root0.id - VDC ID
 * @param {Function} root0.children - Render function
 * @returns {object} Guarded legacy VDC tab
 */
export const LegacyVdcTab = ({ id, children }) => {
  const { isError, error, status, data } = VdcAPI.useGetVDCQuery({ id })

  if (isError) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={error?.data}
        isDismissible={false}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
    )
  }

  if (status === 'fulfilled' || String(id) === String(data?.ID)) {
    return children()
  }

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
}

LegacyVdcTab.propTypes = {
  id: PropTypes.string,
  children: PropTypes.func,
}

export const vdcTabPropTypes = {
  data: PropTypes.shape({
    vdcId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selected: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  }),
  config: PropTypes.object,
}

const getZoneResourceIds = ({
  idKey,
  resourceKey,
  resources = {},
  selectedZone,
}) =>
  toArray(resources?.[resourceKey])
    .filter((resource) => isSameId(resource?.ZONE_ID, selectedZone))
    .map((resource) => resource?.[idKey])
    .filter((id) => id !== undefined && id !== null)

/**
 * @param {object} root0 - Params
 * @param {Array} root0.zones - Zone list
 * @param {boolean} root0.isLoading - Loading state
 * @param {string} root0.value - Selected zone id
 * @param {Function} root0.onChange - Change handler
 * @returns {Component} Zone selector
 */
const ZoneSelector = ({ zones = [], isLoading, value, onChange }) => {
  const options = zones.map(({ ID, NAME }) => ({
    text: NAME,
    value: String(ID),
  }))

  return (
    <Box
      sx={{
        display: 'flex',
        width: { xs: '100%', sm: '280px' },
      }}
    >
      <Dropdown
        label={T.Zone}
        placeholder={T.Zone}
        options={options}
        initialValue={
          options.find((zone) => zone.value === String(value)) ?? null
        }
        onChange={(zone) => zone?.value && onChange(zone.value)}
        isDisabled={isLoading || options.length === 0}
      />
    </Box>
  )
}

ZoneSelector.propTypes = {
  zones: PropTypes.array,
  isLoading: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
}

/**
 * @param {object} root0 - Params
 * @param {Array} root0.columns - Table columns
 * @param {string} root0.idKey - VDC resource id key
 * @param {string} root0.poolKey - VDC resource pool key
 * @param {string} root0.resourceKey - VDC resource list key
 * @param {string} root0.rowDetailsResourceId - Row details resource id
 * @param {string} root0.title - Table title
 * @param {Function} root0.useQuery - Resource list query hook
 * @param {string} root0.vdcId - VDC id
 * @param {string} root0.dataCy - Table data-cy
 * @returns {Component} VDC zone resource tab
 */
export const VdcZoneResourceTab = ({
  columns,
  idKey,
  poolKey,
  resourceKey,
  rowDetailsResourceId,
  title,
  useQuery,
  vdcId,
  dataCy,
}) => {
  const [selectedZone, setSelectedZone] = useState('0')
  const {
    data: zones = [],
    isLoading: isLoadingZones,
    isFetching: isFetchingZones,
  } = ZoneAPI.useGetZonesQuery()
  const {
    data: vdc,
    isLoading: isLoadingVdc,
    isFetching: isFetchingVdc,
    isError,
    error,
  } = VdcAPI.useGetVDCQuery({ id: vdcId })
  const {
    data: resources = [],
    isLoading: isLoadingResources,
    isFetching: isFetchingResources,
  } = useQuery({ zone: selectedZone })

  useEffect(() => {
    if (!zones.length) return

    const selectedZoneExists = zones.some(({ ID }) =>
      isSameId(ID, selectedZone)
    )

    if (!selectedZoneExists) {
      setSelectedZone(String(zones[0]?.ID))
    }
  }, [selectedZone, zones])

  const resourceIds = useMemo(
    () =>
      getZoneResourceIds({
        idKey,
        resourceKey,
        resources: vdc?.[poolKey],
        selectedZone,
      }),
    [idKey, poolKey, resourceKey, selectedZone, vdc]
  )

  const filteredResources = useMemo(() => {
    if (hasAllSelected(resourceIds)) return resources

    return resources.filter((resource) =>
      resourceIds.some((id) => isSameId(id, resource?.ID))
    )
  }, [resourceIds, resources])

  const isLoading =
    isLoadingZones ||
    isFetchingZones ||
    isLoadingVdc ||
    isFetchingVdc ||
    isLoadingResources ||
    isFetchingResources

  if (isLoadingVdc || isFetchingVdc || !vdc) {
    return (
      <LoadingDisplay
        isLoading={isLoadingVdc || isFetchingVdc}
        isEmpty={!vdc}
        error={isError ? error?.data : undefined}
      />
    )
  }

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        gap: `${theme.scale[400]}px`,
        overflow: 'auto',
      })}
    >
      <ZoneSelector
        zones={zones}
        isLoading={isLoadingZones || isFetchingZones}
        value={selectedZone}
        onChange={setSelectedZone}
      />
      <Table
        dataCy={dataCy}
        title={title}
        data={filteredResources}
        columns={columns}
        size="medium"
        isLoading={isLoading}
        isRowsSelectable={false}
        defaultPageSize={5}
        pageSizeOptions={[5, 10, 25]}
        getRowId={(row) => String(row.ID)}
        openRowDetailsOnClick
        rowDetailsResourceId={rowDetailsResourceId}
      />
    </Box>
  )
}

VdcZoneResourceTab.propTypes = {
  columns: PropTypes.array,
  idKey: PropTypes.string,
  poolKey: PropTypes.string,
  resourceKey: PropTypes.string,
  rowDetailsResourceId: PropTypes.string,
  title: PropTypes.string,
  useQuery: PropTypes.func,
  vdcId: PropTypes.string,
  dataCy: PropTypes.string,
}
