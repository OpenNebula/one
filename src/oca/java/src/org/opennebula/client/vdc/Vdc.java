/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
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
package org.opennebula.client.vdc;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula vdc.
 * It also offers static XML-RPC call wrappers.
 */
public class Vdc extends PoolElement{

    private static final String METHOD_PREFIX   = "vdc.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String RENAME          = METHOD_PREFIX + "rename";

    private static final String ADDGROUP        = METHOD_PREFIX + "addgroup";
    private static final String DELGROUP        = METHOD_PREFIX + "delgroup";
    private static final String ADDCLUSTER      = METHOD_PREFIX + "addcluster";
    private static final String DELCLUSTER      = METHOD_PREFIX + "delcluster";
    private static final String ADDHOST         = METHOD_PREFIX + "addhost";
    private static final String DELHOST         = METHOD_PREFIX + "delhost";
    private static final String ADDDATASTORE    = METHOD_PREFIX + "adddatastore";
    private static final String DELDATASTORE    = METHOD_PREFIX + "deldatastore";
    private static final String ADDVNET         = METHOD_PREFIX + "addvnet";
    private static final String DELVNET         = METHOD_PREFIX + "delvnet";

    /**
     * Creates a new Vdc representation.
     *
     * @param id The vdc id.
     * @param client XML-RPC Client.
     */
    public Vdc(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Vdc(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new vdc in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the vdc.
     * @return If successful the message contains the associated
     * id generated for this vdc.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given vdc.
     *
     * @param client XML-RPC Client.
     * @param id The vdc id.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given VDC.
     *
     * @param client XML-RPC Client.
     * @param id The VDC id for the VDC to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a vdc from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The vdc id.
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
     * @param id The vdc id of the target vdc we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the vdc id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Renames this vdc
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param name New name for the vdc.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Adds a group to this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param groupId The group to add
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addGroup(Client client, int id, int groupId)
    {
        return client.call(ADDGROUP, id, groupId);
    }

    /**
     * Deletes a group from this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param groupId The group to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delGroup(Client client, int id, int groupId)
    {
        return client.call(DELGROUP, id, groupId);
    }

    /**
     * Adds a cluster to this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The cluster's zone
     * @param clusterId The cluster to add
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addCluster(Client client, int id, int zoneId, int clusterId)
    {
        return client.call(ADDCLUSTER, id, zoneId, clusterId);
    }

    /**
     * Deletes a cluster from this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The cluster's zone
     * @param clusterId The cluster to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delCluster(Client client, int id, int zoneId, int clusterId)
    {
        return client.call(DELCLUSTER, id, zoneId, clusterId);
    }

    /**
     * Adds a host to this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The host's zone
     * @param hostId The host to add
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addHost(Client client, int id, int zoneId, int hostId)
    {
        return client.call(ADDHOST, id, zoneId, hostId);
    }

    /**
     * Deletes a host from this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The host's zone
     * @param hostId The host to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delHost(Client client, int id, int zoneId, int hostId)
    {
        return client.call(DELHOST, id, zoneId, hostId);
    }

    /**
     * Adds a vnet to this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The vnet's zone
     * @param vnetId The vnet to add
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addVnet(Client client, int id, int zoneId, int vnetId)
    {
        return client.call(ADDVNET, id, zoneId, vnetId);
    }

    /**
     * Deletes a vnet from this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The vnet's zone
     * @param vnetId The vnet to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delVnet(Client client, int id, int zoneId, int vnetId)
    {
        return client.call(DELVNET, id, zoneId, vnetId);
    }

    /**
     * Adds a datastore to this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The datastore's zone
     * @param datastoreId The datastore to add
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addDatastore(Client client, int id, int zoneId, int datastoreId)
    {
        return client.call(ADDDATASTORE, id, zoneId, datastoreId);
    }

    /**
     * Deletes a datastore from this VDC
     *
     * @param client XML-RPC Client.
     * @param id The vdc id of the target vdc
     * @param zoneId The datastore's zone
     * @param datastoreId The datastore to delete
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delDatastore(Client client, int id, int zoneId, int datastoreId)
    {
        return client.call(DELDATASTORE, id, zoneId, datastoreId);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the vdc.
     * The info is also stored internally.
     *
     * @see Vdc#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the vdc from OpenNebula.
     *
     * @see Vdc#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @return If successful the message contains the vdc id.
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
     * @return If successful the message contains the vdc id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Renames this Vdc
     *
     * @param name New name for the vdc.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Adds a group to this VDC
     *
     * @param groupId The group to add
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addGroup(int groupId)
    {
        return client.call(ADDGROUP, id, groupId);
    }

    /**
     * Deletes a group from this VDC
     *
     * @param groupId The group to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delGroup(int groupId)
    {
        return client.call(DELGROUP, id, groupId);
    }

    /**
     * Adds a cluster to this VDC
     *
     * @param zoneId The cluster's zone
     * @param clusterId The cluster to add
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addCluster(int zoneId, int clusterId)
    {
        return client.call(ADDCLUSTER, id, zoneId, clusterId);
    }

    /**
     * Deletes a cluster from this VDC
     *
     * @param zoneId The cluster's zone
     * @param clusterId The cluster to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delCluster(int zoneId, int clusterId)
    {
        return client.call(DELCLUSTER, id, zoneId, clusterId);
    }

    /**
     * Adds a host to this VDC
     *
     * @param zoneId The host's zone
     * @param hostId The host to add
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addHost(int zoneId, int hostId)
    {
        return client.call(ADDHOST, id, zoneId, hostId);
    }

    /**
     * Deletes a host from this VDC
     *
     * @param zoneId The host's zone
     * @param hostId The host to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delHost(int zoneId, int hostId)
    {
        return client.call(DELHOST, id, zoneId, hostId);
    }

    /**
     * Adds a vnet to this VDC
     *
     * @param zoneId The vnet's zone
     * @param vnetId The vnet to add
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addVnet(int zoneId, int vnetId)
    {
        return client.call(ADDVNET, id, zoneId, vnetId);
    }

    /**
     * Deletes a vnet from this VDC
     *
     * @param zoneId The vnet's zone
     * @param vnetId The vnet to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delVnet(int zoneId, int vnetId)
    {
        return client.call(DELVNET, id, zoneId, vnetId);
    }

    /**
     * Adds a datastore to this VDC
     *
     * @param zoneId The datastore's zone
     * @param datastoreId The datastore to add
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addDatastore(int zoneId, int datastoreId)
    {
        return client.call(ADDDATASTORE, id, zoneId, datastoreId);
    }

    /**
     * Deletes a datastore from this VDC
     *
     * @param zoneId The datastore's zone
     * @param datastoreId The datastore to delete
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delDatastore(int zoneId, int datastoreId)
    {
        return client.call(DELDATASTORE, id, zoneId, datastoreId);
    }

    // =================================
    // Helpers
    // =================================

}
