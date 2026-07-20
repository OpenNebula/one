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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { useCallback, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { useGeneralApi } from '@FeaturesModule'
import { vnTable } from '@ModelsModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/NetworksTable/schema'

export const STEP_ID = 'network'

const HIDDEN_COLUMN_IDS = ['owner', 'group', 'labels']

const getSelectedNetwork = (network = {}) => {
  const { ID, NAME, UID, UNAME, SECURITY_GROUPS } = network

  return {
    NETWORK: NAME,
    NETWORK_ID: ID,
    NETWORK_UID: UID,
    NETWORK_UNAME: UNAME,
    SECURITY_GROUPS,
  }
}

const Content = () => {
  const { setModifiedFields } = useGeneralApi()
  const { setValue } = useFormContext()
  const networksRef = useRef([])

  const model = useMemo(
    () => ({
      columns: () =>
        vnTable.columns().filter(({ id }) => !HIDDEN_COLUMN_IDS.includes(id)),
      dataCy: vnTable.dataCy,
      useData: (...args) => {
        const result = vnTable.useData(...args)
        networksRef.current = [].concat(result?.data ?? [])

        return result
      },
    }),
    []
  )

  const updateNetworkValue = useCallback(
    (network) => {
      setValue(
        STEP_ID,
        network
          ? getSelectedNetwork(network)
          : {
              NETWORK: undefined,
              NETWORK_ID: undefined,
              NETWORK_UID: undefined,
              NETWORK_UNAME: undefined,
              SECURITY_GROUPS: undefined,
            },
        {
          shouldDirty: true,
          shouldTouch: true,
        }
      )
    },
    [setValue]
  )

  const handleSelectNetwork = useCallback(
    (selected) => {
      const selectedName = []
        .concat(selected ?? [])
        .filter(Boolean)
        .at(-1)
      const selectedNetwork = networksRef.current.find(
        ({ NAME }) => String(NAME) === String(selectedName)
      )

      updateNetworkValue(selectedNetwork)

      if (selectedNetwork) {
        setModifiedFields(
          {
            network: {
              NETWORK: true,
              NETWORK_ID: true,
              NETWORK_UID: true,
              NETWORK_UNAME: true,
              SECURITY_GROUPS: true,
            },
          },
          { batch: true }
        )
      }
    },
    [setModifiedFields, updateNetworkValue]
  )

  return (
    <FormWithSchema
      id={STEP_ID}
      cy={STEP_ID}
      fields={FIELDS({ model, onSelectNetwork: handleSelectNetwork })}
    />
  )
}

const NetworkStep = (props) => ({
  id: STEP_ID,
  label: T.SelectNetwork,
  resolver: SCHEMA,
  content: Content,
  defaultDisabled: {
    condition: () => props?.defaultData?.NETWORK_MODE === 'auto',
  },
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default NetworkStep
