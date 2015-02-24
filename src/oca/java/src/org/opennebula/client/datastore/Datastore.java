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
package org.opennebula.client.datastore;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.opennebula.client.cluster.ClusterPool;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula datastore.
 * It also offers static XML-RPC call wrappers.
 */
public class Datastore extends PoolElement
{

    private static final String METHOD_PREFIX = "datastore.";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String CHOWN    = METHOD_PREFIX + "chown";
    private static final String CHMOD    = METHOD_PREFIX + "chmod";
    private static final String RENAME   = METHOD_PREFIX + "rename";
    private static final String ENABLE   = METHOD_PREFIX + "enable";

    private static final String[] DATASTORE_TYPES = {"IMAGE", "SYSTEM", "FILE"};

    private static final String[] SHORT_DATASTORE_TYPES = {"img", "sys", "fil"};

    private static final String[] DATASTORE_STATES = {"READY", "DISABLED"};

    private static final String[] SHORT_DATASTORE_STATES = {"rdy", "disa"};

    /**
     * Creates a new Datastore representation.
     * @param id The datastore id.
     * @param client XML-RPC Client.
     */
    public Datastore(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Datastore(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new Datastore in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the datastore.
     * @param clusterId Id of the cluster
     * @return If successful the message contains the associated
     * id generated for this Datastore.
     */
    public static OneResponse allocate(Client client,
            String description, int clusterId)
    {
        return client.call(ALLOCATE, description, clusterId);
    }

    /**
     * Allocates a new Datastore in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the datastore.
     * @return If successful the message contains the associated
     * id generated for this Datastore.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return allocate(client, description, ClusterPool.NONE_CLUSTER_ID);
    }

    /**
     * Retrieves the information of the given Datastore.
     *
     * @param client XML-RPC Client.
     * @param id The datastore id to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a datastore from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target datastore we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Replaces the datastore contents.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target datastore we want to modify.
     * @param new_template New datastore contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the datastore id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Publishes or unpublishes a datastore.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target datastore we want to modify.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the datastore id.
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
     * @param id The id of the target datastore we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the datastore permissions
     *
     * @param client XML-RPC Client.
     * @param id The id of the target datastore.
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
     * Renames this Datastore.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param name New name for the Datastore
     * @return If successful the message contains the datastore id.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Enables or disables this Datastore.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target object.
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the datastore id.
     */
    public static OneResponse enable(Client client, int id, boolean enable)
    {
        return client.call(ENABLE, id, enable);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the Datastore.
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
     * Deletes the datastore from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the datastore template.
     *
     * @param new_template New datastore template.
     * @return If successful the message contains the datastore id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the datastore template.
     *
     * @param new_template New datastore template.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the datastore id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Publishes or unpublishes the datastore.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the datastore id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the datastore.
     *
     * @return If successful the message contains the datastore id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the datastore.
     *
     * @return If successful the message contains the datastore id.
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
     * Changes the datastore permissions
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
     * Renames this Datastore
     *
     * @param name New name for the Datastore.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Enables or disables the datastore.
     *
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the datastore id.
     */
    public OneResponse enable(boolean enable)
    {
        return enable(client, id, enable);
    }

    /**
     * Enables the datastore.
     *
     * @return If successful the message contains the datastore id.
     */
    public OneResponse enable()
    {
        return enable(true);
    }

    /**
     * Disables the datastore.
     *
     * @return If successful the message contains the datastore id.
     */
    public OneResponse disable()
    {
        return enable(false);
    }

    // =================================
    // Helpers
    // =================================
    /**
     * Returns the type of the Datastore.
     *
     * @return The type of the Datastore.
     */
    public int type()
    {
        String state = xpath("TYPE");
        return state != null ? Integer.parseInt( state ) : -1;
    }

    /**
     * Returns the type of the Datastore as a String.
     *
     * @return The type of the Datastore as a String.
     */
    public String typeStr()
    {
        int type = type();
        return type != -1 ? DATASTORE_TYPES[type] : null;
    }

    /**
     * Returns the type of the Datastore as a short String.
     *
     * @return The type of the Datastore as a short String.
     */
    public String shortTypeStr()
    {
        int type = type();
        return type != -1 ? SHORT_DATASTORE_TYPES[type] : null;
    }

    /**
     * Returns the state of the Datastore.
     *
     * @return The state of the Datastore.
     */
    public int state()
    {
        String state = xpath("STATE");
        return state != null ? Integer.parseInt( state ) : -1;
    }

    /**
     * Returns the state of the Datastore as a String.
     *
     * @return The state of the Datastore as a String.
     */
    public String stateStr()
    {
        int state = state();
        return state != -1 ? DATASTORE_STATES[state] : null;
    }

    /**
     * Returns the state of the Datastore as a short String.
     *
     * @return The state of the Datastore as a short String.
     */
    public String shortStateStr()
    {
        int state = state();
        return state != -1 ? SHORT_DATASTORE_STATES[state] : null;
    }

    /**
     * Returns whether or not the image is part of this datastore
     *
     * @param id The image ID.
     * @return Whether or not the image is part of this datastore.
     */
    public boolean contains(int id)
    {
        String res = xpath("IMAGES/ID[.="+id+"]");
        return res != null && res.equals(""+id);
    }
}
