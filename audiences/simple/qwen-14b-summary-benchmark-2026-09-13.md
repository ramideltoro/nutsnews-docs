---
title: "NutsNews 3B versus 14B summary screening"
description: "Historical screening results and their production limitations."
wiki:
  source_route: "/technical/qwen-14b-summary-benchmark-2026-09-13"
  simple_route: "/simple/qwen-14b-summary-benchmark-2026-09-13"
  slug: "qwen-14b-summary-benchmark-2026-09-13"
  primary_diagram:
    file: "diagrams/qwen-14b-summary-benchmark-2026-09-13.mmd"
    accTitle: "NutsNews 3B versus 14B summary screening decision"
    accDescr: "A small controlled model screening provides observations, but production stays unchanged until representative repeated chat tests and human review support a change."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 992
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-09-20T16:46:49.465Z"
    technical_source_hash: d0da882d60575828b3d158457a5d87c511d620f3ecac0c555bff4b42df6f4dcb
---
# NutsNews 3B versus 14B summary screening

The September 13, 2026 screening compared Qwen 3B and 14B on the same three factual story digests. Each story was tested once with two inference threads. This was a controlled generation test, not the exact production chat workflow.

14B generated about 3.30 tokens per second versus 14.82 for 3B, roughly 4.5 times slower. Only one of its three summaries met the required length; 3B met it for all three. The larger model improved some wording, but the mouse-study summary used promotional language and did not explicitly say human lifespan benefits were unproven. Three examples do not establish general accuracy.

Keep production on 3B and improve the current validation pipeline first. Healthy web responses during the test do not establish unaffected AI latency. No publishing or application settings changed. The 14B model was unloaded, while its downloaded files were retained.
