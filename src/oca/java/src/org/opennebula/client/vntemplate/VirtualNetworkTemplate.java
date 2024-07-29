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
package org.opennebula.client.vntemplate;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Virtual Network template.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualNetworkTemplate extends PoolElement
{

    private static final String METHOD_PREFIX = "vntemplate.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String CHOWN    = METHOD_PREFIX + "chown";
    private static final String CHMOD    = METHOD_PREFIX + "chmod";
    private static final String INSTANTIATE = METHOD_PREFIX + "instantiate";
    private static final String CLONE    = METHOD_PREFIX + "clone";
    private static final String RENAME   = METHOD_PREFIX + "rename";
    private static final String LOCK     = METHOD_PREFIX + "lock";
    private static final String UNLOCK   = METHOD_PREFIX + "unlock";

    /**
     * Creates a new VNTemplate representation.
     * @param id The VNtemplate id.
     * @param client XML-RPC Client.
     */
    public VirtualNetworkTemplate(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected VirtualNetworkTemplate(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================


    /**
     * Allocates a new VNTemplate in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the vntemplate.
     * @return If successful the message contains the associated
     * id generated for this VNTemplate.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given VNTemplate.
     *
     * @param client XML-RPC Client.
     * @param id The VNtemplate id for the VNtemplate to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id, false);
    }

    /**
     * Retrieves the information of the given VNTemplate.
     *
     * @param client XML-RPC Client.
     * @param id The VNtemplate id for the VNtemplate to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a VNTemplate from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id, false);
    }

    /**
     * Replaces the VNTemplate contents.
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate we want to modify.
     * @param new_template New vntemplate contents.
     * @param append True to append new attributes instead of replace the whole vntemplate
     * @return If successful the message contains the vntemplate id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Publishes or unpublishes a VNTemplate.
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate we want to modify.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the vntemplate id.
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
     * @param id The vntemplate id of the target vntemplate we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the vntemplate permissions
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate.
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
        return client.call(CHMOD, id,
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
     * 
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, String octet)
    {
        int owner_u = (Integer.parseInt(octet.substring(0, 1)) & 4) != 0 ? 1 : 0;
        int owner_m = (Integer.parseInt(octet.substring(0, 1)) & 2) != 0 ? 1 : 0;
        int owner_a = (Integer.parseInt(octet.substring(0, 1)) & 1) != 0 ? 1 : 0;
        int group_u = (Integer.parseInt(octet.substring(1, 2)) & 4) != 0 ? 1 : 0;
        int group_m = (Integer.parseInt(octet.substring(1, 2)) & 2) != 0 ? 1 : 0;
        int group_a = (Integer.parseInt(octet.substring(1, 2)) & 1) != 0 ? 1 : 0;
        int other_u = (Integer.parseInt(octet.substring(2, 3)) & 4) != 0 ? 1 : 0;
        int other_m = (Integer.parseInt(octet.substring(2, 3)) & 2) != 0 ? 1 : 0;
        int other_a = (Integer.parseInt(octet.substring(2, 3)) & 1) != 0 ? 1 : 0;

        return chmod(client, id,
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
     * 
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, int octet)
    {
        return chmod(client, id, Integer.toString(octet));
    }

    /**
     * Creates a VNET instance from a VNTemplate
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate.
     * @param name A string containing the name of the VM instance, can be empty.
     * @param template User provided VNTemplate to merge with the one
     * being instantiated
     * @return If successful the message contains the VM Instance ID.
     */
    public static OneResponse instantiate(Client client, int id, String name, String template)
    {
        return client.call(INSTANTIATE, id, name, template);
    }

    /**
     * Clones this vntemplate into a new one
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id of the target vntemplate.
     * @param name Name for the new vntemplate.
     * @return If successful the message contains the new vntemplate ID.
     */
    public static OneResponse clone(Client client, int id, String name)
    {
        return clone(client, id, name);
    }

    /**
     * Renames this VNTemplate
     *
     * @param client XML-RPC Client.
     * @param id The VNTemplate id of the target VNTemplate.
     * @param name New name for the VNTemplate.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * lock this VNtemplate
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this vntemplate
     *
     * @param client XML-RPC Client.
     * @param id The vntemplate id.
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
     * Retrieves the information of the VNTemplate.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        return info(false);
    }

    /**
     * Retrieves the information of the given VNTemplate.
     *
     * @param extended optional flag to process the vntemplate and include
     * extended information, such as the SIZE for each DISK
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(boolean extended)
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the vntemplate from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the vntemplate contents.
     *
     * @param new_template New VNtemplate contents.
     * @return If successful the message contains the vntemplate id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the vntemplate contents.
     *
     * @param new_template New vntemplate contents.
     * @param append True to append new attributes instead of replace the whole vntemplate
     * @return If successful the message contains the vntemplate id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Publishes or unpublishes the vntemplate.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the vntemplate id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the vntemplate.
     *
     * @return If successful the message contains the vntemplate id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the vntemplate.
     *
     * @return If successful the message contains the vntemplate id.
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
     * Changes the vntemplate permissions
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
        return client.call(CHMOD, id,
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
     * Creates a VNET instance from a VNTemplate
     *
     * @param name A string containing the name of the VM instance, can be empty.
     * @param template User provided Template to merge with the one
     * being instantiated
     * @return If successful the message contains the VM Instance ID.
     */
    public OneResponse instantiate(String name, String template)
    {
        return instantiate(client, id, name, template);
    }

    /**
     * Creates a VM instance from a VNTemplate
     *
     * @param name A string containing the name of the VM instance, can be empty.
     * @return If successful the message contains the VM Instance ID.
     */
    public OneResponse instantiate(String name)
    {
        return instantiate(client, id, name, "");
    }

    /**
     * Creates a VM instance from a VNTemplate
     *
     * @return If successful the message contains the VM Instance ID.
     */
    public OneResponse instantiate()
    {
        return instantiate(client, id, "", "");
    }

    /**
     * Clones this vntemplate into a new one
     *
     * @param name Name for the new vntemplate.
     * @return If successful the message contains the new vntemplate ID.
     */
    public OneResponse clone(String name)
    {
        return clone(client, id, name);
    }


    /**
     * Renames this VNTemplate
     *
     * @param name New name for the VNTemplate.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Lock this VNtemplate
     *
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this VNtemplate
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
