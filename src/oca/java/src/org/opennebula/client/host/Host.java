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
    private static final String ENABLE          = METHOD_PREFIX + "enable";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String MONITORING      = METHOD_PREFIX + "monitoring";

    private static final String[] HOST_STATES =
        {"INIT", "MONITORING_MONITORED", "MONITORED", "ERROR", "DISABLED", 
         "MONITORING_ERROR"};


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
     * @param vnm The name of the virtual network manager mad name
     * (vnm_mad_name), this values are taken from the oned.conf with the
     * tag name VN_MAD (name)
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
                                       String vnm,
                                       int    clusterId)
    {
        return client.call(ALLOCATE, hostname, im, vmm, vnm, clusterId);
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
     * @param vnm The name of the virtual network manager mad name
     * (vnm_mad_name), this values are taken from the oned.conf with the
     * tag name VN_MAD (name)
     *
     * @return If successful the message contains the associated
     * id generated for this host
     */
    public static OneResponse allocate(
            Client client,
            String hostname,
            String im,
            String vmm,
            String vnm)
    {
        return allocate(client, hostname, im, vmm, vnm, -1);
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
     * @param enable If set true OpenNebula will enable the
     * target host, if set false it will disable it.
     * @return A encapsulated response.
     */
    public static OneResponse enable(Client client, int id, boolean enable)
    {
        return client.call(ENABLE, id, enable);
    }

    /**
     * Replaces the template contents.
     *
     * @param client XML-RPC Client.
     * @param id The image id of the target host we want to modify.
     * @param new_template New template contents
     * @return If successful the message contains the host id.
     */
    public static OneResponse update(Client client, int id, String new_template)
    {
        return client.call(UPDATE, id, new_template);
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
     * Enables or disables the host.
     *
     * @see Host#enable(Client, int, boolean)
     */
    public OneResponse enable(boolean enable)
    {
        return enable(client, id, enable);
    }

    /**
     * Enables the host.
     *
     * @return A encapsulated response.
     */
    public OneResponse enable()
    {
        return enable(true);
    }

    /**
     * Disables the host
     *
     * @return A encapsulated response.
     */
    public OneResponse disable()
    {
        return enable(false);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @return If successful the message contains the host id.
     */
    public OneResponse update(String new_template)
    {
        return update(client, id, new_template);
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

    // =================================
    // Helpers
    // =================================

    /**
     * Returns the state of the Host.
     * <br/>
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
     * <br/>
     * The method {@link Host#info()} must be called before.
     *
     * @return The short length string state of the Host.
     */
    public String shortStateStr()
    {
        String st = stateStr();

        if(st == null)
            return null;
        else if(st.equals("ERROR"))
            return "err";
        else if (st.equals("DISABLED"))
            return "off";
        else if (st.equals("INIT"))
            return "init";
        else if (st.equals("MONITORING_MONITORED"))
            return "update";
        else if (st.equals("MONITORED"))
            return "on";
        else if (st.equals("MONITORING_ERROR"))
            return "retry";

        return "";
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
