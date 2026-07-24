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
import {
  stringToBoolean,
  createTable,
  getLockIcon,
  timeFromMilliseconds,
  prettyBytes,
} from '@UtilsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Check as CopiedIcon, Copy as CopyIcon } from 'iconoir-react'
import { VmAPI, HostAPI, ImageAPI, DatastoreAPI } from '@FeaturesModule'
import { useClipboard } from '@HooksModule'
import {
  getBackupList,
  getDiskSize,
  getDisks,
  getHistoryAction,
  getHistoryRecords,
  getIpv4s,
  getLastHistory,
  getNics,
  getPcis,
  getSnapshotList,
  getScheduleActions,
  getVirtualMachineState,
} from '@modules/models/VirtualMachine/general'
import { getRepeatInformation } from '@modules/models/Scheduler/general'
import { getDiskType, getDiskName } from '@modules/models/Image/general'
import { getPciDevices } from '@modules/models/Host/general'
import {
  T,
  UNITS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'
import {
  Image,
  ProgressBar,
  StatusTag,
  Tag,
  TagList,
} from '@ComponentsV2Module'
import { createLabelColumn } from '@modules/models/labels'
import { scale } from '@StylesModule'

const CopyableTagListCell = ({ values = [] }) => {
  const { copy, isCopied } = useClipboard()

  return (
    <Box onClick={(event) => event.stopPropagation()}>
      {values.length ? (
        <TagList
          max={1}
          tags={values.map((value) => ({
            title: value,
            endIcon: isCopied(value) ? <CopiedIcon /> : <CopyIcon />,
            onClick: (event) => {
              event.stopPropagation()
              copy(value)
            },
          }))}
        />
      ) : (
        '-'
      )}
    </Box>
  )
}

CopyableTagListCell.propTypes = {
  values: PropTypes.arrayOf(PropTypes.string),
}

/* eslint-disable jsdoc/require-jsdoc */
export const VM_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    accessorKey: 'NAME',
    truncate: true,
    cell: ({ row }) => {
      const logo =
        row?.original?.USER_TEMPLATE?.LOGO ||
        row?.original?.USER_TEMPLATE?.USER_TEMPLATE?.LOGO ||
        row?.original?.TEMPLATE?.LOGO ||
        DEFAULT_TEMPLATE_LOGO
      const src = `${STATIC_FILES_URL}/${logo}`
      const lockIcon = getLockIcon(row.original)

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
          }}
        >
          <Image
            src={src}
            width={scale[600]}
            height={scale[600]}
            alt={'list-image-identifier'}
          />
          <Box
            component="span"
            sx={{
              flex: '0 1 auto',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.original?.NAME}
          </Box>
          {lockIcon && (
            <Box sx={{ display: 'flex', flex: '0 0 auto' }}>{lockIcon}</Box>
          )}
        </Box>
      )
    },
  },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getVirtualMachineState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getVirtualMachineState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.CPU,
    id: 'cpu',
    cell: ({ row }) => row?.original?.TEMPLATE?.CPU ?? 1,
  },
  {
    header: T.Memory,
    id: 'memory',
    cell: ({ row }) =>
      prettyBytes(row?.original?.TEMPLATE?.MEMORY ?? 0, UNITS.MB),
  },
  {
    header: T.DiskSize,
    id: 'disk_size',
    cell: ({ row }) => prettyBytes(getDiskSize(row.original), UNITS.MB),
  },
  {
    header: T.IP,
    id: 'ips',
    accessorFn: (row) => getIpv4s(row).join(),
    meta: { disableCellTooltip: true },
    cell: ({ row }) => <CopyableTagListCell values={getIpv4s(row.original)} />,
  },
  {
    header: T.Host,
    id: 'hostname',
    truncate: true,
    accessorFn: (row) => getLastHistory(row)?.HOSTNAME,
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  {
    header: T.Created,
    id: 'time',
    cell: ({ row }) => timeFromMilliseconds(row.original.STIME).toRelative(),
    grow: false,
  },
  createLabelColumn({ grow: false }),
]

export const VM_DISK_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'DISK_ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    truncate: true,
    accessorFn: (row) => getDiskName(row) ?? '-',
  },

  {
    header: T.DiskType,
    id: 'type',
    grow: false,
    accessorFn: getDiskType,
    cell: ({ row }) => {
      const diskType = getDiskType(row.original)

      return diskType ? <Tag title={diskType} status="default" /> : '-'
    },
  },
  {
    header: T.TargetDevice,
    id: 'target',
    accessorKey: 'TARGET',
  },
  {
    header: `${T.Use}`,
    id: 'diskuse',
    cell: ({ row }) => {
      const { SIZE = 0, MONITOR_SIZE = 0 } = row?.original ?? {}
      const size = Number(SIZE)
      const monitorSize = Number(MONITOR_SIZE)
      const label = `${monitorSize ? prettyBytes(monitorSize, 'MB') : '-'}/${
        size ? prettyBytes(size, 'MB') : '-'
      }`

      return (
        <ProgressBar
          value={size > 0 ? (monitorSize / size) * 100 : 0}
          label={label}
          isLabelVisible
        />
      )
    },
  },
  {
    header: T.Datastore,
    id: 'datastore',
    accessorKey: 'DATASTORE',
  },
  { header: T.Filesystem, id: 'fs', accessorKey: 'FS' },
  {
    header: 'TM MAD',
    id: 'tm_mad',
    grow: false,
    accessorKey: 'TM_MAD',
    cell: ({ row }) =>
      row.original?.TM_MAD ? (
        <Tag title={row.original.TM_MAD} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.Driver,
    id: 'driver',
    grow: false,
    accessorKey: 'DRIVER',
    cell: ({ row }) =>
      row.original?.DRIVER ? (
        <Tag title={row.original.DRIVER} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.Snapshots,
    grow: false,
    id: 'snapshots',
    accessorFn: (row) =>
      [].concat(row?.SNAPSHOTS)?.filter(Boolean)?.length ?? 0,
  },
  {
    header: T.Tags,
    id: 'tags',
    cell: ({ row }) => {
      const { READONLY, PERSISTENT, SAVE, CLONE } = row

      const labels = [
        getDiskType(row),
        stringToBoolean(PERSISTENT) && T.Persistent,
        stringToBoolean(READONLY) && T.ReadOnly,
        stringToBoolean(SAVE) && T.Save,
        stringToBoolean(CLONE) && T.Clone,
      ].filter(Boolean)

      return (
        <Box
          sx={{
            display: 'flex',
            gap: '2px',
          }}
        >
          {labels.map((label, idx) => (
            <Tag key={`${label}-${idx}`} status="information" title={label} />
          ))}
        </Box>
      )
    },
  },
]

export const VM_NIC_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'NIC_ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    truncate: true,
    grow: false,
    accessorKey: 'NAME',
  },
  {
    header: T.Network,
    id: 'network',
    truncate: true,
    accessorKey: 'NETWORK',
  },
  {
    header: T.TargetDevice,
    id: 'target',
    accessorKey: 'TARGET',
  },
  {
    header: T.ip,
    id: 'ipv4',
    meta: { disableCellTooltip: true },
    cell: ({ row }) => (
      <CopyableTagListCell values={[row.original?.IP].filter(Boolean)} />
    ),
  },
  {
    header: T.MAC,
    id: 'mac',
    accessorKey: 'MAC',
    meta: { disableCellTooltip: true },
    cell: ({ row }) => (
      <CopyableTagListCell values={[row.original?.MAC].filter(Boolean)} />
    ),
  },
  {
    header: 'VN MAD',
    id: 'vn_mad',
    accessorKey: 'VN_MAD',
    cell: ({ row }) =>
      row.original?.VN_MAD ? (
        <Tag title={row.original.VN_MAD} status="default" />
      ) : (
        '-'
      ),
  },
]

export const VM_PCI_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'PCI_ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    truncate: true,
    accessorFn: (pci) =>
      pci?.DEVICE_NAME ?? pci?.PCI_DEVICE_NAME ?? pci?.DEVICE,
  },
  {
    header: T.Vendor,
    id: 'vendor',
    accessorFn: (pci) => pci?.VENDOR_NAME ?? pci?.VENDOR,
  },
  {
    header: T.Class,
    id: 'class',
    accessorFn: (pci) => pci?.CLASS_NAME ?? pci?.CLASS,
  },
  {
    header: T.NumaNode,
    id: 'numa_node_id',
    accessorKey: 'NUMA_NODE',
  },
]

export const VM_SNAPSHOT_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'SNAPSHOT_ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    truncate: true,
    accessorKey: 'NAME',
  },
  {
    header: T.Created,
    id: 'time',
    cell: ({ row }) =>
      row.original?.TIME
        ? timeFromMilliseconds(+row.original.TIME).toRelative()
        : '-',
  },
  {
    header: T.SystemDiskSize,
    id: 'system_disk_size',
    cell: ({ row }) =>
      prettyBytes(row.original?.SYSTEM_DISK_SIZE ?? 0, UNITS.MB),
  },
]

export const VM_BACKUP_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    truncate: true,
    accessorKey: 'NAME',
  },
  {
    header: T.Created,
    id: 'regtime',
    cell: ({ row }) =>
      row.original?.REGTIME
        ? timeFromMilliseconds(+row.original.REGTIME).toRelative()
        : '-',
  },
  {
    header: T.Datastore,
    id: 'datastore',
    truncate: true,
    accessorKey: 'DATASTORE',
  },
  {
    header: T.Type,
    id: 'backupType',
    accessorFn: (row) =>
      row?.BACKUP_INCREMENTS?.INCREMENT ? T.Incremental : T.Full,
    cell: ({ row }) => (
      <Tag
        title={
          row.original?.BACKUP_INCREMENTS?.INCREMENT ? T.Incremental : T.Full
        }
        status="default"
      />
    ),
  },
  {
    header: T.Size,
    id: 'size',
    cell: ({ row }) => prettyBytes(row.original?.SIZE ?? 0, UNITS.MB),
  },
  {
    header: T.Persistent,
    id: 'persistent',
    cell: ({ row }) => (+row?.original?.PERSISTENT ? T.Yes : T.No),
  },
  createLabelColumn({ grow: false }),
]

export const VM_HISTORY_COLUMNS = [
  {
    header: T.Sequence,
    id: 'seq',
    accessorKey: 'SEQ',
    grow: false,
  },
  {
    header: T.Action,
    id: 'action',
    accessorFn: (row) => getHistoryAction(row?.ACTION) ?? T.Unknown,
  },
  {
    header: T.Host,
    id: 'hostname',
    accessorKey: 'HOSTNAME',
    truncate: true,
  },
  {
    header: T.Datastore,
    id: 'datastore',
    accessorKey: 'DATASTORE',
  },
  {
    header: T.Started,
    id: 'stime',
    cell: ({ row }) =>
      row.original?.STIME
        ? timeFromMilliseconds(+row.original.STIME).toRelative()
        : '-',
  },
  {
    header: T.Ended,
    id: 'etime',
    cell: ({ row }) =>
      row.original?.ETIME && +row.original.ETIME > 0
        ? timeFromMilliseconds(+row.original.ETIME).toRelative()
        : T.Running,
  },
  {
    header: T.Duration,
    id: 'duration',
    cell: ({ row }) => {
      const start = +row.original?.STIME
      const end = +row.original?.ETIME || Math.floor(Date.now() / 1000)

      if (!start) return '-'

      const {
        days = 0,
        hours = 0,
        minutes = 0,
      } = timeFromMilliseconds(end)
        .diff(timeFromMilliseconds(start), ['days', 'hours', 'minutes'])
        .toObject()

      return (
        [
          days > 0 && `${days}d`,
          hours > 0 && `${hours}h`,
          Math.floor(minutes) > 0 && `${Math.floor(minutes)}m`,
        ]
          .filter(Boolean)
          .join(' ') || '<1m'
      )
    },
  },
  {
    header: T.Driver,
    id: 'vmMad',
    grow: false,
    accessorKey: 'VM_MAD',
    cell: ({ row }) =>
      row.original?.VM_MAD ? (
        <Tag title={row.original.VM_MAD} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: 'TM MAD',
    id: 'tmMad',
    grow: false,
    accessorKey: 'TM_MAD',
    cell: ({ row }) =>
      row.original?.TM_MAD ? (
        <Tag title={row.original.TM_MAD} status="default" />
      ) : (
        '-'
      ),
  },
]

export const VM_SCHED_ACTION_COLUMNS = [
  {
    header: T.ID,
    id: 'id',
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T.Action,
    id: 'action',
    accessorKey: 'ACTION',
  },
  {
    header: T.Scheduled,
    id: 'time',
    accessorFn: (row) =>
      row?.TIME ? timeFromMilliseconds(+row.TIME).toRelative() : '-',
  },
  {
    header: T.Repeat,
    id: 'repeat',
    accessorFn: (row) => getRepeatInformation(row)?.repeat ?? T.Once,
  },
  {
    header: T.Ends,
    id: 'end',
    accessorFn: (row) => getRepeatInformation(row)?.end ?? '-',
  },
  {
    header: T.Warning,
    id: 'warning',
    accessorFn: (row) =>
      +row?.WARNING ? timeFromMilliseconds(row?.WARNING)?.toRelative() : '-',
  },
  {
    header: T.Status,
    id: 'done',
    accessorFn: (row) => (+row.DONE >= 0 ? T.DONE : T.PENDING),
  },
]

export const vmsTable = createTable(VM_COLUMNS, VmAPI.useGetVmsPaginatedQuery, {
  dataCy: 'vms',
})
export const vmdisksTable = createTable(
  VM_DISK_COLUMNS,
  (args, options) =>
    VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getDisks(data),
        isFetching,
        isLoading,
      }),
    }),
  { dataCy: 'vm-disks' }
)
export const vmnicsTable = createTable(
  VM_NIC_COLUMNS,
  (args, options) =>
    VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getNics(data),
        isFetching,
        isLoading,
      }),
    }),
  { dataCy: 'vm-nics' }
)

export const vmpcisTable = createTable(
  VM_PCI_COLUMNS,
  (args, options) => {
    const {
      data: vmPcis,
      isFetching: isFetchingVm,
      isLoading: isLoadingVm,
    } = VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getPcis(data),
        isFetching,
        isLoading,
      }),
    })

    const {
      data: pcis,
      isFetching: isFetchingHosts,
      isLoading: isLoadingHosts,
    } = HostAPI.useGetHostsQuery(undefined, {
      ...options,
      skip: options?.skip || !vmPcis?.length,
      selectFromResult: ({ data, isFetching, isLoading }) => {
        const hostPcis = [].concat(data).map(getPciDevices).flat()

        return {
          data: vmPcis?.map((vmPci) => {
            const hostPci =
              vmPci?.SHORT_ADDRESS &&
              hostPcis.find(
                (pci) => pci?.SHORT_ADDRESS === vmPci?.SHORT_ADDRESS
              )

            return {
              ...hostPci,
              ...vmPci,
            }
          }),
          isFetching,
          isLoading,
        }
      },
    })

    return {
      data: pcis,
      isFetching: isFetchingVm || isFetchingHosts,
      isLoading: isLoadingVm || isLoadingHosts,
    }
  },
  { dataCy: 'vm-pcis' }
)

export const vmsnapshotsTable = createTable(
  VM_SNAPSHOT_COLUMNS,
  (args, options) =>
    VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getSnapshotList(data),
        isFetching,
        isLoading,
      }),
    }),
  { dataCy: 'vm-snapshots' }
)

export const vmschedactionsTable = createTable(
  VM_SCHED_ACTION_COLUMNS,
  (args, options) =>
    VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getScheduleActions(data),
        isFetching,
        isLoading,
      }),
    }),
  { dataCy: 'vm-scheduled-actions' }
)

export const vmbackupsTable = createTable(
  VM_BACKUP_COLUMNS,
  (args, options) => {
    const {
      data: vmBackupIds,
      isFetching: isFetchingVm,
      isLoading: isLoadingVm,
    } = VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getBackupList(data),
        isFetching,
        isLoading,
      }),
    })

    const {
      data: backups,
      isFetching: isFetchingImages,
      isLoading: isLoadingImages,
    } = ImageAPI.useGetBackupsQuery(undefined, {
      ...options,
      skip: options?.skip || !vmBackupIds,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: (() =>
          []
            .concat(data)
            ?.filter(({ ID } = {}) => vmBackupIds?.includes(ID))
            ?.filter(Boolean))(),
        isFetching,
        isLoading,
      }),
    })

    return {
      data: backups,
      isFetching: isFetchingVm || isFetchingImages,
      isLoading: isLoadingVm || isLoadingImages,
    }
  },
  { dataCy: 'vm-backups' }
)

export const vmhistoryTable = createTable(
  VM_HISTORY_COLUMNS,
  (args, options) => {
    const {
      data: historyRecords,
      isFetching: isFetchingVm,
      isLoading: isLoadingVm,
    } = VmAPI.useGetVmQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: getHistoryRecords(data),
        isFetching,
        isLoading,
      }),
    })

    const {
      data: historyRecordsWithDatastores,
      isFetching: isFetchingDatastores,
      isLoading: isLoadingDatastores,
    } = DatastoreAPI.useGetDatastoresQuery(undefined, {
      ...options,
      skip: options?.skip || !historyRecords,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: historyRecords
          ?.map((history = {}) => {
            const datastore = []
              .concat(data)
              ?.find(({ ID } = {}) => +ID === +history?.DS_ID)

            return {
              ...history,
              DATASTORE: datastore?.NAME ?? history?.DS_ID,
            }
          })
          ?.filter(Boolean),
        isFetching,
        isLoading,
      }),
    })

    return {
      data: historyRecordsWithDatastores,
      isFetching: isFetchingVm || isFetchingDatastores,
      isLoading: isLoadingVm || isLoadingDatastores,
    }
  },
  { dataCy: 'vm-history' }
)
