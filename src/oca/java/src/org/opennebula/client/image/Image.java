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
package org.opennebula.client.image;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula image.
 * It also offers static XML-RPC call wrappers.
 */
public class Image extends PoolElement
{

    private static final String METHOD_PREFIX = "image.";
    private static final String ALLOCATE    = METHOD_PREFIX + "allocate";
    private static final String INFO        = METHOD_PREFIX + "info";
    private static final String DELETE      = METHOD_PREFIX + "delete";
    private static final String UPDATE      = METHOD_PREFIX + "update";
    private static final String ENABLE      = METHOD_PREFIX + "enable";
    private static final String PERSISTENT  = METHOD_PREFIX + "persistent";
    private static final String CHOWN       = METHOD_PREFIX + "chown";
    private static final String CHMOD       = METHOD_PREFIX + "chmod";
    private static final String CHTYPE      = METHOD_PREFIX + "chtype";
    private static final String CLONE       = METHOD_PREFIX + "clone";
    private static final String RENAME      = METHOD_PREFIX + "rename";

    private static final String[] IMAGE_STATES =
        {"INIT", "READY", "USED", "DISABLED", "LOCKED",
        "ERROR", "CLONE", "DELETE", "USED_PERS"};

    private static final String[] SHORT_IMAGE_STATES =
        {"init", "rdy", "used", "disa", "lock", "err", "clon", "dele", "used"};

    private static final String[] IMAGE_TYPES =
        {"OS", "CDROM", "DATABLOCK", "KERNEL", "RAMDISK", "CONTEXT"};

    private static final String[] SHORT_IMAGE_TYPES =
        {"OS", "CD", "DB", "KL", "RD", "CX"};

    /**
     * Creates a new Image representation.
     * @param id The image id.
     * @param client XML-RPC Client.
     */
    public Image(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Image(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new Image in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the image.
     * @param datastoreId The cluster ID. If it is -1, this image
     * won't be added to any cluster.
     *
     * @return If successful the message contains the associated
     * id generated for this Image.
     */
    public static OneResponse allocate(
            Client client,
            String description,
            int    datastoreId)
    {
        return client.call(ALLOCATE, description, datastoreId);
    }

    /**
     * Retrieves the information of the given Image.
     *
     * @param client XML-RPC Client.
     * @param id The image id for the image to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes an image from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to delete.
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
     * @param id The image id of the target image we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the image id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Enables or disables an image.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to modify.
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the image id.
     */
    public static OneResponse enable(Client client, int id, boolean enable)
    {
        return client.call(ENABLE, id, enable);
    }

    /**
     * Sets the Image as persistent or not persistent.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to modify.
     * @param persistent True to make it persistent, false non-persistent
     * @return If successful the message contains the image id.
     */
    public static OneResponse persistent(Client client, int id, boolean persistent)
    {
        return client.call(PERSISTENT, id, persistent);
    }

    /**
     * Publishes or unpublishes an image.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to modify.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the image id.
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
     * @param id The image id of the target image we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the Image permissions
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to modify.
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
     * Changes the Image type
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target image we want to modify.
     * @param type The new Image type
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chtype(Client client, int id, String type)
    {
        return client.call(CHTYPE, id, type);
    }

    /**
     * Clones this Image into a new one
     *
     * @param client XML-RPC Client.
     * @param id The Image id of the target Image.
     * @param name Name for the new Image.
     * @param targetDS The ID of the target datastore. Set to -1 to use the current one.
     * @return If successful the message contains the new Image ID.
     */
    public static OneResponse clone(Client client, int id, String name, int targetDS)
    {
        return client.call(CLONE, id, name, targetDS);
    }

    /**
     * Renames this Image
     *
     * @param client XML-RPC Client.
     * @param id The Image id of the target Image.
     * @param name New name for the Image.
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
     * Retrieves the information of the Image.
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
     * Deletes the image from OpenNebula.
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
     * @return If successful the message contains the image id.
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
     * @return If successful the message contains the image id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Enables or disables the image.
     *
     * @param enable True for enabling, false for disabling.
     * @return If successful the message contains the image id.
     */
    public OneResponse enable(boolean enable)
    {
        return enable(client, id, enable);
    }

    /**
     * Enables the image.
     *
     * @return If successful the message contains the image id.
     */
    public OneResponse enable()
    {
        return enable(true);
    }

    /**
     * Disables the image.
     *
     * @return If successful the message contains the image id.
     */
    public OneResponse disable()
    {
        return enable(false);
    }

    /**
     * Sets the Image as persistent or not persistent.
     *
     * @param persistent True for enabling, false for disabling.
     * @return If successful the message contains the image id.
     */
    public OneResponse persistent(boolean persistent)
    {
        return persistent(client, id, persistent);
    }

    /**
     * Sets the Image as persistent
     *
     * @return If successful the message contains the image id.
     */
    public OneResponse persistent()
    {
        return persistent(true);
    }

    /**
     * Sets the Image as persistent or not persistent.
     *
     * @return If successful the message contains the image id.
     */
    public OneResponse nonpersistent()
    {
        return persistent(false);
    }

    /**
     * Publishes or unpublishes the image.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the image id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the image.
     *
     * @return If successful the message contains the image id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the image.
     *
     * @return If successful the message contains the image id.
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
     * Changes the Image permissions
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
     * Changes the Image type
     *
     * @param type The new Image type
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chtype(String type)
    {
        return chtype(client, id, type);
    }

    /**
     * Clones this Image into a new one
     *
     * @param name Name for the new Image.
     * @return If successful the message contains the new Image ID.
     */
    public OneResponse clone(String name)
    {
        return clone(client, id, name, -1);
    }

    /**
     * Clones this Image into a new one
     *
     * @param name Name for the new Image.
     * @param targetDS The ID of the target datastore.
     * @return If successful the message contains the new Image ID.
     */
    public OneResponse clone(String name, int targetDS)
    {
        return clone(client, id, name, targetDS);
    }

    /**
     * Renames this Image
     *
     * @param name New name for the Image.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Returns the state of the Image.
     * <br/>
     * The method {@link Image#info()} must be called before.
     *
     * @return The state of the Image.
     */
    public String stateString()
    {
        int state = state();
        return state != -1 ? IMAGE_STATES[state] : null;
    }

    /**
     * Returns the short length string state of the Image.
     * <br/>
     * The method {@link Image#info()} must be called before.
     *
     * @return The short length string state of the Image.
     */
    public String shortStateStr()
    {
        int state = state();
        return state != -1 ? SHORT_IMAGE_STATES[state] : null;
    }

    /**
     * Returns the type of the Image.
     *
     * @return The type of the Image.
     */
    public int type()
    {
        String state = xpath("TYPE");
        return state != null ? Integer.parseInt( state ) : -1;
    }

    /**
     * Returns the type of the Image as a String.
     *
     * @return The type of the Image as a String.
     */
    public String typeStr()
    {
        int type = type();
        return type != -1 ? IMAGE_TYPES[type] : null;
    }

    /**
     * Returns the type of the Image as a short String.
     *
     * @return The type of the Image as a short String.
     */
    public String shortTypeStr()
    {
        int type = type();
        return type != -1 ? SHORT_IMAGE_TYPES[type] : null;
    }

    /**
     * Returns true if the image is enabled.
     *
     * @return True if the image is enabled.
     */
    public boolean isEnabled()
    {
        return state() != 3;
    }
}
