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
import { css } from '@emotion/css'
import { Alert, Stack, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import { OpenNebulaLogo } from '@modules/components/Icons'

import { RESOURCE_NAMES } from '@ConstantsModule'
import { MarketplaceAppAPI, useViews } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { GlobalActions } from '@modules/components/Tables/Enhanced/Utils'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/MarketplaceApp/Info'
import Template from '@modules/components/Tabs/MarketplaceApp/Template'

const useStyles = () => ({
  actions: css({
    marginBottom: '0.5rem',
    gridArea: 'actions',
  }),
})

const getTabComponent = (tabName) =>
  ({
    info: Info,
    template: Template,
  }[tabName])

const MarketplaceAppTabs = memo(({ id, actions }) => {
  const theme = useTheme()
  const styles = useMemo(() => useStyles(theme), [theme])

  const { view, getResourceView } = useViews()
  const { isError, error, status, data } =
    MarketplaceAppAPI.useGetMarketplaceAppQuery(
      { id },
      { refetchOnMountOrArgChange: 10 }
    )

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.APP
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view, id])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || id === data?.ID) {
    if (actions?.length) {
      const selectedRows = [
        {
          id,
          original: data,
        },
      ]

      return (
        <>
          <GlobalActions
            globalActions={actions}
            selectedRows={selectedRows}
            className={styles.actions}
          />
          <Tabs addBorder tabs={tabsAvailable ?? []} />
        </>
      )
    }

    return <Tabs addBorder tabs={tabsAvailable ?? []} />
  }

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
})
MarketplaceAppTabs.propTypes = {
  id: PropTypes.string.isRequired,
  actions: PropTypes.array,
}
MarketplaceAppTabs.displayName = 'MarketplaceAppTabs'

export default MarketplaceAppTabs
