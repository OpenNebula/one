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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, Divider } from '@mui/material'
import { T, TEXT_VARIANTS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import {
  timeToSecondsByPeriodicity,
  transformChartersToSchedActions,
  getFixedLeases,
  getEditableLeases,
} from '@ModelsModule'
import { createForm, jsonToXml, sentenceCase } from '@UtilsModule'
import { FormWithSchema, Text } from '@ComponentsV2Module'
import {
  CHARTER_SCHEMA,
  CHARTER_FIELDS,
  RELATIVE_CHARTER_FIELDS,
  RELATIVE_CHARTER_SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/CreateCharterForm/schema'

const formatRelativeCharter = (
  { ACTION, TIME, PERIOD, WARNING, WARNING_PERIOD },
  translate
) => (
  <>
    {`> ${translate(sentenceCase(ACTION))} ${translate(
      T.In
    )} ${TIME} ${translate(PERIOD)}`}
    {WARNING &&
      ` | ${translate(T.WarningBefore)} ${WARNING} ${translate(
        WARNING_PERIOD
      )}`}
  </>
)

const CharterLeasesText = ({ leases, onlyFixed = true }) => {
  const { translate } = useTranslation()
  const displayLeases = useMemo(
    () => (onlyFixed ? getFixedLeases(leases) : leases),
    [leases, onlyFixed]
  )
  const leaseEntries = displayLeases ?? []

  if (leaseEntries.length === 0) return null

  return (
    <>
      <Stack spacing={1}>
        {transformChartersToSchedActions(leaseEntries, true)?.map((action) => {
          const { ACTION, TIME, PERIOD, WARNING, WARNING_PERIOD } = action

          return (
            <Stack
              key={[ACTION, TIME, PERIOD, WARNING, WARNING_PERIOD]
                .filter(Boolean)
                .join('-')}
              spacing={0.5}
            >
              <Text
                noWrap
                sx={{ px: 2, py: 1 }}
                value={formatRelativeCharter(action, translate)}
                variant={TEXT_VARIANTS.BODY_LARGE}
              />
            </Stack>
          )
        })}
      </Stack>
      <Divider />
    </>
  )
}

CharterLeasesText.propTypes = {
  leases: PropTypes.array,
  onlyFixed: PropTypes.bool,
}

const normalizeLeasesProps = (props) =>
  Array.isArray(props) ? props : Object.values(props ?? {})

const toSchedActionTemplate = (scheduleActions = []) => ({
  template: jsonToXml({
    SCHED_ACTION: []
      .concat(scheduleActions)
      .filter(({ ACTION } = {}) => ACTION),
  }),
})

const createCharterFormContent = (
  fields,
  { hideFields = false, showAllLeases = false } = {}
) => {
  const CharterFormContent = (props) => {
    const leases = normalizeLeasesProps(props)

    return (
      <>
        <CharterLeasesText leases={leases} onlyFixed={!showAllLeases} />
        {!hideFields && (
          <FormWithSchema
            cy="form-charter"
            fields={fields(leases)}
            rootProps={{
              sx: {
                boxSizing: 'border-box',
                px: 0.5,
                width: '100%',
              },
            }}
            gridContainerSx={{
              m: 0,
              width: '100%',
            }}
            gridItemSx={{
              p: 0,
              width: '100%',
            }}
          />
        )}
      </>
    )
  }

  return CharterFormContent
}

const CreateCharterForm = createForm(CHARTER_SCHEMA, CHARTER_FIELDS, {
  ContentForm: createCharterFormContent(CHARTER_FIELDS),
  description: (leases) => <CharterLeasesText leases={leases} />,
  transformInitialValue: (leases, schema) => {
    const schedActions = transformChartersToSchedActions(
      getEditableLeases(leases)
    )

    return schema.cast({ CHARTERS: schedActions }, { context: schedActions })
  },
  transformBeforeSubmit: (formData) => toSchedActionTemplate(formData.CHARTERS),
})

const RelativeForm = createForm(
  RELATIVE_CHARTER_SCHEMA,
  RELATIVE_CHARTER_FIELDS,
  {
    ContentForm: createCharterFormContent(RELATIVE_CHARTER_FIELDS, {
      hideFields: true,
      showAllLeases: true,
    }),
    description: (leases) => (
      <CharterLeasesText leases={leases} onlyFixed={false} />
    ),
    transformInitialValue: (leases, schema) => {
      const schedActions = transformChartersToSchedActions(
        getEditableLeases(leases),
        true
      )

      return schema.cast({ CHARTERS: schedActions }, { context: schedActions })
    },
    transformBeforeSubmit: (_, leases) =>
      transformChartersToSchedActions(leases, true)?.map(
        ({ TIME, PERIOD, WARNING, WARNING_PERIOD, ...lease }) => ({
          ...lease,
          TIME: `+${timeToSecondsByPeriodicity(PERIOD, TIME)}`,
          ...(WARNING && {
            WARNING: `-${timeToSecondsByPeriodicity(WARNING_PERIOD, WARNING)}`,
          }),
        })
      ),
  }
)

export { RelativeForm }

export default CreateCharterForm
