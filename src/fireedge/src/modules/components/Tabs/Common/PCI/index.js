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

import { HostAPI, useGeneralApi } from '@FeaturesModule'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { debounce } from 'lodash'
import PropTypes from 'prop-types'
import { Component, useState, useEffect } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import {
  PCI_PROFILE_FIELD,
  PCI_FILTER_FIELDS,
  PCI_SCHEMA,
} from '@modules/components/Tabs/Common/PCI/schema'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { jsonToXml } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.host - Fetched host data
 * @param {number} root0.id - Host ID
 * @param {Function} root0.update - API update call
 * @param {object} root0.resource - Resource returned from API call
 * @param {boolean} root0.forceSync - Attempt to force update host after update
 * @returns {Component} PCI Profile selector.
 */
export const ProfileSelector = ({
  id,
  host,
  update,
  resource,
  forceSync = false,
}) => {
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
    if (!Object.hasOwn(resource, 'TEMPLATE')) return
    const { TEMPLATE } = resource

    setUpdating((prev) => !prev)
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

    isSuccess && enqueueSuccess([T.PciConfigUpdated, id])

    setUpdating((prev) => !prev)
  }

  const { handleSubmit, setValue, watch, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: PCI_SCHEMA.default(),
    resolver: yupResolver(PCI_SCHEMA),
  })

  useEffect(() => {
    if (resource) {
      const fieldIdentifiers = [
        'PCI_FILTER',
        'PCI_GPU_PROFILE',
        'PCI_SHORT_ADDRESS',
      ]
      fieldIdentifiers?.forEach((field) => {
        if (field === 'PCI_SHORT_ADDRESS') {
          setValue(
            field,
            [].concat(resource?.TEMPLATE?.[field]?.split(',')).filter(Boolean)
          )
        } else {
          setValue(field, resource?.TEMPLATE?.[field])
        }
      })
    }
  }, [])

  const watchedProfileSelector = watch('PCI_GPU_PROFILE')

  useEffect(() => {
    const debouncedSubmit = debounce(() => {
      handleSubmit(onSubmit)()
    }, 500)

    if (
      (watchedProfileSelector || watchedProfileSelector === '') &&
      watchedProfileSelector !== resource?.TEMPLATE?.PCI_GPU_PROFILE
    ) {
      debouncedSubmit()
    }

    return () => {
      debouncedSubmit.cancel()
    }
  }, [watchedProfileSelector])

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <FormProvider {...methods}>
        {/* Render filter fields separately from profile selector, as the filters control which profiles are visible */}
        <Box
          sx={{
            p: 2,
            m: 2,
          }}
        >
          <Typography
            variant="h6"
            component="legend"
            sx={{
              mb: 2,
            }}
          >
            {T.vGPUProfile}
          </Typography>
          <FormWithSchema
            cy="pci-profile-selector"
            fields={PCI_PROFILE_FIELD(host)}
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            {T.vGPUConcept}
          </Alert>
        </Box>
        <Box
          sx={{
            p: 2,
            m: 2,
          }}
        >
          <Typography
            variant="h6"
            component="legend"
            sx={{
              mb: 2,
            }}
          >
            {T.FilterPCIDevices}
          </Typography>
          <FormWithSchema
            cy="pci-filter-selector"
            fields={PCI_FILTER_FIELDS(host)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SubmitButton
              data-cy="submit-pci-filter"
              onClick={handleSubmit(onSubmit)}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              disabled={updating}
              label={T.Filter}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
            />
          </Box>
        </Box>
      </FormProvider>
    </Box>
  )
}

ProfileSelector.propTypes = {
  id: PropTypes.number,
  host: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  update: PropTypes.function,
  resource: PropTypes.object,
  forceSync: PropTypes.boolean,
}
