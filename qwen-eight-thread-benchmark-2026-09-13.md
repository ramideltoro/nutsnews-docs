# Eight-thread NutsNews benchmark

September 13, 2026. Rerun of the [two-thread benchmark](qwen-32b-summary-benchmark-2026-09-13.md), changing only num_thread to 8. Same three digests, JSON generate API, temperature 0, seed 42, context capacity 8192 and output cap 220. Production configuration unchanged. This is one run per prompt, not a statistically controlled capacity test. Same source, sampling and production-chat limitations as the earlier report apply.

| Measure | 3B, 2 threads | 3B, 8 threads | 32B, 2 threads | 32B, 8 threads |
|---|---:|---:|---:|---:|
| Mean output tokens/sec | 14.79 | 20.90 | 1.56 | 2.25 |
| Whole-server CPU mean | 12.16% | 43.12% | 12.44% | 46.64% |
| Whole-server CPU peak | 12.74% | 50.20% | 13.93% | 51.81% |
| Runner RSS peak GiB | 2.21 | 2.21 | 20.71 | 20.71 |
| NASA seconds | 19.43 | 11.09 | 197.26 | 105.15 |
| Mouse-study seconds | 9.64 | 5.07 | 98.88 | 57.91 |
| Lost-toy seconds | 9.38 | 5.71 | 100.26 | 59.72 |

Eight threads improved generation speed approximately 41% for 3B and 44% for 32B. 32B request times fell about 40–47%; prompt processing also improved. Output token counts and wording changed, so total times are not pure speed ratios. First-request loading was 2.50 seconds for 3B and 19.25 seconds for 32B. No claim of maximum throughput follows from three short prompts. Whole-server CPU is aggregated across 16 logical processors; it includes other processes and does not imply that remaining logical utilization is equivalent physical-core headroom.

At eight threads, minimum available RAM was 55.00 GiB (3B) and 36.44 GiB (32B). Peak swap allocation was only 480 KiB. All health samples returned HTTP 200, maximum observed 6.87 ms for 3B and 6.52 ms for 32B. Health checks do not measure production AI queue latency.

Quality: 32B preserved the need for clinical research in humans and avoided the earlier 3B bedding distortion. Its summary lengths were 249, 259 and 267 characters; only 1/3 met the 200–250 requirement. 3B lengths were 276, 156 and 206, likewise 1/3. Both returned valid JSON and nonempty reasons. Fixed seed/temperature did not ensure identical outputs across thread configurations; length differences should not be attributed to intrinsic quality changes from threading.

Conclusion: 32B is more plausible for background use at roughly one minute per warm short summary, but consumes substantially more CPU time and RAM than 3B. Keep production unchanged pending representative production-chat replays and queue-volume evaluation. 32B was unloaded after testing; downloaded files remain available. No service settings or publishing behavior changed.
