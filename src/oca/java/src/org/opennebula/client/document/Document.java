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
package org.opennebula.client.document;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula document.
 * Documents are generic objects. You can dynamically create new Pools in
 * OpenNebula, creating subclasses with different TYPE values.
 * <br>
 * TYPE must be the same for the corresponding pool, see {@link DocumentPool}
 * <br>
 * For example:
 * <pre>
 * <code>
 * public class GenericObjA extends Document
 * {
 *     private static final int TYPE = 200;
 *
 *     public GenericObjA(int id, Client client)
 *     {
 *         super(id, client);
 *     }
 *
 *     public GenericObjA(Node xmlElement, Client client)
 *     {
 *         super(xmlElement, client);
 *     }
 *
 *     public static OneResponse allocate(Client client, String description)
 *     {
 *         return Document.allocate(client, description, TYPE);
 *     }
 * }
 * </code>
 * </pre>
 *
 */
public abstract class Document extends PoolElement
{

    private static final String METHOD_PREFIX = "document.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String INFO     = METHOD_PREFIX + "info";

    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String CHOWN    = METHOD_PREFIX + "chown";
    private static final String CHMOD    = METHOD_PREFIX + "chmod";
    private static final String CLONE    = METHOD_PREFIX + "clone";
    private static final String RENAME   = METHOD_PREFIX + "rename";
    private static final String LOCK     = METHOD_PREFIX + "lock";
    private static final String UNLOCK   = METHOD_PREFIX + "unlock";

    /**
     * Creates a new Document representation.
     * @param id The document id.
     * @param client XML-RPC Client.
     */
    public Document(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    public Document(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    /**
     * lock this Document
     *
     * @param client XML-RPC Client.
     * @param id The Image id.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this Document
     *
     * @param client XML-RPC Client.
     * @param id The Image id.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse unlock(Client client, int id)
    {
        return client.call(UNLOCK, id);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new Document in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the document.
     * @return If successful the message contains the associated
     * id generated for this Document.
     */
    protected static OneResponse allocate(Client client, String description, int type)
    {
        return client.call(ALLOCATE, description, type);
    }

    /**
     * Retrieves the information of the given Document.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a document from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return client.call(DELETE, id);
    }

    /**
     * Replaces the document template contents.
     *
     * @param new_document New template contents.
     * @return If successful the message contains the document id.
     */
    public OneResponse update(String new_document)
    {
        return update(new_document, false);
    }

    /**
     * Replaces the document template contents.
     *
     * @param new_document New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the document id.
     */
    public OneResponse update(String new_document, boolean append)
    {
        return client.call(UPDATE, id, new_document, append);
    }

    /**
     * Publishes or unpublishes a document.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the document id.
     */
    public OneResponse publish(boolean publish)
    {
        int group_u = publish ? 1 : 0;

        return chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1);
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
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the document permissions
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
    public OneResponse chmod(   int owner_u, int owner_m, int owner_a,
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
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(String octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Changes the permissions
     *
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(int octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Clones this document into a new one
     *
     * @param name Name for the new document.
     * @return If successful the message contains the new document ID.
     */
    public OneResponse clone(String name)
    {
        return client.call(CLONE, id, name);
    }

    /**
     * Renames this document
     *
     * @param name New name for the document.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Locks this object
     *
     * @param level int to identify the lock level
     * @return In case of success, a boolean with true if the lock was granted,
     * and false if the object is already locked.
     */
    public OneResponse lock(int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlocks this object
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unlock()
    {
        return client.call(UNLOCK, id);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Publishes the document.
     *
     * @return If successful the message contains the document id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the document.
     *
     * @return If successful the message contains the document id.
     */
    public OneResponse unpublish()
    {
        return publish(false);
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
}
