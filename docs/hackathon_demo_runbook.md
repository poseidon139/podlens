# PodLens 3-Minute Hackathon Demo Script

## 🎯 Goal
Demonstrate to Google Cloud judges that PodLens solves a recognized media problem using **native multimodal intelligence** and **Vertex AI Google Search Grounding**, delivering an intuitive, low-latency user experience.

---

## ⏱️ Timeline & Talking Points

### Minute 0:00 - 0:45 | The Hook & Problem
- **Speaker:** *"Millions of people consume podcasts for education, science, and news. But there is a silent dilemma: podcasts are audio-first, making live verification impossible. If a guest states a flawed study or incorrect statistic, the audience absorbs it without context."*
- **Action:** Open PodLens home screen showing a popular science podcast episode loaded in the video frame.

### Minute 0:45 - 1:45 | The Live Core Demo (Video Sync)
- **Speaker:** *"Watch what happens as we play this segment from a leading health podcast where fasting and autophagy are discussed."*
- **Action:** Press Play on the embedded video player.
- **At 01:10 (Playback reaches 04:18):**
  - **Speaker:** *"The speaker claims 72-hour fasting completely restarts the immune system."*
  - **Screen Action:** The PodLens sidebar animates. An amber **[CONTESTED]** card slides in with high-contrast styling.
  - **Callout:** *"PodLens extracted this assertion, sent it through Gemini 1.5 Flash with Vertex Search Grounding, and synthesized the verdict: rodent models show this regeneration, but human trials remain non-definitive. All with direct links to the 2014 Cell Stem Cell paper."*

### Minute 1:45 - 2:30 | Technical Architecture & GCP Differentiation
- **Speaker:** *"Why couldn't this be done before? Standard RAG is too slow and generic. We leverage:"*
  1. **Gemini 1.5 Flash:** Fast sub-2s extraction without needing heavy pre-transcription pipelines.
  2. **Google Search Grounding:** Direct access to verified public web context with zero hallucination.
  3. **Firestore & Cloud Run:** Instant sub-second timeline synchronizations across WebSockets.

### Minute 2:30 - 3:00 | The Wrap-Up & Vision
- **Action:** Click "Generate Episode Dossier".
- **Speaker:** *"At the end of a 2-hour podcast, the listener gets an exportable credibility scorecard and a one-click bibliography export for Zotero and Notion. PodLens transforms passive video listening into active, verified digital learning."*
- **Judges Call-to-Action:** Open for questions on latency, schema design, and scaling.

---

## 🛡️ Backup Demo Contingencies (Hackathon Safety Net)
1. **Wi-Fi / Latency Degradation:** If live search grounding takes >3 seconds during live stage Wi-Fi, toggle `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` to serve pre-grounded Firestore cached records.
2. **Audio Glitch:** Have the 15-second screen recording clip ready on desktop tab 2 as instant backup.