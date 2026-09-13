# NutsNews summary screening: Qwen 2.5 3B versus 7B

Production remains on its existing model. September 13, 2026.

## Scope and controls

Three real stories linked by NutsNews were reduced to source-checked factual digests. Each model received the same digest and the exact buildPrompt function read from the deployed local AI service. Tests used Ollama generate, JSON output, temperature 0, seed 42, 8,192 context capacity, 220 output tokens maximum and two CPU threads, once per story. This is not an exact production replay: production uses chat with an additional system message and its own sampling configuration, ingestion excerpts and output normalization. These results are a screening signal, not sufficient evidence to replace a model or measure general accuracy. Prompts were approximately 400 tokens; no production publishing was triggered.

Sources:
- [NASA citizen-science project](https://science.nasa.gov/get-involved/citizen-science/help-refine-data-from-space-telescopes-with-artifact-inspector/)
- [Mouse-aging study](https://www.sciencedaily.com/releases/2026/09/260911214238.htm)
- [Hotel returns lost toy](https://www.goodnewsnetwork.org/hotel-staff-give-girls-lost-plushie-the-vip-treatment-before-sending-her-home-with-a-note-look/)

## Results

| Story | 3B seconds | 7B seconds | 3B characters | 7B characters |
|---|---:|---:|---:|---:|
| NASA | 19.36 | 38.75 | 221 | 150 |
| Mouse study | 9.65 | 17.13 | 205 | 185 |
| Lost toy | 9.41 | 16.64 | 208 | 155 |

3B generated approximately 14.7 tokens/sec; 7B approximately 7.0. First requests include loading. Prefix caching and live traffic affect timings. Both returned valid JSON and accepted all three positive stories. 3B met the 200–250 character requirement 3/3 times; 7B 0/3. All 7B decision reasons were empty. The raw result field `pass` only checks acceptance, not overall quality.

Manual factual review: both retained the mouse-study setting without claiming proven human longevity, but omitted the explicit need for human clinical confirmation. 3B distorted the toy being swept up with bedding into being mistaken for bedding. 7B's toy summary blurred staged photos into the toy being found enjoying the hotel. 3B's NASA summary included participation methods; 7B omitted those details. No clear 7B quality advantage was demonstrated on this small sample.

NutsNews health requests all returned 200 during the runs. This does not measure publishing queue throughput or article-generation latency. No shared configuration changed; the test 7B model was unloaded afterward.

## Follow-up

Keep the existing model. First improve summary validation and remove generic length-padding behavior: deployed normalizeAcceptedSummary adds filler when text is short, which can reduce specificity independently of model quality. A proposed change should preserve complete sentences and source limitations, and be tested before publishing. No such production change was made in this benchmark. A future model decision needs repeated production-chat replays with the same excerpts and normalization, varied article categories, and human review.
