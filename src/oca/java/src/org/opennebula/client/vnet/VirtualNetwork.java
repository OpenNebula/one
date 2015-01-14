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
    private static final String ADDAR           = METHOD_PREFIX + "add_ar";
    private static final String RMAR            = METHOD_PREFIX + "rm_ar";
    private static final String UPDATEAR        = METHOD_PREFIX + "update_ar";
    private static final String CHOWN           = METHOD_PREFIX + "chown";
    private static final String CHMOD           = METHOD_PREFIX + "chmod";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String HOLD            = METHOD_PREFIX + "hold";
    private static final String RELEASE         = METHOD_PREFIX + "release";
    private static final String RENAME          = METHOD_PREFIX + "rename";
    private static final String RESERVE         = METHOD_PREFIX + "reserve";
    private static final String FREEAR          = METHOD_PREFIX + "free_ar";

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
     * Adds an Address Range to the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template AR to add, example:
     *      AR = [
     *          TYPE = IP4,
     *          IP = 192.168.0.5,
     *          SIZE = 10 ]
     *
     * @return A encapsulated response.
     */
    public static OneResponse addAr(Client client, int id, String template)
    {
        return client.call(ADDAR, id, template);
    }

    /**
     * Removes an Address Range from the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param arId Id of the Address Range to remove
     * @return A encapsulated response.
     */
    public static OneResponse rmAr(Client client, int id, int arId)
    {
        return client.call(RMAR, id, arId);
    }

    /**
     * Upates an Address Range from the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template AR to update, example:
     *      AR = [
     *          AR_ID = 3,
     *          TYPE  = IP4,
     *          IP    = 192.168.0.5,
     *          SIZE  = 10 ]
     *
     * @return A encapsulated response.
     */
    public static OneResponse updateAr(Client client, int id, String template)
    {
        return client.call(UPDATEAR, id, template);
    }

    /**
     * Holds a VirtualNetwork lease, marking it as used
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template Address to hold, examples:
     *<pre>
     *      LEASES = [ IP = 192.168.0.5 ]
     *      LEASES = [ MAC = 02:00:0a:00:00:96 ]
     *      LEASES = [ IP = 192.168.0.5, AR_ID = 3 ]
     *</pre>
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
     * @param template Address to release, examples:
     *<pre>
     *      LEASES = [ IP = 192.168.0.5 ]
     *      LEASES = [ MAC = 02:00:0a:00:00:96 ]
     *      LEASES = [ IP = 192.168.0.5, AR_ID = 3 ]
     *</pre>
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
     * @param id The vnet id of the target vnet we want to modify.
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the vnet id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Renames this VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The VirtualNetwork id of the target VirtualNetwork.
     * @param name New name for the VirtualNetwork.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Reserve a set of addresses from this virtual network
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param template of the reservation. Examples:
     *<pre>
     *      SIZE  = 10
     *
     *      SIZE  = 10
     *      AR_ID = 3
     *      NAME  = "new_network"
     *
     *      SIZE  = 10
     *      IP    = 192.168.10.50
     *      NETWORK_ID = 9
     *</pre>
     * @return A encapsulated response.
     */
    public static OneResponse reserve(Client client, int id, String template)
    {
        return client.call(RESERVE, id, template);
    }

    /**
     * Removes an Address Range from the VirtualNetwork
     *
     * @param client XML-RPC Client.
     * @param id The virtual network id (nid) of the target network.
     * @param arId Id of the Address Range to remove
     * @return A encapsulated response.
     */
    public static OneResponse free(Client client, int id, int arId)
    {
        return client.call(FREEAR, id, arId);
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
     * Adds an Address Range to the VirtualNetwork
     *
     * @param template AR to add, example:
     *<pre>
     *      AR = [
     *          TYPE = IP4,
     *          IP = 192.168.0.5,
     *          SIZE = 10 ]
     *</pre>
     *
     * @return A encapsulated response.
     */
    public OneResponse addAr(String template)
    {
        return addAr(client, id, template);
    }

    /**
     * Removes an Address Range from the VirtualNetwork
     *
     * @param arId Id of the Address Range to remove
     * @return A encapsulated response.
     */
    public OneResponse rmAr(int arId)
    {
        return rmAr(client, id, arId);
    }

    /**
     * Upates an Address Range from the VirtualNetwork
     *
     * @param template AR to update, example:
     *<pre>
     *      AR = [
     *          AR_ID = 3,
     *          TYPE  = IP4,
     *          IP    = 192.168.0.5,
     *          SIZE  = 10 ]
     *</pre>
     *
     * @return A encapsulated response.
     */
    public OneResponse updateAr(String template)
    {
        return updateAr(client, id, template);
    }

    /**
     * Holds a VirtualNetwork lease, marking it as used
     *
     * @param ip IP or MAC to hold, e.g. "192.168.0.5", "02:00:0a:00:00:96"
     * @return A encapsulated response.
     */
    public OneResponse hold(String ip)
    {
        String addr_name = ip.contains(":") ? "MAC" : "IP";

        String lease_template = "LEASES = [ "+addr_name+" = "+ip+"]";

        return hold(client, id, lease_template);
    }

    /**
     * Holds a VirtualNetwork lease, marking it as used
     *
     * @param ip IP or MAC to hold, e.g. "192.168.0.5", "02:00:0a:00:00:96"
     * @param arId Id of the Address Range to hold the lease from
     * @return A encapsulated response.
     */
    public OneResponse hold(String ip, int arId)
    {
        String addr_name = ip.contains(":") ? "MAC" : "IP";

        String lease_template =
            "LEASES = [ "+addr_name+" = "+ip+", AR_ID = "+arId+" ]";

        return hold(client, id, lease_template);
    }

    /**
     * Releases a VirtualNetwork lease on hold
     *
     * @param ip IP or MAC to hold, e.g. "192.168.0.5", "02:00:0a:00:00:96"
     * @return A encapsulated response.
     */
    public OneResponse release(String ip)
    {
        String addr_name = ip.contains(":") ? "MAC" : "IP";

        String lease_template = "LEASES = [ "+addr_name+" = "+ip+"]";

        return release(client, id, lease_template);
    }

    /**
     * Releases a VirtualNetwork lease on hold
     *
     * @param ip IP or MAC to hold, e.g. "192.168.0.5", "02:00:0a:00:00:96"
     * @param arId Id of the Address Range to release the lease from
     * @return A encapsulated response.
     */
    public OneResponse release(String ip, int arId)
    {
        String addr_name = ip.contains(":") ? "MAC" : "IP";

        String lease_template =
            "LEASES = [ "+addr_name+" = "+ip+", AR_ID = "+arId+" ]";

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
        return update(new_template, false);
    }

    /**
     * Replaces the VirtualNetwork template contents.
     *
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the vnet id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Renames this VirtualNetwork
     *
     * @param name New name for the VirtualNetwork.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Reserve a set of addresses from this virtual network
     *
     * @param template of the reservation. Examples:
     *<pre>
     *      SIZE  = 10
     *
     *      SIZE  = 10
     *      AR_ID = 3
     *      NAME  = "new_network"
     *
     *      SIZE  = 10
     *      IP    = 192.168.10.50
     *      NETWORK_ID = 9
     *</pre>
     * @return A encapsulated response.
     */
    public OneResponse reserve(String template)
    {
        return reserve(client, id, template);
    }

    /**
     * Removes an Address Range from the VirtualNetwork
     *
     * @param arId Id of the Address Range to remove
     * @return A encapsulated response.
     */
    public OneResponse free(int arId)
    {
        return free(client, id, arId);
    }

    // =================================
    // Helpers
    // =================================

}
