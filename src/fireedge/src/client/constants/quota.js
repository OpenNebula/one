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

/**
 * @typedef {number|'-1'|'-2'} Quota
 * - For each quota, there are two special limits
 * ``-1``: the default quota will be used.
 * ``-2``: Unlimited.
 */

/**
 * @typedef DatastoreQuota
 * @property {Quota} ID - ID of the Datastore to set the quota for
 * @property {Quota} IMAGES -Maximum number of images that can be created in the datastore
 * @property {Quota} IMAGES_USED - {@link DatastoreQuota.IMAGES}
 * @property {Quota} SIZE - Maximum size in MB that can be used in the datastore
 * @property {Quota} SIZE_USED - {@link DatastoreQuota.SIZE}
 */

/**
 * @typedef NetworkQuota
 * @property {Quota} ID - ID of the Network to set the quota for
 * @property {Quota} LEASES - Maximum IPs that can be leased from the Network
 * @property {Quota} LEASES_USED - {@link NetworkQuota.LEASES}
 */

/**
 * @typedef VmQuota
 * @description Running quotas will be increased or decreased depending
 * on the state of the Virtual Machine. The states in which the machine
 * is counted as “Running” are `ACTIVE` , `HOLD`, `PENDING` and `CLONING`.
 * @property {Quota} VMS - Maximum number of VMs that can be created
 * @property {Quota} VMS_USED - {@link VmQuota.VMS}
 * @property {Quota} RUNNING_VMS - Maximum number of VMs that can be running
 * @property {Quota} RUNNING_VMS_USED - {@link VmQuota.RUNNING_VMS}
 * @property {Quota} MEMORY - Maximum memory in MB that can be requested by user/group VMs
 * @property {Quota} MEMORY_USED - {@link VmQuota.MEMORY}
 * @property {Quota} RUNNING_MEMORY - Maximum memory in MB that can be running by user/group VMs
 * @property {Quota} RUNNING_MEMORY_USED - {@link VmQuota.RUNNING_MEMORY}
 * @property {Quota} CPU - Maximum CPU capacity that can be requested by user/group VMs
 * @property {Quota} CPU_USED - {@link VmQuota.CPU}
 * @property {Quota} RUNNING_CPU - Maximum CPU capacity that can be running by user/group VMs
 * @property {Quota} RUNNING_CPU_USED - {@link VmQuota.RUNNING_CPU}
 * @property {Quota} SYSTEM_DISK_SIZE - Maximum size (in MB) of system disks that can be requested by user/group VMs
 * @property {Quota} SYSTEM_DISK_SIZE_USED - {@link VmQuota.SYSTEM_DISK_SIZE}
 */

/**
 * @typedef ImageQuota
 * @type {object}
 * @property {Quota} ID - ID of the Image to set the quota for
 * @property {Quota} RVMS - Maximum VMs that can used this image at the same time
 * @property {Quota} RVMS_USED - {@link ImageQuota.RVMS}
 */

export const QUOTA_LIMIT_DEFAULT = '-1'
export const QUOTA_LIMIT_UNLIMITED = '-2'
