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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Accordion,
  AccordionDetails,
  styled,
  Stack,
  Alert,
} from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import { Actions } from '@modules/resources/Tabs/Common/Attribute'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { isEmpty } from 'lodash'

const CodeBox = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontFamily: 'Courier Prime, monospace',
  fontWeight: 700,
  lineHeight: '16px',
  wordWrap: 'break-word',
  padding: `${theme.spacing(2)} ${theme.spacing(1.5)}`,
  borderRadius: theme.typography.pxToRem(8),
}))

/**
 * Renders configuration tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Template id
 * @returns {ReactElement} Configuration tab
 */
const KubernetesConfig = ({ id }) => {
  const { translate } = useTranslation()
  const { data: cluster = {} } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })
  const { DOCUMENT = {} } = cluster

  const { data, error } =
    OneKsAPI.useGetKubeConfigQuery({ id }, { skip: !id }) || {}
  const kubeconf = data?.kubeconfig ?? ''

  if (isEmpty(DOCUMENT) || !data || error) {
    return (
      <Alert severity="error" variant="outlined">
        {translate(T['oneks.tab.info.kubeconfig.help.paragraph'])}
      </Alert>
    )
  }

  return (
    <Accordion variant="outlined" expanded>
      <AccordionDetails>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="start"
          spacing={2}
          sx={{ width: '100%' }}
        >
          <CodeBox component="pre" sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box
              component="code"
              sx={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}
            >
              {kubeconf}
            </Box>
          </CodeBox>
          <Box sx={{ flexShrink: 0 }}>
            <Actions.Copy name={T.ClickToCopy} value={kubeconf} />
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

KubernetesConfig.displayName = 'KubernetesConfig'
KubernetesConfig.propTypes = {
  id: PropTypes.string,
}

export default KubernetesConfig
