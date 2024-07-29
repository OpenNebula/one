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
package org.opennebula.client.marketplace;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula MarketPlace.
 * It also offers static XML-RPC call wrappers.
 */
public class MarketPlace extends PoolElement
{

    private static final String METHOD_PREFIX = "market.";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String CHOWN    = METHOD_PREFIX + "chown";
    private static final String CHMOD    = METHOD_PREFIX + "chmod";
    private static final String RENAME   = METHOD_PREFIX + "rename";
    private static final String ENABLE   = METHOD_PREFIX + "enable";

    /**
     * Creates a new MarketPlace representation.
     * @param id The MarketPlace id.
     * @param client XML-RPC Client.
     */
    public MarketPlace(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected MarketPlace(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new MarketPlace in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the MarketPlace.
     * @return If successful the message contains the associated
     * id generated for this MarketPlace.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given MarketPlace.
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlace id to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given MarketPlace.
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlace id for the MarketPlace to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a MarketPlace from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target MarketPlace we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Replaces the MarketPlace contents.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target MarketPlace we want to modify.
     * @param new_template New MarketPlace contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the MarketPlace id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The id of the target MarketPlace we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the MarketPlace permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target MarketPlace.
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
     * @param octet Permissions octet, e.g. 640
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
     * Renames this MarketPlace.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param name New name for the MarketPlace
     * @return If successful the message contains the MarketPlace id.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Enable or disable the Marketplace.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param enable True for enabling, false for disabling
     * @return If successful the message contains the MarketPlace id.
     */
    public static OneResponse enable(Client client, int id, boolean enable)
    {
        return client.call(ENABLE, id, enable);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the MarketPlace.
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
     * Deletes the MarketPlace from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the MarketPlace template.
     *
     * @param new_template New MarketPlace template.
     * @return If successful the message contains the MarketPlace id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the MarketPlace template.
     *
     * @param new_template New MarketPlace template.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the MarketPlace id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
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
     * Changes the MarketPlace permissions
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
     * Renames this MarketPlace
     *
     * @param name New name for the MarketPlace.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Enable or disable this Marketplace.
     *
     * @param enable True for enabling, false for disabling
     * @return If successful the message contains the MarketPlace id.
     */
    public OneResponse enable(boolean enable)
    {
        return enable(client, id, enable);
    }


    // =================================
    // Helpers
    // =================================

    /**
     * Returns whether or not the App is part of this MarketPlace
     *
     * @param id The App ID.
     * @return Whether or not the App is part of this MarketPlace.
     */
    public boolean contains(int id)
    {
        String res = xpath("MARKETPLACEAPPS/ID[.="+id+"]");
        return res != null && res.equals(""+id);
    }
}
