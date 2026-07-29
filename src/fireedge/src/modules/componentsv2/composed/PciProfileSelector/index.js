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

import { HostAPI, useGeneralApi } from '@FeaturesModule'
import { T, TEXT_WEIGHTS, TEXT_VARIANTS } from '@ConstantsModule'
import { debounce } from 'lodash'
import PropTypes from 'prop-types'
import { Component, useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { FormWithSchema } from '@modules/componentsv2/composed'
import {
  AlertNotification,
  SubmitButton,
  Text,
} from '@modules/componentsv2/primitives'
import {
  PCI_PROFILE_FIELD,
  PCI_FILTER_FIELDS,
  PCI_SCHEMA,
} from '@modules/componentsv2/composed/PciProfileSelector/schema'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { jsonToXml } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const getPciProfile = (resource) => resource?.TEMPLATE?.PCI_GPU_PROFILE ?? ''

const getPciShortAddresses = (resource) =>
  String(resource?.TEMPLATE?.PCI_SHORT_ADDRESS ?? '')
    .split(',')
    .filter(Boolean)

/**
 * @param {object} root0 - Params
 * @param {object} root0.host - Fetched host data
 * @param {string|number} root0.id - Host ID
 * @param {Function} root0.update - API update call
 * @param {object} root0.resource - Resource returned from API call
 * @param {boolean} root0.forceSync - Attempt to force update host after update
 * @returns {Component} PCI Profile selector.
 */
export const PciProfileSelector = ({
  id,
  host,
  update,
  resource,
  forceSync = false,
}) => {
  const { translate } = useTranslation()
  const [offline] = HostAPI.useOfflineHostMutation()
  const [enable] = HostAPI.useEnableHostMutation()
  const [refresh] = HostAPI.useLazyGetHostsQuery()

  const forceUpdate = async () => {
    await offline(id)
    await enable(id)
    await refresh()
  }

  const [updating, setUpdating] = useState(false)
  const { enqueueSuccess } = useGeneralApi()

  const onSubmit = async (data) => {
    if (!resource || !Object.hasOwn(resource, 'TEMPLATE')) return
    const { TEMPLATE } = resource

    setUpdating(true)

    try {
      const fmtData = Object.fromEntries(
        [...Object.entries(TEMPLATE), ...Object.entries(data)].filter(Boolean)
      )

      if (Array.isArray(fmtData.PCI_SHORT_ADDRESS)) {
        fmtData.PCI_SHORT_ADDRESS = fmtData.PCI_SHORT_ADDRESS.join(',')
      }

      const template = jsonToXml(fmtData)

      const { data: response } = await update({ id, template, replace: 0 })

      const isSuccess = +response === +id

      forceSync && (await forceUpdate())

      isSuccess && enqueueSuccess(T.PciConfigUpdated, id)
    } finally {
      setUpdating(false)
    }
  }

  const { handleSubmit, setValue, watch, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: PCI_SCHEMA.default(),
    resolver: yupResolver(PCI_SCHEMA),
  })

  useEffect(() => {
    if (resource) {
      setValue('PCI_FILTER', resource?.TEMPLATE?.PCI_FILTER ?? '')
      setValue('PCI_GPU_PROFILE', getPciProfile(resource))
      setValue('PCI_SHORT_ADDRESS', getPciShortAddresses(resource))
    }
  }, [
    resource?.TEMPLATE?.PCI_FILTER,
    resource?.TEMPLATE?.PCI_GPU_PROFILE,
    resource?.TEMPLATE?.PCI_SHORT_ADDRESS,
    setValue,
  ])

  const watchedPciProfileSelector = watch('PCI_GPU_PROFILE')
  const resourcePciProfile = getPciProfile(resource)

  useEffect(() => {
    const debouncedSubmit = debounce(() => {
      handleSubmit(onSubmit)()
    }, 500)

    if (
      (watchedPciProfileSelector || watchedPciProfileSelector === '') &&
      watchedPciProfileSelector !== resourcePciProfile
    ) {
      debouncedSubmit()
    }

    return () => {
      debouncedSubmit.cancel()
    }
  }, [resourcePciProfile, watchedPciProfileSelector])

  const vGpuProfileLabel = translate(T.vGPUProfile)
  const vGpuConceptDescription = translate(T.vGPUConcept)
  const filterPciDevicesLabel = translate(T.FilterPCIDevices)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <FormProvider {...methods}>
        {/* Render filter fields separately from profile selector, as the filters control which profiles are visible */}
        <Box
          sx={{
            px: '8px',
          }}
        >
          <Text
            component="h6"
            variant={TEXT_VARIANTS.H6}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={vGpuProfileLabel}
          />
          <FormWithSchema
            cy="pci-profile-selector"
            fields={PCI_PROFILE_FIELD(host)}
          />
          <AlertNotification
            type="primary"
            status="information"
            description={vGpuConceptDescription}
            isDismissible={false}
            style={{
              boxSizing: 'border-box',
              marginBottom: '16px',
              width: '100%',
            }}
          />
        </Box>
        <Box
          sx={{
            px: 0,
            py: 2,
            mx: 1,
            my: 2,
          }}
        >
          <Text
            component="h6"
            variant={TEXT_VARIANTS.H6}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={filterPciDevicesLabel}
          />
          <FormWithSchema
            cy="pci-filter-selector"
            fields={PCI_FILTER_FIELDS(host)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SubmitButton
              data-cy="submit-pci-filter"
              onClick={handleSubmit(onSubmit)}
              type="secondary"
              disabled={updating}
              label={T.Filter}
            />
          </Box>
        </Box>
      </FormProvider>
    </Box>
  )
}

PciProfileSelector.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  host: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  update: PropTypes.func,
  resource: PropTypes.object,
  forceSync: PropTypes.bool,
}
