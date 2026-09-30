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
import { StatusTag } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { OneKsAPI } from '@FeaturesModule'
import { createTable } from '@UtilsModule'

const getApplicationMetadata = (application = {}) => application?.metadata ?? {}

/**
 * @param {object} application - Catalogue or installed application
 * @returns {string|undefined} Application name
 */
export const getApplicationName = (application = {}) =>
  application?.name ??
  getApplicationMetadata(application)?.name ??
  application?.release_name ??
  application?.id

/**
 * @param {object} application - Catalogue or installed application
 * @returns {string|undefined} Application description
 */
export const getApplicationDescription = (application = {}) =>
  application?.description ?? getApplicationMetadata(application)?.description

const getImageSource = (image) =>
  typeof image === 'string' ? image : image?.url ?? image?.src

/**
 * @param {object} application - Catalogue or installed application
 * @returns {string|undefined} Application image URL
 */
export const getApplicationImage = (application = {}) => {
  const metadata = getApplicationMetadata(application)

  return [
    metadata?.image,
    metadata?.icon,
    metadata?.logo,
    application?.image,
    application?.icon,
    application?.logo,
  ]
    .map(getImageSource)
    .find(Boolean)
}

/**
 * @param {string} state - Installed application state
 * @returns {string} Status tag color
 */
export const getApplicationStateColor = (state = '') => {
  switch (`${state}`.toLowerCase()) {
    case 'ready':
    case 'running':
      return 'success'
    case 'error':
    case 'failed':
      return 'error'
    case 'deleting':
      return 'warning'
    case 'installing':
    case 'updating':
      return 'information'
    default:
      return 'default'
  }
}

/* eslint-disable jsdoc/require-jsdoc */
export const ONEKS_APPLICATION_COLUMNS = [
  {
    header: T.Application,
    id: 'application',
    enableColumnFilter: false,
    enableGlobalFilter: true,
    truncate: true,
    maxWidth: 600,
    enableSorting: false,
    accessorFn: getApplicationName,
  },
  {
    header: T.Status,
    id: 'state',
    accessorKey: 'state',
    grow: false,
    cell: ({ row }) => {
      const state = row.original?.state

      return state ? (
        <StatusTag
          statusColor={getApplicationStateColor(state)}
          statusName={state}
        />
      ) : (
        '-'
      )
    },
  },
  {
    header: T.ChartVersion,
    id: 'version',
    accessorKey: 'version',
    grow: false,
  },
]

export const oneksApplicationTable = createTable(
  ONEKS_APPLICATION_COLUMNS,
  OneKsAPI.useGetOneKsClusterApplicationsQuery,
  { dataCy: 'oneks-applications' }
)
