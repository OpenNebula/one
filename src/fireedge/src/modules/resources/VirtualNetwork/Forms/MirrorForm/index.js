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
import { Box } from '@mui/material'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { object } from 'yup'
import { FormWithSchema, TagsInput, Text } from '@ComponentsModule'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { createSteps } from '@UtilsModule'
import { SourceSelector } from './SourceSelector'
import { MirrorReview } from './Review'
import { mirrorAttributes, mirrorFormValues } from './helpers'
import {
  CONFIGURATION_SCHEMA,
  TRAFFIC_SCHEMA,
  configurationFields,
  destinationFields,
  DIRECTION_FIELD,
  PORTS_FIELD,
  VLANS_FIELD,
  parseVLANs,
} from './schema'

const ConfigurationContent = ({ isUpdate }) => {
  const [type, subtype] = useWatch({
    name: ['configuration.TYPE', 'configuration.ERSPAN_TYPE'],
  })

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <FormWithSchema
        id="configuration"
        cy="mirror-configuration"
        fields={configurationFields(isUpdate)}
      />
      <Box
        component="section"
        display="flex"
        flexDirection="column"
        gap={2}
        data-cy="mirror-destination"
      >
        <Text
          variant={TEXT_VARIANTS.BODY_MEDIUM}
          weight={TEXT_WEIGHTS.SEMIBOLD}
          value={T.MirrorDestination}
          sx={{ color: 'text.headings' }}
        />
        {type ? (
          <FormWithSchema
            id="configuration"
            cy="mirror-configuration"
            fields={destinationFields(type, subtype)}
          />
        ) : (
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={T.MirrorChooseDestinationType}
            sx={{ color: 'text.onDisabled' }}
            data-cy="mirror-destination-hint"
          />
        )}
      </Box>
    </Box>
  )
}
ConfigurationContent.propTypes = {
  isUpdate: PropTypes.bool,
}

const TrafficContent = ({ vnet, isUpdate }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={(theme) => ({ gap: `${theme.scale[600]}px` })}
    >
      <Box component="section" display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" gap={0.5}>
          <Text
            variant={TEXT_VARIANTS.BODY_MEDIUM}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={T.MirrorDirection}
            sx={{ color: 'text.headings' }}
          />
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={T.MirrorDirectionDescription}
            sx={{ color: 'text.body' }}
          />
        </Box>
        <FormWithSchema
          id="traffic"
          cy="mirror-traffic"
          fields={[{ ...DIRECTION_FIELD, label: '' }]}
          rootProps={{ sx: { m: 0, '& fieldset': { m: 0 } } }}
        />
      </Box>
      <Box component="section" display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" gap={0.5}>
          <Text
            variant={TEXT_VARIANTS.BODY_MEDIUM}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={PORTS_FIELD.label}
            sx={{ color: 'text.headings' }}
          />
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={T.MirrorSourceInterfacesDescription}
            values={[vnet.NAME ?? String(vnet.ID)]}
            sx={{ color: 'text.body' }}
          />
        </Box>
        {isUpdate ? (
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={T.MirrorEditSourcesHint}
            sx={{ color: 'text.body' }}
          />
        ) : (
          <Controller
            control={control}
            name={`traffic.${PORTS_FIELD.name}`}
            render={({ field }) => (
              <SourceSelector
                vnetId={vnet.ID}
                value={field.value}
                onChange={field.onChange}
                errors={errors?.traffic?.[PORTS_FIELD.name]}
              />
            )}
          />
        )}
      </Box>
      <Controller
        control={control}
        name={`traffic.${VLANS_FIELD.name}`}
        render={({ field, fieldState }) => (
          <TagsInput
            {...VLANS_FIELD.fieldProps}
            label={VLANS_FIELD.label}
            dataCy={`mirror-traffic-${VLANS_FIELD.name}`}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(values) => field.onChange(values.flatMap(parseVLANs))}
            error={fieldState.error?.message}
          />
        )}
      />
    </Box>
  )
}
TrafficContent.propTypes = {
  vnet: PropTypes.object,
  isUpdate: PropTypes.bool,
}

const ReviewContent = ({ vnet, onStepChange }) => {
  const values = useWatch()

  return (
    <MirrorReview
      mirror={mirrorAttributes(values)}
      vnet={vnet}
      onEditConfiguration={() => onStepChange(0)}
      onEditTraffic={() => onStepChange(1)}
    />
  )
}
ReviewContent.propTypes = {
  vnet: PropTypes.object,
  onStepChange: PropTypes.func,
}

const MirrorForm = createSteps(
  [
    ({ isUpdate }) => ({
      id: 'configuration',
      label: T.Configuration,
      resolver: () => CONFIGURATION_SCHEMA,
      optionsValidate: { abortEarly: false },
      content: () => <ConfigurationContent isUpdate={isUpdate} />,
    }),
    ({ vnet, isUpdate }) => ({
      id: 'traffic',
      label: T.MirrorTrafficSource,
      resolver: () => TRAFFIC_SCHEMA,
      optionsValidate: { abortEarly: false },
      content: () => <TrafficContent vnet={vnet} isUpdate={isUpdate} />,
    }),
    ({ vnet }) => ({
      id: 'review',
      label: T.MirrorReview,
      resolver: () =>
        object().test('review', T.MirrorInvalidConfiguration, function () {
          const values = this.options.context
          if (!values?.configuration) return true

          try {
            CONFIGURATION_SCHEMA.validateSync(values.configuration)
            TRAFFIC_SCHEMA.validateSync(values.traffic)

            return true
          } catch (error) {
            return this.createError({ message: error.message })
          }
        }),
      content: ({ onStepChange }) => (
        <ReviewContent vnet={vnet} onStepChange={onStepChange} />
      ),
    }),
  ],
  {
    transformInitialValue: (mirror) => mirrorFormValues(mirror),
    transformBeforeSubmit: (values, _, { isUpdate }) =>
      mirrorAttributes(values, isUpdate),
  }
)

export default MirrorForm
