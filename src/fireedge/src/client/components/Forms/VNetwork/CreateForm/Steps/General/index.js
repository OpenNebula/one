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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext, useWatch } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Legend } from 'client/components/Forms'
import { AttributePanel } from 'client/components/Tabs/Common'

import {
  SCHEMA,
  SECTIONS,
  IP_LINK_CONF_FIELD,
} from 'client/components/Forms/VNetwork/CreateForm/Steps/General/schema'
import { cleanEmpty, cloneObject, set } from 'client/utils'
import { T, VirtualNetwork, VN_DRIVERS } from 'client/constants'

export const STEP_ID = 'general'
const DRIVER_PATH = `${STEP_ID}.VN_MAD`
const IP_CONF_PATH = `${STEP_ID}.${IP_LINK_CONF_FIELD.name}`

/**
 * @param {boolean} isUpdate - True if it is an update operation
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} Form content component
 */
const Content = (isUpdate, oneConfig, adminGroup) => {
  const { setValue } = useFormContext()

  const driver = useWatch({ name: DRIVER_PATH })
  const ipConf = useWatch({ name: IP_CONF_PATH }) || {}

  const sections = useMemo(
    () => SECTIONS(driver, isUpdate, oneConfig, adminGroup),
    [driver]
  )

  const handleChangeAttribute = (path, newValue) => {
    const newConf = cloneObject(ipConf)

    set(newConf, path, newValue)
    setValue(IP_CONF_PATH, cleanEmpty(newConf))
  }

  return (
    <>
      {sections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          {...section}
        />
      ))}
      {driver === VN_DRIVERS.vxlan && (
        <AttributePanel
          collapse
          title={
            <Legend
              disableGutters
              data-cy={'ip-conf'}
              title={T.IpConfiguration}
              tooltip={T.IpConfigurationConcept}
            />
          }
          allActionsEnabled
          handleAdd={handleChangeAttribute}
          handleEdit={handleChangeAttribute}
          handleDelete={handleChangeAttribute}
          attributes={ipConf}
          filtersSpecialAttributes={false}
        />
      )}
    </>
  )
}

/**
 * General configuration about Virtual network.
 *
 * @param {VirtualNetwork} data - Virtual network
 * @returns {object} General configuration step
 */
const General = ({ data, oneConfig, adminGroup }) => {
  const isUpdate = data?.NAME !== undefined
  const initialDriver = data?.VN_MAD

  return {
    id: STEP_ID,
    label: T.General,
    resolver: (formData) =>
      SCHEMA(formData?.[STEP_ID]?.VN_MAD ?? initialDriver, isUpdate),
    optionsValidate: { abortEarly: false },
    content: () => Content(isUpdate, oneConfig, adminGroup),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

export default General
