# NutsNews 3B versus 14B summary screening

September 13, 2026. Same three source-checked story digests and deployed buildPrompt as the [7B screening](qwen-summary-benchmark-2026-09-13.md). Same limitations apply: one run per story, generate API rather than production chat, no additional production system message or normalization, two inference threads, temperature 0, seed 42, 8192 context capacity, 220 output tokens. These are small controlled writing tests, not exact production replays or publishing-throughput benchmarks.

| Measure | 3B | 14B |
|---|---:|---:|
| Mean generation tokens/sec | 14.82 | 3.30 |
| NASA seconds | 19.20 | 87.46 |
| Mouse-study seconds | 9.64 | 41.54 |
| Lost-toy seconds | 9.33 | 39.33 |
| Summary length compliant | 3/3 | 1/3 |
| Valid JSON / accepted / nonempty reasons | 3/3 | 3/3 |

14B summary lengths: 294, 220, 192 characters; required 200–250. First-request loading: 3B 2.51 seconds; 14B 9.68 seconds. Generation was about 4.5 times slower. Available memory during 14B remained approximately 47.2 GiB. All sampled NutsNews health requests returned 200; this does not establish unaffected AI-generation latency. Production remained on 3B; 14B was unloaded after testing, with downloaded files retained.

Manual review: 14B's NASA summary clearly explained the AI-training purpose but exceeded the card limit. Its mouse summary retained mice and future human research, but used promotional “breakthrough” language and did not explicitly state that human lifespan benefits are unproven. Its toy summary correctly described the playful letter without 3B's bedding distortion or the staged-photo ambiguity seen in earlier outputs. It was eight characters short. This is a modest factual-writing improvement on one case, not evidence of a general accuracy gain.

Decision: do not switch production on this evidence. 14B offers some clearer wording but substantially slower generation and inconsistent length compliance. Improve the current summarization/validation pipeline first; require repeated production-chat replays and queue-latency measurements before adopting 14B. No publishing or application configuration changes were made.
