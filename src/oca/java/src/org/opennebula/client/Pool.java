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
package org.opennebula.client;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Node;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

/**
 * Represents a generic OpenNebula Pool in XML format
 * and provides the basic functionality to handle the Pool elements.
 */
public abstract class Pool{

    protected Client client;

    protected String   elementName;
    protected NodeList poolElements;

    /**
     * Sets the Pool attributes.
     * @param elementName Name of the PoolElement's xml element
     * @param client XML-RPC client which will handle calls
     */
    protected Pool(String elementName, Client client)
    {
        this.elementName = elementName;
        this.client      = client;
    }

    /**
     * The factory method returns a suitable PoolElement object from
     * an XML node. Each Pool must implement the corresponding factory method.
     *
     * @param node XML Dom node to build the PoolElement from
     * @return The corresponding PoolElement
     */
    public abstract PoolElement factory(Node node);

    /**
     * After a *pool.info call, this method builds the internal xml
     * representation of the pool.
     * @param info The XML-RPC *pool.info response
     */
    public void processInfo(OneResponse info)
    {
        if (info.isError())
        {
            return;
        }

        try
        {
            DocumentBuilder builder;
            Document        doc;
            Element         xml;

            builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            doc = builder.parse(
                new ByteArrayInputStream(info.getMessage().getBytes()));
            xml = doc.getDocumentElement();

            poolElements = xml.getElementsByTagName(elementName);
        }
        catch (ParserConfigurationException e) {}
        catch (SAXException e) {}
        catch (IOException e) {}
    }

    /**
     * Returns the indexth element in the pool. If index is greater than or
     * equal to the number of elements in the pool, this returns null.
     *
     * @param index Index of the element.
     * @return The element at the indexth position in the pool, or
     * null if that is not a valid index.
     */
    public PoolElement item(int index)
    {
        PoolElement theElement = null;

        if (poolElements != null)
        {
            Node node = poolElements.item(index);

            if (node != null)
            {
                theElement = factory(node);
            }
        }

        return theElement;
    }

    protected PoolElement getById(int id)
    {
        // TODO: Use xpath to find the element /<elementName>/ID

        PoolElement theElement = null;
        PoolElement tmpElement = null;

        for( int i = 0; i < getLength(); i++ )
        {
            tmpElement = item(i);
            if( tmpElement.id() == id )
            {
                theElement = tmpElement;
                break;
            }
        }

        return theElement;
    }

    /**
     * The number of elements in the pool.
     * @return The number of elements in the pool.
     */
    public int getLength()
    {
        return poolElements == null ? 0 : poolElements.getLength();
    }
}
