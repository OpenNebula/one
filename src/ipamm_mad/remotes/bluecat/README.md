# BlueCat IPAM Driver

This is a BlueCat-backed OpenNebula IPAM driver. Mock mode is available for local testing. Non-mock mode has been validated end-to-end against a real BlueCat BAM REST v2 environment.

## Architecture and Authentication

OpenNebula invokes one script per IPAM action, passing a request ID as `$1` and base64-encoded XML on standard input. Shared configuration, logging, REST, and error helpers are in `common.sh`. Logs default to `/tmp/bluecat-ipam.log`; `BLUECAT_LOG` overrides the path.

The validated REST v2 authentication flow is:

1. `POST /api/v2/sessions` with the configured username and password.
2. Extract `basicAuthenticationCredentials`.
3. Use that credential for Basic authorization on subsequent REST v2 calls.

Each real-mode action establishes a fresh session before its API operations. Credentials are not cached or reused across separate IPAM action executions. There is no automatic HTTP 401 retry or re-authentication within a single action.

## Supported Actions

| Script | Current behavior and validation |
| --- | --- |
| `register_address_range` | Validates and reuses an existing network when `BLUECAT_NETWORK_ID` is supplied in the AR or config. Registration against an existing BlueCat network has been validated. Creating a network under `BLUECAT_PARENT_BLOCK_ID` (or the `BLUECAT_BLOCK_ID` fallback) is site-policy-sensitive and requires separate production validation. |
| `unregister_address_range` | `BLUECAT_UNREGISTER_ACTION=keep` is validated and recommended: removing the OpenNebula AR keeps the existing BlueCat network. `delete` attempts network deletion, is separate from the default tested lifecycle, and requires site validation. |
| `get_address` | Supports normal/dynamic single-address allocation. It finds an address inside the OpenNebula AR reported as `UNASSIGNED`, reserves it in BlueCat, and returns it to OpenNebula. |
| `allocate_address` | Reserves the exact single IP requested/selected by OpenNebula. Explicit `ADDRESS/IP` is supported. It must be inside the AR and `UNASSIGNED`; an already reserved requested IP is rejected rather than replaced with another IP. |
| `free_address` | Releases the exact BlueCat reservation. After successful release, the address returns to `UNASSIGNED`. |

## Validation Status

### Mock Validation

Mock mode makes no BlueCat calls and remains available for local lifecycle testing. AR registration/removal, dynamic and fixed allocation, and release flows have been exercised.

### Real-Environment Validation

The following workflows have been validated end-to-end against a real BlueCat BAM REST v2 environment:

- BlueCat REST v2 authentication and session creation.
- Address Range registration using an existing `BLUECAT_NETWORK_ID`.
- Address Range removal with `BLUECAT_UNREGISTER_ACTION=keep`.
- Address Range remove/re-add while reusing the existing BlueCat network.
- Normal/dynamic VM address allocation.
- Explicit requested-IP allocation.
- Address allocation through VM and NIC workflows.
- Rejection when the requested IP is already reserved.
- VM termination releasing the associated BlueCat reservation.
- VM undeploy/resume preserving the existing reservation.
- `onevnet hold` reserving an address in BlueCat.
- `onevnet release` releasing the corresponding BlueCat reservation.

These tests cover the primary OpenNebula IPAM lifecycle expected by the current driver implementation. Broader production validation may still be required depending on the BlueCat BAM version, network ownership policy, and site-specific configuration.

## Configuration

The default config location is `/etc/one/bluecat_ipam.conf`. For development/testing, set `BLUECAT_CONFIG` to override it. Never commit credentials, tokens, passwords, authorization values, or secret-bearing URLs.

```bash
BLUECAT_MOCK=no
BLUECAT_URL=https://bluecat.example.com
BLUECAT_USER=api-user
BLUECAT_PASS=api-password
BLUECAT_VERIFY_TLS=yes
BLUECAT_UNREGISTER_ACTION=keep

# Optional/default network information depending on AR configuration
BLUECAT_NETWORK_ID=12345
BLUECAT_PARENT_BLOCK_ID=67890
BLUECAT_NETWORK_NAME=opennebula-network
```

- `BLUECAT_MOCK`: `yes` disables BlueCat calls; `no` enables REST v2. Default: `no`.
- `BLUECAT_URL`: BAM base URL.
- `BLUECAT_USER`, `BLUECAT_PASS`: used to create a REST v2 session, not directly as Basic credentials for later calls.
- `BLUECAT_VERIFY_TLS`: certificate verification; defaults to `yes`. Use `no` only in an approved lab.
- `BLUECAT_UNREGISTER_ACTION`: `keep` retains the network and is the recommended behavior; `delete` requests deletion.
- `BLUECAT_NETWORK_ID`: default existing network; an AR-provided value takes precedence where supported.
- `BLUECAT_PARENT_BLOCK_ID`: parent for network creation; `BLUECAT_BLOCK_ID` is a fallback.
- `BLUECAT_NETWORK_NAME`: optional name for a driver-created network.
- `BLUECAT_CONFIG`: environment override for the config path.
- `BLUECAT_LOG`: environment override for the log path.

Real mode requires `curl` and `jq`. Recommended config permissions:

```bash
chown root:oneadmin /etc/one/bluecat_ipam.conf
chmod 640 /etc/one/bluecat_ipam.conf
```

## Installation and HA Deployment

Driver location: `/var/lib/one/remotes/ipam/bluecat/`

Required runtime files:

- `common.sh`
- `register_address_range`
- `unregister_address_range`
- `get_address`
- `allocate_address`
- `free_address`

For HA front ends, deploy the same driver version and `/etc/one/bluecat_ipam.conf` to every FE capable of becoming leader. Runtime backup, editor-swap, `.orig`, and debug files are not part of deployment.

```bash
chown oneadmin:oneadmin \
  register_address_range unregister_address_range \
  get_address allocate_address free_address common.sh

chmod 770 \
  register_address_range unregister_address_range \
  get_address allocate_address free_address

chmod 660 common.sh
```

### Enable the IPAM Driver

After installing the driver files, add `bluecat` to the IPAM MAD configuration in `/etc/one/oned.conf`.

Locate the `IPAM_MAD_CONF` entry and include `bluecat` in the `ARGUMENTS` list.

For example:

```text
IPAM_MAD_CONF = [
    EXECUTABLE = "one_ipam",
    ARGUMENTS  = "-t 1 -i dummy,aws,equinix,vultr,scaleway,bluecat"
]
```

Preserve any existing IPAM drivers already present in the configuration; only add `bluecat` to the list.

After changing `/etc/one/oned.conf`, restart the OpenNebula service on the active Front-end:

```bash
systemctl restart opennebula
```

Verify that the IPAM MAD was started with the BlueCat driver enabled:

```bash
ps -ef | grep '[o]ne_ipam'
```

The process arguments should include `bluecat`, for example:

```text
one_ipam.rb -t 1 -i dummy,aws,equinix,vultr,scaleway,bluecat
```

In an HA Front-end deployment, keep the relevant `oned.conf` IPAM MAD configuration consistent across Front-ends while preserving node-specific HA settings such as `SERVER_ID`.

## Mock Mode

```bash
BLUECAT_MOCK=yes
BLUECAT_NETWORK_ID=mock-network
```

Mock mode returns OpenNebula-compatible responses without BlueCat calls: AR registration echoes an AR definition, allocation actions return mock address results, and release/unregister actions succeed after logging.

## Testing

Shell syntax validation:

```bash
bash -n common.sh register_address_range unregister_address_range get_address allocate_address free_address
```

For mock testing:

```bash
export BLUECAT_CONFIG=/tmp/bluecat_ipam.conf
export BLUECAT_LOG=/tmp/bluecat-ipam-test.log
```

Put `BLUECAT_MOCK=yes` in the temporary config. Invoke actions as OpenNebula does: pass request ID `$1`, provide base64 action XML on stdin, check stdout, and inspect the log.

Non-mock smoke-test checklist:

1. Register/reuse an AR with an existing BlueCat network.
2. Perform a normal VM allocation.
3. Allocate an explicit IP.
4. Confirm collision with a reserved IP is rejected.
5. Run `onevnet hold` and `onevnet release`.
6. Undeploy/resume and confirm the reservation remains.
7. Terminate and confirm the reservation is released.
8. Unregister with `keep` and confirm the BlueCat network remains.

## Current Limitations

- Validated against a real BAM REST v2 environment; broader production/site validation is still required across other BlueCat versions and deployments.
- Multi-address reservations and `SIZE > 1` are not fully supported.
- BlueCat network creation/deletion is site-policy-sensitive.
- `BLUECAT_UNREGISTER_ACTION=keep` is the validated/recommended current lifecycle.
- No background/persistent reconciliation exists between historical OpenNebula leases and BlueCat state.
- Availability relies on BlueCat reporting `UNASSIGNED`.
- Each action creates a fresh session; there is no shared session cache.
- No automatic 401 retry exists within an action.
