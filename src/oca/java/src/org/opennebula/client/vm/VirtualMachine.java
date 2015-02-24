/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs
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
    private static final String SAVEDISK = METHOD_PREFIX + "savedisk";
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
    private static final String SNAPSHOTCREATE = METHOD_PREFIX + "snapshotcreate";
    private static final String SNAPSHOTREVERT = METHOD_PREFIX + "snapshotrevert";
    private static final String SNAPSHOTDELETE = METHOD_PREFIX + "snapshotdelete";
    private static final String RECOVER = METHOD_PREFIX + "recover";

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
        "UNDEPLOYED" };

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
        "unde" };

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
        "BOOT_UNDEPLOY" };

    private static final String[] SHORT_LCM_STATES =
    {
        null,
        "prol",
        "boot",
        "runn",
        "migr",
        "save",
        "save",
        "save",
        "migr",
        "prol",
        "epil",
        "epil",
        "shut",
        "shut",
        "fail",
        "clea",
        "unkn",
        "hotp",
        "shut",
        "boot",
        "boot",
        "boot",
        "boot",
        "clea",
        "snap",
        "hotp",
        "hotp",
        "hotp",
        "hotp",
        "shut",
        "epil",
        "prol",
        "boot" };

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
     * Sets the specified vm's disk to be saved in a new image.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param imageType Type of the new image. Set to empty string to use
     * the default type
     * @param hot True to save the disk immediately, false will perform
     * the operation when the VM shuts down
     * @param doTemplate True to clone also the VM originating template
     * and replace the disk with the saved image
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse diskSnapshot(Client client, int id,
        int diskId, String imageName, String imageType,
        boolean hot, boolean doTemplate)
    {
        return client.call(SAVEDISK, id ,diskId, imageName, imageType,
                            hot, doTemplate);
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
     * Recovers a stuck VM.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @param success recover by succeeding the missing transaction if true.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse recover(Client client, int id, boolean success)
    {
        return client.call(RECOVER, id, success);
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
    public OneResponse deploy(int hostId, boolean enforce, int dsId)
    {
        return client.call(DEPLOY, id, hostId, enforce, dsId);
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
        return deploy(hostId, false, -1);
    }

    /**
     * Submits an action to be performed on the virtual machine.
     * <br/>
     * It is recommended to use the helper methods instead:
     * <ul>
     * <li>{@link VirtualMachine#shutdown(boolean)}</li>
     * <li>{@link VirtualMachine#reboot(boolean)}</li>
     * <li>{@link VirtualMachine#hold()}</li>
     * <li>{@link VirtualMachine#release()}</li>
     * <li>{@link VirtualMachine#stop()}</li>
     * <li>{@link VirtualMachine#suspend()}</li>
     * <li>{@link VirtualMachine#resume()}</li>
     * <li>{@link VirtualMachine#delete(boolean)}</li>
     * <li>{@link VirtualMachine#boot()}</li>
     * <li>{@link VirtualMachine#poweroff()}</li>
     * <li>{@link VirtualMachine#resched()}</li>
     * <li>{@link VirtualMachine#unresched()}</li>
     * <li>{@link VirtualMachine#undeploy(boolean)}</li>
     * </ul>
     *
     * @param action The action name to be performed, can be:<br/>
     * "shutdown", "hold", "release", "stop", "shutdown-hard", "suspend",
     * "resume", "boot", "delete", "delete-recreate", "reboot", "resched",
     * "unresched", "reboot-hard", "poweroff", "undeploy", "undeploy-hard"
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
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId, boolean live, boolean enforce)
    {
        return client.call(MIGRATE, id, hostId, live, enforce);
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
        return migrate(hostId, live, false);
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
        return migrate(hostId, false, false);
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
     * Sets the specified vm's disk to be saved in a new image.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param imageType Type of the new image. Set to empty string to use
     * the default type
     * @param hot True to save the disk immediately, false will perform
     * the operation when the VM shuts down
     * @param doTemplate True to clone also the VM originating template
     * and replace the disk with the saved image
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSnapshot(int diskId, String imageName,
        String imageType, boolean hot, boolean doTemplate)
    {
        return diskSnapshot(client, id, diskId, imageName, imageType,
                            hot, doTemplate);
    }

    /**
     * Sets the specified vm's disk to be saved in a new image when the
     * VirtualMachine shuts down.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSnapshot(int diskId, String imageName)
    {
        return diskSnapshot(diskId, imageName, "", false, false);
    }

    /**
     * Sets the specified vm's disk to be saved in a new image.
     *
     * @param diskId ID of the disk to be saved.
     * @param imageName Name of the new Image that will be created.
     * @param hot True to save the disk immediately, false will perform
     * the operation when the VM shuts down
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse diskSnapshot(int diskId, String imageName, boolean hot)
    {
        return diskSnapshot(diskId, imageName, "", hot, false);
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
     * Recovers a stuck VM.
     *
     * @param success recover by succeeding the missing transaction if true.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse recover(boolean success)
    {
        return recover(client, id, success);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Gracefully shuts down the already deployed VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse shutdown()
    {
        return shutdown(false);
    }

    /**
     * Shuts down the already deployed VM.
     * @param hard True to perform a hard (no acpi) shutdown, false for a
     * graceful shutdown
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse shutdown(boolean hard)
    {
        String actionSt = hard ? "shutdown-hard" : "shutdown";

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
     * Deletes the VM from the pool and database.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delete()
    {
        return delete(false);
    }

    /**
     * Deletes the VM from the pool and database.
     * @param recreate True to recreate the VM in the pending state.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delete(boolean recreate)
    {
        String actionSt = recreate ? "delete-recreate" : "delete";

        return action(actionSt);
    }

    /**
     * Forces a re-deployment of a VM in UNKNOWN or BOOT states.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse boot()
    {
        return action("boot");
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
     * @deprecated  Replaced by {@link #diskSnapshot(int,String)}
     */
    @Deprecated public OneResponse savedisk(int diskId, String imageName)
    {
        return diskSnapshot(diskId, imageName);
    }

    /**
     * @deprecated  Replaced by {@link #diskSnapshot(int,String,String,boolean,boolean)}
     */
    public OneResponse savedisk(int diskId, String imageName, String imageType)
    {
        return diskSnapshot(diskId, imageName, imageType, false, false);
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
     * Cancels the running VM.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by hard shutdown {@link #shutdown(boolean)}
     */
    @Deprecated public OneResponse cancel()
    {
        return action("cancel");
    }

    /**
     * Resets a running VM.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by hard reboot {@link #reboot(boolean)}
     */
    @Deprecated public OneResponse reset()
    {
        return action("reset");
    }

    /**
     * Deletes the VM from the pool and database.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by {@link #delete}
     */
    @Deprecated public OneResponse finalizeVM()
    {
        return action("finalize");
    }

    /**
     * Resubmits a VM to PENDING state.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by delete and recreate {@link #delete(boolean)}
     */
    @Deprecated public OneResponse resubmit()
    {
        return action("resubmit");
    }

    /**
     * Forces a re-deployment of a VM in UNKNOWN or BOOT states.
     * @return If an error occurs the error message contains the reason.
     *
     * @deprecated  Replaced by {@link #boot}
     */
    @Deprecated public OneResponse restart()
    {
        return action("restart");
    }

    /**
     * Performs a live migration of the virtual machine to the
     * target host (hid).
     * <br/>
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
