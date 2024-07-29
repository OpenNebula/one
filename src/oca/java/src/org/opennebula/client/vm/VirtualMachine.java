/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
package org.opennebula.client.vm;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula VM.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualMachine extends PoolElement{
    private static final String METHOD_PREFIX = "vm.";

    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DEPLOY   = METHOD_PREFIX + "deploy";
    private static final String ACTION   = METHOD_PREFIX + "action";
    private static final String MIGRATE  = METHOD_PREFIX + "migrate";
    private static final String CHOWN    = METHOD_PREFIX + "chown";
    private static final String CHMOD    = METHOD_PREFIX + "chmod";
    private static final String MONITORING = METHOD_PREFIX + "monitoring";
    private static final String ATTACH  = METHOD_PREFIX + "attach";
    private static final String DETACH  = METHOD_PREFIX + "detach";
    private static final String RENAME  = METHOD_PREFIX + "rename";
    private static final String UPDATE  = METHOD_PREFIX + "update";
    private static final String RESIZE  = METHOD_PREFIX + "resize";
    private static final String ATTACHNIC = METHOD_PREFIX + "attachnic";
    private static final String DETACHNIC = METHOD_PREFIX + "detachnic";
    private static final String UPDATENIC = METHOD_PREFIX + "updatenic";
    private static final String SNAPSHOTCREATE = METHOD_PREFIX + "snapshotcreate";
    private static final String SNAPSHOTREVERT = METHOD_PREFIX + "snapshotrevert";
    private static final String SNAPSHOTDELETE = METHOD_PREFIX + "snapshotdelete";
    private static final String RECOVER = METHOD_PREFIX + "recover";
    private static final String DISKSAVEAS          = METHOD_PREFIX + "disksaveas";
    private static final String DISKSNAPSHOTCREATE  = METHOD_PREFIX + "disksnapshotcreate";
    private static final String DISKSNAPSHOTREVERT  = METHOD_PREFIX + "disksnapshotrevert";
    private static final String DISKSNAPSHOTDELETE  = METHOD_PREFIX + "disksnapshotdelete";
    private static final String DISKSNAPSHOTRENAME  = METHOD_PREFIX + "disksnapshotrename";
    private static final String DISKRESIZE          = METHOD_PREFIX + "diskresize";
    private static final String UPDATECONF          = METHOD_PREFIX + "updateconf";
    private static final String SCHEDADD            = METHOD_PREFIX + "schedadd";
    private static final String SCHEDDELETE         = METHOD_PREFIX + "scheddelete";
    private static final String SCHEDUPDATE         = METHOD_PREFIX + "schedupdate";
    private static final String LOCK                = METHOD_PREFIX + "lock";
    private static final String UNLOCK              = METHOD_PREFIX + "unlock";
    private static final String ATTACHSG            = METHOD_PREFIX + "attachsg";
    private static final String DETACHSG            = METHOD_PREFIX + "detachsg";
    private static final String ATTACHPCI           = METHOD_PREFIX + "attachpci";
    private static final String DETACHPCI           = METHOD_PREFIX + "detachpci";
    private static final String BACKUP              = METHOD_PREFIX + "backup";
    private static final String BACKUPCANCEL        = METHOD_PREFIX + "backupcancel";
    private static final String RESTORE             = METHOD_PREFIX + "restore";

    private static final String[] VM_STATES =
    {
        "INIT",
        "PENDING",
        "HOLD",
        "ACTIVE",
        "STOPPED",
        "SUSPENDED",
        "DONE",
        "FAILED",
        "POWEROFF",
        "UNDEPLOYED",
        "CLONING",
        "CLONING_FAILURE"
    };

    private static final String[] SHORT_VM_STATES =
    {
        "init",
        "pend",
        "hold",
        "actv",
        "stop",
        "susp",
        "done",
        "fail",
        "poff",
        "unde",
        "clon",
        "fail"
    };

    private static final String[] LCM_STATE =
    {
        "LCM_INIT",
        "PROLOG",
        "BOOT",
        "RUNNING",
        "MIGRATE",
        "SAVE_STOP",
        "SAVE_SUSPEND",
        "SAVE_MIGRATE",
        "PROLOG_MIGRATE",
        "PROLOG_RESUME",
        "EPILOG_STOP",
        "EPILOG",
        "SHUTDOWN",
        "CANCEL",
        "FAILURE",
        "CLEANUP_RESUBMIT",
        "UNKNOWN",
        "HOTPLUG",
        "SHUTDOWN_POWEROFF",
        "BOOT_UNKNOWN",
        "BOOT_POWEROFF",
        "BOOT_SUSPENDED",
        "BOOT_STOPPED",
        "CLEANUP_DELETE",
        "HOTPLUG_SNAPSHOT",
        "HOTPLUG_NIC",
        "HOTPLUG_SAVEAS",
        "HOTPLUG_SAVEAS_POWEROFF",
        "HOTPLUG_SAVEAS_SUSPENDED",
        "SHUTDOWN_UNDEPLOY",
        "EPILOG_UNDEPLOY",
        "PROLOG_UNDEPLOY",
        "BOOT_UNDEPLOY",
        "HOTPLUG_PROLOG_POWEROFF",
        "HOTPLUG_EPILOG_POWEROFF",
        "BOOT_MIGRATE",
        "BOOT_FAILURE",
        "BOOT_MIGRATE_FAILURE",
        "PROLOG_MIGRATE_FAILURE",
        "PROLOG_FAILURE",
        "EPILOG_FAILURE",
        "EPILOG_STOP_FAILURE",
        "EPILOG_UNDEPLOY_FAILURE",
        "PROLOG_MIGRATE_POWEROFF",
        "PROLOG_MIGRATE_POWEROFF_FAILURE",
        "PROLOG_MIGRATE_SUSPEND",
        "PROLOG_MIGRATE_SUSPEND_FAILURE",
        "BOOT_UNDEPLOY_FAILURE",
        "BOOT_STOPPED_FAILURE",
        "PROLOG_RESUME_FAILURE",
        "PROLOG_UNDEPLOY_FAILURE",
        "DISK_SNAPSHOT_POWEROFF",
        "DISK_SNAPSHOT_REVERT_POWEROFF",
        "DISK_SNAPSHOT_DELETE_POWEROFF",
        "DISK_SNAPSHOT_SUSPENDED",
        "DISK_SNAPSHOT_REVERT_SUSPENDED",
        "DISK_SNAPSHOT_DELETE_SUSPENDED",
        "DISK_SNAPSHOT",
        "DISK_SNAPSHOT_REVERT",
        "DISK_SNAPSHOT_DELETE",
        "PROLOG_MIGRATE_UNKNOWN",
        "PROLOG_MIGRATE_UNKNOWN_FAILURE",
        "DISK_RESIZE",
        "DISK_RESIZE_POWEROFF",
        "DISK_RESIZE_UNDEPLOYED",
        "HOTPLUG_NIC_POWEROFF",
        "HOTPLUG_RESIZE",
        "HOTPLUG_SAVEAS_UNDEPLOYED",
        "HOTPLUG_SAVEAS_STOPPED",
        "BACKUP",
        "BACKUP_POWEROFF",
        "RESTORE"
    };

    private static final String[] SHORT_LCM_STATES =
    {
        "",         // LCM_INIT
        "prol",     // PROLOG
        "boot",     // BOOT
        "runn",     // RUNNING
        "migr",     // MIGRATE
        "save",     // SAVE_STOP
        "save",     // SAVE_SUSPEND
        "save",     // SAVE_MIGRATE
        "migr",     // PROLOG_MIGRATE
        "prol",     // PROLOG_RESUME
        "epil",     // EPILOG_STOP
        "epil",     // EPILOG
        "shut",     // SHUTDOWN
        "shut",     // CANCEL
        "fail",     // FAILURE
        "clea",     // CLEANUP_RESUBMIT
        "unkn",     // UNKNOWN
        "hotp",     // HOTPLUG
        "shut",     // SHUTDOWN_POWEROFF
        "boot",     // BOOT_UNKNOWN
        "boot",     // BOOT_POWEROFF
        "boot",     // BOOT_SUSPENDED
        "boot",     // BOOT_STOPPED
        "clea",     // CLEANUP_DELETE
        "snap",     // HOTPLUG_SNAPSHOT
        "hotp",     // HOTPLUG_NIC
        "hotp",     // HOTPLUG_SAVEAS
        "hotp",     // HOTPLUG_SAVEAS_POWEROFF
        "hotp",     // HOTPLUG_SAVEAS_SUSPENDED
        "shut",     // SHUTDOWN_UNDEPLOY
        "epil",     // EPILOG_UNDEPLOY
        "prol",     // PROLOG_UNDEPLOY
        "boot",     // BOOT_UNDEPLOY
        "hotp",     // HOTPLUG_PROLOG_POWEROFF
        "hotp",     // HOTPLUG_EPILOG_POWEROFF
        "boot",     // BOOT_MIGRATE
        "fail",     // BOOT_FAILURE
        "fail",     // BOOT_MIGRATE_FAILURE
        "fail",     // PROLOG_MIGRATE_FAILURE
        "fail",     // PROLOG_FAILURE
        "fail",     // EPILOG_FAILURE
        "fail",     // EPILOG_STOP_FAILURE
        "fail",     // EPILOG_UNDEPLOY_FAILURE
        "migr",     // PROLOG_MIGRATE_POWEROFF
        "fail",     // PROLOG_MIGRATE_POWEROFF_FAILURE
        "migr",     // PROLOG_MIGRATE_SUSPEND
        "fail",     // PROLOG_MIGRATE_SUSPEND_FAILURE
        "fail",     // BOOT_UNDEPLOY_FAILURE
        "fail",     // BOOT_STOPPED_FAILURE
        "fail",     // PROLOG_RESUME_FAILURE
        "fail",     // PROLOG_UNDEPLOY_FAILURE
        "snap",     // DISK_SNAPSHOT_POWEROFF
        "snap",     // DISK_SNAPSHOT_REVERT_POWEROFF
        "snap",     // DISK_SNAPSHOT_DELETE_POWEROFF
        "snap",     // DISK_SNAPSHOT_SUSPENDED
        "snap",     // DISK_SNAPSHOT_REVERT_SUSPENDED
        "snap",     // DISK_SNAPSHOT_DELETE_SUSPENDED
        "snap",     // DISK_SNAPSHOT
        "snap",     // DISK_SNAPSHOT_REVERT
        "snap",     // DISK_SNAPSHOT_DELETE
        "migr",     // PROLOG_MIGRATE_UNKNOWN
        "fail",     // PROLOG_MIGRATE_UNKNOWN_FAILURE
        "drsz",     // DISK_RESIZE
        "drsz",     // DISK_RESIZE_POWEROFF
        "drsz",     // DISK_RESIZE_UNDEPLOYED
        "hotp",     // HOTPLUG_NIC_POWEROFF
        "hotp",     // HOTPLUG_RESIZE
        "hotp",     // HOTPLUG_SAVEAS_UNDEPLOYED
        "hotp",     // HOTPLUG_SAVEAS_STOPPED
        "back",     // BACKUP
        "back",     // BACKUP_POWEROFF
        "rest"      // RESTORE
    };

    /**
     * Creates a new VM representation.
     *
     * @param id The virtual machine Id (vid).
     * @param client XML-RPC Client.
     */
    public VirtualMachine(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected VirtualMachine(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new VM in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the vm.
     * @return If successful the message contains the associated
     * id generated for this VM.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return allocate(client, description, false);
    }

    /**
     * Allocates a new VM in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the vm.
     * @param onHold False to create this VM in pending state, true on hold
     * @return If successful the message contains the associated
     * id generated for this VM.
     */
    public static OneResponse allocate(Client client, String description,
        boolean onHold)
    {
        return client.call(ALLOCATE, description, onHold);
    }

    /**
     * Replaces the user template contents for the given VM.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target vm.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Resizes the VM capacity
     *
     * @param client XML-RPC Client.
     * @param id The id of the target vm.
     * @param capacityTemplate Template containing the new capacity
     *   elements CPU, VCPU, MEMORY. If one of them is not present, or its
     *   value is 0, it will not be resized
     * @param enforce If it is set to true, the host capacity
     *   will be checked. This will only affect oneadmin requests, regular users
     *   resize requests will always be enforced
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse resize(Client client, int id,
        String capacityTemplate, boolean enforce)
    {
        return client.call(RESIZE, id, capacityTemplate, enforce);
    }

    /**
     * Retrieves the information of the given VM.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given VM.
     *
     * @param client XML-RPC Client.
     * @param id The VM id for the VM to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the VM permissions
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param owner_u 1 to allow, 0 deny, -1 do not change
     * @param owner_m 1 to allow, 0 deny, -1 do not change
     * @param owner_a 1 to allow, 0 deny, -1 do not change
     * @param group_u 1 to allow, 0 deny, -1 do not change
     * @param group_m 1 to allow, 0 deny, -1 do not change
     * @param group_a 1 to allow, 0 deny, -1 do not change
     * @param other_u 1 to allow, 0 deny, -1 do not change
     * @param other_m 1 to allow, 0 deny, -1 do not change
     * @param other_a 1 to allow, 0 deny, -1 do not change
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id,
                                    int owner_u, int owner_m, int owner_a,
                                    int group_u, int group_m, int group_a,
                                    int other_u, int other_m, int other_a)
    {
        return chmod(client, CHMOD, id,
                owner_u, owner_m, owner_a,
                group_u, group_m, group_a,
                other_u, other_m, other_a);
    }

    /**
     * Changes the permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, String octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Changes the permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, int octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Retrieves the monitoring information of the given VM, in XML
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @return If successful the message contains the string
     * with the monitoring information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int id)
    {
        return client.call(MONITORING, id);
    }

    /**
     * Attaches a disk to a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskTemplate Template containing the new DISK definition
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskAttach(Client client, int id,
            String diskTemplate)
    {
        return client.call(ATTACH, id, diskTemplate);
    }

    /**
     * Detaches a disk from a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskId The DISK_ID of the disk to detach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskDetach(Client client, int id,
            int diskId)
    {
        return client.call(DETACH, id, diskId);
    }


    /**
     * Sets the specified vm's disk to be saved as a new image.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param imageType Type of the new image. Set to empty string to use
     * the default type
     * @param snapId ID of the snapshot to save, -1 to use the
     * current disk image state
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskSaveas(Client client, int id,
        int diskId, String imageName, String imageType, int snapId)
    {
        return client.call(DISKSAVEAS, id ,diskId, imageName, imageType, snapId);
    }

    /**
     * Attaches a NIC to a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param nicTemplate Template containing the new NIC definition
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse nicAttach(Client client, int id,
            String nicTemplate)
    {
        return client.call(ATTACHNIC, id, nicTemplate);
    }

    /**
     * Detaches a NIC from a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param nicId The NIC_ID of the NIC to detach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse nicDetach(Client client, int id,
            int nicId)
    {
        return client.call(DETACHNIC, id, nicId);
    }

    /**
     * Updates a NIC for a VM. In case the VM is running, trigger NIC
     * update on the host.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param nicId The NIC_ID of the NIC to detach
     * @param nicTemplate Template containing the updated NIC definition
     * @param append True to append new attributes instead of replace the whole template
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse nicUpdate(Client client, int id,
            int nicId, String nicTemplate, boolean append)
    {
        return client.call(UPDATENIC, id, nicId, nicTemplate, append ? 1 : 0);
    }

    /**
     * Renames this VM
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param name New name for the VM.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Creates a new VM snapshot
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param name Name for the snapshot.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse snapshotCreate(Client client, int id, String name)
    {
        return client.call(SNAPSHOTCREATE, id, name);
    }

    /**
     * Reverts to a snapshot
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse snapshotRevert(Client client, int id, int snapId)
    {
        return client.call(SNAPSHOTREVERT, id, snapId);
    }

    /**
     * Deletes a VM snapshot.
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse snapshotDelete(Client client, int id, int snapId)
    {
        return client.call(SNAPSHOTDELETE, id, snapId);
    }

    /**
     * Takes a new snapshot of a disk
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param diskId Id of the disk
     * @param name description for the snapshot
     * @return New snapshot Id, or the error message
     */
    public static OneResponse diskSnapshotCreate(Client client, int id,
        int diskId, String name)
    {
        return client.call(DISKSNAPSHOTCREATE, id, diskId, name);
    }

    /**
     * Reverts disk state to a previously taken snapshot
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param diskId Id of the disk
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskSnapshotRevert(Client client, int id,
        int diskId, int snapId)
    {
        return client.call(DISKSNAPSHOTREVERT, id, diskId, snapId);
    }

    /**
     * Deletes a disk snapshot
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param diskId Id of the disk
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskSnapshotDelete(Client client, int id,
        int diskId, int snapId)
    {
        return client.call(DISKSNAPSHOTDELETE, id, diskId, snapId);
    }

    /**
     * Deletes a disk snapshot
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param diskId Id of the disk
     * @param snapId Id of the snapshot
     * @param new_name New name of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskSnapshotRename(Client client, int id,
        int diskId, int snapId, String new_name)
    {
        return client.call(DISKSNAPSHOTRENAME, id, diskId, snapId, new_name);
    }


    /**
     * Resize VM disk
     *
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param diskId Id of the disk
     * @param newSize for the disk
     * @return diskId of resized disk, or error message
     */
    public static OneResponse diskResize(Client client, int id,
        int diskId, long newSize)
    {
        return client.call(DISKRESIZE, id, diskId, String.valueOf(newSize));
    }

    /**
     * Update VM Configuration
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param new_conf New Configuration of the target VM
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse updateconf(Client client, int id, String new_conf)
    {
        return client.call(UPDATECONF, id, new_conf);
    }

    /**
     * Create new scheduled action
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param new_sched New scheduled action
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse schedadd(Client client, int id, String new_sched)
    {
        return client.call(SCHEDADD, id, new_sched);
    }

    /**
     * Delete scheduled action
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param sched_id The sched action id to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse scheddelete(Client client, int id, int sched_id)
    {
        return client.call(SCHEDDELETE, id, sched_id);
    }

    /**
     * Update VM scheduled action
     * @param client XML-RPC Client.
     * @param id The VM id of the target VM.
     * @param sched_id The sched action id
     * @param updated_sched Updated template of the sched action
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse schedupdate(Client client, int id, int sched_id, String updated_sched)
    {
        return client.call(SCHEDUPDATE, id, sched_id, updated_sched);
    }

    /**
     * Recovers a stuck VM.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param operation to recover the VM: (0) failure, (1) success or (2)
     * retry
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse recover(Client client, int id, int operation)
    {
        return client.call(RECOVER, id, operation);
    }

    /**
     * Lock this VM
     *
     * @param client XML-RPC Client.
     * @param id The VM id.
     * @param level Lock level (use (1), manage (2), admin (3), all (4))
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this VM
     *
     * @param client XML-RPC Client.
     * @param id The VM id.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse unlock(Client client, int id)
    {
        return client.call(UNLOCK, id);
    }

    /**
     * Attaches a SG to a VM NIC
     *
     * @param client XML-RPC Client.
     * @param id The Virtual Machine id (vid) of the target instance.
     * @param nicid The NIC id, where to attach the Security Group
     * @param sgid The Security Group id to attach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse sgAttach(Client client, int id,
            int nicid, int sgid)
    {
        return client.call(ATTACHSG, id, nicid, sgid);
    }

    /**
     * Detaches a SG from a VM NIC
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param nicid The NIC id from which the Security Group should be detached
     * @param sgid The Security Group id to detach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse sgDetach(Client client, int id,
            int nicid, int sgid)
    {
        return client.call(DETACHSG, id, nicid, sgid);
    }

    /**
     * Attaches a PCI to a VM
     *
     * @param client XML-RPC Client.
     * @param id The Virtual Machine id (vid) of the target instance.
     * @param pciTemplate The PCI Template to attach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse pciAttach(Client client, int id,
            String pciTemplate)
    {
        return client.call(ATTACHPCI, id, pciTemplate);
    }

    /**
     * Detaches a PCI from a VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param pciid The PCI id to detach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse pciDetach(Client client, int id, int pciid)
    {
        return client.call(DETACHPCI, id, pciid);
    }

    /**
     * Backup Virtual Machine
     *
     * @param client XML-RPC Client.
     * @param id The Virtual Machine ID (vid) of the target instance.
     * @param ds_id Id of the datastore to save the backup
     * @param reset Reset incremental backup, do full backup
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse backup(Client client, int id, int ds_id,
            boolean reset)
    {
        return client.call(BACKUP, id, ds_id, reset);
    }

    /**
     * Cancel ongoing backup operation
     *
     * @param client XML-RPC Client.
     * @param id The Virtual Machine ID (vid) of the target instance.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse backupCancel(Client client, int id)
    {
        return client.call(BACKUPCANCEL, id);
    }

    /**
     * Restore Virtual Machine disks from backup Image
     *
     * @param client XML-RPC Client.
     * @param id The Virtual Machine ID (vid) of the target instance.
     * @param imageId Id of the backup Image
     * @param incrementId ID of the backup increment. Use -1 for latest or with full backup
     * @param diskId ID of the disk to restore. Use -1 to restore all disks
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse restore(Client client, int id, int imageId,
            int incrementId, int diskId)
    {
        return client.call(RESTORE, id, imageId, incrementId, diskId);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the virtual machine.
     * The info is also stored internally.
     *
     * @see VirtualMachine#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Initiates the instance of the VM on the target host.
     *
     * @param hostId The host id (hid) of the target host where
     * the VM will be instantiated.
     * @param enforce If it is set to true, the host capacity
     * will be checked, and the deployment will fail if the host is
     * overcommited. Defaults to false
     * @param dsId The System Datastore where to deploy the VM. To use the
     * default, set it to -1
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse deploy(int hostId, boolean enforce, int dsId, String extra_template)
    {
        return client.call(DEPLOY, id, hostId, enforce, dsId, extra_template);
    }

    /**
     * Initiates the instance of the VM on the target host.
     *
     * @param hostId The host id (hid) of the target host where
     * the VM will be instantiated.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse deploy(int hostId)
    {
        return deploy(hostId, false, -1, "");
    }

    /**
     * Submits an action to be performed on the virtual machine.
     * <br>
     * It is recommended to use the helper methods instead:
     * <ul>
     * <li>{@link VirtualMachine#terminate(boolean)}</li>
     * <li>{@link VirtualMachine#reboot(boolean)}</li>
     * <li>{@link VirtualMachine#hold()}</li>
     * <li>{@link VirtualMachine#release()}</li>
     * <li>{@link VirtualMachine#stop()}</li>
     * <li>{@link VirtualMachine#suspend()}</li>
     * <li>{@link VirtualMachine#resume()}</li>
     * <li>{@link VirtualMachine#poweroff(boolean)}</li>
     * <li>{@link VirtualMachine#resched()}</li>
     * <li>{@link VirtualMachine#unresched()}</li>
     * <li>{@link VirtualMachine#undeploy(boolean)}</li>
     * </ul>
     *
     * @param action The action name to be performed, can be:<br>
     *
     * "terminate-hard", "terminate", "undeploy-hard", "undeploy",
     * "poweroff-hard", "poweroff", "reboot-hard", "reboot", "hold",
     * "release", "stop", "suspend", "resume", "resched", "unresched"
     *
     * @return If an error occurs the error message contains the reason.
     */
    protected OneResponse action(String action)
    {
        return client.call(ACTION, action, id);
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @param live If true we are indicating that we want livemigration,
     * otherwise false.
     * @param enforce If it is set to true, the host capacity
     * will be checked, and the deployment will fail if the host is
     * overcommited. Defaults to false
     * @param ds_id The System Datastore where to migrate the VM. To use the
     * current one, set it to -1
     * @param migration_type the migration type to use
     * (0 save, 1 poweroff, 2 poweroff hard)
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId, boolean live, boolean enforce, int ds_id, int migration_type)
    {
        return client.call(MIGRATE, id, hostId, live, enforce, ds_id, migration_type);
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @param live If true we are indicating that we want livemigration,
     * otherwise false.
     * @param enforce If it is set to true, the host capacity
     * will be checked, and the deployment will fail if the host is
     * overcommited. Defaults to false
     * @param ds_id The System Datastore where to migrate the VM. To use the
     * current one, set it to -1
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId, boolean live, boolean enforce, int ds_id)
    {
        return client.call(MIGRATE, id, hostId, live, enforce, ds_id);
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @param live If true the migration is done without downtime.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId, boolean live)
    {
        return migrate(hostId, live, false, -1);
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId)
    {
        return migrate(hostId, false, false, -1);
    }

    /**
     * Changes the owner/group
     *
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chown(int uid, int gid)
    {
        return chown(client, id, uid, gid);
    }

    /**
     * Changes the owner
     *
     * @param uid The new owner user ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chown(int uid)
    {
        return chown(uid, -1);
    }

    /**
     * Changes the group
     *
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chgrp(int gid)
    {
        return chown(-1, gid);
    }

    /**
     * Changes the VM permissions
     *
     * @param owner_u 1 to allow, 0 deny, -1 do not change
     * @param owner_m 1 to allow, 0 deny, -1 do not change
     * @param owner_a 1 to allow, 0 deny, -1 do not change
     * @param group_u 1 to allow, 0 deny, -1 do not change
     * @param group_m 1 to allow, 0 deny, -1 do not change
     * @param group_a 1 to allow, 0 deny, -1 do not change
     * @param other_u 1 to allow, 0 deny, -1 do not change
     * @param other_m 1 to allow, 0 deny, -1 do not change
     * @param other_a 1 to allow, 0 deny, -1 do not change
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(int owner_u, int owner_m, int owner_a,
                             int group_u, int group_m, int group_a,
                             int other_u, int other_m, int other_a)
    {
        return chmod(client, id,
                    owner_u, owner_m, owner_a,
                    group_u, group_m, group_a,
                    other_u, other_m, other_a);
    }

    /**
     * Changes the permissions
     *
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(String octet)
    {
        return chmod(client, id, octet);
    }

    /**
     * Changes the permissions
     *
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(int octet)
    {
        return chmod(client, id, octet);
    }

    /**
     * Retrieves the monitoring information of the given VM, in XML
     *
     * @return If successful the message contains the string
     * with the monitoring information returned by OpenNebula.
     */
    public OneResponse monitoring()
    {
        return monitoring(client, id);
    }

    /**
     * Attaches a disk to a running VM
     *
     * @param diskTemplate Template containing the new DISK definition
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskAttach(String diskTemplate)
    {
        return diskAttach(client, id, diskTemplate);
    }

    /**
     * Detaches a disk from a running VM
     *
     * @param diskId The DISK_ID of the disk to detach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskDetach(int diskId)
    {
        return detachdisk(client, id, diskId);
    }

    /**
     * Sets the specified vm's disk to be saved as a new image.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param imageType Type of the new image. Set to empty string to use
     * the default type
     * @param snapId ID of the snapshot to save, -1 to use the
     * current disk image state
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSaveas(int diskId, String imageName,
        String imageType, int snapId)
    {
        return diskSaveas(client, id, diskId, imageName, imageType, snapId);
    }

    /**
     * Sets the specified vm's disk to be saved as a new image.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSaveas(int diskId, String imageName)
    {
        return diskSaveas(diskId, imageName, "", -1);
    }

    /**
     * Sets the specified vm's disk to be saved in a new image.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param snapId ID of the snapshot to save, -1 to use the
     * current disk image state
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSaveas(int diskId, String imageName, int snapId)
    {
        return diskSaveas(diskId, imageName, "", snapId);
    }

    /**
     * Attaches a NIC to a running VM
     *
     * @param nicTemplate Template containing the new NIC definition
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse nicAttach(String nicTemplate)
    {
        return nicAttach(client, id, nicTemplate);
    }

    /**
     * Detaches a NIC from a running VM
     *
     * @param nicId The NIC_ID of the NIC to detach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse nicDetach(int nicId)
    {
        return nicDetach(client, id, nicId);
    }

    /**
     * Updates a NIC for a VM. In case the VM is running, trigger NIC
     * update on the host.
     *
     * @param nicId The NIC_ID of the NIC to detach
     * @param nicTemplate Template containing the updated NIC definition
     * @param append True to append new attributes instead of replace the whole template
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse nicUpdate(int nicId, String nicTemplate, boolean append)
    {
        return nicUpdate(client, id, nicId, nicTemplate, append);
    }

    /**
     * Renames this VM
     *
     * @param name New name for the VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Replaces this VM's user template contents.
     *
     * @param new_template New template contents
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces this VM's user template contents.
     *
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Resizes this VM's capacity
     *
     * @param capacityTemplate Template containing the new capacity
     *   elements CPU, VCPU, MEMORY. If one of them is not present, or its
     *   value is 0, it will not be resized
     * @param enforce If it is set to true, the host capacity
     *   will be checked. This will only affect oneadmin requests, regular users
     *   resize requests will always be enforced
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse resize(String capacityTemplate, boolean enforce)
    {
        return resize(client, id, capacityTemplate, enforce);
    }

    /**
     * Creates a new VM snapshot
     *
     * @param name Name for the snapshot.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse snapshotCreate(String name)
    {
        return snapshotCreate(client, id, name);
    }

    /**
     * Reverts to a snapshot
     *
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse snapshotRevert(int snapId)
    {
        return snapshotRevert(client, id, snapId);
    }

    /**
     * Deletes a VM snapshot
     *
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse snapshotDelete(int snapId)
    {
        return snapshotDelete(client, id, snapId);
    }

    /**
     * Takes a new snapshot of a disk
     *
     * @param diskId Id of the disk
     * @param name description for the snapshot
     * @return New snapshot Id, or the error message
     */
    public OneResponse diskSnapshotCreate(int diskId, String name)
    {
        return diskSnapshotCreate(client, id, diskId, name);
    }

    /**
     * Reverts disk state to a previously taken snapshot
     *
     * @param diskId Id of the disk
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSnapshotRevert(int diskId, int snapId)
    {
        return diskSnapshotRevert(client, id, diskId, snapId);
    }

    /**
     * Deletes a disk snapshot
     *
     * @param diskId Id of the disk
     * @param snapId Id of the snapshot
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSnapshotDelete(int diskId, int snapId)
    {
        return diskSnapshotDelete(client, id, diskId, snapId);
    }

    /**
     * Resize VM disk
     *
     * @param diskId Id of the disk
     * @param newSize for the disk
     * @return diskId of resized disk, or error message
     */
    public OneResponse diskResize(int diskId, long newSize)
    {
        return diskResize(client, id, diskId, newSize);
    }

    /**
     * Update VM Configuration
     * @param new_conf New Configuration of the target VM
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse updateconf(String new_conf)
    {
        return updateconf(client, id, new_conf);
    }

    /**
     * Create new scheduled action
     * @param new_sched New scheduled action
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse schedadd(String new_sched)
    {
        return schedadd(client, id, new_sched);
    }

    /**
     * Delete scheduled action
     * @param sched_id The sched action id to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse scheddelete(int sched_id)
    {
        return scheddelete(client, id, sched_id);
    }

    /**
     * Update VM scheduled action
     * @param sched_id The sched action id
     * @param updated_sched Updated template of the sched action
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse schedupdate(int sched_id, String updated_sched)
    {
        return schedupdate(client, id, sched_id, updated_sched);
    }

    /**
     * Recovers a stuck VM.
     *
     * @param operation to recover the VM:
     * <ul>
     * <li>0 failure</li>
     * <li>1 success</li>
     * <li>2 retry</li>
     * <li>3 delete</li>
     * <li>4 delete-recreate</li>
     * </ul>
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse recover(int operation)
    {
        return recover(client, id, operation);
    }

    /**
     * Lock this VM
     *
     * @param level Lock level (use (1), manage (2), admin (3), all (4))
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this VM
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unlock()
    {
        return unlock(client, id);
    }

    /**
     * Attaches a NIC to a running VM
     *
     * @param nicid The NIC id, where to attach the Security Group
     * @param sgid The Security Group id to attach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse sgAttach(int nicid, int sgid)
    {
        return sgAttach(client, id, nicid, sgid);
    }

    /**
     * Detaches a NIC from a running VM
     *
     * @param nicid The NIC id from which the Security Group should be detached
     * @param sgid The Security Group /id to detach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse sgDetach(int nicid, int sgid)
    {
        return sgDetach(client, id, nicid, sgid);
    }

    /**
     * Attaches a PCI to a VM
     *
     * @param pciTemplate The PCI template to attach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse pciAttach(String pciTemplate)
    {
        return pciAttach(client, id, pciTemplate);
    }

    /**
     * Detaches a PCI from a VM
     *
     * @param pciid The PCI id to detach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse pciDetach(int pciid)
    {
        return pciDetach(client, id, pciid);
    }

    /**
     * Backup VM
     *
     * @param ds_id Id of the datastore to save the backup
     * @param reset Reset incremental backup, do full backup
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse backup(int ds_id, boolean reset)
    {
        return backup(client, id, ds_id, reset);
    }

    /**
     * Cancel ongoing backup operation
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse backupCancel()
    {
        return backupCancel(client, id);
    }

    /**
     * Restore Virtual Machine disks from backup Image
     *
     * @param imageId Id of the backup Image
     * @param incrementId ID of the backup increment. Use -1 for latest or with full backup
     * @param diskId ID of the disk to restore. Use -1 to restore all disks
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse restore(int imageId, int incrementId, int diskId)
    {
        return restore(client, id, imageId, incrementId, diskId);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Gracefully shuts down the already deployed VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse terminate()
    {
        return terminate(false);
    }

    /**
     * Shuts down the already deployed VM.
     * @param hard True to perform a hard (no acpi) shutdown, false for a
     * graceful shutdown
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse terminate(boolean hard)
    {
        String actionSt = hard ? "terminate-hard" : "terminate";

        return action(actionSt);
    }

    /**
     * Undeploy a running VM, it preserve its resources and disk modifications.
     * @param hard True to perform a hard (no acpi) shutdown, false for a
     * graceful shutdown
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse undeploy(boolean hard)
    {
        String actionSt = hard ? "undeploy-hard" : "undeploy";

        return action(actionSt);
    }

    /**
     * Powers off a running VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse poweroff()
    {
        return poweroff(false);
    }

    /**
     * Powers off a running VM.
     * @param hard True to perform a hard (no acpi) shutdown, false for a
     * graceful shutdown
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse poweroff(boolean hard)
    {
        String actionSt = hard ? "poweroff-hard" : "poweroff";

        return action(actionSt);
    }

    /**
     * Reboots a running VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse reboot()
    {
        return action("reboot");
    }

    /**
     * Reboots a running VM.
     * @param hard True to perform a hard (no acpi) reboot, false for a
     * graceful reboot
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse reboot(boolean hard)
    {
        String actionSt = hard ? "reboot-hard" : "reboot";

        return action(actionSt);
    }

    /**
     * Sets the VM to hold state. The VM will not be scheduled until it is
     * released.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse hold()
    {
        return action("hold");
    }

    /**
     * Releases a virtual machine from hold state.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse release()
    {
        return action("release");
    }

    /**
     * Stops the virtual machine. The virtual machine state is transferred back
     * to OpenNebula for a possible reschedule.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse stop()
    {
        return action("stop");
    }

    /**
     * Suspends the virtual machine. The virtual machine state is left in the
     * cluster node for resuming.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse suspend()
    {
        return action("suspend");
    }

    /**
     * Resumes the execution of a saved VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse resume()
    {
        return action("resume");
    }

    /**
     * Sets the re-scheduling flag for the VM
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse resched()
    {
        return action("resched");
    }

    /**
     * Unsets the re-scheduling flag for the VM
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unresched()
    {
        return action("unresched");
    }

    public int state()
    {
        return super.state();
    }

    /**
     * Returns the VM state of the VirtualMachine (string value).
     * @return The VM state of the VirtualMachine (string value).
     */
    public String stateStr()
    {
        int state = state();
        return state != -1 ? VM_STATES[state()] : null;
    }

    /**
     * Returns the LCM state of the VirtualMachine (numeric value).
     * @return The LCM state of the VirtualMachine (numeric value).
     */
    public int lcmState()
    {
        String state = xpath("LCM_STATE");
        return state != null ? Integer.parseInt(state) : -1;
    }

    /**
     * Returns the LCM state of the VirtualMachine (string value).
     * @return The LCM state of the VirtualMachine (string value).
     */
    public String lcmStateStr()
    {
        int state = lcmState();
        return state != -1 ? LCM_STATE[state] : null;
    }

    /**
     * Returns the short status string for the VirtualMachine.
     * @return The short status string for the VirtualMachine.
     */
    public String status()
    {
        int state = state();
        String shortStateStr = null;
        if(state != -1)
        {
            shortStateStr = SHORT_VM_STATES[state];
            if(shortStateStr.equals("actv"))
            {
                int lcmState = lcmState();
                if(lcmState != -1)
                    shortStateStr = SHORT_LCM_STATES[lcmState];
            }
        }
        return shortStateStr;
    }

    // =================================
    // Deprecated methods
    // =================================

    /**
     * Attaches a disk to a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskTemplate Template containing the new DISK definition
     * @return If an error occurs the error message contains the reason.
     * @deprecated  Replaced by {@link #diskAttach}
     */
    @Deprecated public static OneResponse attachdisk(Client client, int id,
            String diskTemplate)
    {
        return diskAttach(client, id, diskTemplate);
    }

    /**
     * Detaches a disk from a running VM
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskId The DISK_ID of the disk to detach
     * @return If an error occurs the error message contains the reason.
     * @deprecated  Replaced by {@link #diskDetach}
     */
    @Deprecated public static OneResponse detachdisk(Client client, int id,
            int diskId)
    {
        return diskDetach(client, id, diskId);
    }

    /**
     * @deprecated  Replaced by {@link #diskAttach(String)}
     */
    @Deprecated public OneResponse attachdisk(String diskTemplate)
    {
        return diskAttach(diskTemplate);
    }

    @Deprecated public OneResponse detachdisk(int diskId)
    {
        return diskDetach(diskId);
    }

    /**
     * Performs a live migration of the virtual machine to the
     * target host (hid).
     * <br>
     * It does the same as {@link VirtualMachine#migrate(int, boolean)}
     * with live set to true.
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by {@link #migrate}
     */
    @Deprecated public OneResponse liveMigrate(int hostId)
    {
        return migrate(hostId, false);
    }
}
