/*******************************************************************************
 * Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.template;

import java.util.AbstractList;
import java.util.Iterator;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Template pool.
 * It also offers static XML-RPC call wrappers.
 */
public class TemplatePool extends Pool implements Iterable<Template>
{
    private static final String ELEMENT_NAME = "VMTEMPLATE";
    private static final String INFO_METHOD  = "templatepool.info";

    private int filter;

    /**
     * Creates a new Template pool with the default filter flag value
     * set to 0 (Templates belonging to user with UID 0)
     *
     * @param client XML-RPC Client.
     *
     * @see TemplatePool#TemplatePool(Client, int)
     */
    public TemplatePool(Client client)
    {
        super(ELEMENT_NAME, client);
        this.filter = 0;
    }

    /**
     * Creates a new Template pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link TemplatePool#info()}. Possible values:
     * <ul>
     * <li><= -2: All Templates</li>
     * <li>-1: Connected user's Templates and public ones</li>
     * <li>>= 0: UID User's Templates</li>
     * </ul>
     */
    public TemplatePool(Client client, int filter)
    {
        super(ELEMENT_NAME, client);
        this.filter = filter;
    }

    /* (non-Javadoc)
     * @see org.opennebula.client.Pool#factory(org.w3c.dom.Node)
     */
    @Override
    public PoolElement factory(Node node)
    {
        return new Template(node, client);
    }

    /**
     * Retrieves all or part of the templates in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link TemplatePool#info()}. Possible values:
     * <ul>
     * <li><= -2: All Templates</li>
     * <li>-1: Connected user's Templates and public ones</li>
     * <li>>= 0: UID User's Templates</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return client.call(INFO_METHOD, filter);
    }

    /**
     * Loads the xml representation of all or part of the
     * Templates in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see TemplatePool#info(Client, int)
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, filter);
        super.processInfo(response);
        return response;
    }

    public Iterator<Template> iterator()
    {
        AbstractList<Template> ab = new AbstractList<Template>()
        {
            public int size()
            {
                return getLength();
            }

            public Template get(int index)
            {
                return (Template) item(index);
            }
        };

        return ab.iterator();
    }
}
