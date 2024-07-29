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
import { ReactElement, useCallback, memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import makeStyles from '@mui/styles/makeStyles'
import { Stack, FormControl, Link, Button, IconButton } from '@mui/material'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate, Tr } from 'client/components/HOC'

import {
  FIELDS,
  SCHEMA,
} from 'client/components/Forms/SecurityGroups/CreateForm/Steps/Rules/schema'
import {
  T,
  ICMP_STRING,
  ICMP_V6_STRING,
  RESOURCE_NAMES,
} from 'client/constants'

export const SECTION_ID = 'RULES'

const useStyles = makeStyles({
  container: {
    marginTop: '3rem',
  },
})

const RulesSection = memo(
  /**
   * @param {object} props - Props
   * @param {string} [props.stepId] - ID of the step the section belongs to
   * @returns {ReactElement} - Inputs section
   */
  ({ stepId }) => {
    const classes = useStyles()

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
      methods.reset()
    }

    if (fields.length === 0) {
      return null
    }

    return (
      <FormControl component="fieldset" sx={{ width: '100%' }}>
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
              rootProps={{ sx: { m: 0 } }}
            />
            <Button
              variant="contained"
              type="submit"
              color="secondary"
              startIcon={<AddCircledOutline />}
              data-cy={getCyPath('add-rules')}
              sx={{ mt: '1em' }}
            >
              <Translate word={T.Add} />
            </Button>
          </Stack>
        </FormProvider>
        <TableContainer className={classes.container}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>{Tr(T.Protocol)}</b>
                </TableCell>
                <TableCell>
                  <b>{Tr(T.Type)}</b>
                </TableCell>
                <TableCell>
                  <b>{Tr(T.Range)}</b>
                </TableCell>
                <TableCell>
                  <b>{Tr(T.Network)}</b>
                </TableCell>
                <TableCell>
                  <b>{Tr(T.IcmpType)}</b>
                </TableCell>
                <TableCell>
                  <b>{Tr(T.IcmpTypeV6)}</b>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rules?.map(
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
                      <Link
                        component={RouterLink}
                        to={`/${RESOURCE_NAMES.VNET}/${NETWORK_ID}`}
                        color="secondary"
                      >
                        {NETWORK_ID}
                      </Link>
                    )
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell>{Tr(PROTOCOL)}</TableCell>
                      <TableCell>{Tr(RULE_TYPE)}</TableCell>
                      <TableCell>{Tr(RANGE)}</TableCell>
                      <TableCell>{Tr(network)}</TableCell>
                      <TableCell>{Tr(ICMP_STRING[ICMP_TYPE]) || ''}</TableCell>
                      <TableCell>
                        {Tr(ICMP_V6_STRING[ICMPv6_TYPE]) || ''}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => remove(index)}>
                          <DeleteCircledOutline />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                }
              )}
            </TableBody>
          </Table>
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
