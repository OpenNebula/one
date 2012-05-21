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
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.host.Host;
import org.opennebula.client.host.HostPool;
import org.w3c.dom.Node;

public class HostTest
{
    class HostXML extends Host
    {
        public HostXML(Node node, Client client){ super(node, client); }
    }

    private static Host host;
    private static HostPool hostPool;
    private static Client client;
    private OneResponse res;
    private static String name = "new_test_host";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client   = new Client();
        hostPool = new HostPool(client);
    }

    /**
     * @throws java.lang.Exception
     */
    @AfterClass
    public static void tearDownAfterClass() throws Exception
    {
    }

    /**
     * @throws java.lang.Exception
     */
    @Before
    public void setUp() throws Exception
    {
        res = Host.allocate(client, name, "im_dummy", "vmm_dummy", "dummy");

        int hid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;
        host    = new Host(hid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        host.delete();
    }

    @Test
    public void allocate()
    {
        String name = "allocate_test";

        res = Host.allocate(client, name, "im_dummy", "vmm_dummy", "dummy");
        assertTrue( !res.isError() );
//        assertTrue( res.getMessage().equals("0") );

        hostPool.info();

        boolean found = false;
        for(Host h : hostPool)
        {
            found = found || h.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = host.info();
        assertTrue( !res.isError() );
        
//        assertTrue( host.getId().equals("0") );
        assertTrue( host.id() >= 0 );

//        assertTrue( host.shortStateStr().equals("on") );
    }

    @Test
    public void enable()
    {
        res = host.enable();
        assertTrue( !res.isError() );

        host.info();
        assertTrue( host.isEnabled() );
    }

    @Test
    public void disable()
    {
        res = host.disable();
        assertTrue( !res.isError() );

        host.info();
        assertTrue( !host.isEnabled() );
    }

    @Test
    public void delete()
    {
        String name = host.getName();

        res = host.delete();
        assertTrue( !res.isError() );

        res = host.info();
        assertTrue( res.isError() );

        res = hostPool.info();
        assertTrue( !res.isError() );

        boolean found = false;
        for(Host h : hostPool)
        {
            found = found || h.getName().equals(name);
        }

        assertTrue( !found );
    }

    @Test
    public void update()
    {
        res = host.info();
        assertTrue( !res.isError() );

        assertTrue( host.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( host.xpath("TEMPLATE/ATT2").equals( "" ) );

        String new_template =  "ATT2 = NEW_VAL\n" +
                        "ATT3 = VAL3";

        res = host.update(new_template);
        assertTrue( !res.isError() );


        res = host.info();
        assertTrue( !res.isError() );
        assertTrue( host.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( host.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( host.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

/*
    @Test
    public void attributes()
    {
        DocumentBuilder builder;
        Document        doc;
        Element         xml;

        try
        {
            builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();

            doc = builder.parse( new File("./fixtures/host.xml") );
            xml = doc.getDocumentElement();

            host = new HostXML(xml, client);

            assertTrue( host.xpath("ID").equals("7") );
            assertTrue( host.xpath("NAME").equals("dummyhost") );
            assertTrue( host.xpath("STATE").equals("2") );
            assertTrue( host.xpath("IM_MAD").equals("im_dummy") );
            assertTrue( host.xpath("LAST_MON_TIME").equals("1277733596") );
            assertTrue( host.xpath("HOST_SHARE/MEM_USAGE").equals("1572864") );
            assertTrue( host.xpath("HOST_SHARE/CPU_USAGE").equals("300") );
            assertTrue( host.xpath("HOST_SHARE/FREE_CPU").equals("800") );
            assertTrue( host.xpath("HOST_SHARE/RUNNING_VMS").equals("3") );
            assertTrue( host.xpath("TEMPLATE/CPUSPEED").equals("2.2GHz") );
            assertTrue( host.xpath("TEMPLATE/HYPERVISOR").equals("dummy") );
            assertTrue( host.xpath("TEMPLATE/TOTALMEMORY").equals("16777216") );

        } catch (Exception e)
        {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
*/
}
