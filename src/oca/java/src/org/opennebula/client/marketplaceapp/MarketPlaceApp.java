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
package org.opennebula.client.marketplaceapp;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula MarketPlaceApp.
 * It also offers static XML-RPC call wrappers.
 */
public class MarketPlaceApp extends PoolElement
{

    private static final String METHOD_PREFIX = "marketapp.";
    private static final String ALLOCATE    = METHOD_PREFIX + "allocate";
    private static final String INFO        = METHOD_PREFIX + "info";
    private static final String DELETE      = METHOD_PREFIX + "delete";
    private static final String UPDATE      = METHOD_PREFIX + "update";
    private static final String ENABLE      = METHOD_PREFIX + "enable";
    private static final String CHOWN       = METHOD_PREFIX + "chown";
    private static final String CHMOD       = METHOD_PREFIX + "chmod";
    private static final String RENAME      = METHOD_PREFIX + "rename";
    private static final String LOCK        = METHOD_PREFIX + "lock";
    private static final String UNLOCK      = METHOD_PREFIX + "unlock";

    private static final String[] MARKETPLACEAPP_STATES =
        {"INIT", "READY", "LOCKED", "ERROR", "DISABLED"};

    private static final String[] SHORT_MARKETPLACEAPP_STATES =
        {"ini", "rdy", "lck", "err", "dis"};

    private static final String[] MARKETPLACEAPP_TYPES =
        {"UNKNOWN", "IMAGE", "VMTEMPLATE", "SERVICE_TEMPLATE"};

    private static final String[] SHORT_MARKETPLACEAPP_TYPES =
        {"unk", "img", "tpl", "srv"};

    /**
     * Creates a new MarketPlaceApp representation.
     * @param id The MarketPlaceApp id.
     * @param client XML-RPC Client.
     */
    public MarketPlaceApp(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected MarketPlaceApp(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new MarketPlaceApp in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the MarketPlaceApp.
     * @param marketId The MarketPlace ID
     *
     * @return If successful the message contains the associated
     * id generated for this MarketPlaceApp.
     */
    public static OneResponse allocate(
            Client client,
            String description,
            int    marketId)
    {
        return client.call(ALLOCATE, description, marketId);
    }

    /**
     * Retrieves the information of the given MarketPlaceApp.
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id for the MarketPlaceApp to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given App.
     *
     * @param client XML-RPC Client.
     * @param id The App id for the App to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes an MarketPlaceApp from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id of the target MarketPlaceApp we want to delete.
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
     * @param id The MarketPlaceApp id of the target MarketPlaceApp we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Enables or disables an MarketPlaceApp.
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id of the target MarketPlaceApp we want to modify.
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public static OneResponse enable(Client client, int id, boolean enable)
    {
        return client.call(ENABLE, id, enable);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id of the target MarketPlaceApp we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the MarketPlaceApp permissions
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id of the target MarketPlaceApp we want to modify.
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
     * Renames this MarketPlaceApp
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id of the target MarketPlaceApp.
     * @param name New name for the MarketPlaceApp.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * lock this MarketPlaceApp
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this MarketPlaceApp
     *
     * @param client XML-RPC Client.
     * @param id The MarketPlaceApp id.
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
     * Retrieves the information of the MarketPlaceApp.
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
     * Deletes the MarketPlaceApp from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Enables or disables the MarketPlaceApp.
     *
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public OneResponse enable(boolean enable)
    {
        return enable(client, id, enable);
    }

    /**
     * Enables the MarketPlaceApp.
     *
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public OneResponse enable()
    {
        return enable(true);
    }

    /**
     * Disables the MarketPlaceApp.
     *
     * @return If successful the message contains the MarketPlaceApp id.
     */
    public OneResponse disable()
    {
        return enable(false);
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
     * Changes the MarketPlaceApp permissions
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
     * Renames this MarketPlaceApp
     *
     * @param name New name for the MarketPlaceApp.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Lock this MarketPlaceApp
     *
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this MarketPlaceApp
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

    /**
     * Returns the state of the MarketPlaceApp.
     * <br>
     * The method {@link MarketPlaceApp#info()} must be called before.
     *
     * @return The state of the MarketPlaceApp.
     */
    public String stateString()
    {
        int state = state();
        return state != -1 ? MARKETPLACEAPP_STATES[state] : null;
    }

    /**
     * Returns the short length string state of the MarketPlaceApp.
     * <br>
     * The method {@link MarketPlaceApp#info()} must be called before.
     *
     * @return The short length string state of the MarketPlaceApp.
     */
    public String shortStateStr()
    {
        int state = state();
        return state != -1 ? SHORT_MARKETPLACEAPP_STATES[state] : null;
    }

    /**
     * Returns the type of the MarketPlaceApp.
     *
     * @return The type of the MarketPlaceApp.
     */
    public int type()
    {
        String state = xpath("TYPE");
        return state != null ? Integer.parseInt( state ) : -1;
    }

    /**
     * Returns the type of the MarketPlaceApp as a String.
     *
     * @return The type of the MarketPlaceApp as a String.
     */
    public String typeStr()
    {
        int type = type();
        return type != -1 ? MARKETPLACEAPP_TYPES[type] : null;
    }

    /**
     * Returns the type of the MarketPlaceApp as a short String.
     *
     * @return The type of the MarketPlaceApp as a short String.
     */
    public String shortTypeStr()
    {
        int type = type();
        return type != -1 ? SHORT_MARKETPLACEAPP_TYPES[type] : null;
    }

    /**
     * Returns true if the MarketPlaceApp is enabled.
     *
     * @return True if the MarketPlaceApp is enabled.
     */
    public boolean isEnabled()
    {
        return state() != 3;
    }
}
