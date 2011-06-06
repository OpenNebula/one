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

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Node;

/**
 * Represents a generic element of a Pool in
 * XML format.
 *
 */
public abstract class PoolElement {

    protected static XPath xpath;

    protected int    id;
    protected Node   xml;

    protected Client client;

    /**
     * Creates a new PoolElement with the specified attributes.
     * @param id Id of the element.
     * @param client XML-RPC Client.
     */
    protected PoolElement(int id, Client client)
    {
        if(xpath == null)
        {
            XPathFactory factory = XPathFactory.newInstance();
            xpath = factory.newXPath();
        }

        this.id     = id;
        this.client = client;
    }

    /**
     * Creates a new PoolElement from the xml provided.
     * 
     * @param client XML-RPC Client.
     * @param xmlElement XML representation of the element.
     */
    protected PoolElement(Node xmlElement, Client client)
    {
        if(xpath == null)
        {
            XPathFactory factory = XPathFactory.newInstance();
            xpath = factory.newXPath();
        }

        this.xml    = xmlElement;
        this.client = client;
        this.id     = Integer.parseInt(xpath("ID"));
    }

    /**
     * After a *.info call, this method builds the internal xml
     * representation of the pool.
     * @param info The XML-RPC *.info response
     */
    protected void processInfo(OneResponse info)
    {
        if (info.isError())
        {
            return;
        }

        try
        {
            DocumentBuilder builder =
                DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document doc = builder.parse(
                new ByteArrayInputStream(info.getMessage().getBytes()));

            xml = doc.getDocumentElement();
        }
        catch (Exception e) {}
    }

    /**
     * Returns the element's ID.
     * @return the element's ID.
     */
    public String getId()
    {
      return Integer.toString(id);
    }

    public int id()
    {
        return id;
    }

    /**
     * Returns the element's name.
     * @return the element's name.
     */
    public String getName()
    {
        return xpath("NAME");
    }

    /**
     * Performs an xpath evaluation for the "state" expression.
     * @return The value of the STATE element.
     */
    public int state()
    {
        String state = xpath("STATE");

        return state != null ? Integer.parseInt( state ) : -1;
    }

    /**
     * Returns the owner User's ID, or -1 if the element doesn't have one.
     * 
     * @return the owner User's ID, or -1 if the element doesn't have one.
     */
    public int uid()
    {
        String uid = xpath("UID");

        return uid != null ? Integer.parseInt( uid ) : -1;
    }

    /**
     * Returns the element group's ID, or -1 if the element doesn't have one.
     * 
     * @return the element group's ID, or -1 if the element doesn't have one.
     */
    public int gid()
    {
        String gid = xpath("GID");

        return gid != null ? Integer.parseInt( gid ) : -1;
    }

    /**
     * Evaluates an XPath expression and returns the result as a String.
     * If the internal xml representation is not built, returns null. The
     * subclass method info() must be called before.
     *
     * @param expression The XPath expression.
     * @return The String that is the result of evaluating the
     * expression and converting the result to a String. Null if
     * the internal xml representation is not built.
     */
    public String xpath(String expression)
    {
        String result = null;

        try
        {
          result = xpath.evaluate(expression, xml);
        }
        catch (XPathExpressionException e) {}

        return result;
    }
}
