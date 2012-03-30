/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
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
    private static final String ADDLEASES       = METHOD_PREFIX + "addleases";
    private static final String RMLEASES        = METHOD_PREFIX + "rmleases";
    private static final String CHOWN           = METHOD_PREFIX + "chown";
    private static final String CHMOD           = METHOD_PREFIX + "chmod";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String HOLD            = METHOD_PREFIX + "hold";
    private static final String RELEASE         = METHOD_PREFIX + "release";

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
     * @param clusterId The cluster ID. If it is -1, this virtual network
     * won't be added to any cluster.
     *
     * @return If successful the message contains the associated
     * id generated for this virtual network.
     */
    public static OneResponse allocate(
            Client  client,
            String  description,
            int     clusterId)
    {
        return client.call(ALLOCATE, description, clusterId);
    }

    /**
     * Allocates a new virtual network in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template
     * of the virtual network.
     *
     * @return If successful the message contains the associated
     * id generated for this virtual network.
     */
    public static OneResponse allocate(
            Client  client,
            String  description)
    {
        return allocate(client, description, -1);
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
        int group_u = publish ? 1 : 0;

        return chmod(client, id, -1, -1, -1, group_u, -1, -1, -1, -1, -1);
    }

    /**
     * Adds a lease to the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template IP to add, e.g. "LEASES = [ IP = 192.168.0.5 ]"
     * @return A encapsulated response.
     */
    public static OneResponse addLeases(Client client, int id, String template)
    {
        return client.call(ADDLEASES, id, template);
    }

    /**
     * Removes a lease from the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template IP to remove, e.g. "LEASES = [ IP = 192.168.0.5 ]"
     * @return A encapsulated response.
     */
    public static OneResponse rmLeases(Client client, int id, String template)
    {
        return client.call(RMLEASES, id, template);
    }

    /**
     * Holds a VirtualNetwork lease, marking it as used
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template IP to hold, e.g. "LEASES = [ IP = 192.168.0.5 ]"
     * @return A encapsulated response.
     */
    public static OneResponse hold(Client client, int id, String template)
    {
        return client.call(HOLD, id, template);
    }

    /**
     * Releases a VirtualNetwork lease on hold
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template IP to release, e.g. "LEASES = [ IP = 192.168.0.5 ]"
     * @return A encapsulated response.
     */
    public static OneResponse release(Client client, int id, String template)
    {
        return client.call(RELEASE, id, template);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the VirtualNetwork permissions
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
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
     * Replaces the VirtualNetwork template contents.
     *
     * @param client XML-RPC Client.
     * @param id The user id of the target vnet we want to modify.
     * @param new_template New template contents.
     * @return If successful the message contains the vnet id.
     */
    public static OneResponse update(Client client, int id, String new_template)
    {
        return client.call(UPDATE, id, new_template);
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
        String lease_template = "LEASES = [ IP = " + ip;

        if( mac != null )
        {
            lease_template += ", MAC = " + mac;
        }

        lease_template += " ]";

        return addLeases(client, id, lease_template);
    }

    /**
     * Removes a lease from the VirtualNetwork
     *
     * @param ip IP to remove, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public OneResponse rmLeases(String ip)
    {
        String lease_template = "LEASES = [ IP = " + ip + " ]";
        return rmLeases(client, id, lease_template);
    }

    /**
     * Holds a VirtualNetwork lease, marking it as used
     *
     * @param ip IP to hold, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public OneResponse hold(String ip)
    {
        String lease_template = "LEASES = [ IP = " + ip + " ]";
        return hold(client, id, lease_template);
    }

    /**
     * Releases a VirtualNetwork lease on hold
     *
     * @param ip IP to release, e.g. "192.168.0.5"
     * @return A encapsulated response.
     */
    public OneResponse release(String ip)
    {
        String lease_template = "LEASES = [ IP = " + ip + " ]";
        return release(client, id, lease_template);
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
     * Changes the VirtualNetwork permissions
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
     * Replaces the VirtualNetwork template contents.
     *
     * @param new_template New template contents.
     * @return If successful the message contains the vnet id.
     */
    public OneResponse update(String new_template)
    {
        return update(client, id, new_template);
    }

    // =================================
    // Helpers
    // =================================

}
