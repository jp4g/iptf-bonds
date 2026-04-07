---
name: No fallback addresses
description: Never use AztecAddress.zero() or canonical defaults as fallbacks — fail hard if config is missing
type: feedback
---

Never use `AztecAddress.zero()` or canonical/default addresses as fallbacks for missing config. If an address (FPC, stablecoin, etc.) isn't found in env vars, throw an error immediately.

**Why:** The user wants explicit failures rather than silent misconfiguration. A zero address or canonical FPC would mask setup issues and lead to confusing runtime errors.

**How to apply:** Any code that reads contract addresses from env/config should throw if the value is empty/missing. No ternary fallbacks to zero addresses.
