---
title: "NutsNews summary screening: Qwen 2.5 3B versus 7B"
description: "Historical screening results and their production limitations."
wiki:
  source_route: "/technical/qwen-summary-benchmark-2026-09-13"
  simple_route: "/simple/qwen-summary-benchmark-2026-09-13"
  slug: "qwen-summary-benchmark-2026-09-13"
  primary_diagram:
    file: "diagrams/qwen-summary-benchmark-2026-09-13.mmd"
    accTitle: "NutsNews summary screening: Qwen 2.5 3B versus 7B decision"
    accDescr: "A small controlled model screening provides observations, but production stays unchanged until representative repeated chat tests and human review support a change."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 991
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-09-20T16:46:49.908Z"
    technical_source_hash: aa66a4c3dd48390d07290fb2cdd82c5e851d531761c87ac84378acae81bf817e
---
# NutsNews summary screening: Qwen 2.5 3B versus 7B

Three story digests were tested once with Qwen 3B and 7B on September 13, 2026. This used a controlled generation test, not the exact production chat workflow. Production stayed on its existing model.

3B produced about 14.7 tokens per second, compared with about 7.0 for 7B. All three 3B summaries met the 200–250 character limit; none of the 7B summaries did. The small manual review found factual weaknesses in both models and no clear overall advantage for 7B.

Health requests succeeded during the test, but that does not prove unchanged publishing speed or AI queue latency. The test model was unloaded afterward. Keep production unchanged, improve summary validation first, and require repeated production-chat tests and human review before considering a model switch.
