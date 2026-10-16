from typing import Dict, List
from ..models.schemas import Session, Claim, ClaimStatus, BadgeColor, ClaimCategory, Citation, DossierMetrics

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
        created_at="2026-10-15T12:00:00Z"
    )
}

SAMPLE_CLAIMS: Dict[str, List[Claim]] = {
    "huberman_fasting": [
        Claim(
            id="clm_hf_01",
            session_id="huberman_fasting",
            timestamp_start=15.0,
            timestamp_end=35.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Moderate coffee consumption reduces all-cause mortality risk by roughly 12 percent.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Large prospective cohort studies associate moderate coffee consumption (2 to 4 cups daily) with an 8% to 15% lower risk of all-cause mortality.",
            citations=[
                Citation(
                    title="Coffee Drinking and Mortality in 10 European Countries (EPIC Study)",
                    source="Annals of Internal Medicine (2022)",
                    url="https://doi.org/10.7326/M21-2977",
                    type="Peer-Reviewed Cohort Study"
                ),
                Citation(
                    title="Association of Coffee Drinking with Total and Cause-Specific Mortality",
                    source="New England Journal of Medicine (NEJM)",
                    url="https://www.nejm.org/doi/full/10.1056/NEJMoa1112010",
                    type="Clinical Review"
                )
            ],
            confidence_score=0.98,
            search_query="coffee consumption all cause mortality percentage prospective study"
        ),
        Claim(
            id="clm_hf_02",
            session_id="huberman_fasting",
            timestamp_start=45.0,
            timestamp_end=72.0,
            speaker="Guest Expert",
            claim_text="Intermittent fasting doubles cellular autophagy in humans within a 24-hour window.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="Significant increases in autophagy markers are clearly demonstrated in rodent models, but direct clinical quantification in living human tissue remains limited and debated.",
            citations=[
                Citation(
                    title="Autophagy regulation during fasting and feeding in human skeletal muscle",
                    source="Nature Metabolism (2021)",
                    url="https://doi.org/10.1038/s42255-021-00466-9",
                    type="Clinical Trial Paper"
                ),
                Citation(
                    title="Intermittent Fasting and Cellular Renewal Mechanisms",
                    source="Cell Metabolism Journal",
                    url="https://doi.org/10.1016/j.cmet.2020.02.018",
                    type="Systematic Review"
                )
            ],
            confidence_score=0.91,
            search_query="intermittent fasting 24 hours double autophagy human clinical trials"
        ),
        Claim(
            id="clm_hf_03",
            session_id="huberman_fasting",
            timestamp_start=95.0,
            timestamp_end=125.0,
            speaker="Guest Expert",
            claim_text="Drinking 500ml of ice water burns over 500 extra calories per day through metabolic thermogenesis.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.UNSUPPORTED,
            badge_color=BadgeColor.RED,
            verdict_summary="Water-induced thermogenesis only expends roughly 15 to 25 calories per 500ml of cold water to warm it to body temperature, far below 500 kcal.",
            citations=[
                Citation(
                    title="Water-Induced Thermogenesis: Energy Expenditure Measurements",
                    source="Journal of Clinical Endocrinology & Metabolism",
                    url="https://doi.org/10.1210/jc.2003-030380",
                    type="Controlled Trial"
                ),
                Citation(
                    title="Debunking the Ice Water Caloric Burn Myth",
                    source="American Journal of Clinical Nutrition",
                    url="https://academic.oup.com/ajcn/article/84/6/1330/4632996",
                    type="Replication Study"
                )
            ],
            confidence_score=0.97,
            search_query="ice water thermogenesis burn 500 calories clinical measurement"
        ),
        Claim(
            id="clm_hf_04",
            session_id="huberman_fasting",
            timestamp_start=140.0,
            timestamp_end=175.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Prolonged fasting for 72 hours resets the entire immune system by triggering stem-cell regeneration.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.CONTESTED,
            badge_color=BadgeColor.AMBER,
            verdict_summary="Valter Longo's landmark 2014 study observed hematopoietic stem cell recycling during 72h cycles in mice; clinical oncology adjuvant trials in humans are ongoing but do not demonstrate a complete immune 'reset'.",
            citations=[
                Citation(
                    title="Prolonged Fasting Reduces IGF-1/PKA to Promote Hematopoietic-Stem-Cell-Based Regeneration",
                    source="Cell Stem Cell (2014)",
                    url="https://doi.org/10.1016/j.stem.2014.04.014",
                    type="Peer-Reviewed Landmark Paper"
                ),
                Citation(
                    title="Fasting-mimicking diet and markers of immune rejuvenation in humans",
                    source="Science Translational Medicine",
                    url="https://doi.org/10.1126/scitranslmed.aai8830",
                    type="Translational Study"
                )
            ],
            confidence_score=0.93,
            search_query="72 hour fasting resets immune system stem cell valter longo cell stem cell"
        ),
        Claim(
            id="clm_hf_05",
            session_id="huberman_fasting",
            timestamp_start=190.0,
            timestamp_end=225.0,
            speaker="Dr. Andrew Huberman",
            claim_text="Zone 2 cardiovascular training increases mitochondrial volume and lactate clearance capacity by over 30%.",
            category=ClaimCategory.SCIENCE_HEALTH,
            status=ClaimStatus.VERIFIED,
            badge_color=BadgeColor.GREEN,
            verdict_summary="Endurance training at sub-lactate thresholds (Zone 2) consistently triggers mitochondrial biogenesis via PGC-1alpha upregulation and boosts MCT1 lactate transporter expression.",
            citations=[
                Citation(
                    title="Mitochondrial Adaptations to Endurance Training",
                    source="Medicine & Science in Sports & Exercise",
                    url="https://doi.org/10.1249/MSS.0000000000002574",
                    type="Physiological Study"
                ),
                Citation(
                    title="Lactate as a Fulcrum of Metabolism in Zone 2 Conditioning",
                    source="Cell Metabolism",
                    url="https://doi.org/10.1016/j.cmet.2018.06.016",
                    type="Review Paper"
                )
            ],
            confidence_score=0.96,
            search_query="zone 2 training mitochondrial volume increase lactate clearance"
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
