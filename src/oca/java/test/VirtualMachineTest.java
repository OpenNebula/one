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
import org.opennebula.client.datastore.Datastore;
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
     *  Wait until the VM changes to the specified state.
     *  There is a time-out of 10 seconds.
    */
    void waitAssert(VirtualMachine vm, String state, String lcmState)
    {
        int n_steps     = 100;
        int step        = 100;

        int i = 0;

        vm.info();

        while( !( (vm.stateStr().equals(state) && (!state.equals("ACTIVE") || vm.lcmStateStr().equals(lcmState) ))|| i > n_steps ))
        {
            try{ Thread.sleep(step); } catch (Exception e){}

            vm.info();
            i++;
        }

        assertTrue( vm.stateStr().equals(state) );
        if(state.equals("ACTIVE"))
        {
            assertTrue( vm.lcmStateStr().equals(lcmState) );
        }
    }

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        vmPool      = new VirtualMachinePool(client);


        res = Host.allocate(client, "host_A",
                            "im_dummy", "vmm_dummy", "dummy");
        hid_A = Integer.parseInt( res.getMessage() );

        res = Host.allocate(client, "host_B",
                            "im_dummy", "vmm_dummy", "dummy");
        hid_B = Integer.parseInt( res.getMessage() );

        Datastore systemDs = new Datastore(0, client);
        systemDs.update("TM_MAD = dummy");
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
        waitAssert(vm, "DONE", "-");

        vm = null;
    }

    @Test
    public void allocate()
    {
        res = vmPool.info();
        assertTrue( !res.isError() );

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

        assertTrue( vm.getName().equals(name) );
    }

    @Test
    public void hold()
    {
        res = vm.hold();
        assertTrue( !res.isError() );
        waitAssert(vm, "HOLD", "-");
    }

    @Test
    public void release()
    {
        vm.hold();

        res = vm.release();
        assertTrue( !res.isError() );
        waitAssert(vm, "PENDING", "-");
    }

    @Test
    public void deploy()
    {
        res = vm.deploy(hid_A);
        assertTrue( !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void migrate()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.migrate(hid_B);
        assertTrue( !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void liveMigrate()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.liveMigrate(hid_B);
        assertTrue( !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void shutdown()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.shutdown();
        assertTrue( !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void cancel()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.cancel();
        assertTrue( !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void stop()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.stop();
        assertTrue( !res.isError() );
        waitAssert(vm, "STOPPED", "-");
    }

    @Test
    public void suspend()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.suspend();
        assertTrue( !res.isError() );
        waitAssert(vm, "SUSPENDED", "-");
    }

    @Test
    public void resume()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        vm.suspend();
        waitAssert(vm, "SUSPENDED", "-");

        res = vm.resume();
        assertTrue( !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void finalizeVM()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");
        res = vm.finalizeVM();

        assertTrue( !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void restart()
    {
        // TODO
    }

    @Test
    public void resubmit()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");
        res = vm.resubmit();

        assertTrue( !res.isError() );
        waitAssert(vm, "PENDING", "-");
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

//  TODO
//    @Test
    public void savedisk()
    {
        String template = "NAME = savedisk_vm\n"+
                          "MEMORY = 512\n" +
                          "CONTEXT = [DNS = 192.169.1.4]\n" +
                          "DISK = [ TYPE = fs, SIZE = 4, " +
                          "FORMAT = ext3, TARGET = sdg ]";

        res = VirtualMachine.allocate(client, template);
        int vmid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;

        vm = new VirtualMachine(vmid, client);

        res = vm.savedisk(0, "New_image");
        assertTrue( !res.isError() );
        assertTrue( res.getMessage().equals("0") );

        res = vm.info();
        assertTrue( !res.isError() );

        assertTrue( vm.xpath("TEMPLATE/DISK/SAVE_AS").equals(("0")) );

    }
}
