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
import { useMemo } from 'react'
import { Box } from '@mui/material'
import { Plus, RefreshDouble, Trash } from 'iconoir-react'
import { Button, Dropdown, Text } from '@ComponentsModule'
import { VmAPI } from '@FeaturesModule'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { networkNics } from './helpers'

const nicLabel = (nic) =>
  [`NIC ${nic.NIC_ID}`, nic.IP || nic.IP6, nic.MAC].filter(Boolean).join(' · ')

/**
 * Selects VM interfaces on the current network.
 *
 * @param {object} props - Props
 * @param {string|number} props.vnetId - Current network
 * @param {object[]} props.value - Selected VM/NIC pairs
 * @param {Function} props.onChange - Selection change handler
 * @param {string[]} props.excludedPorts - Already attached sources
 * @param {boolean} props.single - Allow one source
 * @param {boolean} props.disabled - Disable changes
 * @param {object} props.errors - Field errors
 * @returns {object} VM/NIC selector
 */
export const SourceSelector = ({
  vnetId,
  value = [],
  onChange,
  excludedPorts = [],
  single = false,
  disabled = false,
  errors = {},
}) => {
  const { translate } = useTranslation()
  const {
    data: vms = [],
    isFetching,
    isError,
    refetch,
  } = VmAPI.useGetVmsQuery({ extended: true }, { skip: vnetId == null })
  const candidates = useMemo(
    () => vms.filter((vm) => networkNics(vm, vnetId).length > 0),
    [vms, vnetId]
  )
  const blocked = disabled || isFetching || isError
  const rows = value.length ? value : [{ VM_ID: '', NIC_ID: '' }]

  const updateSources = (sources) =>
    onChange(
      !single && sources.length === 1 && !sources[0].VM_ID && !sources[0].NIC_ID
        ? []
        : sources
    )

  const updateRow = (index, selection) =>
    updateSources(
      rows.map((source, idx) =>
        idx === index ? { ...source, ...selection } : source
      )
    )

  /**
   * Prepares the selected interface, dropdown options and errors for a row.
   *
   * @param {object} source - Selected VM/NIC pair
   * @param {number} index - Source row index
   * @returns {object} Row data
   */
  const getRowData = (source, index) => {
    const vm = candidates.find(({ ID }) => String(ID) === String(source.VM_ID))
    const nics = networkNics(vm, vnetId)
    const usedPorts = new Set([
      ...excludedPorts,
      ...rows
        .filter((_, idx) => idx !== index)
        .map(({ VM_ID, NIC_ID }) => `${VM_ID}:${NIC_ID}`),
    ])
    const availableNics = (machine) =>
      networkNics(machine, vnetId).filter(
        (nic) => !usedPorts.has(`${machine.ID}:${nic.NIC_ID}`)
      )
    const vmOptions = candidates
      .filter((machine) => availableNics(machine).length)
      .map((machine) => ({
        value: String(machine.ID),
        text: `${machine.NAME} (#${machine.ID})`,
        description: `${networkNics(machine, vnetId).length} · ${
          T.MirrorSourceInterfaces
        }`,
      }))
    const nicOptions = vm
      ? availableNics(vm).map((nic) => ({
          value: String(nic.NIC_ID),
          text: nicLabel(nic),
        }))
      : []
    const missing =
      source.VM_ID &&
      !isFetching &&
      !isError &&
      (!vm ||
        (source.NIC_ID &&
          !nics.some((nic) => String(nic.NIC_ID) === String(source.NIC_ID))))
    const rowErrors = errors?.[index] ?? {}

    return { vm, nics, vmOptions, nicOptions, missing, rowErrors }
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1.5}
      data-cy="mirror-sources"
    >
      {rows.map((source, index) => {
        const { vm, nics, vmOptions, nicOptions, missing, rowErrors } =
          getRowData(source, index)

        return (
          <Box key={index} display="flex" alignItems="flex-start" gap={1.5}>
            <Box flex="1 1 0" minWidth={0}>
              <Dropdown
                label={T.MirrorVM}
                placeholder={T.MirrorVMSearch}
                dataCy={`mirror-source-${index}-vm`}
                isSearchable
                isDisabled={blocked}
                initialValue={
                  vmOptions.find((option) => option.value === source.VM_ID) ??
                  null
                }
                options={vmOptions}
                error={
                  rowErrors.VM_ID?.message ||
                  (missing ? T.MirrorSourceUnavailable : undefined)
                }
                onChange={(option) => {
                  const selectedVM = candidates.find(
                    ({ ID }) => String(ID) === option?.value
                  )
                  const matching = networkNics(selectedVM, vnetId)

                  updateRow(index, {
                    VM_ID: option?.value ?? '',
                    NIC_ID:
                      matching.length === 1 ? String(matching[0].NIC_ID) : '',
                  })
                }}
              />
            </Box>

            <Box
              flex="1 1 0"
              minWidth={0}
              display="flex"
              alignItems="flex-start"
            >
              {!vm ? (
                <Box>
                  <Text
                    variant={TEXT_VARIANTS.BODY_SMALL}
                    weight={TEXT_WEIGHTS.MEDIUM}
                    value={T.MirrorInterface}
                    sx={{ color: 'text.headings' }}
                  />
                  <Text
                    variant={TEXT_VARIANTS.BODY_SMALL}
                    value={T.MirrorChooseVMFirst}
                    sx={{ mt: '15px', color: 'text.onDisabled' }}
                  />
                </Box>
              ) : (
                <Dropdown
                  label={T.MirrorInterface}
                  placeholder={T.MirrorVMSearchInterface}
                  dataCy={`mirror-source-${index}-nic`}
                  options={nicOptions}
                  initialValue={
                    nicOptions.find(
                      (option) => option.value === source.NIC_ID
                    ) ?? null
                  }
                  isDisabled={blocked || nics.length === 1}
                  hint={
                    nics.length === 1
                      ? T.MirrorAutoSelectedInterface
                      : nics.length > 1
                      ? translate(T.MirrorInterfacesOnNetwork, nics.length)
                      : undefined
                  }
                  error={rowErrors.NIC_ID?.message}
                  onChange={(option) =>
                    updateRow(index, { NIC_ID: option?.value ?? '' })
                  }
                />
              )}
            </Box>

            {!single && (
              <Button
                isDestructive={true}
                type="transparent"
                iconOnly={<Trash />}
                dataCy={`mirror-source-${index}-remove`}
                isDisabled={disabled || (rows.length === 1 && !source.VM_ID)}
                sx={{ mt: '29px' }}
                onClick={() =>
                  rows.length === 1
                    ? updateRow(index, { VM_ID: '', NIC_ID: '' })
                    : updateSources(rows.filter((_, idx) => idx !== index))
                }
              />
            )}
          </Box>
        )
      })}

      {isError && (
        <Text
          variant={TEXT_VARIANTS.BODY_SMALL}
          value={T.MirrorSourceLoadError}
          sx={{ color: 'error.main' }}
        />
      )}

      {!isFetching && !isError && !candidates.length && (
        <Text
          variant={TEXT_VARIANTS.BODY_SMALL}
          value={T.MirrorNoSourceVMs}
          sx={{ color: 'text.onDisabled' }}
        />
      )}

      {errors?.message && (
        <Text
          variant={TEXT_VARIANTS.BODY_SMALL}
          value={errors.message}
          sx={{ color: 'error.main' }}
        />
      )}

      {!single && (
        <Box display="flex" gap={1}>
          <Button
            type="secondary"
            size="small"
            startIcon={<Plus />}
            dataCy="mirror-add-source-row"
            isDisabled={blocked}
            onClick={() => updateSources([...rows, { VM_ID: '', NIC_ID: '' }])}
          >
            {T.MirrorAddSource}
          </Button>
          <Button
            type="transparent"
            size="small"
            startIcon={<RefreshDouble />}
            dataCy="mirror-refresh-sources"
            isDisabled={disabled || isFetching}
            onClick={refetch}
          >
            {T.Refresh}
          </Button>
        </Box>
      )}
    </Box>
  )
}

SourceSelector.propTypes = {
  vnetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  excludedPorts: PropTypes.array,
  single: PropTypes.bool,
  disabled: PropTypes.bool,
  errors: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
}
