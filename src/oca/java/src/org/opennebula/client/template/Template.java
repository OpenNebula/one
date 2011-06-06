/*******************************************************************************
 * Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.template;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula template.
 * It also offers static XML-RPC call wrappers.
 */
public class Template extends PoolElement
{

    private static final String METHOD_PREFIX = "template.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String RMATTR   = METHOD_PREFIX + "rmattr";
    private static final String PUBLISH  = METHOD_PREFIX + "publish";
    private static final String CHOWN    = METHOD_PREFIX + "chown";

    /**
     * Creates a new Template representation.
     * @param id The template id.
     * @param client XML-RPC Client.
     */
    public Template(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Template(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================


    /**
     * Allocates a new Template in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the template.
     * @return If successful the message contains the associated
     * id generated for this Template.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given Template.
     *
     * @param client XML-RPC Client.
     * @param id The template id for the template to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a template from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The template id of the target template we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Modifies a template attribute.
     *
     * @param client XML-RPC Client.
     * @param id The template id of the target template we want to modify.
     * @param att_name The name of the attribute to update.
     * @param att_val The new value for the attribute.
     * @return If successful the message contains the template id.
     */
    public static OneResponse update(Client client, int id,
                                     String att_name, String att_val)
    {
        return client.call(UPDATE, id, att_name, att_val);
    }

    /**
     * Removes a template attribute.
     *
     * @param client XML-RPC Client.
     * @param id The template id of the target template we want to modify.
     * @param att_name The name of the attribute to remove.
     * @return If successful the message contains the template id.
     */
    public static OneResponse rmattr(Client client, int id, String att_name)
    {
        return client.call(RMATTR, id, att_name);
    }

    /**
     * Publishes or unpublishes a template.
     *
     * @param client XML-RPC Client.
     * @param id The template id of the target template we want to modify.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the template id.
     */
    public static OneResponse publish(Client client, int id, boolean publish)
    {
        return client.call(PUBLISH, id, publish);
    }

    /**
     * Changes the owner/group
     * 
     * @param client XML-RPC Client.
     * @param id The template id of the target template we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the Template.
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
     * Deletes the template from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Modifies a template attribute.
     *
     * @param att_name The name of the attribute to update.
     * @param att_val The new value for the attribute.
     * @return If successful the message contains the template id.
     */
    public OneResponse update(String att_name, String att_val)
    {
        return update(client, id, att_name, att_val);
    }

    /**
     * Removes a template attribute.
     *
     * @param att_name The name of the attribute to remove.
     * @return If successful the message contains the template id.
     */
    public OneResponse rmattr(String att_name)
    {
        return rmattr(client, id, att_name);
    }

    /**
     * Publishes or unpublishes the template.
     *
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the template id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the template.
     *
     * @return If successful the message contains the template id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the template.
     *
     * @return If successful the message contains the template id.
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

    // =================================
    // Helpers
    // =================================

    /**
     * Returns true if the template is public.
     *
     * @return True if the template is public.
     */
    public boolean isPublic()
    {
        String isPub = xpath("PUBLIC");
        return isPub != null && isPub.equals("1");
    }
}
