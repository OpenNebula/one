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
    private static final String ADDLEASES       = METHOD_PREFIX + "addleases";
    private static final String RMLEASES        = METHOD_PREFIX + "rmleases";


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

    /**
     * Adds a lease to the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param ip IP to add, e.g. "192.168.0.5"
     * @param mac MAC address associated to the IP. Can be null, in which case
     * OpenNebula will generate it using the following rule:
     * MAC = MAC_PREFFIX:IP
     * @return A encapsulated response.
     */
    public static OneResponse addLeases(Client client, int id, String ip,
                                        String mac)
    {
        String lease_template = "LEASES = [ IP = " + ip;

        if( mac != null )
        {
            lease_template += ", MAC = " + mac;
        }

        lease_template += " ]";

        return client.call(ADDLEASES, id, lease_template);
    }

    /**
     * Removes a lease from the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param ip IP to remove, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public static OneResponse rmLeases(Client client, int id, String ip)
    {
        String lease_template = "LEASES = [ IP = " + ip + " ]";
        return client.call(RMLEASES, id, lease_template);
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

    /**
     * Adds a lease to the VirtualNetwork
     *
     * @param ip IP to add, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public OneResponse addLeases(String ip)
    {
        return addLeases(ip, null);
    }

    /**
     * Adds a lease to the VirtualNetwork
     *
     * @param ip IP to add, e.g. "192.168.0.5"
     * @param mac MAC address associated to the IP. Can be null, in which case
     * OpenNebula will generate it using the following rule:
     * MAC = MAC_PREFFIX:IP
     * @return A encapsulated response.
     */
    public OneResponse addLeases(String ip, String mac)
    {
        return addLeases(client, id, ip, mac);
    }

    /**
     * Removes a lease from the VirtualNetwork
     *
     * @param ip IP to remove, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public OneResponse rmLeases(String ip)
    {
        return rmLeases(client, id, ip);
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
