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
import PropTypes from 'prop-types'
import { useMemo, useEffect, useState } from 'react'
import { useTheme, Stack } from '@mui/material'
import { css } from '@emotion/css'
import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { useTranslation } from '@ProvidersModule'
import {
  ACLRulePreview,
  ACLStringRuleDocumentation,
} from '@modules/resources/resources/ACLs/Forms/CreateForm/Utils/helper'

import { useWatch } from 'react-hook-form'

import { validACL } from '@ModelsModule'

export const STEP_ID = 'stringEditor'
const COLUMNS = [[], FIELDS, []]

const Content = (users, groups, clusters, zones) => {
  const { translate } = useTranslation()
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
      <Stack
        display="grid"
        gap="1em"
        sx={{
          gridTemplateColumns: { sm: '1fr 1fr', md: '1fr' },
          padding: '0.5 em',
        }}
      >
        {validACL(ruleString) ? (
          <ACLRulePreview
            users={users}
            groups={groups}
            clusters={clusters}
            zones={zones}
            rule={ruleString}
          />
        ) : (
          <AlertNotification
            type="primary"
            status="error"
            description={translate(T['acls.translate.error'])}
            isDismissible={false}
            className={classes.groupInfo}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        )}
        <FormWithSchema
          id={STEP_ID}
          cy={`${STEP_ID}`}
          fields={FIELDS}
          columns={COLUMNS}
          gridContainerSx={{
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
          }}
        />
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
  content: () => Content(users, groups, clusters, zones),
  documentation: {
    title: T['acls.form.create.stringEditor.title'],
    content: () => <ACLStringRuleDocumentation version={version} />,
    link: 'product/cloud_system_administration/multitenancy/chmod/#manage-acl',
    version,
  },
})

Resources.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Resources
