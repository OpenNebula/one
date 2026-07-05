# Release Notes for PCI Group Scheduling Extension

## Feature: SR-IOV vNICs Antiaffinity

- Extended PCI group scheduling to support affinity/antiaffinity based on PCI address.
- Added `PARENT_PCI` attribute to PCI devices to identify the physical NIC.
- Scheduling policy now ensures that antiaffinity vNICs are allocated on different physical NICs.
- Backward compatible: existing PCI groups without parent attribute work as before.

## Usage

In the PCI group definition, set `USE_PARENT=YES` and specify `ANTIAFFINITY` with PCI addresses.
The scheduler will place those addresses on different physical NICs.

## Known Issues

- Parent PCI address must be explicitly set in the host datastore.
- Affinity/Antiaffinity with mixed parent and non-parent devices is not supported.
