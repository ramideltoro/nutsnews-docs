# NutsNews 3B versus 32B: summaries and resource utilization

September 13, 2026. Production remains on 3B. Same three factual digests and deployed buildPrompt as the [earlier screening](qwen-summary-benchmark-2026-09-13.md). One run per story and model, JSON generate API, temperature 0, seed 42, 8192 context capacity, 220 output-token cap, two inference threads. This is not an exact production chat replay: the extra system message, production sampling and normalization are excluded. No concurrent load test or publishing-queue benchmark was performed. The model download required a retry; download time is excluded.

| Measure | 3B | 32B |
|---|---:|---:|
| Mean output tokens/sec | 14.79 | 1.56 |
| Mean whole-server CPU | 12.16% | 12.44% |
| Peak sampled whole-server CPU | 12.74% | 13.93% |
| Peak sampled runner RSS | 2.21 GiB | 20.71 GiB |
| Minimum available system RAM | 55.01 GiB | 36.44 GiB |
| Peak swap allocated | 4 KiB | 480 KiB |
| Max sampled health latency | 4.31 ms | 3.46 ms |
| Health failures | 0 | 0 |
| NASA request | 19.43 sec | 197.26 sec |
| Mouse-study request | 9.64 sec | 98.88 sec |
| Lost-toy request | 9.38 sec | 100.26 sec |
| Meets 200–250 character limit | 3/3 | 1/3 |

CPU uses successive /proc/stat samples approximately two seconds apart, expressed across all 16 logical CPUs; idle and iowait are excluded from busy time. Similar CPU percentages reflect the equal thread cap, not equal work or energy. Percentages include all server activity. Runner RSS is the observed llama-server process, not total Ollama service memory; concurrent runners would make attribution ambiguous. MemAvailable includes reclaimable cache. Swap allocation was negligible, and allocation alone does not measure swap I/O. Short spikes between samples are not measured. Generation was about 9.5 times slower, with 9.4 times the resident model-process memory. First requests include load phases of 2.76 and 20.23 seconds respectively; prefix reuse and live traffic affect timings.

Manual quality review: 32B clearly stated that human effects from the mouse study require clinical confirmation, unlike 3B's less explicit caveat. It avoided 3B's bedding distortion in the toy story. NASA's summary included the project name and AI purpose. However, lengths were 236, 254 and 253 characters, so two still exceeded the limit. The toy summary added generic feel-good commentary. All outputs were valid JSON, accepted the stories, and included reasons. These observations on three digests do not establish general accuracy rates.

Recommendation: 32B may be useful for occasional background review where latency is acceptable, but is not a demonstrated replacement without slowdown. Retain production 3B. A production decision needs representative chat replays, repeated quality evaluation, and NutsNews generation/queue measurements. HTTP health success does not prove unchanged AI processing latency. 32B was unloaded after testing; model files remain for reuse. No service configuration or publishing changed.
