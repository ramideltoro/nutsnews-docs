---
title: "Eight-thread NutsNews benchmark"
description: "Historical screening results and their production limitations."
wiki:
  source_route: "/technical/qwen-eight-thread-benchmark-2026-09-13"
  simple_route: "/simple/qwen-eight-thread-benchmark-2026-09-13"
  slug: "qwen-eight-thread-benchmark-2026-09-13"
  primary_diagram:
    file: "diagrams/qwen-eight-thread-benchmark-2026-09-13.mmd"
    accTitle: "Eight-thread NutsNews benchmark decision"
    accDescr: "A small controlled model screening provides observations, but production stays unchanged until representative repeated chat tests and human review support a change."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 994
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-09-20T16:46:49.760Z"
    technical_source_hash: 5ecc7d71d77a5611943b19a398f6cdbf90ca7e02f36e8483da7eaa4f7efd60f4
---
# Eight-thread NutsNews benchmark

The September 13, 2026 follow-up repeated the three-story 3B/32B screening with eight inference threads instead of two. Production settings stayed unchanged. One run per story is not a statistically controlled capacity test.

Generation speed increased about 41% for 3B and 44% for 32B. Mean server CPU rose to about 43% and 47%, respectively. Model-process memory was roughly unchanged. These server CPU figures include other processes and do not directly measure spare physical-core capacity.

Output wording and token counts changed. Both models met the 200–250 character limit for only one of three summaries. Fixed sampling settings did not make outputs identical across thread counts, so these differences do not establish a quality change caused by threading.

Health requests succeeded, but production AI queue latency was not measured. Keep production unchanged pending representative chat replays and queue-volume testing. The 32B test model was unloaded; its files remain available.
