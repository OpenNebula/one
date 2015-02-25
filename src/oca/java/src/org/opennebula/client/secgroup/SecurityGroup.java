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
package org.opennebula.client.secgroup;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula security group.
 * It also offers static XML-RPC call wrappers.
 */
public class SecurityGroup extends PoolElement{

    private static final String METHOD_PREFIX   = "secgroup.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String CHOWN           = METHOD_PREFIX + "chown";
    private static final String CHMOD           = METHOD_PREFIX + "chmod";
    private static final String CLONE           = METHOD_PREFIX + "clone";
    private static final String RENAME          = METHOD_PREFIX + "rename";

    /**
     * Creates a new security group representation.
     *
     * @param id The security group id.
     * @param client XML-RPC Client.
     */
    public SecurityGroup(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected SecurityGroup(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new security group in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template
     * of the security group.
     *
     * @return If successful the message contains the associated
     * id generated for this security group.
     */
    public static OneResponse allocate(
            Client  client,
            String  description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given security group
     *
     * @param client XML-RPC Client.
     * @param id the id for the security group to
     * retrieve the information from.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a security group from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the security group permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group.
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
     * Replaces the security group template contents.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group we want to modify.
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the security group id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Clones this security group into a new one
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group.
     * @param name Name for the new template.
     * @return If successful the message contains the new security group ID.
     */
    public static OneResponse clone(Client client, int id, String name)
    {
        return client.call(CLONE, id, name);
    }

    /**
     * Renames this security group
     *
     * @param client XML-RPC Client.
     * @param id The id of the target security group.
     * @param name New name for the security group.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the security group.
     * The info is also stored internally.
     *
     * @see SecurityGroup#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the security group from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
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
     * Changes the security group permissions
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
     * Replaces the security group template contents.
     *
     * @param new_template New template contents.
     * @return If successful the message contains the security group id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the security group template contents.
     *
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the security group id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Clones this security group into a new one
     *
     * @param name Name for the new security group.
     * @return If successful the message contains the new security group ID.
     */
    public OneResponse clone(String name)
    {
        return clone(client, id, name);
    }

    /**
     * Renames this security group
     *
     * @param name New name for the security group.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    // =================================
    // Helpers
    // =================================

}
