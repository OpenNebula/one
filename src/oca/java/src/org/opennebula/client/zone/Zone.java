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
package org.opennebula.client.zone;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula zone.
 * It also offers static XML-RPC call wrappers.
 */
public class Zone extends PoolElement{

    private static final String METHOD_PREFIX   = "zone.";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String RENAME          = METHOD_PREFIX + "rename";
    private static final String DELETE          = METHOD_PREFIX + "delete";

    /**
     * Creates a new Zone representation.
     *
     * @param id The zone id.
     * @param client XML-RPC Client.
     */
    public Zone(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Zone(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new Zone in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the zone.
     * @return If successful the message contains the associated
     * id generated for this Zone.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given zone.
     *
     * @param client XML-RPC Client.
     * @param id The zone id.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given Zone.
     *
     * @param client XML-RPC Client.
     * @param id The Zone id for the Zone to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a zone from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The zone id.
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
     * @param id The zone id of the target zone we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the zone id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Renames this Zone
     *
     * @param client XML-RPC Client.
     * @param id The Zone id of the target Zone.
     * @param name New name for the Zone.
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
     * Loads the xml representation of the zone.
     * The info is also stored internally.
     *
     * @see Zone#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the zone from OpenNebula.
     *
     * @see Zone#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Renames this Zone
     *
     * @param name New name for the Zone.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @return If successful the message contains the zone id.
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
     * @return If successful the message contains the zone id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }
}
