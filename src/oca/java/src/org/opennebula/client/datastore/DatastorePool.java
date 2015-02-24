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
package org.opennebula.client.datastore;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula datastore pool.
 * It also offers static XML-RPC call wrappers.
 */
public class DatastorePool extends Pool implements Iterable<Datastore>{

    private static final String ELEMENT_NAME = "DATASTORE";
    private static final String INFO_METHOD  = "datastorepool.info";

    /**
     * Creates a new datastore pool
     * @param client XML-RPC Client.
     */
    public DatastorePool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new Datastore(node, client);
    }

    /**
     * Retrieves all the datastores in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client)
    {
        return Pool.info(client, INFO_METHOD);
    }

    /**
     * Loads the xml representation of the datastore pool.
     *
     * @see DatastorePool#info(Client)
     */
    public OneResponse info()
    {
        return super.info();
    }

    public Iterator<Datastore> iterator()
    {
        AbstractList<Datastore> ab = new AbstractList<Datastore>()
        {
            public int size()
            {
                return getLength();
            }

            public Datastore get(int index)
            {
                return (Datastore) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Datastore with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the Datastore to retrieve
     * @return The Image with the given Id, or null if it was not found.
     */
    public Datastore getById(int id)
    {
        return (Datastore) super.getById(id);
    }
}
