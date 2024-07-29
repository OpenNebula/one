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
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { MultiChart } from 'client/components/Charts'
import { transformApiResponseToDataset } from 'client/components/Charts/MultiChart/helpers/scripts'
import { QuotaControls } from 'client/components/Tabs/Quota/Components'
import { useGetUserQuery } from 'client/features/OneApi/user'
import { useGetGroupQuery } from 'client/features/OneApi/group'
import { nameMapper } from 'client/components/Tabs/Quota/Components/helpers/scripts'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
/**
 * Generates a QuotaInfoTab for an user or a group.
 *
 * @param {object} props - Input properties
 * @param {boolean} props.groups - If it's a group or not
 * @returns {object} - The QuotasInfoTab component
 */
const generateQuotasInfoTab = ({ groups }) => {
  const QuotasInfoTab = ({ id }) => {
    const datastoresResponse = useGetDatastoresQuery()
    const networksResponse = useGetVNetworksQuery()
    const imagesResponse = useGetImagesQuery()
    const [dsNameMap, setDsNameMap] = useState({})
    const [imgNameMap, setImgNameMap] = useState({})
    const [netNameMap, setNetNameMap] = useState({})
    const [selectedType, setSelectedType] = useState('VM')
    const [clickedElement, setClickedElement] = useState(null)
    const queryInfo = groups
      ? useGetGroupQuery({ id })
      : useGetUserQuery({ id })

    const apiData = queryInfo?.data || {}

    useEffect(() => {
      if (datastoresResponse.isSuccess && datastoresResponse.data) {
        setDsNameMap(nameMapper(datastoresResponse))
      }
    }, [datastoresResponse])

    useEffect(() => {
      if (networksResponse.isSuccess && networksResponse.data) {
        setNetNameMap(nameMapper(networksResponse))
      }
    }, [networksResponse])

    useEffect(() => {
      if (imagesResponse.isSuccess && imagesResponse.data) {
        setImgNameMap(nameMapper(imagesResponse))
      }
    }, [imagesResponse])

    const nameMaps = {
      DATASTORE: dsNameMap,
      NETWORK: netNameMap,
      IMAGE: imgNameMap,
    }

    const handleChartElementClick = (data) => {
      setClickedElement(data)
    }

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
            .map((word) =>
              Tr(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            )
            .join(' ')

          metricNames[key] = transformedKey
        })
      })

      return metricNames
    }

    const processDataset = (dataset) => {
      if (!dataset || !dataset.data) return { ...dataset }

      const newData = dataset.data.map((item) => {
        const newItem = { ...item }
        if (newItem.ID && nameMaps?.[selectedType]?.[newItem.ID]) {
          newItem.ID = nameMaps?.[selectedType]?.[newItem.ID]
        }
        Object.keys(newItem).forEach((key) => {
          const value = parseFloat(newItem[key])
          if (value < 0) {
            newItem[key] = '0'
          }
        })

        return newItem
      })

      return {
        ...dataset,
        data: newData,
      }
    }

    const quotaTypesConfig = [
      {
        title: Tr(T.VMQuota),
        quota: Array.isArray(apiData.VM_QUOTA)
          ? apiData.VM_QUOTA
          : [apiData.VM_QUOTA],
        type: 'VM',
        keyMap: generateKeyMap(apiData.VM_QUOTA),
      },
      {
        title: Tr(T.DatastoreQuota),
        quota: Array.isArray(apiData.DATASTORE_QUOTA)
          ? apiData.DATASTORE_QUOTA
          : [apiData.DATASTORE_QUOTA],
        type: 'DATASTORE',
        keyMap: generateKeyMap(apiData.DATASTORE_QUOTA),
      },
      {
        title: Tr(T.NetworkQuota),
        quota: Array.isArray(apiData.NETWORK_QUOTA)
          ? apiData.NETWORK_QUOTA
          : [apiData.NETWORK_QUOTA],
        type: 'NETWORK',
        keyMap: generateKeyMap(apiData.NETWORK_QUOTA),
      },
      {
        title: Tr(T.ImageQuota),
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

    const processedDataset = processDataset(selectedDataset?.dataset)

    return (
      <Grid
        container
        spacing={1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: '300px',
          minHeight: '600px',
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
            <Card
              variant={'outlined'}
              sx={{ height: '100%', overflow: 'auto' }}
            >
              <CardContent sx={{ flex: 1, overflow: 'auto' }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  textAlign={'center'}
                  sx={{ opacity: 0.8 }}
                >
                  {Tr(T.QuotaControls)}
                </Typography>
                <Box overflow={'auto'}>
                  <QuotaControls
                    quotaTypes={quotaTypesConfig}
                    userId={id}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    existingData={processedDataset?.data}
                    existingResourceIDs={processedDataset?.data?.map(
                      ({ ID }) => ID
                    )}
                    clickedElement={clickedElement}
                    nameMaps={nameMaps}
                    groups={groups}
                  />
                </Box>
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
                datasets={[processedDataset]}
                chartType={selectedType === 'VM' ? 'radialBar' : 'stackedBar'}
                ItemsPerPage={10}
                isLoading={queryInfo.isFetching}
                error={
                  queryInfo.isError || !selectedDataset?.dataset
                    ? 'Error fetching data'
                    : ''
                }
                disableExport={true}
                coordinateType={selectedType === 'VM' ? 'POLAR' : 'CARTESIAN'}
                disableNavController={selectedType === 'VM'}
                metricNames={dynamicMetricNames}
                onElementClick={handleChartElementClick}
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

  QuotasInfoTab.displayName = 'QuotasInfoTab'

  return QuotasInfoTab
}

export default generateQuotasInfoTab
