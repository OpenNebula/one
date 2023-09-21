/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Component, useState } from 'react'
import { Box, Grid, Card, CardContent, Typography } from '@mui/material'
import { MultiChart } from 'client/components/Charts'
import { transformApiResponseToDataset } from 'client/components/Charts/MultiChart/helpers/scripts'
import { QuotaControls } from 'client/components/Tabs/User/Quota/Components'
import { useGetUserQuery } from 'client/features/OneApi/user'

/**
 * QuotasInfoTab component.
 *
 * @param {object} props - Component properties.
 * @param {string} props.id - User ID.
 * @returns {Component} Rendered component.
 */
const QuotasInfoTab = ({ id }) => {
  const [selectedType, setSelectedType] = useState('VM')
  const queryInfo = useGetUserQuery({ id })
  const apiData = queryInfo?.data || {}

  const generateKeyMap = (data) => {
    const keyMap = {}
    if (Array.isArray(data)) {
      Object.keys(data[0] || {}).forEach((key) => {
        keyMap[key] = key
      })
    } else {
      Object.keys(data || {}).forEach((key) => {
        keyMap[key] = key
      })
    }

    return keyMap
  }

  const generateMetricKeys = (quotaTypes) => {
    const metricKeys = {}
    quotaTypes.forEach((config) => {
      metricKeys[config.type] = Object.values(config.keyMap).filter(
        (key) => key !== 'ID'
      )
    })

    return metricKeys
  }

  const generateMetricNames = (quotaTypes) => {
    const metricNames = {}

    quotaTypes.forEach((config) => {
      Object.keys(config.keyMap).forEach((key) => {
        const transformedKey = key
          .replace(/_/g, ' ')
          .split(' ')
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ')

        metricNames[key] = transformedKey
      })
    })

    return metricNames
  }

  const quotaTypesConfig = [
    {
      title: 'VM Quota',
      quota: Array.isArray(apiData.VM_QUOTA)
        ? apiData.VM_QUOTA
        : [apiData.VM_QUOTA],
      type: 'VM',
      keyMap: generateKeyMap(apiData.VM_QUOTA),
    },
    {
      title: 'Datastore Quota',
      quota: Array.isArray(apiData.DATASTORE_QUOTA)
        ? apiData.DATASTORE_QUOTA
        : [apiData.DATASTORE_QUOTA],
      type: 'DATASTORE',
      keyMap: generateKeyMap(apiData.DATASTORE_QUOTA),
    },
    {
      title: 'Network Quota',
      quota: Array.isArray(apiData.NETWORK_QUOTA)
        ? apiData.NETWORK_QUOTA
        : [apiData.NETWORK_QUOTA],
      type: 'NETWORK',
      keyMap: generateKeyMap(apiData.NETWORK_QUOTA),
    },
    {
      title: 'Image Quota',
      quota: Array.isArray(apiData.IMAGE_QUOTA)
        ? apiData.IMAGE_QUOTA
        : [apiData.IMAGE_QUOTA],
      type: 'IMAGE',
      keyMap: generateKeyMap(apiData.IMAGE_QUOTA),
    },
  ]
  const dynamicMetricKeys = generateMetricKeys(quotaTypesConfig)
  const dynamicMetricNames = generateMetricNames(quotaTypesConfig)

  const allDatasets = quotaTypesConfig.map((quotaType, index) => {
    const nestedQuotaData = { nestedData: quotaType.quota }

    const { dataset, error, isEmpty } = transformApiResponseToDataset(
      nestedQuotaData,
      quotaType.keyMap,
      dynamicMetricKeys[quotaTypesConfig[index].type],
      () => quotaType.type
    )

    return {
      dataset: { ...dataset, error, isEmpty },
    }
  })

  const selectedDataset = allDatasets.find(
    (_datasetObj, index) => quotaTypesConfig[index].type === selectedType
  )

  return (
    <Grid
      container
      spacing={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: '300px',
        minHeight: '300px',
      }}
    >
      <Grid
        container
        item
        spacing={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          flexShrink: 1,
          minWidth: 0,
          minHeight: 0,
          width: '100%',
        }}
      >
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Card variant={'outlined'} sx={{ height: '100%' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                textAlign={'center'}
                sx={{ opacity: 0.8 }}
              >
                Quota Controls
              </Typography>
              <QuotaControls
                quotaTypes={quotaTypesConfig}
                userId={id}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          md={8}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box sx={{ flex: 1, position: 'relative', mt: 4 }}>
            <MultiChart
              datasets={[selectedDataset?.dataset]}
              chartType={'stackedBar'}
              ItemsPerPage={10}
              isLoading={queryInfo.isFetching}
              error={
                queryInfo.isError || !selectedDataset?.dataset
                  ? 'Error fetching data'
                  : ''
              }
              groupBy={'ID'}
              disableExport={true}
              metricNames={dynamicMetricNames}
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  )
}

QuotasInfoTab.propTypes = {
  id: PropTypes.string.isRequired,
}

export default QuotasInfoTab
