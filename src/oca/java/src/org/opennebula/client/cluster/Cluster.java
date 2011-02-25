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
package org.opennebula.client.cluster;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.opennebula.client.host.Host;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula cluster.
 * It also offers static XML-RPC call wrappers.
 */
public class Cluster extends PoolElement
{

    private static final String METHOD_PREFIX = "cluster.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String ADD      = METHOD_PREFIX + "add";
    private static final String REMOVE   = METHOD_PREFIX + "remove";


    /**
     * Creates a new Image representation.
     * @param id The image id.
     * @param client XML-RPC Client.
     */
    public Cluster(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Cluster(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================


    /**
     * Allocates a new Cluster in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param name Name for the cluster we want to add.
     * @return If successful the message contains the associated
     * id generated for this Cluster.
     */
    public static OneResponse allocate(Client client, String name)
    {
        return client.call(ALLOCATE, name);
    }

    /**
     * Retrieves the information of the given Cluster.
     *
     * @param client XML-RPC Client.
     * @param id The cluster id for the cluster to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a cluster from OpenNebula.
     * 
     * @param client XML-RPC Client.
     * @param id The cluster id of the target cluster we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Adds a host to a cluster.
     * 
     * @param client XML-RPC Client.
     * @param id The cluster id of the cluster where the host will be assigned.
     * @param hid The host id (hid) of the host.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse add(Client client, int id, int hid)
    {
        return client.call(ADD, hid, id);
    }

    /**
     * Removes a host from its cluster.
     * 
     * @param client XML-RPC Client.
     * @param hid The host id (hid) of the host.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse remove(Client client, int hid)
    {
        return client.call(REMOVE, hid);
    }


    // =================================
    // Instanced object XML-RPC methods
    // =================================


    /**
     * Retrieves the information of the Cluster.
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
     * Deletes the cluster from OpenNebula.
     * 
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Adds a host to the cluster.
     * 
     * @param hid The host id (hid) of the host.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse add(int hid)
    {
        return add(client, id, hid);
    }

    /**
     * Adds a host to the cluster.
     * 
     * @param host The Host to add.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse add(Host host)
    {
        return add(client, id, host.id());
    }

    /**
     * Removes a host from its cluster.
     * 
     * @param hid The host id (hid) of the host.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse remove(int hid)
    {
        return remove(client, hid);
    }

    /**
     * Removes a host from its cluster.
     * 
     * @param host The Host to remove.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse remove(Host host)
    {
        return remove(client, host.id());
    }
}
