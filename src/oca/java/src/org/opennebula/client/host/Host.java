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
package org.opennebula.client.host;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula host.
 * It also offers static XML-RPC call wrappers.
 */
public class Host extends PoolElement{

    private static final String METHOD_PREFIX   = "host.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String STATUS          = METHOD_PREFIX + "status";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String MONITORING      = METHOD_PREFIX + "monitoring";
    private static final String RENAME          = METHOD_PREFIX + "rename";

    private static final String[] HOST_STATES =
        {"INIT", "MONITORING_MONITORED", "MONITORED", "ERROR", "DISABLED",
         "MONITORING_ERROR",  "MONITORING_INIT", "MONITORING_DISABLED", "OFFLINE"};

    private static final String[] SHORT_HOST_STATES =
        {"init", "update", "on", "err", "dsbl", "retry", "init", "dsbl", "off"};

    public enum Status {
        ENABLED,
        DISABLED,
        OFFLINE;

        public int code() {
            switch(this) {
                case ENABLED:  return 0;
                case DISABLED: return 1;
                case OFFLINE:  return 2;
            }

            return -1;
        }
    }

    /**
     * Creates a new Host representation.
     *
     * @param id The host id (hid) of the machine.
     * @param client XML-RPC Client.
     */
    public Host(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Host(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new host in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param hostname Hostname of the machine we want to add
     * @param im The name of the information manager (im_mad_name),
     * this values are taken from the oned.conf with the tag name IM_MAD (name)
     * @param vmm The name of the virtual machine manager mad name
     * (vmm_mad_name), this values are taken from the oned.conf with the
     * tag name VM_MAD (name)
     * @param clusterId The cluster ID. If it is -1, this host won't be
     * added to any cluster.
     *
     * @return If successful the message contains the associated
     * id generated for this host
     */
    public static OneResponse allocate(Client client,
                                       String hostname,
                                       String im,
                                       String vmm,
                                       int    clusterId)
    {
        return client.call(ALLOCATE, hostname, im, vmm, clusterId);
    }

    /**
     * Allocates a new host in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param hostname Hostname of the machine we want to add
     * @param im The name of the information manager (im_mad_name),
     * this values are taken from the oned.conf with the tag name IM_MAD (name)
     * @param vmm The name of the virtual machine manager mad name
     * (vmm_mad_name), this values are taken from the oned.conf with the
     * tag name VM_MAD (name)
     *
     * @return If successful the message contains the associated
     * id generated for this host
     */
    public static OneResponse allocate(
            Client client,
            String hostname,
            String im,
            String vmm)
    {
        return allocate(client, hostname, im, vmm, -1);
    }

    /**
     * Retrieves the information of the given host.
     *
     * @param client XML-RPC Client.
     * @param id The host id (hid) of the target machine.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given Host.
     *
     * @param client XML-RPC Client.
     * @param id The Host id for the Host to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
    }

    /**
     * Deletes a host from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The host id (hid) of the target machine.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Enables or disables a given host.
     *
     * @param client XML-RPC Client.
     * @param id The host id (hid) of the target machine.
     * @param status Host status
     * @return A encapsulated response.
     */
    public static OneResponse status(Client client, int id, Status status)
    {
        return client.call(STATUS, id, status.code());
    }

    /**
     * Replaces the template contents.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target host we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the host id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Retrieves the monitoring information of the given host, in XML
     *
     * @param client XML-RPC Client.
     * @param id The host id (hid) of the target machine.
     * @return If successful the message contains the string
     * with the monitoring information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int id)
    {
        return client.call(MONITORING, id);
    }

    /**
     * Renames this Host.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target host we want to modify.
     * @param name New name for the Host
     * @return If successful the message contains the host id.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the host.
     * The info is also stored internally.
     *
     * @see Host#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the host from OpenNebula.
     *
     * @see Host#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Enables the host.
     *
     * @return A encapsulated response.
     */
    public OneResponse enable()
    {
        return status(client, id, Status.ENABLED);
    }

    /**
     * Disables the host
     *
     * @return A encapsulated response.
     */
    public OneResponse disable()
    {
        return status(client, id, Status.DISABLED);
    }

    /**
     * Sets the host offline
     *
     * @return A encapsulated response.
     */
    public OneResponse offline()
    {
        return status(client, id, Status.OFFLINE);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @return If successful the message contains the host id.
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
     * @return If successful the message contains the host id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Retrieves the monitoring information of the given host, in XML
     *
     * @return If successful the message contains the string
     * with the monitoring information returned by OpenNebula.
     */
    public OneResponse monitoring()
    {
        return monitoring(client, id);
    }

    /**
     * Renames this Host.
     *
     * @param name New name for the Host
     * @return If successful the message contains the host id.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Returns the state of the Host.
     * <br>
     * The method {@link Host#info()} must be called before.
     *
     * @return The state of the Host.
     */
    public String stateStr()
    {
        int state = state();
        return state != -1 ? HOST_STATES[state()] : null;
    }

    /**
     * Returns the short length string state of the Host.
     * <br>
     * The method {@link Host#info()} must be called before.
     *
     * @return The short length string state of the Host.
     */
    public String shortStateStr()
    {
        int state = state();
        return state != -1 ? SHORT_HOST_STATES[state()] : null;
    }

    /**
     * Returns true if the host is enabled.
     *
     * @return True if the host is enabled.
     */
    public boolean isEnabled()
    {
        return state() != 4;
    }
}
