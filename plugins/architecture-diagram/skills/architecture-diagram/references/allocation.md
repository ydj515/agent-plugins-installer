# Resource Allocation Rules

## Allocation Table

Default columns: status, environment, role/instance, resource ID and name, network, quantity, CPU, memory, local disk, shared storage, OS, notes/items to confirm, source. Mark specs missing from the input as `not specified`. For a new design without an existing resource list, create proposed resource IDs and mark the source as user requirements or design assumptions.

Each row is either an individual instance or a clearly defined quantity group with identical specs. For quantity groups, state in the column header whether specs are per unit or for the whole group. If one resource serves multiple roles, record its allocation once and link it to multiple roles.

Example data shape (illustrative only; use input values in actual results):

```json
{
  "resources": [{
    "id": "r1", "name": "source-01", "kind": "vm", "quantity": 1,
    "network": "internal", "cpu": 4, "memoryGB": 16,
    "localDiskGB": 100, "sanGB": null,
    "source": {"file": "resources.xlsx", "sheet": "Resources", "row": 5}
  }],
  "allocations": [{
    "id": "a1", "resourceId": "r1", "quantity": 1,
    "environment": "production", "role": "Application", "network": "internal",
    "cpu": 4, "memoryGB": 16, "localDiskGB": 100, "sanGB": null,
    "status": "proposed", "reason": "Assigned to the role requested by the user"
  }],
  "nodes": [{"id": "app", "allocationIds": ["a1"], "label": "Application"}],
  "edges": []
}
```

## Calculation and Preservation

- `null` means unknown; `0` means a confirmed zero. For totals that include unknown values, show the confirmed partial total together with the number of missing items.
- For per-unit specs, `row total = quantity × per-unit spec`. Do not multiply a value that is already a group total by the quantity again.
- Do not sum or convert physical cores, vCores, and vCPUs into one unit without confirmation. Distinguish GB/GiB and TB/TiB as well, and state the basis when converting.
- Derive environment subtotals and the grand total from non-duplicated allocation data. Count physical servers, VMs, containers, and network devices separately.
- Compute `remaining = confirmed capacity − allocated amount` in the same unit and scope. If negative, do not hide it as 0; show it as over-allocation. Distinguish remaining resource counts from remaining capacity.
- Manage a shared SAN as a pool with a unique ID, and do not add its capacity again just because multiple servers are attached to it. Distinguish individual allocations from pool capacity.
- When capacity from one resource pool is allocated to multiple roles, preserve the pool reference and its capacity limit. Do not automatically treat multiple references to a resource ID as an error; check whether the sharing is intended and verify the summed capacity.
- Keep proposed specs separate from specs confirmed in the input. Do not arbitrarily split physical resources as if they were VMs.
- Without known capacity or virtualization limits, do not conclude whether over-commit is possible. Calculate utilization or headroom only when the denominator can be confirmed.

## Allocation Decisions

Apply the environments, networks, roles, and minimum specs set by the user first. When available resources are given, allocate within them and show shortfalls and remainders. For a new design with no available capacity given, propose the required resources but do not calculate remaining capacity or utilization. Do not invent unnecessary roles just to use up all resources. Write newly designed allocations with proposed status, and do not change any real system.

Do not automatically apply quantities such as 2 production / 1 staging, Active-Active, DB replication, L4/VIP, or direct access to the staging environment unless the input supports them. A resource list alone cannot prove communication paths, so draw connections only as evidenced flows or explicit proposals.

## Semantic Verification Cases

- Two resources with 4 vCPU each total 8 vCPU; counting both the two individual rows and a group row at the same time is a failure.
- One unit with 16 GB memory and one unit with unspecified memory gives `16 GB confirmed, 1 unit unknown`, not a confirmed total of 16 GB.
- A 1000 GB shared pool attached to two servers is still 1000 GB of capacity.
- Allocating 10 vCPU against 8 vCPU of capacity is `2 vCPU over-allocated`.
- A VM that hosts both WEB and WAS roles counts as one VM.
- When proposing an 8 vCPU server without known capacity, show 8 and the proposed status in the card and allocation table, and do not show remaining capacity or utilization.
