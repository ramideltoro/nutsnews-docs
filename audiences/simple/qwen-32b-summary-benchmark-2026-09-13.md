---
title: "NutsNews 3B versus 32B: summaries and resource utilization"
description: "Historical screening results and their production limitations."
wiki:
  source_route: "/technical/qwen-32b-summary-benchmark-2026-09-13"
  simple_route: "/simple/qwen-32b-summary-benchmark-2026-09-13"
  slug: "qwen-32b-summary-benchmark-2026-09-13"
  primary_diagram:
    file: "diagrams/qwen-32b-summary-benchmark-2026-09-13.mmd"
    accTitle: "NutsNews 3B versus 32B: summaries and resource utilization decision"
    accDescr: "A small controlled model screening provides observations, but production stays unchanged until representative repeated chat tests and human review support a change."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 993
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-09-20T16:46:49.615Z"
    technical_source_hash: adf422bbda67fbd7a109421f8e439cf4e0f7f1831a9a5417f7e30b029e198168
---
# NutsNews 3B versus 32B: summaries and resource utilization

On September 13, 2026, Qwen 3B and 32B each summarized three factual story digests once using two inference threads. This was not an exact production replay or a publishing-capacity test.

32B generated about 1.56 tokens per second versus 14.79 for 3B. Its observed model-process memory peaked at 20.71 GiB versus 2.21 GiB. Similar server CPU percentages came from the same thread limit; they do not mean equal work or energy use.

The larger model preserved an important caveat about human clinical research and avoided one factual distortion seen in 3B. However, only one of its three summaries met the required length. This small sample cannot establish general accuracy.

All sampled health requests succeeded, but that does not prove unchanged AI or queue latency. Keep production on 3B. Consider larger-model background review only after representative repeated tests. No service or publishing configuration changed; 32B was unloaded and its files retained.
