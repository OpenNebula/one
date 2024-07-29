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
package org.opennebula.client.document;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;

/**
 * <p>
 * This class represents an OpenNebula Document pool.
 * </p>
 * Documents are generic objects. You can dynamically create new Pools in
 * OpenNebula, creating subclasses with different TYPE values.
 * <br>
 * TYPE must be the same for the corresponding pool element, see {@link Document}
 * <br>
 * For example:
 * <pre>
 * <code>
 * public class GenericObjAPool extends DocumentPool implements Iterable{@code <GenericObjA> }
 * {
 *     private static final int TYPE = 200;
 *
 *     protected int type()
 *     {
 *         return TYPE;
 *     }
 *
 *     public GenericObjAPool(Client client)
 *     {
 *         super(client);
 *     }
 *
 *     public GenericObjAPool(Client client, int filter)
 *     {
 *         super(client, filter);
 *     }
 *
 *     public GenericObjA factory(Node node)
 *     {
 *         return new GenericObjA(node, client);
 *     }
 *
 *     {@code public Iterator<GenericObjA> iterator()}
 *     {
 *         {@code AbstractList<GenericObjA> ab = new AbstractList<GenericObjA>()}
 *         {
 *             public int size()
 *             {
 *                 return getLength();
 *             }
 *
 *             public GenericObjA get(int index)
 *             {
 *                 return (GenericObjA) item(index);
 *             }
 *         };
 *
 *         return ab.iterator();
 *     }
 * }
 * </code>
 * </pre>
 */
public abstract class DocumentPool extends Pool
{
    private static final String ELEMENT_NAME = "DOCUMENT";
    private static final String INFO_METHOD  = "documentpool.info";

    private final int filter;

    protected abstract int type();

    /**
     * Creates a new Document pool with the default filter flag value
     * set to {@link Pool#MINE_GROUP} (Document belonging to the connected user,
     * and the ones in his group)
     *
     * @param client XML-RPC Client.
     *
     * @see DocumentPool#DocumentPool(Client, int)
     */
    public DocumentPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = MINE_GROUP;
    }

    /**
     * Creates a new Document pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use by default in the method
     * {@link DocumentPool#info()}. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Documents</li>
     * <li>{@link Pool#MINE}: Connected user's Documents</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Documents, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Documents</li>
     * <li>&gt;= 0 UID User's Documents</li>
     * </ul>
     */
    public DocumentPool(Client client, int filter)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = filter;
    }

    /**
     * Loads the xml representation of all or part of the
     * Documents in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see DocumentPool#info
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response =
                xmlrpcInfo(client, infoMethod, filter, -1, -1, type());
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the Documents in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoAll()
    {
        OneResponse response =
                xmlrpcInfo(client, infoMethod, ALL, -1, -1, type());
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Documents.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoMine()
    {
        OneResponse response =
                xmlrpcInfo(client, infoMethod, MINE, -1, -1, type());
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Documents and
     * the ones in his group.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoGroup()
    {
        OneResponse response =
                xmlrpcInfo(client, infoMethod, MINE_GROUP, -1, -1, type());
        processInfo(response);
        return response;
    }

    /**
     * Retrieves all or part of the Documents in the pool. The Documents to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Documents</li>
     * <li>{@link Pool#MINE}: Connected user's Documents</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Documents, and the ones in
     * his group</li>
     * <li>{@link Pool#GROUP}: User's primary group Documents</li>
     * <li>&gt;= 0 UID User's Documents</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(int filter, int startId, int endId)
    {
        OneResponse response =
                xmlrpcInfo(client, infoMethod, filter, startId, endId, type());
        processInfo(response);
        return response;
    }

    /**
     * Returns the Document with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the ACl rule to retrieve
     * @return The Document with the given Id, or null if it was not found.
     */
    public Document getById(int id)
    {
        return (Document) super.getById(id);
    }
}
