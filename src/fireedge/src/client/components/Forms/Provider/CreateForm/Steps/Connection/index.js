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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'

import { useGetProviderConfigQuery } from 'client/features/OneApi/provider'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'

import { getConnectionEditable } from 'client/models/ProviderTemplate'
import { sentenceCase } from 'client/utils'
import { T } from 'client/constants'

import {
  FORM_FIELDS,
  STEP_FORM_SCHEMA,
} from 'client/components/Forms/Provider/CreateForm/Steps/Connection/schema'
import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/Provider/CreateForm/Steps/Template'

export const STEP_ID = 'connection'

let connection = {}
let fileCredentials = false

const Content = ({ isUpdate }) => {
  const [fields, setFields] = useState([])
  const { data: providerConfig } = useGetProviderConfigQuery()
  const { watch } = useFormContext()

  useEffect(() => {
    const {
      [TEMPLATE_ID]: templateSelected,
      [STEP_ID]: currentConnection = {},
    } = watch()

    const template = templateSelected?.[0] ?? {}

    fileCredentials = Boolean(
      providerConfig?.[template?.provider]?.file_credentials
    )

    connection = isUpdate
      ? // when is updating, connections have the name as input label
        Object.keys(currentConnection).reduce(
          (res, name) => ({ ...res, [name]: sentenceCase(name) }),
          {}
        )
      : // set connections from template, to take values as input labels
        getConnectionEditable(template, providerConfig)

    setFields(FORM_FIELDS({ connection, fileCredentials }))
  }, [])

  return fields?.length === 0 ? (
    <EmptyCard title={"There aren't connections to fill"} />
  ) : (
    <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
  )
}

const Connection = ({ isUpdate }) => ({
  id: STEP_ID,
  label: T.ConfigureConnection,
  resolver: () => STEP_FORM_SCHEMA({ connection, fileCredentials }),
  optionsValidate: { abortEarly: false },
  content: () => Content({ isUpdate }),
})

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

export * from 'client/components/Forms/Provider/CreateForm/Steps/Connection/schema'
export default Connection
