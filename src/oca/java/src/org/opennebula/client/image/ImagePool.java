/*******************************************************************************
 * Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.image;

import java.util.AbstractList;
import java.util.Iterator;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.opennebula.client.vm.VirtualMachinePool;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Image pool.
 * It also offers static XML-RPC call wrappers.
 */
public class ImagePool extends Pool implements Iterable<Image>
{
    private static final String ELEMENT_NAME = "IMAGE";
    private static final String INFO_METHOD  = "imagepool.info";

    private int filter;

    /**
     * Creates a new Image pool with the default filter flag value
     * set to 0 (Images belonging to user with UID 0)
     * 
     * @param client XML-RPC Client.
     * 
     * @see VirtualMachinePool#VirtualMachinePool(Client, int)
     */
    public ImagePool(Client client)
    {
        super(ELEMENT_NAME, client);
        this.filter = 0;
    }

    /**
     * Creates a new Image pool.
     * 
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link ImagePool#info()}. Possible values:
     * <ul>
     * <li><= -2: All Images</li>
     * <li>-1: Connected user's Images</li>
     * <li>>= 0: UID User's VMs</li>
     * </ul>
     */
    public ImagePool(Client client, int filter)
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
        return new Image(node, client);
    }

    /**
     * Retrieves all or part of the images in the pool.
     *  
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link ImagePool#info()}. Possible values:
     * <ul>
     * <li><= -2: All Images</li>
     * <li>-1: Connected user's Images</li>
     * <li>>= 0: UID User's VMs</li>
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
     * Images in the pool. The filter used is the one set in
     * the constructor.
     * 
     * @see ImagePool#info(Client, int)
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

    public Iterator<Image> iterator()
    {
        AbstractList<Image> ab = new AbstractList<Image>()
        {
            public int size()
            {
                return getLength();
            }

            public Image get(int index)
            {
                return (Image) item(index);
            }
        };

        return ab.iterator();
    }
}
