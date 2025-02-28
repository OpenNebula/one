/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { useMemo, useEffect, useState } from 'react'
import { useTheme, Stack, Alert, Typography } from '@mui/material'
import { css } from '@emotion/css'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { Tr } from '@modules/components/HOC'

import { useWatch } from 'react-hook-form'

import { translateACL, validACL } from '@ModelsModule'

import { generateDocLink } from '@UtilsModule'

export const STEP_ID = 'stringEditor'

const Content = (version, users, groups, clusters, zones) => {
  const theme = useTheme()
  const [ruleString, setRuleString] = useState('')

  const watch = useWatch({
    name: 'stringEditor.RULE',
  })

  useEffect(() => {
    setRuleString(watch)
  }, [watch])

  // Style for info message
  const useStyles = ({ palette }) => ({
    groupInfo: css({
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })

  const classes = useMemo(() => useStyles(theme), [theme])

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{
        gridTemplateColumns: { sm: '1fr', md: '1frs' },
        padding: '0.5 em',
      }}
    >
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {Tr(T['acls.form.create.stringEditor.info'])}
        <ul>
          <li>
            <b>{Tr(T['acls.form.create.stringEditor.info.user.title'])}</b>
            {Tr(T['acls.form.create.stringEditor.info.user.info'])}
          </li>
          <li>
            <b>{Tr(T['acls.form.create.stringEditor.info.resource.title'])}</b>
            {Tr(T['acls.form.create.stringEditor.info.resource.info'])}
          </li>
          <li>
            <b>{Tr(T['acls.form.create.stringEditor.info.rights.title'])}</b>
            {Tr(T['acls.form.create.stringEditor.info.rights.info'])}
          </li>
          <li>
            <b>{Tr(T['acls.form.create.stringEditor.info.zone.title'])}</b>
            {Tr(T['acls.form.create.stringEditor.info.zone.info'])}
          </li>
        </ul>
        {Tr(T['acls.form.create.stringEditor.info.more'])}
        <a
          target="_blank"
          href={generateDocLink(
            version,
            'management_and_operations/users_groups_management/chmod.html#manage-acl'
          )}
          rel="noreferrer"
        >
          {Tr(T['acls.form.create.stringEditor.info.more.link'])}
        </a>
      </Alert>
      <Stack
        display="grid"
        gap="1em"
        sx={{
          gridTemplateColumns: { sm: '1fr 1fr', md: '1fr' },
          padding: '0.5 em',
        }}
      >
        <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
        <Typography>
          {validACL(ruleString) ? (
            <Alert
              severity="success"
              variant="outlined"
              className={classes.groupInfo}
            >
              {translateACL(ruleString, users, groups, clusters, zones)}
            </Alert>
          ) : (
            <Alert
              severity="error"
              variant="outlined"
              className={classes.groupInfo}
            >
              {Tr(T['acls.translate.error'])}
            </Alert>
          )}
        </Typography>
      </Stack>
    </Stack>
  )
}

/**
 * StringEditor ACL configuration.
 *
 * @param {object} props - Step props
 * @param {string} props.version - ONE version
 * @param {Array} props.users - List of users
 * @param {Array} props.groups - List of groups
 * @param {Array} props.clusters - List of clusters
 * @param {Array} props.zones - List of zones
 * @returns {object} StringEditor ACL configuration step
 */
const Resources = ({ version, users, groups, clusters, zones }) => ({
  id: STEP_ID,
  label: T['acls.form.create.stringEditor.title'],
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(version, users, groups, clusters, zones),
})

Resources.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Resources
