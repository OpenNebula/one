/*******************************************************************************
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems
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
package org.opennebula.client.vrouter;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Virtual Router
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualRouter extends PoolElement
{

    private static final String METHOD_PREFIX = "vrouter.";
    private static final String ALLOCATE    = METHOD_PREFIX + "allocate";
    private static final String INSTANTIATE = METHOD_PREFIX + "instantiate";
    private static final String INFO        = METHOD_PREFIX + "info";
    private static final String UPDATE      = METHOD_PREFIX + "update";
    private static final String DELETE      = METHOD_PREFIX + "delete";
    private static final String CHOWN       = METHOD_PREFIX + "chown";
    private static final String CHMOD       = METHOD_PREFIX + "chmod";
    private static final String RENAME      = METHOD_PREFIX + "rename";
    private static final String ATTACHNIC   = METHOD_PREFIX + "attachnic";
    private static final String DETACHNIC   = METHOD_PREFIX + "detachnic";
    private static final String LOCK        = METHOD_PREFIX + "lock";
    private static final String UNLOCK      = METHOD_PREFIX + "unlock";

    /**
     * Creates a new VirtualRouter representation.
     * @param id The VirtualRouter id.
     * @param client XML-RPC Client.
     */
    public VirtualRouter(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected VirtualRouter(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================


    /**
     * Allocates a new VirtualRouter in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the VirtualRouter.
     * @return If successful the message contains the associated
     * id generated for this VirtualRouter.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given VirtualRouter.
     *
     * @param client XML-RPC Client.
     * @param id The VirtualRouter id for the VirtualRouter to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given VRouter.
     *
     * @param client XML-RPC Client.
     * @param id The VRouter id for the VRouter to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Creates VM instances from a VM Template. New VMs will be associated
     * to this Virtual Router, and its Virtual Networks
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter.
     * @param nVMs Number of VMs to instantiate
     * @param templateId VM Template id to instantiate
     * @param name Name for the VM instances. If it is an empty string
     * OpenNebula will set a default name. Wildcard %i can be used.
     * @param onHold False to create this VM in pending state, true on hold
     * @param template User provided Template to merge with the one
     * being instantiated
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse instantiate(Client client, int id, int nVMs,
        int templateId, String name, boolean onHold, String template)
    {
        return client.call(INSTANTIATE, id, nVMs, templateId, name, onHold, template);
    }

    /**
     * Deletes a VirtualRouter from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Replaces the template contents.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter we want to modify.
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the VirtualRouter id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Publishes or unpublishes a VirtualRouter.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter we want to modify.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the VirtualRouter id.
     */
    public static OneResponse publish(Client client, int id, boolean publish)
    {
        int group_u = publish ? 1 : 0;

        return chmod(client, id, -1, -1, -1, group_u, -1, -1, -1, -1, -1);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the VirtualRouter permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter.
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
     * Renames this VirtualRouter
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter.
     * @param name New name for the VirtualRouter.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Attaches a NIC to this VirtualRouter, and each one of its VMs
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter.
     * @param nicTemplate Template containing the new NIC definition
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse nicAttach(Client client, int id,
            String nicTemplate)
    {
        return client.call(ATTACHNIC, id, nicTemplate);
    }

    /**
     * Detaches a NIC from this VirtualRouter, and each one of its VMs
     *
     * @param client XML-RPC Client.
     * @param id The id of the target VirtualRouter.
     * @param nicId The NIC_ID of the NIC to detach
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse nicDetach(Client client, int id,
            int nicId)
    {
        return client.call(DETACHNIC, id, nicId);
    }

    /**
     * lock this virtual router
     *
     * @param client XML-RPC Client.
     * @param id The virtual router id.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this virtual router
     *
     * @param client XML-RPC Client.
     * @param id The virtual router id.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse unlock(Client client, int id)
    {
        return client.call(UNLOCK, id);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the VirtualRouter.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the VirtualRouter from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the VirtualRouter contents.
     *
     * @param new_template New template contents.
     * @return If successful the message contains the VirtualRouter id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the VirtualRouter id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Publishes or unpublishes the VirtualRouter.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the VirtualRouter id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the VirtualRouter.
     *
     * @return If successful the message contains the VirtualRouter id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the VirtualRouter.
     *
     * @return If successful the message contains the VirtualRouter id.
     */
    public OneResponse unpublish()
    {
        return publish(false);
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
     * Changes the VirtualRouter permissions
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
     * Creates VM instances from a VM Template. New VMs will be associated
     * to this Virtual Router, and its Virtual Networks
     *
     * @param nVMs Number of VMs to instantiate
     * @param templateId VM Template id to instantiate
     * @param name Name for the VM instances. If it is an empty string
     * OpenNebula will set a default name. Wildcard %i can be used.
     * @param onHold False to create this VM in pending state, true on hold
     * @param template User provided Template to merge with the one
     * being instantiated
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse instantiate(int nVMs, int templateId, String name,
        boolean onHold, String template)
    {
        return instantiate(client, id, nVMs, templateId, name, onHold, template);
    }

    /**
     * Creates VM instances from a VM Template. New VMs will be associated
     * to this Virtual Router, and its Virtual Networks
     *
     * @param nVMs Number of VMs to instantiate
     * @param templateId VM Template id to instantiate
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse instantiate(int nVMs, int templateId)
    {
        return instantiate(client, id, nVMs, templateId, "", false, "");
    }

    /**
     * Renames this VirtualRouter
     *
     * @param name New name for the VirtualRouter.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Attaches a NIC to this VirtualRouter, and each one of its VMs
     *
     * @param nicTemplate Template containing the new NIC definition
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse nicAttach(String nicTemplate)
    {
        return nicAttach(client, id, nicTemplate);
    }

    /**
     * Detaches a NIC from this VirtualRouter, and each one of its VMs
     *
     * @param nicId The NIC_ID of the NIC to detach
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse nicDetach(int nicId)
    {
        return nicDetach(client, id, nicId);
    }

    /**
     * Lock this virtual router
     *
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this virtual router
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unlock()
    {
        return unlock(client, id);
    }

    // =================================
    // Helpers
    // =================================
}
