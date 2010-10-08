/*******************************************************************************
 * Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.vnet;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula virtual network.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualNetwork extends PoolElement{

    private static final String METHOD_PREFIX   = "vn.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String PUBLISH         = METHOD_PREFIX + "publish";


    /**
     * Creates a new virtual network representation.
     * 
     * @param id The virtual network id (nid) .
     * @param client XML-RPC Client.
     */
    public VirtualNetwork(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected VirtualNetwork(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new virtual network in OpenNebula.
     * 
     * @param client XML-RPC Client.
     * @param description A string containing the template
     * of the virtual network. 
     * @return If successful the message contains the associated
     * id generated for this virtual network.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given virtual network
     * 
     * @param client XML-RPC Client.
     * @param id the virtual network id (nid) for the network to
     * retrieve the information from. 
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Deletes a network from OpenNebula.
     * 
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Publishes or unpublishes a virtual network.
     * 
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the image id.
     */
    public static OneResponse publish(Client client, int id, boolean publish)
    {
        return client.call(PUBLISH, id, publish);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the virtual network.
     * The info is also stored internally.
     * 
     * @see VirtualNetwork#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the network from OpenNebula.
     * 
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Publishes or unpublishes the virtual network.
     * 
     * @param publish True for publishing, false for unpublishing.
     * @return If successful the message contains the image id.
     */
    public OneResponse publish(boolean publish)
    {
        return publish(client, id, publish);
    }

    /**
     * Publishes the virtual network.
     * 
     * @return If successful the message contains the image id.
     */
    public OneResponse publish()
    {
        return publish(true);
    }

    /**
     * Unpublishes the virtual network.
     * 
     * @return If successful the message contains the image id.
     */
    public OneResponse unpublish()
    {
        return publish(false);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Returns true if the Virtual Network is public.
     * 
     * @return True if the Virtual Network is public.
     */
    public boolean isPublic()
    {
        String isPub = xpath("PUBLIC"); 
        return isPub != null && isPub.equals("1");
    }
}
