# PodLens (CiteCast) User Journey & Experience Map

This document outlines the end-to-end journey for a listener/viewer engaging with an episode through PodLens, as well as the administrative content ingestion workflow.

---

## 1. Target Personas

* **Primary Persona:** The Inquisitive Learner (e.g., tech workers, students, researchers listening to science, tech, economics, and health podcasts who struggle to distinguish verified science from anecdotal opinion).
* **Secondary Persona:** The Fact-Checker / Journalist (professionals needing verified citations, study links, and quotes extracted quickly from multi-hour video interviews).

---

## 2. End-to-End User Journey Map

| Phase | User Goal | User Action | System Action / Experience |
| :--- | :--- | :--- | :--- |
| **1. Discovery & Load** | Launch an episode to verify claims in real time. | Pastes a YouTube URL, selects a trending pre-processed episode, or opens the PodLens Chrome Extension on YouTube. | PodLens initializes player, fetches or generates stream chunks, and pre-renders the synchronized timeline sidebar. |
| **2. Active Playback** | Listen passively until an unusual claim is made. | Listens to a podcast conversation (e.g., debate on AI economics, diet, or physics). | Subtle visual indicator in the corner of the player stays neutral (grey/idle) while casual banter occurs. |
| **3. Trigger & Notice** | Notice when a specific metric or study is cited. | Speaker states: *"Global EV battery production dropped 18% last quarter."* | Timeline bar highlights; a compact "Context Pill" slides into the top-right overlay. |
| **4. Deep Dive Inspection** | Verify whether the claim is backed by peer-reviewed evidence. | User clicks or hovers over the Context Pill / Sidebar Card. | Video automatically pauses (or stays playing in picture-in-picture); card expands to show verdict, sample size, primary source URL, and scientific consensus summary. |
| **5. Retrospective Review** | Inspect all citations after finishing the podcast. | Clicks "Export Episode Context Dossier" or reviews the chronological timeline. | System generates a downloadable summary containing all claims, status distribution (e.g., 85% Verified, 10% Contested, 5% Unsupported), and literature links. |

---

## 3. Step-by-Step Experience Walkthrough

### Step 1: Episode Activation
1. The user navigates to the PodLens dashboard.
2. The user has two options:
   * **Instant Library:** Click one of the pre-processed popular episodes (e.g., *Huberman Lab*, *Lex Fridman*, *Joe Rogan*, *All-In Podcast*).
   * **Live / Custom Ingest:** Paste any YouTube link. PodLens starts processing in the background, rendering initial cards within 15–20 seconds.

### Step 2: The Adaptive Playback Interface
* **Left Screen (65% width):** High-definition video player with custom timeline markers. Colored tick-marks indicate points of interest:
  * 🟢 **Green tick:** Verified empirical data.
  * 🟡 **Yellow tick:** Contested / Lacking scientific consensus.
  * 🔴 **Red tick:** Debunked, false, or misquoted assertion.
* **Right Screen (35% width):** The "Context Lens" feed. It stays synchronized with the current video timestamp, auto-scrolling to the active claim while keeping previous claims accessible.

### Step 3: Interactive Claim Cards
When a claim card activates:
```
+----------------------------------------------------------+
| [🟡 CONTESTED]                                 @ 14:22   |
| "Intermittent fasting doubles cellular autophagy in humans" |
+----------------------------------------------------------+
| Consensus Summary:                                       |
| Autophagy increase is well-documented in rodents, but     |
| direct clinical biomarkers in living human tissue remain  |
| limited and debated.                                     |
|                                                          |
| Primary Citations:                                       |
| - Nature Metabolism (2021) [Read Paper ->]               |
| - New England Journal of Medicine Review [Read ->]       |
+----------------------------------------------------------+
```

### Step 4: Post-Episode Insight Dossier
When the video ends:
1. The user receives a **Truth & Context Scorecard**:
   * Total claims detected: `34`
   * Supported by primary literature: `26`
   * Debated or nuanced: `6`
   * Misleading / Refuted: `2`
2. Option to export citations directly to **Notion**, **Markdown**, or **Zotero** with one click.

---

## 4. Edge Cases & User Graceful Handling
* **Ambiguous or Metaphorical Language:** The LLM prompt explicitly flags humor, sarcasm, or hyperbole as `NON_VERIFIABLE_RHETORIC` to avoid false alerts on jokes.
* **Live Ingestion Delay:** If the user fast-forwards to an unanalyzed segment, the interface displays a subtle pulsing placeholder: *"Grounding claims for this segment..."* with a non-blocking background queue.