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
package org.opennebula.client.vm;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula VM pool.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualMachinePool extends Pool implements Iterable<VirtualMachine>{

    private static final String ELEMENT_NAME          = "VM";
    private static final String INFO_METHOD           = "vmpool.info";
    private static final String INFO_EXTENDED_METHOD  = "vmpool.infoextended";
    private static final String INFO_SET_METHOD       = "vmpool.infoset";
    private static final String MONITORING            = "vmpool.monitoring";
    private static final String ACCOUNTING            = "vmpool.accounting";
    private static final String SHOWBACK              = "vmpool.showback";
    private static final String CALCULATE_SHOWBACK    = "vmpool.calculateshowback";

    /**
     * Flag for Virtual Machines in any state.
     */
    public static final int ALL_VM   = -2;

    /**
     * Flag for Virtual Machines in any state, except for DONE.
     */
    public static final int NOT_DONE = -1;

    private int filter;

    /**
     * Creates a new Virtual Machine pool with the default filter flag value
     * set to {@link Pool#MINE_GROUP} (Virtual Machines belonging to the connected user,
     * and the ones in his group)
     *
     * @param client XML-RPC Client.
     *
     * @see VirtualMachinePool#VirtualMachinePool(Client, int)
     */
    public VirtualMachinePool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = MINE_GROUP;
    }

    /**
     * Creates a new Virtual Machine pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use by default in the method
     * {@link VirtualMachinePool#info()}. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     */
    public VirtualMachinePool(Client client, int filter)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = filter;
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new VirtualMachine(node, client);
    }


    /**
     * Retrieves all or part of the Virtual Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return client.call(INFO_METHOD, filter, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all of the Virtual Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info_extended(Client client, int filter)
    {
        return client.call(INFO_EXTENDED_METHOD, filter, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all of the Virtual Machines in the vm_ids list.
     *
     * @param client XML-RPC Client.
     * @param vm_ids Comma separated list of VM IDs.
     * @param extended If true the extended body is retrieved.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info_extended(Client client, int vm_ids, boolean extended)
    {
        return client.call(INFO_SET_METHOD, vm_ids, extended);
    }

    /**
     * Retrieves all the Virtual Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoAll(Client client)
    {
        return client.call(INFO_METHOD, ALL, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all the connected user's Virtual Machines.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoMine(Client client)
    {
        return client.call(INFO_METHOD, MINE, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all the connected user's Virtual Machines and the ones in
     * his group.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoGroup(Client client)
    {
        return client.call(INFO_METHOD, MINE_GROUP, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all or part of the Virtual Machines in the pool. The
     * Virtual Machines to retrieve can be also filtered by Id, specifying the
     * first and last Id to include; and by state.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @param state Numeric state of the Virtual Machines wanted, or one
     * of {@link VirtualMachinePool#ALL_VM} or
     * {@link VirtualMachinePool#NOT_DONE}
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter,
            int startId, int endId, int state)
    {
        return client.call(INFO_METHOD, filter, startId, endId, state);
    }

    /**
     * Retrieves all or part of the Virtual Machines in the pool. The
     * Virtual Machines to retrieve can be also filtered by Id, specifying the
     * first and last Id to include; and by state.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @param state Numeric state of the Virtual Machines wanted, or one
     * of {@link VirtualMachinePool#ALL_VM} or
     * {@link VirtualMachinePool#NOT_DONE}
     * @param query query for FTS
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info_search(Client client, int filter,
            int startId, int endId, int state, String query)
    {
        return client.call(INFO_METHOD, filter, startId, endId, state, query);
    }

    /**
     * Retrieves the monitoring data for all or part of the Virtual
     * Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int filter)
    {
        return client.call(MONITORING, filter);
    }

    /**
     * Retrieves the monitoring data for all or part of the Virtual
     * Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param num: Retrieve monitor records in the last num seconds.
     * 0 just the last record, -1 all records.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int filter, int num)
    {
        return client.call(MONITORING, filter, num);
    }

    /**
     * Returns the virtual machine history records.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param start_time: Start time for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param end_time: End time for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse accounting(Client client, int filter,
                                         int start_time, int end_time)
    {
        return client.call(ACCOUNTING, filter, start_time, end_time);
    }

    /**
     * Returns the virtual machine showback records
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param first_month First month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a left boundary.
     * @param first_year First year for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param last_month Last month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a right boundary.
     * @param last_year Last year for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse showback(Client client, int filter,
                                       int first_month, int first_year,
                                       int last_month, int last_year)
    {
        return client.call(SHOWBACK, filter,
                           first_month, first_year,
                           last_month, last_year);
    }

    /**
     * Processes all the history records, and stores the monthly cost for each VM
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param first_month First month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a left boundary.
     * @param first_year First year for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param last_month Last month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a right boundary.
     * @param last_year Last year for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse calculateshowback(Client client, int filter,
                                                int first_month, int first_year,
                                                int last_month, int last_year)
    {
        return client.call(CALCULATE_SHOWBACK, filter,
                           first_month, first_year,
                           last_month, last_year);
    }

    /**
     * Loads the xml representation of all or part of the
     * Virtual Machines in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see VirtualMachinePool#info(Client, int)
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, filter);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the
     * Virtual Machines in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see VirtualMachinePool#info(Client, int)
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info_extended()
    {
        OneResponse response = info_extended(client, filter);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the Virtual Machines in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoAll()
    {
        OneResponse response = infoAll(client);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Virtual Machines.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoMine()
    {
        OneResponse response = infoMine(client);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Virtual Machines and
     * the ones in his group.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoGroup()
    {
        OneResponse response = infoGroup(client);
        processInfo(response);
        return response;
    }

    /**
     * Retrieves all or part of the Virtual Machines in the pool. The Virtual Machines to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @param state Numeric state of the Virtual Machines wanted
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(int filter, int startId, int endId, int state)
    {
        OneResponse response = info(client, filter, startId, endId, state);
        processInfo(response);
        return response;
    }

    /**
     * Retrieves the monitoring data for all or part of the Virtual
     * Machines in the pool.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse monitoring(int filter)
    {
        return monitoring(client, filter);
    }

    /**
     * Returns the virtual machine history records.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param start_time: Start time for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param end_time: End time for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse accounting(int filter,
                                         int start_time, int end_time)
    {
        return accounting(client, filter, start_time, end_time);
    }

    /**
     * Returns the virtual machine showback records
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param first_month First month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a left boundary.
     * @param first_year First year for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param last_month Last month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a right boundary.
     * @param last_year Last year for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse showback(int filter,
                                int first_month, int first_year,
                                int last_month, int last_year)
    {
        return showback(client, filter,
                        first_month, first_year,
                        last_month, last_year);
    }

    /**
     * Processes all the history records, and stores the monthly cost for each VM
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Virtual Machines</li>
     * <li>&gt;= 0 UID User's Virtual Machines</li>
     * </ul>
     * @param first_month First month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a left boundary.
     * @param first_year First year for the time interval. Can be -1,
     * in which case the time interval won't have a left boundary.
     * @param last_month Last month for the time interval. January is 1.
     * Can be -1, in which case the time interval won't have a right boundary.
     * @param last_year Last year for the time interval. Can be -1,
     * in which case the time interval won't have a right boundary.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse calculateshowback(int filter,
                                         int first_month, int first_year,
                                         int last_month, int last_year)
    {
        return calculateshowback(client, filter,
                                 first_month, first_year,
                                 last_month, last_year);
    }

    public Iterator<VirtualMachine> iterator()
    {
        AbstractList<VirtualMachine> ab = new AbstractList<VirtualMachine>()
        {
            public int size()
            {
                return getLength();
            }

            public VirtualMachine get(int index)
            {
                return (VirtualMachine) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Virtual Machine with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the ACl rule to retrieve
     * @return The Virtual Machine with the given Id, or null if it was not found.
     */
    public VirtualMachine getById(int id)
    {
        return (VirtualMachine) super.getById(id);
    }
}
