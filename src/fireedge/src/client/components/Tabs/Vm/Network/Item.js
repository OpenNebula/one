/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo, useContext } from 'react'
import PropTypes from 'prop-types'

import { styled, useMediaQuery } from '@mui/material'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import MAccordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary, {
  accordionSummaryClasses,
} from '@mui/material/AccordionSummary'
import { Trash as TrashIcon, NavArrowRight as ExpandIcon } from 'iconoir-react'

import { useVmApi } from 'client/features/One'
import { useDialog } from 'client/hooks'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { Action } from 'client/components/Cards/SelectCard'
import { DialogConfirmation } from 'client/components/Dialogs'
import MultipleTags from 'client/components/MultipleTags'

import { Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const DATACYSECURITY = 'securitygroup-'
const DATACYNETWORK = 'network-'
const DATACYALIAS = 'alias-'

const Accordion = styled((props) => (
  <MAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:before': { display: 'none' },
}))

const Summary = styled(AccordionSummary)({
  [`&.${accordionSummaryClasses.root}`]: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '&:hover': { backgroundColor: 'rgba(0, 0, 0, .07)' },
  },
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
    {
      transform: 'rotate(90deg)',
    },
})

const Row = styled('div')({
  display: 'flex',
  width: '100%',
  gap: '0.5em',
  alignItems: 'center',
  flexWrap: 'nowrap',
})

const Labels = styled('span')({
  display: 'inline-flex',
  gap: '0.5em',
  alignItems: 'center',
})

const Details = styled(AccordionDetails)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5em',
  marginLeft: '1em',
})

const SecGroups = styled(Paper)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5em',
  padding: '0.8em',
})

const NetworkItem = ({ nic = {}, actions }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

  const { display, show, hide, values } = useDialog()
  const { detachNic } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const {
    NIC_ID,
    NETWORK = '-',
    IP,
    MAC,
    PCI_ID,
    ADDRESS,
    ALIAS,
    SECURITY_GROUPS,
  } = nic
  const isPciDevice = PCI_ID !== undefined

  const hasDetails = useMemo(
    () => !!ALIAS.length || !!SECURITY_GROUPS?.length,
    [ALIAS?.length, SECURITY_GROUPS?.length]
  )

  const handleDetach = async () => {
    const response =
      values?.id !== undefined && (await detachNic(vm.ID, values.id))

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
    hide()
  }

  const detachAction = (id, isAlias) =>
    actions?.includes?.(VM_ACTIONS.DETACH_NIC) && (
      <Action
        cy={`${VM_ACTIONS.DETACH_NIC}-${id}`}
        icon={<TrashIcon />}
        stopPropagation
        handleClick={() => show({ id, isAlias })}
      />
    )

  const tags = [
    {
      text: IP,
      dataCy: `${DATACYNETWORK}ip`,
    },
    {
      text: MAC,
      dataCy: `${DATACYNETWORK}mac`,
    },
    {
      text: ADDRESS,
      dataCy: `${DATACYNETWORK}address`,
    },
  ].filter(({ text } = {}) => Boolean(text))

  return (
    <>
      <Accordion data-cy={`${DATACYNETWORK}${NIC_ID}`}>
        <Summary {...(hasDetails && { expandIcon: <ExpandIcon /> })}>
          <Row>
            <Typography noWrap data-cy={`${DATACYNETWORK}name`}>
              {`${NIC_ID} | ${NETWORK}`}
            </Typography>
            <Labels>
              <MultipleTags
                clipboard
                limitTags={isMobile ? 1 : 3}
                tags={tags}
              />
            </Labels>
            {!isMobile && !isPciDevice && detachAction(NIC_ID)}
          </Row>
        </Summary>
        {hasDetails && (
          <Details>
            {ALIAS?.map(({ NIC_ID, NETWORK = '-', BRIDGE, IP, MAC }) => {
              const tags = [
                {
                  text: IP,
                  dataCy: `${DATACYALIAS}ip`,
                },
                {
                  text: MAC,
                  dataCy: `${DATACYALIAS}mac`,
                },
                {
                  text: BRIDGE && `BRIDGE - ${BRIDGE}`,
                  dataCy: `${DATACYALIAS}bridge`,
                },
              ].filter(({ text } = {}) => Boolean(text))

              return (
                <Row key={NIC_ID} data-cy={`${DATACYALIAS}${NIC_ID}`}>
                  <Typography
                    noWrap
                    variant="body2"
                    data-cy={`${DATACYALIAS}name`}
                  >
                    <Translate word={T.Alias} />
                    {`${NIC_ID} | ${NETWORK}`}
                  </Typography>
                  <Labels>
                    <MultipleTags
                      clipboard
                      limitTags={isMobile ? 1 : 3}
                      tags={tags}
                    />
                  </Labels>
                  {!isMobile && !isPciDevice && detachAction(NIC_ID, true)}
                </Row>
              )
            })}
            {!!SECURITY_GROUPS?.length && (
              <SecGroups variant="outlined">
                <Typography variant="body1">
                  <Translate word={T.SecurityGroups} />
                </Typography>

                {SECURITY_GROUPS?.map(
                  (
                    {
                      ID,
                      SECURITY_GROUP_ID,
                      NAME,
                      PROTOCOL,
                      RULE_TYPE,
                      ICMP_TYPE,
                      RANGE,
                      NETWORK_ID,
                    },
                    idx
                  ) => {
                    const tags = [
                      {
                        text: PROTOCOL,
                        dataCy: `${DATACYSECURITY}protocol`,
                      },
                      {
                        text: RULE_TYPE,
                        dataCy: `${DATACYSECURITY}ruletype`,
                      },
                      {
                        text: RANGE,
                        dataCy: `${DATACYSECURITY}range`,
                      },
                      {
                        text: NETWORK_ID,
                        dataCy: `${DATACYSECURITY}networkid`,
                      },
                      {
                        text: ICMP_TYPE,
                        dataCy: `${DATACYSECURITY}icmp_type`,
                      },
                    ].filter(({ text } = {}) => Boolean(text))

                    return (
                      <Row
                        key={`${idx}-${NAME}`}
                        data-cy={`${DATACYSECURITY}${idx}`}
                      >
                        <Typography
                          noWrap
                          variant="body2"
                          data-cy={`${DATACYSECURITY}name`}
                        >
                          {`${ID} | ${NAME}`}
                        </Typography>
                        <Labels>
                          <MultipleTags
                            limitTags={isMobile ? 2 : 5}
                            tags={tags}
                          />
                        </Labels>
                      </Row>
                    )
                  }
                )}
              </SecGroups>
            )}
          </Details>
        )}
      </Accordion>

      {display && (
        <DialogConfirmation
          title={
            <Translate
              word={T.DetachSomething}
              values={`${values?.isAlias ? T.Alias : T.NIC} #${values?.id}`}
            />
          }
          handleAccept={handleDetach}
          handleCancel={hide}
        >
          <Typography>
            <Translate word={T.DoYouWantProceed} />
          </Typography>
        </DialogConfirmation>
      )}
    </>
  )
}

NetworkItem.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  nic: PropTypes.object,
}

NetworkItem.displayName = 'NetworkItem'

export default NetworkItem
