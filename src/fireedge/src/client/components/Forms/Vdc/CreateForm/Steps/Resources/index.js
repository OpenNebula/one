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
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import { ReactElement, useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { FieldErrors, useFormContext } from 'react-hook-form'

import { useViews } from 'client/features/Auth'

import Cluster from './ClustersTable'
import Datastore from './DatastoresTable'
import Host from './HostsTable'
import Vnets from './VnetsTable'
import ZoneSelect from './ZonesSelect'

import { SCHEMA } from './schema'

import { RESOURCE_NAMES, T } from 'client/constants'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'

/**
 * @typedef {object} TabType
 * @property {string} id - Id will be to use in view yaml to hide/display the tab
 * @property {string} name - Label of tab
 * @property {ReactElement} Content - Content tab
 * @property {object} [icon] - Icon of tab
 * @property {function(FieldErrors):boolean} [getError] - Returns `true` if the tab contains an error in form
 */

export const STEP_ID = 'resources'

/** @type {TabType[]} */
export const RESOURCES = [Cluster, Datastore, Host, Vnets]

const Content = (zones) => {
  const {
    formState: { errors },
    control,
  } = useFormContext()
  const { view, getResourceView } = useViews()

  const sectionsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VDC
    const dialog = getResourceView(resource)?.dialogs?.create_dialog

    return getSectionsAvailable(dialog)
  }, [view])

  const totalErrors = Object.keys(errors[STEP_ID] ?? {}).length

  const resources = useMemo(
    () =>
      RESOURCES.filter(({ id }) => sectionsAvailable.includes(id)).map(
        ({ Content: TabContent, id }) => (
          <TabContent key={id} id={STEP_ID} {...{ zones, control }} />
        )
      ),
    [totalErrors, view, control]
  )

  return (
    <>
      <ZoneSelect zones={zones} />
      {resources}
    </>
  )
}

/**
 * Optional configuration about VDC.
 *
 * @param {Array[object]} zones - Zones available
 * @returns {object} Optional configuration step
 */
const Resources = (zones = []) => ({
  id: STEP_ID,
  label: T.Resources,
  resolver: (formData) => SCHEMA(zones),
  optionsValidate: { abortEarly: false },
  content: () => Content(zones),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default Resources
