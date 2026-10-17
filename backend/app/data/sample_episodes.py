from typing import Dict, List
from ..models.schemas import Session, Claim, ClaimStatus, BadgeColor, ClaimCategory, Citation, DossierMetrics, VideoContext

SAMPLE_EPISODES: Dict[str, Session] = {
    "huberman_fasting": Session(
        session_id="huberman_fasting",
        title="Huberman Lab: Effects of Fasting & Longevity Protocols",
        source_type="SAMPLE",
        media_url="https://www.youtube.com/watch?v=9tRohh0gErM",
        youtube_video_id="9tRohh0gErM",
        duration_seconds=420.0,
        status="READY",
        stream_ws_url="/ws/sessions/huberman_fasting",
        total_claims=5,
        metrics=DossierMetrics(
            verified=2,
            contested=2,
            unsupported=1,
            total_claims=5,
            truth_score=40.0
        ),
        context=VideoContext(
            domain="Metabolic Physiology & Fasting Protocols",
            primary_topic="Intermittent Fasting, Autophagy & Circadian Biology",
            speaker="Dr. Andrew Huberman",
            summary="Physiological examination of time-restricted feeding, glycogen depletion, cellular autophagy, and metabolic markers.",
            key_entities=["time-restricted feeding", "autophagy", "glycogen", "insulin", "circadian biology", "mTOR", "AMPK", "ketones", "metabolic health"]
        ),
        created_at="2026-10-15T10:00:00Z"
    ),
    "lex_ai_scaling": Session(
        session_id="lex_ai_scaling",
        title="Lex Fridman: AI Compute, Nuclear Energy & Scaling Laws",
        source_type="SAMPLE",
        media_url="https://www.youtube.com/watch?v=J5bI3B_Yd9g",
        youtube_video_id="J5bI3B_Yd9g",
        duration_seconds=360.0,
        status="READY",
        stream_ws_url="/ws/sessions/lex_ai_scaling",
        total_claims=4,
        metrics=DossierMetrics(
            verified=3,
            contested=1,
            unsupported=0,
            total_claims=4,
            truth_score=75.0
        ),
        context=VideoContext(
            domain="Artificial Intelligence & Distributed Systems",
            primary_topic="Scaling Laws, Transformer Architectures & Energy Constraints",
            speaker="Lex Fridman",
            summary="Discussion on frontier model training dynamics, Chinchilla compute optimality, synthetic data, and gigawatt datacenters.",
            key_entities=["scaling laws", "GPU clusters", "transformer", "Chinchilla compute optimal", "synthetic data", "gigawatt capacity", "inference latency", "nuclear power"]
        ),
        created_at="2026-10-15T11:00:00Z"
    ),
    "all_in_clean_energy": Session(
        session_id="all_in_clean_energy",
        title="All-In Podcast: Global EV Battery Production & Grid Capacity",
        source_type="SAMPLE",
        media_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        duration_seconds=300.0,
        status="READY",
        stream_ws_url="/ws/sessions/all_in_clean_energy",
        total_claims=4,
        metrics=DossierMetrics(
            verified=2,
            contested=1,
            unsupported=1,
            total_claims=4,
            truth_score=50.0
        ),
        context=VideoContext(
            domain="Energy Infrastructure & Clean Tech Economics",
            primary_topic="Global EV Battery Supply Chain & Power Grid Modernization",
            speaker="All-In Podcast",
            summary="Market and engineering analysis of battery manufacturing gigafactories, mineral refining, and electric grid transmission capacity.",
            key_entities=["EV battery manufacturing", "lithium-ion supply chain", "grid transmission capacity", "clean tech economics", "gigawatt hours", "energy storage"]
        ),
        created_at="2026-10-15T12:00:00Z"
    )
}

SAMPLE_CLAIMS: Dict[str, List[Claim]] = {
    "huberman_fasting": [
        Claim(
            id="clm_hf_01",
            session_id="huberman_fasting",
            timestamp_start=60.0,
            timestamp_end=95.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Because people don't eat during their sleep, almost everybody is employing some form of intermittent fasting or time-restricted feeding.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Physiologically, nocturnal fasting (8-10 hours) constitutes baseline time-restricted feeding in humans, establishing circadian metabolic cycles.",
            citations=[
                Citation(
                    title="Time-Restricted Eating in Humans: Mechanisms and Clinical Outcomes",
                    source="Cell Metabolism (2019)",
                    url="https://doi.org/10.1016/j.cmet.2019.11.003",
                    type="Clinical Review"
                )
            ],
            confidence_score=0.98,
            search_query="intermittent fasting time restricted feeding sleep duration metabolic baseline"
        ),
        Claim(
            id="clm_hf_02",
            session_id="huberman_fasting",
            timestamp_start=135.0,
            timestamp_end=175.0,
            speaker="Dr. Andrew Huberman",
            claim_text="If you eat during an 8-hour period most days, but occasionally eat across a 12-hour period, in theory that could have pretty serious detrimental health effects.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="While severe day-to-day feeding shifts disrupt peripheral circadian clocks in animal models, occasional 12-hour feeding in humans shows minor acute variation rather than severe detrimental health damage.",
            citations=[
                Citation(
                    title="Circadian Disruption and Human Metabolic Health",
                    source="Science Translational Medicine (2020)",
                    url="https://doi.org/10.1126/scitranslmed.aai8830",
                    type="Translational Study"
                )
            ],
            confidence_score=0.91,
            search_query="fluctuating feeding window 8 hour to 12 hour circadian disruption human metabolic"
        ),
        Claim(
            id="clm_hf_03",
            session_id="huberman_fasting",
            timestamp_start=255.0,
            timestamp_end=310.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Increases in resting blood glucose predict mortality in humans and monkeys, but the opposite is true in mice ('Lost in Translation' study).",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Accurately cites the comparative gerontology study demonstrating that while elevated fasting blood glucose strongly correlates with mortality in primates, rodent strains show divergent longevity curves.",
            citations=[
                Citation(
                    title="Fasting Blood Glucose as a Predictor of Mortality: Lost in Translation",
                    source="Comparative Gerontology & Metabolism Review",
                    url="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3836186/",
                    type="Comparative Study"
                )
            ],
            confidence_score=0.97,
            search_query="fasting blood glucose predictor of mortality lost in translation mice vs human"
        ),
        Claim(
            id="clm_hf_04",
            session_id="huberman_fasting",
            timestamp_start=895.0,
            timestamp_end=945.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Gardner et al. (2018 JAMA) found no significant difference in 12-month weight loss between a healthy low-fat diet and a healthy low-carbohydrate diet.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="The landmark DIETFITS randomized trial (JAMA 2018, 609 adults) concluded that 12-month weight loss did not significantly differ between healthy low-fat vs healthy low-carbohydrate diets.",
            citations=[
                Citation(
                    title="Effect of Low-Fat vs Low-Carbohydrate Diet on 12-Month Weight Loss (DIETFITS Study)",
                    source="JAMA (2018)",
                    url="https://doi.org/10.1001/jama.2018.0245",
                    type="Randomized Clinical Trial"
                )
            ],
            confidence_score=0.99,
            search_query="Gardner 2018 JAMA low fat vs low carbohydrate weight loss DIETFITS"
        ),
        Claim(
            id="clm_hf_05",
            session_id="huberman_fasting",
            timestamp_start=1790.0,
            timestamp_end=1845.0,
            speaker="Dr. Andrew Huberman",
            claim_text="The reason original rodent studies used an 8-hour feeding window rather than 9 or 10 hours was logistical constraints of researchers removing food from cages.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="Satchin Panda's 2012 Salk Institute time-restricted feeding trials selected an 8-hour window both to fit standard laboratory shift constraints and to model active-phase circadian boundaries.",
            citations=[
                Citation(
                    title="Time-Restricted Feeding Without Reducing Caloric Intake Prevents Metabolic Diseases",
                    source="Cell Metabolism (2012)",
                    url="https://doi.org/10.1016/j.cmet.2012.04.019",
                    type="Landmark Paper"
                )
            ],
            confidence_score=0.94,
            search_query="satchin panda 8 hour feeding window mice cell metabolism 2012"
        )
    ],
    "lex_ai_scaling": [
        Claim(
            id="clm_lex_01",
            session_id="lex_ai_scaling",
            timestamp_start=20.0,
            timestamp_end=48.0,
            speaker="Guest (AI Researcher)",
            claim_text="Frontier AI models are now requiring data centers with greater than 100 megawatts of dedicated power.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Major frontier training clusters under construction in 2024–2026 range from 100 MW up to gigawatt scale, as confirmed by IEA grid filings and hyperscaler power purchase agreements.",
            citations=[
                Citation(
                    title="Electricity 2024: Analysis and Forecast to 2026 (Data Centers & AI)",
                    source="International Energy Agency (IEA)",
                    url="https://www.iea.org/reports/electricity-2024",
                    type="Official Agency Report"
                )
            ],
            confidence_score=0.98,
            search_query="frontier AI training cluster power requirements 100 megawatts IEA"
        ),
        Claim(
            id="clm_lex_02",
            session_id="lex_ai_scaling",
            timestamp_start=60.0,
            timestamp_end=90.0,
            speaker="Lex Fridman",
            claim_text="Chinchilla scaling laws established that models should be trained with equal scaling of parameters and tokens.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Hoffmann et al. (DeepMind 2022) demonstrated that for compute-optimal training, model size and number of training tokens should be scaled in equal proportion.",
            citations=[
                Citation(
                    title="Training Compute-Optimal Large Language Models (Chinchilla)",
                    source="NeurIPS 2022 / Google DeepMind",
                    url="https://arxiv.org/abs/2203.15556",
                    type="Conference Paper"
                )
            ],
            confidence_score=0.99,
            search_query="chinchilla scaling laws compute optimal tokens parameters ratio deepmind"
        ),
        Claim(
            id="clm_lex_03",
            session_id="lex_ai_scaling",
            timestamp_start=115.0,
            timestamp_end=150.0,
            speaker="Guest (AI Researcher)",
            claim_text="Synthetic data generation can completely replace human internet data without model collapse.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="While curated synthetic reasoning traces improve specific skills, uncurated recursive synthetic data ingestion is proven to cause statistical tail degradation and model collapse.",
            citations=[
                Citation(
                    title="The Curse of Recursion: Training on Generated Data Makes Models Forget",
                    source="Nature (2024)",
                    url="https://doi.org/10.1038/s41586-024-07566-y",
                    type="Nature Paper"
                )
            ],
            confidence_score=0.92,
            search_query="model collapse recursive training synthetic data nature Shumailov"
        ),
        Claim(
            id="clm_lex_04",
            session_id="lex_ai_scaling",
            timestamp_start=170.0,
            timestamp_end=205.0,
            speaker="Guest (AI Researcher)",
            claim_text="Inference compute scaling via test-time search yields exponential performance improvements on competitive benchmarks.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Recent research shows that allocating additional test-time compute through chain-of-thought search and verifiers scales performance predictably along a compute frontier.",
            citations=[
                Citation(
                    title="Scaling LLM Test-Time Compute Optimally Can Be More Effective than Pretraining",
                    source="arXiv (2024)",
                    url="https://arxiv.org/abs/2408.03314",
                    type="Preprint Paper"
                )
            ],
            confidence_score=0.96,
            search_query="scaling test time compute inference search reasoning benchmarks"
        )
    ],
    "all_in_clean_energy": [
        Claim(
            id="clm_allin_01",
            session_id="all_in_clean_energy",
            timestamp_start=25.0,
            timestamp_end=55.0,
            speaker="Chamath Palihapitiya",
            claim_text="Global EV battery cell manufacturing prices dropped below $100 per kilowatt-hour in 2024.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="BloombergNEF energy storage surveys confirmed that average global lithium iron phosphate (LFP) battery pack and cell prices fell below $100/kWh in early 2024.",
            citations=[
                Citation(
                    title="Lithium-Ion Battery Price Survey 2024",
                    source="BloombergNEF (BNEF)",
                    url="https://about.bnef.com/electric-transport/",
                    type="Market Analysis Report"
                )
            ],
            confidence_score=0.97,
            search_query="bloombergNEF lithium battery price per kwh 2024 under 100 dollars"
        ),
        Claim(
            id="clm_allin_02",
            session_id="all_in_clean_energy",
            timestamp_start=70.0,
            timestamp_end=102.0,
            speaker="Jason Calacanis",
            claim_text="Global electric vehicle production declined by 18 percent in the previous quarter.",
            category=ClaimCategory.STATISTICS_DATA,
            status=ClaimStatus.UNSUPPORTED,
            badge_color=BadgeColor.RED,
            verdict_summary="Global electric vehicle production actually grew approximately 20% year-over-year according to IEA and Rho Motion data; growth rate slowed in some regions, but total output did not contract by 18%.",
            citations=[
                Citation(
                    title="Global EV Outlook: Quarterly Market Update",
                    source="International Energy Agency (IEA)",
                    url="https://www.iea.org/reports/global-ev-outlook-2024",
                    type="Official Statistical Report"
                )
            ],
            confidence_score=0.95,
            search_query="global electric vehicle production declined 18 percent IEA Rho Motion"
        ),
        Claim(
            id="clm_allin_03",
            session_id="all_in_clean_energy",
            timestamp_start=120.0,
            timestamp_end=155.0,
            speaker="David Sacks",
            claim_text="Existing nuclear power plants produce the lowest lifecycle carbon emissions per megawatt-hour of any baseline generation source.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="IPCC lifecycle greenhouse gas analyses calculate nuclear energy lifecycle emissions median at 12 g CO2 eq/kWh, on par with wind power and lower than solar PV.",
            citations=[
                Citation(
                    title="IPCC Working Group III: Mitigation of Climate Change (Annex III)",
                    source="Intergovernmental Panel on Climate Change (IPCC)",
                    url="https://www.ipcc.ch/report/ar6/wg3/",
                    type="United Nations Scientific Assessment"
                )
            ],
            confidence_score=0.98,
            search_query="IPCC lifecycle greenhouse gas emissions nuclear per kwh median"
        ),
        Claim(
            id="clm_allin_04",
            session_id="all_in_clean_energy",
            timestamp_start=180.0,
            timestamp_end=215.0,
            speaker="Brad Gerstner",
            claim_text="Geothermal energy can supply over 80% of North American electricity baseload within 5 years.",
            category=ClaimCategory.TECH_BUSINESS,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="Enhanced Geothermal Systems (EGS) hold enormous long-term potential, but US Department of Energy projections show EGS supplying roughly 10% of generation by 2050, making an 80% target within 5 years technically unfeasible.",
            citations=[
                Citation(
                    title="Pathways to Commercial Liftoff: Next-Generation Geothermal Power",
                    source="U.S. Department of Energy (DOE)",
                    url="https://liftoff.energy.gov/geothermal/",
                    type="Government Technology Roadmap"
                )
            ],
            confidence_score=0.94,
            search_query="enhanced geothermal systems DOE commercial liftoff electricity generation target"
        )
    ]
}
