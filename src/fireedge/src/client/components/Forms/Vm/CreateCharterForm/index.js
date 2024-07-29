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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, Typography, Divider } from '@mui/material'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'
import {
  timeToSecondsByPeriodicity,
  transformChartersToSchedActions,
  getFixedLeases,
  getEditableLeases,
} from 'client/models/Scheduler'
import { createForm, sentenceCase } from 'client/utils'
import {
  CHARTER_SCHEMA,
  CHARTER_FIELDS,
  RELATIVE_CHARTER_FIELDS,
  RELATIVE_CHARTER_SCHEMA,
} from 'client/components/Forms/Vm/CreateCharterForm/schema'

const FixedLeases = ({ leases }) => {
  const fixedLeases = useMemo(() => getFixedLeases(leases), [])

  if (fixedLeases.length === 0) return null

  return (
    <>
      <Stack spacing={1}>
        {transformChartersToSchedActions(fixedLeases, true)?.map((action) => {
          const { ACTION, TIME, PERIOD, WARNING, WARNING_PERIOD } = action

          return (
            <Stack
              key={[ACTION, TIME, PERIOD].filter(Boolean).join('-')}
              spacing={0.5}
            >
              <Typography noWrap variant="subtitle1" padding="1rem">
                {`> ${Tr(sentenceCase(ACTION))} ${Tr(T.In)} ${TIME} ${Tr(
                  PERIOD
                )}`}
                {WARNING &&
                  ` | ${Tr(T.WarningBefore)} ${WARNING} ${Tr(WARNING_PERIOD)}`}
              </Typography>
            </Stack>
          )
        })}
      </Stack>
      <Divider />
    </>
  )
}

FixedLeases.propTypes = {
  leases: PropTypes.array,
}

const CreateCharterForm = createForm(CHARTER_SCHEMA, CHARTER_FIELDS, {
  description: (leases) => <FixedLeases leases={leases} />,
  transformInitialValue: (leases, schema) => {
    const schedActions = transformChartersToSchedActions(
      getEditableLeases(leases)
    )

    return schema.cast({ CHARTERS: schedActions }, { context: schedActions })
  },
  transformBeforeSubmit: (formData) => formData.CHARTERS,
})

const RelativeForm = createForm(
  RELATIVE_CHARTER_SCHEMA,
  RELATIVE_CHARTER_FIELDS,
  {
    description: (leases) => <FixedLeases leases={leases} />,
    transformInitialValue: (leases, schema) => {
      const schedActions = transformChartersToSchedActions(
        getEditableLeases(leases),
        true
      )

      return schema.cast({ CHARTERS: schedActions }, { context: schedActions })
    },
    transformBeforeSubmit: (formData) =>
      formData.CHARTERS?.map(
        ({ TIME, PERIOD, WARNING, WARNING_PERIOD, ...lease }) => ({
          ...lease,
          TIME: `+${timeToSecondsByPeriodicity(PERIOD, TIME)}`,
          WARNING: `-${timeToSecondsByPeriodicity(WARNING_PERIOD, WARNING)}`,
        })
      ),
  }
)

export { RelativeForm }

export default CreateCharterForm
