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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import { CodeSnippet, EmptyContent } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

/**
 * Renders configuration tab.
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab data
 * @returns {Component} Configuration tab
 */
const KubernetesConfig = ({ data: tabData }) => {
  const id = tabData?.selected?.ID ?? tabData?.id
  const { data = {}, error } = OneKsAPI.useGetKubeConfigQuery(
    { id, expand: true },
    {
      skip: !id,
    }
  )

  if (!data?.kubeconfig || error) {
    return (
      <EmptyContent
        title={T.KubeconfigNotAvailableYet}
        subtitle={T['oneks.tab.info.kubeconfig.help.paragraph']}
      />
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <CodeSnippet code={data?.kubeconfig} />
    </Box>
  )
}

KubernetesConfig.displayName = 'KubernetesConfig'
KubernetesConfig.id = 'kubeconfig'
KubernetesConfig.title = 'Kubeconfig'
KubernetesConfig.propTypes = {
  data: PropTypes.object,
}

export default KubernetesConfig
