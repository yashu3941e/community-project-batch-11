# Security Specification — Plant Care Reminder Application

## 1. Data Invariants
1. Every document ID (`gardenId`, `plantId`, `activityId`) must match `^[a-zA-Z0-9_\-]+$` and stay within 128 characters.
2. A `Plant` document can only exist under an existing `Garden` workspace (`/gardens/{gardenId}`), with `data.gardenId == gardenId` and `data.id == plantId`.
3. `Plant` fields are strictly allowlisted (`hasAll` + `hasOnly`), preventing shadow/arbitrary fields.
4. Care frequencies (`wateringFrequencyDays`, `fertilizerFrequencyDays`, `pruningFrequencyDays`) must be integers in `[1, 365]`.
5. Dates (`plantingDate`, `lastWateredDate`, `nextWateringDate`, `lastFertilizedDate`, `nextFertilizingDate`, `lastPrunedDate`, `nextPruningDate`, `scheduledDate`, `completedDate`, `nextDueDate`) must strictly match `YYYY-MM-DD`.
6. Enumerations (`plantType`, `sunlightRequirement`, `activityType`) must match explicit allowlists.
7. An `ActivityLog` document must belong to `/gardens/{gardenId}` (`data.gardenId == gardenId`) and reference an existing `Plant` document or valid plant ID (`isValidId(data.plantId)`).
8. Updates on `Plant` and `Garden` preserve immutable identifiers (`id`, `gardenId`, `createdAt`).
9. Completed `ActivityLog` records are append-only historical logs (immutable after creation, deletable only during workspace reset or plant cleanup).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Path ID Poisoning**: Creating `/gardens/abc$invalid/plants/p1` with special characters or >128 char ID.
2. **Shadow Field Injection**: Creating a `Plant` containing an extra `"isAdmin": true` or `"__proto__": {}` key.
3. **Missing Required Field**: Creating a `Plant` without `nextWateringDate` or `sunlightRequirement`.
4. **Cross-Garden Spoofing**: Creating `/gardens/garden-a/plants/p1` with `gardenId: "garden-b"`.
5. **Document ID Mismatch**: Creating `/gardens/garden-a/plants/p1` with `id: "p2"`.
6. **Negative / Out-of-Range Frequency**: Creating a `Plant` with `wateringFrequencyDays: 0` or `9999`.
7. **Invalid Date Format**: Creating a `Plant` with `plantingDate: "11/17/2026"` instead of `YYYY-MM-DD`.
8. **Invalid Enum Value**: Creating a `Plant` with `sunlightRequirement: "UV Laser"`.
9. **Oversized String Exhaustion**: Creating a `Plant` with `notes` exceeding 500 characters or `name` exceeding 100 characters.
10. **Orphaned Plant Write**: Creating a `Plant` under `/gardens/nonexistent-garden/plants/p1` when parent `/gardens/nonexistent-garden` does not exist.
11. **Immutable Field Tampering**: Updating a `Plant` and attempting to change `createdAt` or `gardenId`.
12. **Activity Log Tampering**: Attempting to `update` an immutable `ActivityLog` entry after creation.
