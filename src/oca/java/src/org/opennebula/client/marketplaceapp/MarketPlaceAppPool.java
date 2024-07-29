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
package org.opennebula.client.marketplaceapp;

import java.util.AbstractList;
import java.util.Iterator;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula MarketPlaceApp pool.
 * It also offers static XML-RPC call wrappers.
 */
public class MarketPlaceAppPool extends Pool implements Iterable<MarketPlaceApp>
{
    private static final String ELEMENT_NAME = "MARKETPLACEAPP";
    private static final String INFO_METHOD  = "marketapppool.info";

    private int filter;

    /**
     * Creates a new MarketPlaceApp pool with the default filter flag value
     * set to {@link Pool#MINE_GROUP} (MarketPlaceApps belonging to the connected user,
     * and the ones in his group)
     *
     * @param client XML-RPC Client.
     *
     * @see MarketPlaceAppPool#MarketPlaceAppPool(Client, int)
     */
    public MarketPlaceAppPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = MINE_GROUP;
    }

    /**
     * Creates a new MarketPlaceApp pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use by default in the method
     * {@link MarketPlaceAppPool#info()}. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All MarketPlaceApps</li>
     * <li>{@link Pool#MINE}: Connected user's MarketPlaceApps</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's MarketPlaceApps, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group MarketPlaceApps</li>
     * <li>&gt;= 0 UID User's MarketPlaceApps</li>
     * </ul>
     */
    public MarketPlaceAppPool(Client client, int filter)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = filter;
    }

    /* (non-Javadoc)
     * @see org.opennebula.client.Pool#factory(org.w3c.dom.Node)
     */
    @Override
    public PoolElement factory(Node node)
    {
        return new MarketPlaceApp(node, client);
    }

    /**
     * Retrieves all or part of the MarketPlaceApps in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All MarketPlaceApps</li>
     * <li>{@link Pool#MINE}: Connected user's MarketPlaceApps</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's MarketPlaceApps, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group MarketPlaceApps</li>
     * <li>&gt;= 0 UID User's MarketPlaceApps</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return Pool.info(client, INFO_METHOD, filter, -1, -1);
    }

    /**
     * Retrieves all the MarketPlaceApps in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoAll(Client client)
    {
        return Pool.infoAll(client, INFO_METHOD);
    }

    /**
     * Retrieves all the connected user's MarketPlaceApps.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoMine(Client client)
    {
        return Pool.infoMine(client, INFO_METHOD);
    }

    /**
     * Retrieves all the connected user's MarketPlaceApps and the ones in
     * his group.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoGroup(Client client)
    {
        return Pool.infoGroup(client, INFO_METHOD);
    }

    /**
     * Retrieves all or part of the MarketPlaceApps in the pool. The MarketPlaceApps to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All MarketPlaceApps</li>
     * <li>{@link Pool#MINE}: Connected user's MarketPlaceApps</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's MarketPlaceApps, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group MarketPlaceApps</li>
     * <li>&gt;= 0 UID User's MarketPlaceApps</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter,
            int startId, int endId)
    {
        return Pool.info(client, INFO_METHOD, filter, startId, endId);
    }

    /**
     * Loads the xml representation of all or part of the
     * MarketPlaceApps in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see MarketPlaceAppPool#info(Client, int)
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        return super.info(filter, -1, -1);
    }

    /**
     * Loads the xml representation of all the MarketPlaceApps in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoAll()
    {
        return super.infoAll();
    }

    /**
     * Loads the xml representation of all the connected user's MarketPlaceApps.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoMine()
    {
        return super.infoMine();
    }

    /**
     * Loads the xml representation of all the connected user's MarketPlaceApps and
     * the ones in his group.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoGroup()
    {
        return super.infoGroup();
    }

    /**
     * Retrieves all or part of the MarketPlaceApps in the pool. The MarketPlaceApps to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All MarketPlaceApps</li>
     * <li>{@link Pool#MINE}: Connected user's MarketPlaceApps</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's MarketPlaceApps, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group MarketPlaceApps</li>
     * <li>&gt;= 0 UID User's MarketPlaceApps</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(int filter, int startId, int endId)
    {
        return super.info(filter, startId, endId);
    }

    public Iterator<MarketPlaceApp> iterator()
    {
        AbstractList<MarketPlaceApp> ab = new AbstractList<MarketPlaceApp>()
        {
            public int size()
            {
                return getLength();
            }

            public MarketPlaceApp get(int index)
            {
                return (MarketPlaceApp) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the MarketPlaceApp with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the MarketPlaceApp to retrieve
     * @return The MarketPlaceApp with the given Id, or null if it was not found.
     */
    public MarketPlaceApp getById(int id)
    {
        return (MarketPlaceApp) super.getById(id);
    }
}
