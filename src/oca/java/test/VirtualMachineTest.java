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
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.host.Host;
import org.opennebula.client.vm.VirtualMachine;
import org.opennebula.client.vm.VirtualMachinePool;


public class VirtualMachineTest
{

    private static VirtualMachine vm;
    private static VirtualMachinePool vmPool;

    private static Client client;

    private static int hid_A, hid_B;
    
    private static OneResponse res;
    private static String name = "new_test_machine";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        vmPool      = new VirtualMachinePool(client);


        res = Host.allocate(client, "host_A",
                            "im_dummy", "vmm_dummy", "tm_dummy");
        hid_A = Integer.parseInt( res.getMessage() );

        res = Host.allocate(client, "host_B",
                            "im_dummy", "vmm_dummy", "tm_dummy");
        hid_B = Integer.parseInt( res.getMessage() );
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
        String template = "NAME = " + name + "\n"+
                          "MEMORY = 512\n" +
                          "CONTEXT = [DNS = 192.169.1.4]";

        res = VirtualMachine.allocate(client, template);
        int vmid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;

        vm = new VirtualMachine(vmid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vm.finalizeVM();
    }

    @Test
    public void allocate()
    {
//        String template = "NAME = " + name + "\n"+
//                          "MEMORY = 512\n" +
//                          "CONTEXT = [DNS = 192.169.1.4]";
//
//        res = VirtualMachine.allocate(client, template);
//        assertTrue( !res.isError() );
//        assertTrue( res.getMessage().equals("0") );

        vmPool.info();

        boolean found = false;
        for(VirtualMachine vm : vmPool)
        {
            found = found || vm.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void update()
    {
        res = vm.info();
        assertTrue( !res.isError() );

//        assertTrue( vm.getId().equals("0") );
//        assertTrue( vm.id() == 0 );
        assertTrue( vm.getName().equals(name) );
    }

    @Test
    public void hold()
    {
        res = vm.hold();
        assertTrue( !res.isError() );
    }

    @Test
    public void release()
    {
        vm.hold();

        res = vm.release();
        assertTrue( !res.isError() );
    }

    @Test
    public void deploy()
    {
        res = vm.deploy(hid_A);
        assertTrue( !res.isError() );
    }

    @Test
    public void migrate()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.migrate(hid_B);
        assertTrue( !res.isError() );
    }

    @Test
    public void liveMigrate()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.liveMigrate(hid_B);
        assertTrue( !res.isError() );
    }

    @Test
    public void shutdown()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.shutdown();
        assertTrue( !res.isError() );        
    }

    @Test
    public void cancel()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.cancel();
        assertTrue( !res.isError() );
    }

    @Test
    public void stop()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.stop();
        assertTrue( !res.isError() );
    }

    @Test
    public void suspend()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.suspend();
        assertTrue( !res.isError() );
    }

    @Test
    public void resume()
    {
        vm.deploy(hid_A);
        try{ Thread.sleep(5000); } catch (Exception e){}
        vm.suspend();
        try{ Thread.sleep(5000); } catch (Exception e){}

        res = vm.resume();
        assertTrue( !res.isError() );
    }

    @Test
    public void finalize()
    {
        res = vm.finalizeVM();
        assertTrue( !res.isError() );
    }

    @Test
    public void restart()
    {
        // TODO
    }

    @Test
    public void attributes()
    {
        res = vm.info();
        assertTrue( !res.isError() );

        assertTrue( vm.xpath("NAME").equals(name) );
        assertTrue( vm.xpath("TEMPLATE/MEMORY").equals("512") );
//        assertTrue( vm.xpath("ID").equals("0") );
        assertTrue( vm.xpath("TEMPLATE/MEMORY").equals("512") );
        assertTrue( vm.xpath("TEMPLATE/CONTEXT/DNS").equals("192.169.1.4") );
    }
}
