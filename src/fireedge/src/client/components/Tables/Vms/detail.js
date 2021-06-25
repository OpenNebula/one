import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'

import Tabs from 'client/components/Tabs'
import { StatusBadge } from 'client/components/Status'

import { useFetch, useSocket } from 'client/hooks'
import { useVmApi } from 'client/features/One'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'

const NavArrowDown = <span style={{ writingMode: 'vertical-rl' }}>{'>'}</span>

const VmDetail = ({ id }) => {
  const { getHooksSocket } = useSocket()
  const socket = getHooksSocket({ resource: 'vm', id })

  const { getVm } = useVmApi()
  const { data, fetchRequest, loading, error } = useFetch(getVm, socket)

  useEffect(() => {
    fetchRequest(id)
  }, [id])

  if ((!data && !error) || loading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  if (error) {
    return <div>{error}</div>
  }

  const { ID, NAME, UNAME, GNAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID, TEMPLATE, USER_TEMPLATE } = data

  const isVCenter = VirtualMachine.isVCenter(data)
  const { name: stateName, color: stateColor } = VirtualMachine.getState(data)

  const { HID: hostId, HOSTNAME: hostname = '--', CID: clusterId } = VirtualMachine.getLastHistory(data)
  const clusterName = clusterId === '-1' ? 'default' : '--' // TODO: get from cluster list

  const ips = VirtualMachine.getIps(data)
  const { nics, alias } = VirtualMachine.splitNicAlias(data)

  const disks = VirtualMachine.getDisks(data)

  const tabs = [
    {
      name: 'info',
      renderContent: (
        <div>
          <div>
            <StatusBadge
              title={stateName}
              stateColor={stateColor}
              customTransform='translate(150%, 50%)'
            />
            <span style={{ marginLeft: 20 }}>
              {`#${ID} - ${NAME}`}
            </span>
          </div>
          <div>
            <p>Owner: {UNAME}</p>
            <p>Group: {GNAME}</p>
            <p>Reschedule: {Helper.booleanToString(+RESCHED)}</p>
            <p>Locked: {Helper.levelLockToString(LOCK?.LOCKED)}</p>
            <p>IP: {ips.join(', ') || '--'}</p>
            <p>Start time: {Helper.timeToString(STIME)}</p>
            <p>End time: {Helper.timeToString(ETIME)}</p>
            <p>Host: {hostId ? `#${hostId} ${hostname}` : ''}</p>
            <p>Cluster: {clusterId ? `#${clusterId} ${clusterName}` : ''}</p>
            <p>Deploy ID: {DEPLOY_ID}</p>
          </div>
        </div>
      )
    },
    {
      name: 'capacity',
      renderContent: (
        <div>
          <p>Physical CPU: {TEMPLATE?.CPU}</p>
          <p>Virtual CPU: {TEMPLATE?.VCPU ?? '-'}</p>
          {isVCenter && (
            <p>Virtual Cores: {`
              Cores x ${TEMPLATE?.TOPOLOGY?.CORES || '-'} |
              Sockets ${TEMPLATE?.TOPOLOGY?.SOCKETS || '-'}
            `}</p>
          )}
          <p>Memory: {prettyBytes(+TEMPLATE?.MEMORY, 'MB')}</p>
          <p>Cost / CPU: {TEMPLATE?.CPU_COST}</p>
          <p>Cost / MByte: {TEMPLATE?.MEMORY_COST}</p>
        </div>
      )
    },
    {
      name: 'storage',
      renderContent: (
        <div>
          <p>VM DISKS</p>
          {disks.map(({
            DISK_ID,
            DATASTORE = '-',
            TARGET = '-',
            IMAGE,
            TYPE,
            FORMAT,
            SIZE,
            MONITOR_SIZE,
            READONLY,
            SAVE = 'No',
            CLONE
          }) => {
            const size = +SIZE ? prettyBytes(+SIZE, 'MB') : '-'
            const monitorSize = +MONITOR_SIZE ? prettyBytes(+MONITOR_SIZE, 'MB') : '-'

            const type = String(TYPE).toLowerCase()

            const image = IMAGE ?? ({
              fs: `${FORMAT} - ${size}`,
              swap: size
            }[type])

            return (
              <p key={DISK_ID}>
                {`${DISK_ID} | ${DATASTORE} | ${TARGET} | ${image} | ${monitorSize}/${size} | ${type} | ${READONLY} | ${SAVE} | ${CLONE}`}
              </p>
            )
          })}
        </div>
      )
    },
    {
      name: 'network',
      renderContent: (
        <div>
          <div>
            <p>VM NICS</p>
            {nics.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-', PCI_ID = '' }) => (
              <p key={NIC_ID}>
                {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC} | ${PCI_ID}`}
              </p>
            ))}
          </div>
          <hr />
          <div>
            <p>VM ALIAS</p>
            {alias.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-' }) => (
              <p key={NIC_ID}>
                {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC}`}
              </p>
            ))}
          </div>
        </div>
      )
    },
    {
      name: 'template',
      renderContent: (
        <div>
          <Accordion TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={NavArrowDown}>
            User Template
            </AccordionSummary>
            <AccordionDetails>
              <pre>
                <code>
                  {JSON.stringify(USER_TEMPLATE, null, 2)}
                </code>
              </pre>
            </AccordionDetails>
          </Accordion>
          <Accordion TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={NavArrowDown}>
            Template
            </AccordionSummary>
            <AccordionDetails>
              <pre>
                <code>
                  {JSON.stringify(TEMPLATE, null, 2)}
                </code>
              </pre>
            </AccordionDetails>
          </Accordion>
        </div>
      )
    }
  ]

  return (
    <Tabs tabs={tabs} />
  )
}

VmDetail.propTypes = {
  id: PropTypes.string.isRequired
}

export default VmDetail
