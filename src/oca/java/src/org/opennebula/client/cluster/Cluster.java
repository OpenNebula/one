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
package org.opennebula.client.cluster;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula cluster.
 * It also offers static XML-RPC call wrappers.
 */
public class Cluster extends PoolElement{

    private static final String METHOD_PREFIX   = "cluster.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String ADDHOST         = METHOD_PREFIX + "addhost";
    private static final String DELHOST         = METHOD_PREFIX + "delhost";
    private static final String ADDDATASTORE    = METHOD_PREFIX + "adddatastore";
    private static final String DELDATASTORE    = METHOD_PREFIX + "deldatastore";
    private static final String ADDVNET         = METHOD_PREFIX + "addvnet";
    private static final String DELVNET         = METHOD_PREFIX + "delvnet";
    private static final String RENAME          = METHOD_PREFIX + "rename";

    /**
     * Creates a new Cluster representation.
     *
     * @param id The cluster id.
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
     * Allocates a new cluster in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param name Name for the new cluster.
     * @return If successful the message contains the associated
     * id generated for this cluster.
     */
    public static OneResponse allocate(Client client, String name)
    {
        return client.call(ALLOCATE, name);
    }

    /**
     * Retrieves the information of the given cluster.
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given cluster.
     *
     * @param client XML-RPC Client.
     * @param id The Cluster id for the Cluster to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a cluster from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Replaces the cluster contents.
     *
     * @param client XML-RPC Client.
     * @param id The id of the target cluster we want to modify.
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the cluster id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Adds a Host to this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param hid Host ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse addHost(Client client, int id, int hid)
    {
        return client.call(ADDHOST, id, hid);
    }

    /**
     * Deletes a Host from this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param hid Host ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse delHost(Client client, int id, int hid)
    {
        return client.call(DELHOST, id, hid);
    }

    /**
     * Adds a Datastore to this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param dsId Datastore ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse addDatastore(Client client, int id, int dsId)
    {
        return client.call(ADDDATASTORE, id, dsId);
    }

    /**
     * Deletes a Datastore from this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param dsId Datastore ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse delDatastore(Client client, int id, int dsId)
    {
        return client.call(DELDATASTORE, id, dsId);
    }

    /**
     * Adds a VNet to this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param vnetId VNet ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse addVnet(Client client, int id, int vnetId)
    {
        return client.call(ADDVNET, id, vnetId);
    }

    /**
     * Deletes a VNet from this Cluster
     *
     * @param client XML-RPC Client.
     * @param id The cluster id.
     * @param vnetId VNet ID.
     *
     * @return A encapsulated response.
     */
    public static OneResponse delVnet(Client client, int id, int vnetId)
    {
        return client.call(DELVNET, id, vnetId);
    }

    /**
     * Renames this Cluster.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target host we want to modify.
     * @param name New name for the Cluster
     * @return If successful the message contains the cluster id.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the cluster.
     * The info is also stored internally.
     *
     * @see Cluster#info(Client, int)
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
     * @see Cluster#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the cluster template.
     *
     * @param new_template New cluster template.
     * @return If successful the message contains the cluster id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the cluster template.
     *
     * @param new_template New cluster template.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the cluster id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Adds a Host to this Cluster
     *
     * @param hid Host ID.
     * @return A encapsulated response.
     */
    public OneResponse addHost(int hid)
    {
        return addHost(client, id, hid);
    }

    /**
     * Deletes a Host from this Cluster
     *
     * @param hid Host ID.
     * @return A encapsulated response.
     */
    public OneResponse delHost(int hid)
    {
        return delHost(client, id, hid);
    }

    /**
     * Adds a Datastore to this Cluster
     *
     * @param dsId Datastore ID.
     * @return A encapsulated response.
     */
    public OneResponse addDatastore(int dsId)
    {
        return addDatastore(client, id, dsId);
    }

    /**
     * Deletes a Datastore from this Cluster
     *
     * @param dsId Datastore ID.
     * @return A encapsulated response.
     */
    public OneResponse delDatastore(int dsId)
    {
        return delDatastore(client, id, dsId);
    }

    /**
     * Adds a VNet to this Cluster
     *
     * @param vnetId VNet ID.
     * @return A encapsulated response.
     */
    public OneResponse addVnet(int vnetId)
    {
        return addVnet(client, id, vnetId);
    }

    /**
     * Deletes a VNet from this Cluster
     *
     * @param vnetId VNet ID.
     * @return A encapsulated response.
     */
    public OneResponse delVnet(int vnetId)
    {
        return delVnet(client, id, vnetId);
    }

    /**
     * Renames this Cluster
     *
     * @param name New name for the Cluster.
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
     * Returns whether or not the host is part of this cluster
     *
     * @param id The host ID.
     * @return Whether or not the host is part of this cluster.
     */
    public boolean containsHost(int id)
    {
        return containsResource("HOSTS", id);
    }

    /**
     * Returns whether or not the datastore is part of this cluster
     *
     * @param id The datastore ID.
     * @return Whether or not the datastore is part of this cluster.
     */
    public boolean containsDatastore(int id)
    {
        return containsResource("DATASTORES", id);
    }

    /**
     * Returns whether or not the vnet is part of this cluster
     *
     * @param id The vnet ID.
     * @return Whether or not the vnet is part of this cluster.
     */
    public boolean containsVnet(int id)
    {
        return containsResource("VNETS", id);
    }

    private boolean containsResource(String resource, int id)
    {
        String res = xpath(resource+"/ID[.="+id+"]");
        return res != null && res.equals(""+id);
    }
}
