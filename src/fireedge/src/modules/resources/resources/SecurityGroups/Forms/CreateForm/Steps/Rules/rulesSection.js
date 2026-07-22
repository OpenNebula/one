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
import { ReactElement, useCallback, memo, useMemo } from 'react'
import { useTheme, Stack, FormControl } from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'
import TableContainer from '@mui/material/TableContainer'
import { Cancel as CloseIcon, Plus as AddIcon } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  Table,
  FormWithSchema,
  Button,
  ResourceLink,
  Text,
} from '@ComponentsV2Module'
import { Legend } from '@modules/resources/Forms'
import { useTranslation } from '@ProvidersModule'

import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/SecurityGroups/Forms/CreateForm/Steps/Rules/schema'
import {
  T,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  ICMP_STRING,
  ICMP_V6_STRING,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { RULESECURITYGROUP_COLUMNS } from '@ModelsModule'

export const SECTION_ID = 'RULES'

const useStyles = () => ({
  container: css({
    marginTop: '3rem',
  }),
})

// Extension of columns since it's necessary to add the remove button
const ruleColumns = [
  ...RULESECURITYGROUP_COLUMNS,
  {
    header: '',
    id: 'actions',
    cell: ({ row }) => row.original?.ACTIONS,
    meta: { disableCellTooltip: true },
  },
]

const RulesSection = memo(
  /**
   * @param {object} props - Props
   * @param {string} [props.stepId] - ID of the step the section belongs to
   * @returns {ReactElement} - Inputs section
   */
  ({ stepId }) => {
    const { translate } = useTranslation()
    const theme = useTheme()
    const classes = useMemo(() => useStyles(theme), [theme])

    const fields = useMemo(() => FIELDS, [])

    const {
      fields: rules,
      append,
      remove,
    } = useFieldArray({
      name: useMemo(
        () => [stepId, SECTION_ID].filter(Boolean).join('.'),
        [stepId]
      ),
    })

    const getCyPath = useCallback(
      (cy) => [stepId, cy].filter(Boolean).join('-'),
      [stepId]
    )

    const methods = useForm({
      defaultValues: {
        [SECTION_ID]: SCHEMA.default(),
      },
      resolver: yupResolver(SCHEMA),
    })

    const onSubmit = (newRule) => {
      newRule?.RULES && delete newRule.RULES
      append(newRule)
      const currentValues = methods.getValues()
      methods.reset({
        RULE_TYPE: currentValues.RULE_TYPE,
        PROTOCOL: currentValues.PROTOCOL,
        RANGE_TYPE: currentValues.RANGE_TYPE,
        TARGET: currentValues.TARGET,
      })
    }

    if (fields.length === 0) {
      return null
    }

    const formattedRules = rules?.map(
      (
        {
          id,
          PROTOCOL,
          RULE_TYPE,
          RANGE = T.All,
          IP,
          SIZE,
          NETWORK_ID,
          ICMP_TYPE = T.Any,
          // eslint-disable-next-line camelcase
          ICMPv6_TYPE = T.Any,
        },
        index
      ) => {
        let network = T.Any
        if (IP && SIZE) {
          network = `${T.Start}: ${IP}, ${T.Size}: ${SIZE}`
        } else if (!isNaN(NETWORK_ID)) {
          network = (
            <ResourceLink resource={RESOURCE_NAMES.VNET} data={NETWORK_ID}>
              {NETWORK_ID}
            </ResourceLink>
          )
        }

        return {
          PROTOCOL: translate(PROTOCOL),
          RULE_TYPE: translate(RULE_TYPE),
          RANGE: translate(RANGE),
          NETWORK: translate(network),
          ICMP_TYPE: `${translate(ICMP_STRING[ICMP_TYPE]) || ''}`,
          // eslint-disable-next-line camelcase
          ICMPv6_TYPE: `${translate(ICMP_V6_STRING[ICMPv6_TYPE]) || ''}`,
          ACTIONS: (
            <Button
              type={STYLE_BUTTONS.TYPE.TRANSPARENT}
              size="medium"
              iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
              onClick={(event) => {
                event.stopPropagation()
                remove(index)
              }}
            />
          ),
        }
      }
    )

    return (
      <FormControl component="fieldset" sx={{ width: '100%', pb: '6rem' }}>
        <Legend title={T.Rules} />
        <FormProvider {...methods}>
          <Stack
            direction="row"
            alignItems="flex-start"
            gap="0.5rem"
            component="form"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormWithSchema
              cy={getCyPath('rules')}
              fields={fields}
              rootProps={{ sx: { mt: '24px' } }}
            />
          </Stack>
          <Stack>
            <Button
              type={STYLE_BUTTONS.TYPE.SECONDARY}
              startIcon={<AddIcon width={'16px'} height={'16px'} />}
              onClick={methods.handleSubmit(onSubmit)}
              data-cy={getCyPath('add-rules')}
              sx={{ mt: '1em', ml: 'auto' }}
            >
              <Text
                component="span"
                value={T.AddRule}
                variant={TEXT_VARIANTS.BODY_SMALL}
                weight={TEXT_WEIGHTS.MEDIUM}
              />
            </Button>
          </Stack>
        </FormProvider>
        <TableContainer className={classes.container}>
          <Table title={T.Rules} data={formattedRules} columns={ruleColumns} />
        </TableContainer>
      </FormControl>
    )
  }
)

RulesSection.propTypes = {
  stepId: PropTypes.string,
}

RulesSection.displayName = 'RulesSection'

export default RulesSection
