AI-Driven Livelihood Mapping and NSQF-Aligned Skilling Knowledge Base: Implementation Architecture for PM-AJAY GIA (SIH26097)

PART 1 — Executive Summary

The execution of the Smart India Hackathon problem statement SIH26097—centered on an AI-driven, voice-first livelihood mapping and National Skills Qualifications Framework (NSQF) skilling assistant for Scheduled Caste (SC) communities under the Grants-in-Aid (GIA) component of the Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)—requires a deterministically verifiable data foundation. Conversational large language models (LLMs) frequently hallucinate qualification pack codes, fabricate loan eligibility thresholds, and misstate government scheme guidelines when responding to unstructured user queries. The operational design for SkillSphere / Sarathi AI decouples natural language interaction from knowledge retrieval and rule execution. The natural language interface operates strictly as a conversational parsing, translation, and explanation layer across English, Telugu, and Hindi, while all underlying skill-gap assessments, NSQF mappings, credit calculations, and scheme recommendations execute against an authoritative, normalized relational database and an auditable Retrieval-Augmented Generation (RAG) knowledge store.

The data framework bridges the entire trajectory of the beneficiary, encompassing personal demographic and occupational profiling, baseline competency extraction, local labour-market demand matching, identification of competency deficits against National Occupational Standards (NOS), linkage to certified qualification packs and accredited training centers, and progression into either wage employment or credit-linked microenterprises. By embedding statutory provisions of PM-AJAY—such as the mandatory earmarking of at least 10% of Special Central Assistance (SCA) for skill development and at least 15% for income-generating programs targeted at SC women—the engine guarantees that generated recommendations comply directly with ministerial funding streams and district-level implementation mandates.

Data integration across the ecosystem follows a strict three-tier classification model:

⚬ Verified Official Data: Primary government statutes, National Council for Vocational Education and Training (NCVET) qualification registers, Ministry of Social Justice and Empowerment (MoSJE) circulars, Periodic Labour Force Survey (PLFS) indicators, and official credit agency operational manuals.

⚬ Derived System Mappings: Deterministic heuristic logic and rule-engine inferences that compare user-declared baseline skills against NOS performance criteria to calculate skill gaps and recommend specific occupational transitions.

⚬ Indicative Market Data: Prevailing local capital expenditures, machinery procurement estimates, and non-statutory market operational parameters.

PART 2 — SIH26097 Requirement → Data Mapping

The following table establishes the structural relationship between each core SIH26097 functional requirement, its underlying data dependencies, the authoritative source authority, and the target normalized relational database entity:

| **SIH RequirementRequired Data AttributesOfficial Source AuthorityTarget Database Entity** |                                                                                                                                                 |                                                                                                     |                                                                     |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Voice-First Multilingual Profiling                                                         | User demographics, geographic location (state, district, mandal/block, village), education, caste context, language preference, spoken intent.  | Census of India, MoSPI PLFS demographic frameworks, State Revenue Department directories.           | user\_profile, multilingual\_labels, voice\_assessment\_questions   |
| Baseline Competency Assessment                                                             | Self-reported vocational trade experience, tool proficiencies, years in trade, non-formal apprenticeship history.                               | NCVET Qualification Pack entry criteria, Directorate General of Training (DGT) trade syllabi.       | skills, user\_skill\_profile, skill\_competencies                   |
| NSQF Skilling Recommendations                                                              | NSQF levels, Qualification Pack codes, National Occupational Standards (NOS), training hours (theory, practical, OJT), NCVET approval statuses. | National Qualifications Register (NQR), Sector Skill Councils (CSDCI, AMHSSC, WMPSC, SCGJ, ASDC).   | nsqf\_qualifications, nos\_units, qualification\_nos\_mapping       |
| Skill Gap Diagnostics                                                                      | Differential matrix comparing existing user competencies against mandatory NOS performance criteria for target job roles.                       | Derived heuristic matching engine referencing official SSC Model Curricula and Qualification Packs. | skill\_gaps, gap\_resolution\_pathways                              |
| Local Training Delivery Linkage                                                            | Accredited training partners, Skill India Digital Hub training centers, ITI locations, batch intake capacity, district-level operations.        | Skill India Digital (SIDH), Andhra Pradesh State Skill Development Corporation (APSSDC).            | training\_providers, training\_centres, courses                     |
| Local Skill Demand Mapping                                                                 | District-wise sector priorities, high-demand vocational trades, industrial cluster profiles, National Career Service (NCS) vacancy signals.     | District Skill Development Plans (DSDP), APSSDC District Skill Gap Studies, MoLE NCS portal.        | district\_skill\_demand, district\_profiles                         |
| Microenterprise & Business Advisory                                                        | Viable rural self-employment pathways, capital investment breakdowns, mandatory machinery/tools, unit operating costs.                          | Ministry of MSME Project Profiles, KVIC Model Schemes, NSFDC project appraisal guidelines.          | business\_options, business\_equipment, business\_investments       |
| PM-AJAY GIA & Scheme Matching                                                              | Central and State SC welfare schemes, credit limits, margin money subsidies, interest subventions, implementing channelizing agencies.          | MoSJE PM-AJAY Guidelines (May 2023), NSFDC Operational Guidelines, KVIC PMEGP norms.                | government\_schemes, scheme\_eligibility, scheme\_business\_mapping |



PART 3 — PM-AJAY / GIA Dataset

The Centrally Sponsored Scheme of Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY) is framed under Articles 38(2) and 46 of the Constitution of India to minimize economic inequalities and promote the educational and economic interests of Scheduled Castes. Administered by the Department of Social Justice and Empowerment (DoSJE) within the Ministry of Social Justice and Empowerment (MoSJE), the program consolidates three former central schemes: Special Central Assistance to Scheduled Castes Sub-Plan (SCA to SCSP), Pradhan Mantri Adarsh Gram Yojana (PMAGY), and the Scheme of Grants-in-Aid to Voluntary Organizations working for Scheduled Castes. The revised comprehensive guidelines issued in May 2023 establish three distinct operational components: the development of SC-dominated villages into Adarsh Gram, Grants-in-Aid for District and State-level socio-economic projects, and the construction or repair of hostels for SC students.

The Grants-in-Aid (GIA) component specifically finances comprehensive livelihood projects, skill development initiatives, and related socioeconomic infrastructure. Funding is provided on a 100% grant basis by the Central Government, while permitting States and Union Territories to contribute additional funds from their own resources. The inter-state allocation formula allocates non-Adarsh Gram funds by assigning a 50% weightage to the State's relative SC population and a 50% weightage to the ratio of the State's SCSP expenditure relative to its total Annual Plan. Additionally, 2% of the overall GIA budgetary allocation is reserved for North Eastern States implementing SC development plans.

Financial disbursements follow the Single Nodal Agency (SNA) SPARSH model via the Public Financial Management System (PFMS), debitable under Demand No. 93 to Major Head "3601" (Grants-in-aid to State Governments), Sub-Major Head "06" (Centrally Sponsored Schemes), Minor Head "789" (Special Component Plan for Scheduled Castes), Scheme Code 34.12. Project proposals originate through decentralized district planning coordinated by District Level Convergence Committees (DLCC) headed by the District Magistrate or Collector, and are consolidated into multi-year Perspective Plans approved by the national Project Appraisal cum Convergence Committee (PACC) chaired by Secretary, DoSJE.

The central allocation under the GIA component is determined according to the following mathematical distribution:

$$\text{State Allocation} = \text{Total GIA Funds} \times \left[ 0.5 \times \left(\frac{\text{SC Pop}\_{\text{State}}}{\text{SC Pop}\_{\text{National}}}\right) + 0.5 \times \left(\frac{\text{SCSP Ratio}\_{\text{State}}}{\text{SCSP Benchmark}}\right) \right]$$

The operational guidelines establish explicit statutory earmarks that govern the execution of all state and district livelihood interventions:

| **Component SectorStatutory Mandate / Financial ThresholdTarget Beneficiary / Operational ConstraintSource Citation** |                                                                                                                           |                                                                                                                                                           |                                                  |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Skill Development Programmes                                                                                          | Minimum 10% of total SCA/GIA allocated per fiscal year.                                                                   | Must strictly comply with National Skills Qualifications Framework (NSQF) common norms.                                                                   | MoSJE PM-AJAY Guidelines, Chapter 3, Clause 3.3. |
| SC Women Economic Empowerment                                                                                         | Minimum 15% of total GIA funds released to State/UT.                                                                      | Exclusively reserved for viable income-generating self-employment and enterprise schemes for SC women.                                                    | MoSJE PM-AJAY Guidelines, Chapter 3, Clause 3.4. |
| Women Skilling Participation                                                                                          | Minimum 30% female candidate representation across all sponsored skill programs.                                          | Compulsory quota across all empanelled training institutions and courses.                                                                                 | MoSJE PM-AJAY Guidelines, Chapter 3, Clause 3.3. |
| Infrastructure Development                                                                                            | Maximum ceiling of 30% of Central Assistance released in a year.                                                          | Limited to capital assets directly supporting selected livelihood clusters, Common Facility Centres (CFCs), or drinking water/sanitation in Adarsh Grams. | MoSJE PM-AJAY Guidelines, Chapter 3, Clause 3.4. |
| Direct Livelihood Capital Subsidy                                                                                     | Up to Rs. 50,000 per individual beneficiary or 50% of total project cost (whichever is lower).                            | Provided to credit-linked individual or Self-Help Group (SHG) bank loans for microenterprise asset creation.                                              | MoSJE PM-AJAY Guidelines, Chapter 3, Clause 3.4. |
| Administrative & PIU Expenses                                                                                         | Up to 5% of total scheme allocation (1% Central Technical Support Group, 4% State/District Project Implementation Units). | Operational expenditure for running dedicated Project Implementation Units (PIU) at State and District levels.                                            | MoSJE PM-AJAY Guidelines, Chapter 1, Clause 1.4. |



PART 4 — SC Community Context Dataset

Socioeconomic data collected through the Census of India and the Periodic Labour Force Survey (PLFS) 2023–24 conducted by the National Sample Survey Office (NSSO) under MoSPI highlights structural patterns that dictate voice assistant workflows. Nationally, Scheduled Castes comprise 16.6% of the population (20.14 crore persons), with 76.4% residing in rural jurisdictions where informal economic arrangements predominate. The national SC literacy rate of 66.1% conceals significant gender and regional disparities: rural female SC literacy stands at 52.6%, demonstrating the necessity of an audio-first, voice-guided interface in local vernacular dialects. In Andhra Pradesh, Scheduled Castes number 8,445,398 persons (17.1% of the population across 26 reorganized districts), with primary sub-caste groups comprising Mala (41.6%), Madiga (48.2%), and Relli (1.8%, heavily concentrated in Srikakulam, Vizianagaram, and Visakhapatnam).

Workforce statistics from the PLFS 2023–24 (released September 2024) confirm an overall SC Labour Force Participation Rate (LFPR, Usual Status ps+ss, Age 15+) of 57.9% and a Worker Population Ratio (WPR) of 56.1%. While the headline SC unemployment rate is 3.1%, youth unemployment between ages 15 and 29 reaches 10.4%. Educational unemployment for SC individuals with secondary schooling or higher reaches 7.1%. More critically, the structural composition of SC employment shows severe occupational vulnerability compared to national averages:

| **Broad Employment Status CategoryAll-India Aggregate Workforce (PLFS 2023–24)Scheduled Caste Workforce (PLFS 2023–24)Structural Divergence & Operational ImpactSource Authority** |       |       |                                                                                                                                 |                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Self-Employed (Own Account / Unpaid Family)                                                                                                                                        | 58.4% | 39.8% | SC workers show lower ownership of productive enterprise assets and land capital.                                               | MoSPI PLFS 2023-24 Annual Report.              |
| Regular Wage / Salaried Employment                                                                                                                                                 | 20.9% | 18.1% | Significant deficit in formal, protected wage employment within the private organized sector.                                   | MoSPI PLFS 2023-24 Annual Report.              |
| Casual Labour / Daily Wage Work                                                                                                                                                    | 20.7% | 42.1% | More than double the national incidence; indicates high vulnerability, informality, and seasonal distress.                      | MoSPI PLFS 2023-24 Annual Report.              |
| Formally Trained in Vocational Skills                                                                                                                                              | 4.8%  | 2.6%  | Significant skilling gap; over 97% of SC workers acquire trade proficiency informally through hereditary/unaccredited channels. | MoSPI PLFS 2023-24 Vocational Skilling Tables. |



These structural conditions necessitate that the voice engine prioritize Recognition of Prior Learning (RPL) to convert uncertified manual experience into accredited qualifications, while providing enterprise credit linkage to help beneficiaries transition from casual wage labor to sustainable microenterprises.

PART 5 — Skills Dataset

The skill taxonomy establishes a normalized inventory of technical and operational capabilities across vocational trades relevant to rural and semi-urban labor markets. Every skill record is classified into verified trade competencies referenced directly to NCVET National Occupational Standards (NOS).

| **Skill IDSkill Canonical NameSkill DomainDescriptionVerification TypeAuthoritative Source Reference** |                                            |                           |                                                                                                                                              |                        |                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------- |
| SKILL\_APP\_001                                                                                        | Garment Pattern Cutting                    | Apparel & Garments        | Drafting patterns on paper, fabric laying, marking, and manual scissor/shearing operations.                                                  | Verified Official Data | AMHSSC QP AMH/Q1947 NOS AMH/N1947. |
| SKILL\_APP\_002                                                                                        | Single Needle Lockstitch Operation         | Apparel & Garments        | Operating motorized industrial lockstitch sewing machines, bobbin winding, tension adjustments, and fabric stitching.                        | Verified Official Data | AMHSSC QP AMH/Q1947 NOS AMH/N1948. |
| SKILL\_APP\_003                                                                                        | Garment Alteration & Fitting               | Apparel & Garments        | Taking anatomical measurements, dart manipulation, zipper insertion, hemlines adjustment, and defect rectification.                          | Verified Official Data | AMHSSC QP AMH/Q1947 NOS AMH/N1949. |
| SKILL\_CON\_001                                                                                        | PVC Conduit & Cable Laying                 | Construction / Electrical | Cutting, bending, and fixing PVC conduits on brick/concrete walls and pulling single-core insulated copper conductors.                       | Verified Official Data | CSDCI QP CON/Q0602 NOS CON/N0604.  |
| SKILL\_CON\_002                                                                                        | Low Voltage Distribution Board Assembly    | Construction / Electrical | Assembling miniature circuit breakers (MCBs), isolators, and busbars into distribution enclosures with correct phase balancing.              | Verified Official Data | CSDCI QP CON/Q0602 NOS CON/N0605.  |
| SKILL\_CON\_003                                                                                        | Electrical Continuity & Insulation Testing | Construction / Electrical | Operating analog/digital multimeters and insulation resistance testers (Megger) to detect short circuits and ground faults.                  | Verified Official Data | CSDCI QP CON/Q0602 NOS CON/N0602.  |
| SKILL\_PLU\_001                                                                                        | CPVC/UPVC Pipe Jointing & Routing          | Plumbing & Water Mgmt     | Measuring, cutting, reaming, deburring, and chemical solvent cementing of plastic pipes for internal cold/hot water distribution.            | Verified Official Data | WMPSC QP PSC/Q0104 NOS PSC/N0130.  |
| SKILL\_PLU\_002                                                                                        | Sanitary Fixture Installation              | Plumbing & Water Mgmt     | Positioning, leveling, and mounting washbasins, water closets (EWC/IWC), cisterns, and chrome-plated brass bibcocks.                         | Verified Official Data | WMPSC QP PSC/Q0104 NOS PSC/N0132.  |
| SKILL\_PLU\_003                                                                                        | Drainage Line Laying & Leak Detection      | Plumbing & Water Mgmt     | Laying SWR PVC drainage pipes with uniform gradient slopes, fixing gully traps, and conducting hydrostatic pressure tests.                   | Verified Official Data | WMPSC QP PSC/Q0104 NOS PSC/N0131.  |
| SKILL\_SOL\_001                                                                                        | Solar PV Module Civil Mounting             | Green Jobs / Solar        | Assembling galvanized iron/aluminum mounting structures on flat rooftops, anchoring expansion fasteners, and torquing clamps.                | Verified Official Data | SCGJ QP SGJ/Q0101 NOS SGJ/N0103.   |
| SKILL\_SOL\_002                                                                                        | Solar Array Interconnection & Wiring       | Green Jobs / Solar        | String crimping, MC4 connector assembly, DC cable routing in UV-resistant conduits, and grid-tied/off-grid inverter termination.             | Verified Official Data | SCGJ QP SGJ/Q0101 NOS SGJ/N0104.   |
| SKILL\_AUT\_001                                                                                        | IC Engine Periodic Servicing               | Automotive Repair         | Draining engine oil, replacing fuel/air filters, cleaning spark plugs, setting valve tappet clearances, and carburetor/fuel injector tuning. | Verified Official Data | ASDC QP ASC/Q1411 NOS ASC/N1411.   |
| SKILL\_AUT\_002                                                                                        | Drum & Disc Brake Overhauling              | Automotive Repair         | Inspecting brake shoe linings, caliper pistons, brake pad replacements, master cylinder bleeding, and hydraulic fluid refilling.             | Verified Official Data | ASDC QP ASC/Q1411 NOS ASC/N1412.   |
| SKILL\_ELE\_001                                                                                        | Domestic Appliance Motor Diagnostics       | Electronics & Hardware    | Diagnosing run/start capacitors, rotor stator windings, thermals fuses, and bush-bearing wear in ceiling fans and mixer-grinders.            | Verified Official Data | ESSCI QP ELE/Q3104 NOS ELE/N3104.  |



PART 6 — Occupation Dataset

Vocational occupations are mapped to the Ministry of Labour and Employment's National Classification of Occupations (NCO-2015), capturing corresponding Sector Skill Councils, entry conditions, wage employment avenues, and self-employment potential:

| **Occupation IDOccupation TitleNCO-2015 CodeSector Skill Council (SSC)Minimum Academic Entry LevelWage Employment ChannelsSelf-Employment PotentialEquipment RequisitesSource Provenance** |                                          |           |                                                    |                                                 |                                                                              |                                                                    |                                                                             |                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | --------- | -------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------- |
| OCC\_APP\_001                                                                                                                                                                              | Self Employed Tailor                     | 7531.0100 | Apparel, Made-Ups & Home Furnishing (AMHSSC)       | 8th class pass                                  | Export garment units, boutique alterations, uniform supply factories.        | High (Home boutique, stitching unit, tailoring shop).              | Sewing machine, cutting shears, pressing iron, tailoring desk.              | NQR & AMHSSC QP AMH/Q1947.   |
| OCC\_CON\_001                                                                                                                                                                              | Assistant Electrician                    | 7411.0100 | Construction Skill Development Council (CSDCI)     | 10th class pass (or 8th with 2 yrs exp)         | Civil construction contractors, facility management firms, electrical shops. | Medium (Domestic wireman, electrical repair services).             | Insulated plier kit, screw drivers, neon tester, hammer, drill machine.     | CSDCI & NCVET QP CON/Q0602.  |
| OCC\_PLU\_001                                                                                                                                                                              | Plumber - General                        | 7126.0101 | Water Management and Plumbing Skill Council        | 8th class pass                                  | Construction builders, plumbing service aggregators, municipal water bodies. | High (Independent plumbing contractor, local maintenance plumber). | Pipe wrenches, pipe dies, hack saw, basin wrench, spirit level.             | WMPSC & NCVET QP PSC/Q0104.  |
| OCC\_SOL\_001                                                                                                                                                                              | Solar PV Installer (Suryamitra)          | 7411.0302 | Skill Council for Green Jobs (SCGJ)                | 10th pass + ITI (Electrical / Fitter / Wireman) | EPC solar contractors, solar rooftop installation agencies.                  | Medium (Rooftop installation & AMC maintenance provider).          | Solar multimeter, crimping tool for MC4, compass, torque wrench.            | SCGJ & NCVET QP SGJ/Q0101.   |
| OCC\_AUT\_001                                                                                                                                                                              | Two Wheeler Service Technician           | 7231.0501 | Automotive Skills Development Council (ASDC)       | 8th class pass                                  | Authorized OEM 2-wheeler service centers, multi-brand workshops.             | High (Independent two-wheeler service & repair garage).            | Spanner sets, socket wrenches, air compressor, pneumatic tools, tire lever. | ASDC & NCVET QP ASC/Q1411.   |
| OCC\_ELE\_001[span\_131]\(start\_span)[span\_131]\(end\_span)[span\_137]\(start\_span)[span\_137]\(end\_span)                                                                              | Field Technician - Other Home Appliances | 7421.0301 | Electronics Sector Skills Council of India (ESSCI) | 8th class pass                                  | Consumer durable service networks, urban repair aggregators.                 | High (Home appliance mobile repair enterprise).                    | Digital multimeter, soldering iron, wire stripper, test bulb assembly.      | ESSCI & NCVET QP ELE/Q3104.  |



PART 7 — NSQF Dataset

NSQF-aligned qualification records represent verified entries in the National Qualifications Register approved by the National Skills Qualifications Committee (NSQC). The operational training hours reflect mandatory curricular allocations across theory, practical demonstrations, and common employability skills modules codified under Directorate General of Training guidelines.

$$\text{Total Not[span\_154]\(start\_span)[span\_154]\(end\_span)[span\_161]\(start\_span)[span\_161]\(end\_span)ional Hours} = \text{Theory Hours} + \text{Practical Hours} +[span\_91]\(start\_span)[span\_91]\(end\_span) \text{Employability Skills Hours} + \text{Mandatory OJT}$$

| **Qualification CodeQualification Pack NameSectorNSQF LevelTheory HoursPractical HoursEmployability Skills HoursTotal Notional HoursMinimum Age CriteriaEducational Entry RequirementSource Reference** |                                                 |                                     |         |     |     |                           |     |          |                                                                                                 |                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- | ------- | --- | --- | ------------------------- | --- | -------- | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| AMH/Q1947                                                                                                                                                                                               | Self Employed Tailor (v3.0)                     | Apparel, Made-Ups & Home Furnishing | Level 4 | 90  | 240 | 60 (Module DGT/VSQ/N0102) | 390 | 18 Years | 8th Class Pass with zero experience, or 5th Class pass with 3 years relevant experience.        | NQR Approved Qualification Register.    |
| CON/Q0602                                                                                                                                                                                               | Assistant Electrician (v4.0)                    | Construction                        | Level 3 | 90  | 240 | 60 (Module DGT/VSQ/N0102) | 390 | 18 Years | 10th Class pass, or 8th Class pass with 2 years relevant experience, or NSQF Level 2 certified. | NCVET National Qualifications Register. |
| PSC/Q0104                                                                                                                                                                                               | Plumber - General (v5.0)                        | Water Management and Plumbing       | Level 4 | 120 | 270 | 60 (Module DGT/VSQ/N0102) | 450 | 18 Years | 8th Class pass + 2 years experience, or 10th Class pass, or certified Plumber Helper (Level 3). | NCVET Qualification Pack Repository.    |
| SGJ/Q0101                                                                                                                                                                                               | Solar PV Installer (Suryamitra) (v4.0)          | Green Jobs                          | Level 4 | 120 | 240 | 60 (Module DGT/VSQ/N0102) | 420 | 18 Years | 10th Class + ITI (2 yrs in Electrician/Fitter/Wireman) or Class 12th with Science.              | SCGJ NCVET Approved Register.           |
| ASC/Q1411                                                                                                                                                                                               | Two Wheeler Service Technician (v4.0)           | Automotive                          | Level 4 | 136 | 260 | 60 (Module DGT/VSQ/N0102) | 456 | 18 Years | 8th Class pass + 1 year relevant automotive garage experience, or 10th Class pass.              | ASDC Qualification File Directory.      |
| ELE/Q3104                                                                                                                                                                                               | Field Technician - Other Home Appliances (v3.0) | Electronics & Hardware              | Level 4 | 120 | 240 | 60 (Module DGT/VSQ/N0102) | 420 | 18 Years | 8th Class pass + 2 years experience, or 10th Class pass, or ITI in Electronics/Electrical.      | ESSCI NCVET Directory.                  |



PART 8 — Skill Gap Dataset

The skill-gap framework deterministically isolates missing technical and professional proficiencies when a beneficiary presents prior, non-formal trade experience. By comparing the user's declared competencies against mandatory National Occupational Standards (NOS), the system identifies targeted training interventions rather than routing candidates through unnecessary introductory courses.

Let the candidate's existing competency vector be denoted as ‭$C\_{\text{user}} = \\{c\_1, c\_2, \dots, c\_k\\}$‬, and the mandatory occupational standards of the target qualification pack be ‭$S\_{\text{role}} = \\{s\_1, s\_2, \dots, s\_m\\}$‬. The skill-gap vector ‭$G\_{\Delta}$‬ is defined by set difference:

$$G\_{\Delta} = S\_{\text{role}} \setminus C\_{\text{user}}$$

| **Existing Informal CompetenciesTarget NSQF Job RoleVerified Compulsory NOS UnitsIdentified Competency Deficit (Skill Gap)Derived Skilling Intervention ModuleRecommended ModeMatch Classification** |                                                     |                                                                                                                                  |                                                                                                                                                   |                                                                                              |                              |                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------- |
| Basic manual needle stitching, hemline folding, scissor cutting.                                                                                                                                     | Self Employed Tailor (AMH/Q1947, Level 4)           | AMH/N1947 (Drafting & Cutting)<br>AMH/N1948 (Machine Stitching)<br>AMH/N1949 (Alterations)<br>DGT/VSQ/N0102 (Employability)      | Pattern grading, complex collar/cuff assembly, industrial electric sewing machine operation, client invoicing, digital UPI billing.               | Bridge Course: Advanced Industrial Garment Construction & Digital Accounting (120 Hours).    | Hybrid / RPL with Upskilling | Derived System Mapping. |
| Non-formal helper wiring, switch replacing, manual trenching.                                                                                                                                        | Assistant Electrician (CON/Q0602, Level 3)          | CON/N0602 (Hand Tools)<br>CON/N0604 (LV Wiring)<br>CON/N0605 (LV Panel Boards)<br>CON/N9001 (Workplace Safety)                   | Architectural schematic reading, Earth resistance testing using Megger, Three-phase distribution board assembly, Indian Electricity Safety Rules. | Standard QP Course: Assistant Electrician Core NOS Specialization (240 Hours).               | Classroom & Lab Practical    | Derived System Mapping. |
| Manual pipe cutting, thread sealing, leak patching with M-seal.                                                                                                                                      | Plumber - General (PSC/Q0104, Level 4)              | PSC/N0130 (Plumbing Systems)<br>PSC/N0131 (Drainage Lines)<br>PSC/N0132 (Sanitary Fixtures)<br>PSC/N0133 (Testing & Maintenance) | Hot water PPR/CPVC pipe heat-fusion welding, concealed shower/diverter valve fitting, hydrostatic testing up to 10 bar, drainage slope gradients. | RPL Bridge Module: Modern Plumbing Technologies & Pressure Hydro-Testing (80 Hours).         | RPL with Bridge Training     | Derived System Mapping. |
| Basic mechanical dismantling, bicycle repair, engine oil changes.                                                                                                                                    | Two Wheeler Service Technician (ASC/Q1411, Level 4) | ASC/N1411 (Periodic Maintenance)<br>ASC/N1412 (Brake Systems)<br>ASC/N1413 (Electrical & Electronic Systems)                     | Electronic Fuel Injection (EFI) diagnostics, ECU scanning, ABS sensor calibration, digital multimeter harness testing.                            | Full Qualification Pack Training: Two Wheeler Electronic Diagnostics & Overhaul (456 Hours). | Full Time Residential / ITI  | Derived System Mapping. |



PART 9 — Training & Course Dataset

Verified vocational courses aligned with Central PMKVY standards and the Andhra Pradesh State Skill Development Corporation (APSSDC) framework are mapped below. All listed curricula lead to formal NCVET-recognized certifications.

| **Course IDOfficial Course TitleMapped Qualification PackNSQF LevelDelivery StructureTotal DurationAccrediting AuthorityAssessment & Certification AgencySource Provenance** |                                          |           |         |                                         |                          |                                                  |                |                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------- | ------- | --------------------------------------- | ------------------------ | ------------------------------------------------ | -------------- | --------------------------------------- |
| CRS\_APSSDC\_001                                                                                                                                                             | Certification in Self-Employed Tailoring | AMH/Q1947 | Level 4 | Offline Classroom & Sewing Workshop     | 390 Hours (90d @ 4.5h/d) | APSSDC / PMKVY CSSM                              | AMHSSC / NCVET | APSSDC State Skilling Catalogue.        |
| CRS\_APSSDC\_002                                                                                                                                                             | Construction Electrician Foundation      | CON/Q0602 | Level 3 | Offline Technical Practical & Site Demo | 390 Hours (78d @ 5h/d)   | CSDCI / APSSDC Skill Hub                         | CSDCI / NCVET  | NCVET National Qualifications Register. |
| CRS\_APSSDC\_003                                                                                                                                                             | Advanced Plumbing Systems & Sanitation   | PSC/Q0104 | Level 4 | Practical Workshop & Field Training     | 450 Hours (90d @ 5h/d)   | Water Management & Plumbing SSC                  | WMPSC / NCVET  | NCVET Model Curricula Directory.        |
| CRS\_MNRE\_001                                                                                                                                                               | Suryamitra Solar PV Installer Program    | SGJ/Q0101 | Level 4 | Residential Classroom, Lab & Field OJT  | 420 Hours (90d @ 6h/d)   | National Institute of Solar Energy (NISE) / SCGJ | SCGJ / NCVET   | NISE Suryamitra Operational Guidelines. |
| CRS\_ASDC\_001                                                                                                                                                               | Two-Wheeler Technician Certification     | ASC/Q1411 | Level 4 | Industrial Workshop Simulation          | 456 Hours (95d @ 5h/d)   | ASDC / APSSDC ITI Network                        | ASDC / NCVET   | ASDC Course Registry.                   |
| CRS\_ESSCI\_001                                                                                                                                                              | Home Appliances Repair & Maintenance     | ELE/Q3104 | Level 4 | Hands-on Diagnostic Lab & Field Visit   | 420 Hours (84d @ 5h/d)   | ESSCI / APSSDC Skill Hub                         | ESSCI / NCVET  | ESSCI Skilling Programme Master.        |



PART 10 — Training Centre Dataset

Physical training centers verified across the Andhra Pradesh state skilling network are documented below, confirming verifiable operational facilities:

| **Centre IDTraining Centre NameOperating OrganizationPhysical Street AddressDistrictStateGeographic Pin CodeVerified Trade InfrastructureContact Nodal Officer / DeskVerification Status** |                                                |                                    |                                                                 |               |                |        |                                                                          |                                                   |                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- | ------------- | -------------- | ------ | ------------------------------------------------------------------------ | ------------------------------------------------- | ----------------------- |
| TC\_AP\_BAP\_001                                                                                                                                                                           | APSSDC District Skill Development Centre       | APSSDC Direct                      | Viswabrahmana Colony, Bapatla Town                              | Bapatla       | Andhra Pradesh | 522101 | Apparel Stitching Lab, Electrical Wiring Simulator, Computer IT Lab      | District Skill Development Officer (DSDO) Bapatla | Verified Official Data. |
| TC\_AP\_GNT\_001                                                                                                                                                                           | APSSDC Headquarter Technical Skill Hub         | APSSDC                             | 3rd Floor, Infosight Building, Near Pathuru Junction, Tadepalli | Guntur        | Andhra Pradesh | 522501 | Electronics Diagnostic Lab, Solar PV Simulator, Advanced Tooling         | Executive Director (Skill Operations), APSSDC     | Verified Official Data. |
| TC\_AP\_SRK\_001                                                                                                                                                                           | Government Industrial Training Institute (ITI) | Dept. of Employment & Training, AP | Opp. RTC Complex, Srikakulam Urban                              | Srikakulam    | Andhra Pradesh | 532001 | Two-Wheeler Repair Workshop, Plumbing Piping Yard, CSDCI Electrical Yard | Principal / DSDO Srikakulam                       | Verified Official Data. |
| TC\_AP\_VSP\_001                                                                                                                                                                           | Andhra University Skill Hub                    | Andhra University / APSSDC         | AU Engineering College Campus, Maddilapalem, Visakhapatnam      | Visakhapatnam | Andhra Pradesh | 530003 | Green Jobs Solar Rooftop Facility, Home Appliances Lab                   | Coordinator, AU Skill Development Centre          | Verified Official Data. |
| TC\_AP\_KRN\_001                                                                                                                                                                           | Government Polytechnic Skilling Centre         | APSSDC Network                     | Near Alampur X Road, Kurnool                                    | Kurnool       | Andhra Pradesh | 518002 | Electrical LV Installation Lab, Automotive Testing Bay                   | DSDO Kurnool Desk                                 | Verified Official Data. |



PART 11 — Local Skill Demand Dataset

Local vocational demand figures reflect findings from District Skill Development Plans (DSDP), APSSDC District Skill Gap Studies, and National Career Service employer returns. Demand is cataloged using ordinal indicators supported by regional economic and industrial profiles:

| **Location IDDistrict NameEconomic Focus & Industrial ProfileOccupation CategoryDemand IndicatorVerified Demand Rationale & Source DocumentVerification Confidence** |               |                                                                            |                                              |        |                                                                                                         |                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- | -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| LOC\_AP\_BAP                                                                                                                                                         | Bapatla       | Coastal aquaculture, rice milling, agro-processing, rural electrification. | Assistant Electrician (CON/Q0602)            | High   | Rapid conversion of aquaculture farms to three-phase pump electrification; Bapatla DSDP report.         | High (District Administrative Report) |
| LOC\_AP\_BA[span\_192]\(start\_span)[span\_192]\(end\_span)P                                                                                                         | Bapatla       | Rural housing schemes, urban local body expansions.                        | Plumber - General (PSC/Q0104)                | Medium | Replacement of rural borewell plumbing with tap connections under Jal Jeevan Mission; Bapatla DSDP.     | Medium (DSDP Analysis)                |
| LOC\_AP\_SRK                                                                                                                                                         | Srikakulam    | Cashew processing, mineral extraction, pharmaceutical coastal corridor.    | Two Wheeler Service Technician (ASC/Q1411)   | High   | High rural two-wheeler density vs service point ratio; Srikakulam District Skill Gap Study.             | High (APSSDC Skill Gap Report)        |
| LOC\_AP\_SRK                                                                                                                                                         | Srikakulam    | Rural informal crafts, women SHG concentration.                            | Self Employed Tailor (AMH/Q1947)             | High   | Earmarking of school uniform stitch aggregation by SERP and Women Cooperatives; Srikakulam DSDP.        | High (State SCSP Document)            |
| LOC\_AP\_GNT                                                                                                                                                         | Guntur        | Cotton ginning, textile processing, commercial real estate.                | Self Employed Tailor (AMH/Q1947)             | High   | Major market hub for cotton fabrics and wholesale garments; Guntur DSDP Textile Analysis.               | High (APSSDC Industrial Profile)      |
| LOC\_AP\_VSP                                                                                                                                                         | Visakhapatnam | Heavy engineering, port logistics, metro urban residential.                | Solar PV Installer (SGJ/Q0101)               | High   | High urban adoption of grid-tied rooftop solar under PM Surya Ghar Muft Bijli Yojana; Vizag Skill Plan. | High (District Renewable Energy Plan) |
| LOC\_AP\_KRN                                                                                                                                                         | Kurnool       | Cement manufacturing, solar parks, dryland agriculture.                    | Field Technician Home Appliances (ELE/Q3104) | Medium | Semi-urban expansion of cooling appliances and mixer-grinder density; Kurnool DSDP.                     | Medium (APSSDC Skill Survey)          |



PART 12 — Livelihood Mapping Dataset

The livelihood mapping engine links baseline user competencies to validated qualifications, accredited training courses, and sustainable employment endpoints:

| **Mapping IDExisting Core SkillRecommended NSQF Job RoleAligned Course IDPrimary Livelihood EndpointCapital Requirement CategoryInstitutional Scheme Channel** |                                       |                                            |                  |                                                |                                     |                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------ | ---------------- | ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| MAP\_LIV\_001                                                                                                                                                  | Non-formal fabric cutting & stitching | Self Employed Tailor (AMH/Q1947)           | CRS\_APSSDC\_001 | Micro-Tailoring Unit / Boutique                | Low (Rs. 25,000 to Rs. 85,000)      | NSFDC Mahila Samriddhi Yojana / PM-AJAY GIA Capital Subsidy. |
| MAP\_LIV\_002                                                                                                                                                  | Basic household wire fixing           | Assistant Electrician (CON/Q0602)          | CRS\_APSSDC\_002 | Electrical Service & Contracting Agency        | Medium (Rs. 40,000 to Rs. 1,20,000) | PMEGP Service Loan / NSFDC Micro Credit Finance.             |
| MAP\_LIV\_003                                                                                                                                                  | PVC pipe joining & hand pump repair   | Plumber - General (PSC/Q0104)              | CRS\_APSSDC\_003 | Independent Plumbing Sanitary Maintenance      | Low (Rs. 30,000 to Rs. 90,000)      | PM MUDRA Yojana (Shishu) / NSFDC Laghu Vyavsay Yojana.       |
| MAP\_LIV\_004                                                                                                                                                  | Helper electrical line work           | Solar PV Installer (SGJ/Q0101)             | CRS\_MNRE\_001   | Rooftop Solar EPC Subcontractor / AMC Provider | High (Rs. 1,50,000 to Rs. 5,00,000) | Stand-Up India / PMEGP Manufacturing & Service.              |
| MAP\_LIV\_005                                                                                                                                                  | Manual motorcycle mechanic helper     | Two Wheeler Service Technician (ASC/Q1411) | CRS\_ASDC\_001   | Multi-Brand Motorcycle Repair Center           | Medium (Rs. 80,000 to Rs. 2,50,000) | PMEGP / NSFDC Shilpi Samriddhi Yojana.                       |



PART 13 — Employment Dataset

For beneficiaries seeking structured wage employment, the system maps qualifications to formal hiring channels, employer networks, minimum wage baselines, and wage progression pathways:

| **Job Role CodeStandard Entry Job Role TitleTarget Employer SectorsEntry Minimum Monthly Wage (INR)Statutory Wage Reference BaselineCareer Progression Step 1 (1–3 Years)Career Progression Step 2 (3–5 Years)Verification Status** |                               |                                                   |                         |                                                                     |                                                |                                           |                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- | ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------- | ----------------------- |
| AMH/Q1947                                                                                                                                                                                                                           | Garment Assembly Line Tailor  | Export Garment Units, Apparel Factories           | Rs. 12,500 – Rs. 15,000 | Andhra Pradesh State Minimum Wages (Tailoring Scheduled Employment) | Sample Tailor / Line Quality Checker (Level 5) | Floor Supervisor / Batch Production Head  | Verified Official Data. |
| CON/Q0602                                                                                                                                                                                                                           | Construction Site Electrician | Tier 2 Construction Builders, MEP Contractors     | Rs. 14,000 – Rs. 17,500 | Ministry of Labour Central Sphere Semi-Skilled Construction Wages   | Senior Electrician (CON/Q0603, Level 4)        | Electrical Foreman / MEP Site Supervisor  | Verified Official Data. |
| PSC/Q0104                                                                                                                                                                                                                           | Maintenance Plumber           | Facility Management Firms, Commercial Complexes   | Rs. 13,500 – Rs. 16,500 | AP Minimum Wages (Civil Maintenance)                                | Plumbing Foreman (PSC/Q0105, Level 5)          | Public Health Engineering Site Supervisor | Verified Official Data. |
| SGJ/Q0101                                                                                                                                                                                                                           | Solar PV Technician           | Solar EPC Firms, Renewable Maintenance Companies  | Rs. 15,000 – Rs. 20,000 | Renewable Energy Sector Average Skilled Baseline                    | Solar PV Project Engineer (Level 5)            | Rooftop Project Operations Manager        | Verified Official Data. |
| ASC/Q1411                                                                                                                                                                                                                           | 2-Wheeler Dealership Mechanic | Authorized OEM Service Centers (Hero, Bajaj, TVS) | Rs. 13,000 – Rs. 16,000 | Automotive Skills Development Council Placement Averages            | Master Technician (ASC/Q1412, Level 5)         | Service Advisor / Workshop Floor Manager  | Verified Official Data. |



PART 14 — Self-Employment Dataset

Self-employment pathways provide rural and semi-urban entrepreneurs with structured microenterprise operational models, detailing required capital expenditures (CAPEX), operating expenses (OPEX), breakeven periods, and statutory business registrations.

$$\text{Total Capital Required} =[span\_121]\(start\_span)[span\_121]\(end\_span)[span\_128]\(start\_span)[span\_128]\(end\_span) \text{Machinery CAPEX} + \text{Initial Working Capital (60 Days)}$$

| **Business IDProposed Micro-Enterprise TitleMapped QualificationIndicative Setup CAPEXIndicative Working Capital (60d)Estimated Total InvestmentEstimated Monthly Operating MarginEstimated Payback PeriodStatutory Business RegistrationsClassification** |                                                     |           |              |            |              |                         |                |                                                                       |                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------- | ------------ | ---------- | ------------ | ----------------------- | -------------- | --------------------------------------------------------------------- | ----------------------- |
| BIZ\_APP\_001                                                                                                                                                                                                                                              | Rural Women Tailoring & Boutique Centre             | AMH/Q1947 | Rs. 42,000   | Rs. 18,000 | Rs. 60,000   | Rs. 12,000 – Rs. 18,000 | 5 to 7 Months  | Udyam Aadhaar (MSME), Local Gram Panchayat Trade License              | Derived System Mapping. |
| BIZ\_CON\_001                                                                                                                                                                                                                                              | Electrical Domestic Repair & Tool Rental Enterprise | CON/Q0602 | Rs. 55,000   | Rs. 25,000 | Rs. 80,000   | Rs. 15,000 – Rs. 24,000 | 6 to 8 Months  | Udyam Aadhaar, State Electrical Licensing Board Wireman Permit        | Derived System Mapping. |
| BIZ\_PLU\_001                                                                                                                                                                                                                                              | Mobile Plumbing & Borewell Repair Service           | PSC/Q0104 | Rs. 48,000   | Rs. 22,000 | Rs. 70,000   | Rs. 14,000 – Rs. 22,000 | 5 to 7 Months  | Udyam Aadhaar, Gram Panchayat Enterprise Register                     | Derived System Mapping. |
| BIZ\_AUT\_001                                                                                                                                                                                                                                              | Two-Wheeler Rapid Quick-Service Garage              | ASC/Q1411 | Rs. 1,20,000 | Rs. 45,000 | Rs. 1,65,000 | Rs. 22,000 – Rs. 35,000 | 8 to 11 Months | Udyam Aadhaar, State Pollution Control Board Consent (Green category) | Derived System Mapping. |



PART 15 — Government Scheme Dataset

Authoritative parameters for primary Central and State credit and subsidy programs applicable to vocational livelihood development are cataloged below:

| **Scheme IDScheme Nomenclature & MinistryTarget Beneficiary DemographicsCaste / Category Pre-requisiteAnnual Family Income CeilingCredit / Loan QuantumSubsidy Structure / Margin SupportConcessional Interest RateImplementing Channel / Application PortalSource Authority** |                                                           |                                                      |                                                     |                                                                     |                                                                                              |                                                                                         |                                                              |                                                                                |                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| SCH\_PMAJAY\_GIA                                                                                                                                                                                                                                                               | PM-AJAY Grants-in-Aid Component (MoSJE)                   | Impoverished SC households, SHGs, Women Cooperatives | 100% Scheduled Caste exclusive                      | Below Poverty Line (Double Poverty Line preferred: < Rs. 3.00 Lakh) | Dependent on project proposal                                                                | Up to Rs. 50,000 or 50% of asset cost per individual beneficiary                        | Not applicable (direct non-refundable capital grant)         | District Collector / DLCC / State SC Welfare Directorate / pmajay.dosje.gov.in | MoSJE PM-AJAY Scheme Guidelines (May 2023).               |
| SCH\_NSFDC\_MSY                                                                                                                                                                                                                                                                | Mahila Samriddhi Yojana (NSFDC / MoSJE)                   | SC Women micro-entrepreneurs                         | 100% Scheduled Caste exclusive                      | Rs. 3,00,000 per annum (Rural and Urban)                            | Up to Rs. 1,40,000 per unit (up to 90% project cost)                                         | Eligible for capital subsidy under SCA/GIA funds up to Rs. 10,000 or 50% of cost        | 4% per annum chargeable to the beneficiary                   | State Channelizing Agencies (APSCCFC in Andhra Pradesh) / nsfdc.nic.in         | NSFDC Operational Manual & Vikaspedia SC Welfare.         |
| SCH\_NSFDC\_MCF                                                                                                                                                                                                                                                                | Micro Credit Finance (NSFDC / MoSJE)                      | SC individual entrepreneurs and SHGs                 | 100% Scheduled Caste exclusive                      | Rs. 3,00,000 per annum (Double Poverty Line)                        | Up to Rs. 1,40,000 per beneficiary (up to 90% project cost)                                  | Capital subsidy under Special Central Assistance funds where applicable                 | 5% per annum for male; 4% per annum for female beneficiaries | State Channelizing Agencies (APSCCFC) / NBFC-MFIs / nsfdc.nic.in               | NSFDC Credit Policy Guidelines.                           |
| SCH\_MSME\_PMEGP                                                                                                                                                                                                                                                               | Prime Minister's Employment Generation Programme (MoMSME) | Traditional artisans, unemployed youth (18+ yrs)     | Special Category: SC, ST, OBC, Women, Ex-Servicemen | No family income ceiling                                            | Manufacturing: Up to Rs. 50 Lakh; Service: Up to Rs. 20 Lakh                                 | Rural SC: 35% margin money subsidy; Urban SC: 25% subsidy; Beneficiary contribution: 5% | Commercial bank MCLR linked (typically 8.5% – 10.5%)         | KVIC / KVIB / DIC / Online portal kviconline.gov.in                            | KVIC PMEGP Operational Scheme Guidelines.                 |
| SCH\_MOF\_MUDRA                                                                                                                                                                                                                                                                | Pradhan Mantri MUDRA Yojana (Ministry of Finance)         | Non-corporate, non-farm micro and small enterprises  | All categories (High priority for SC/ST/OBC)        | No family income ceiling                                            | Shishu: up to Rs. 50,000; Kishor: Rs. 50,001 to Rs. 5 Lakh; Tarun: Rs. 5 Lakh to Rs. 10 Lakh | Zero capital subsidy; collateral-free credit under CGFMU guarantee                      | Commercial Bank / RRB Base Lending Rate                      | Public/Private Commercial Banks, RRBs, MFIs / mudra.org.in                     | PMMY Operational Guidelines, Dept. of Financial Services. |



PART 16 — Scheme Eligibility Mapping

To eliminate generative hallucinations regarding welfare entitlements, the architecture enforces a deterministic boolean rule validation layer. A candidate scheme is flagged as eligible if and only if all statutory conditions evaluate to true against the user's demographic, financial, and geographic profile.

$$\text{Eligible}(U, S) \iff (S\_{\text{caste}} = \text{False} \lor U\_{\text{caste}} = \text{\`SC'}) \land (U\_{\text{age}} \in [S\_{\text{min\\\_age}}, S\_{\text{max\\\_age}}]) \land (S\_{\text{income}} = \text{Null} \lor U\_{\text{income}} \le S\_{\text{income}}) \land (S\_{\text{gender}} = \text{Null} \lor U\_{\text{gender}} = S\_{\text{gender}})$$

Upon passing this deterministic filtering, matching schemes are ranked by net beneficiary capital subsidy percentage, and the structured record is passed to the LLM solely to synthesize clear conversational explanations in the user's preferred language.

| **Target Scheme CodeRule IdentifierEvaluated Field ParameterRequired Statutory ConditionLogical OperatorFailure Action / Exclusion Message** |               |                        |                                                        |                 |                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------- | ------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------ |
| SCH\_PMAJAY\_GIA                                                                                                                             | R\_PMAJAY\_01 | user.caste\_category   | Equals 'SC'                                            | Mandatory AND   | Reject: PM-AJAY GIA funds are constitutionally and statutorily reserved for Scheduled Castes.    |
| SCH\_PMAJAY\_GIA                                                                                                                             | R\_PMAJAY\_02 | user.annual\_income    | Less than or equal to 300000                           | Mandatory AND   | Reject: Household income exceeds Double Poverty Line criteria for state livelihood grants.       |
| SCH\_NSFDC\_MSY                                                                                                                              | R\_MSY\_01    | user.gender            | Equals 'FEMALE'                                        | Mandatory AND   | Reject: Mahila Samriddhi Yojana is exclusively reserved for women entrepreneurs.                 |
| SCH\_NSFDC\_MSY                                                                                                                              | R\_MSY\_02    | user.caste\_category   | Equals 'SC'                                            | Mandatory AND   | Reject: NSFDC schemes require official Scheduled Caste community certification.                  |
| SCH\_NSFDC\_MSY                                                                                                                              | R\_MSY\_03    | user.annual\_income    | Less than or equal to 300000                           | Mandatory AND   | Reject: Income exceeds NSFDC statutory Double Poverty Line ceiling.                              |
| SCH\_MSME[span\_265]\(start\_span)[span\_265]\(end\_span)[span\_267]\(start\_span)[span\_267]\(end\_span)\_PMEGP                             | R\_PMEGP\_01  | user.age               | Greater than or equal to 18                            | Mandatory AND   | Reject: Applicant must be minimum 18 years of age to sign commercial credit contracts.           |
| SCH\_MSME\_PMEGP                                                                                                                             | R\_PMEGP\_02  | business.project\_cost | If Manufacturing > Rs. 10 Lakh, Education >= 8th\_pass | Conditional AND | Flag: For manufacturing projects above 10 Lakh, minimum 8th class educational pass is mandatory. |
| SCH\_MOF\_MUDRA                                                                                                                              | R\_MUDRA\_01  | user.credit\_record    | Zero formal banking defaults                           | Mandatory AND   | Reject: Commercial bank NPA/default status invalidates CGFMU credit guarantee cover.             |



PART 17 — Andhra Pradesh Dataset

The institutional ecosystem in Andhra Pradesh operates across 26 reorganized administrative districts, where the Scheduled Caste community accounts for 17.1% of the total population. Livelihood initiatives converge through two primary state bodies: the Andhra Pradesh State Skill Development Corporation (APSSDC), which oversees training delivery through constituency-level Skill Hubs and district-level Skill Colleges, and the Andhra Pradesh Scheduled Castes Co-operative Finance Corporation Ltd. (APSCCFC), which channels NSFDC concessional credit lines and state margin money subsidies.

| **District NameDistrict HeadquartersSC Population ProportionDominant Sub-Caste ClustersLeading District Industrial / Agricultural SectorsAPSSDC Identified Priority Skilling SectorsDistrict Skill Nodal Office Location** |               |       |                     |                                                                                 |                                                                       |                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- | ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| Bapatla                                                                                                                                                                                                                    | Bapatla       | 18.2% | Madiga, Mala        | Marine aquaculture, paddy milling, textile handlooms, rural construction.       | Green energy pump wiring, garment stitching, aquaculture technician.  | APSSDC DSDO, Viswabrahmana Colony, Bapatla.       |
| Guntur                                                                                                                                                                                                                     | Guntur        | 19.1% | Mala, Madiga        | Cotton processing, spices & chilli export, commercial construction, healthcare. | Apparel tailoring, electrical installation, logistics & retail.       | APSSDC State HQ / Guntur DSDO, Tadepalli.         |
| Srikakulam                                                                                                                                                                                                                 | Srikakulam    | 10.1% | Relli, Mala, Madiga | Cashew processing, marine fisheries, rural artisan crafts, two-wheeler trade.   | Two-wheeler repair, sanitary plumbing, cashew machinery operation.    | APSSDC DSDO, Govt. ITI Campus, Srikakulam.        |
| Visakhapatnam                                                                                                                                                                                                              | Visakhapatnam | 8.8%  | Mala, Relli         | Heavy industry, steel manufacturing, IT clusters, coastal shipping.             | Rooftop solar installer, home appliance technician, CNC operation.    | APSSDC Regional Centre, AU Campus, Visakhapatnam. |
| Kurnool                                                                                                                                                                                                                    | Kurnool       | 18.6% | Madiga, Mala        | Cement processing, solar energy parks, dryland agro-machinery.                  | Solar PV installation, tractor mechanics, domestic electrical wiring. | APSSDC DSDO, Govt. Polytechnic Campus, Kurnool.   |



PART 18 — Multilingual Dataset

Multilingual speech interfaces require precise, verified occupational terms across English, Telugu, and Hindi to communicate technical concepts clearly to rural beneficiaries. Official NCVET and SSC terminologies are utilized wherever documented, complemented by standardized colloquial phrasing for conversational fluency:

| **Concept IdentifierEnglish Canonical TermTelugu Localized TermHindi Localized Term Functional Definition / Voice UsageTranslation Category** |                        |                                                                   |                                                      |                                                                        |                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| TERM\_OCC\_001                                                                                                                                | Self Employed Tailor   | స్వయం ఉపాధి దర్జీ (Swayam Upadhi Darjee)                          | स्व-नियोजित दर्जी (Swa-Niyojit Darzi)                | Individual stitching and running an independent boutique.              | Verified Official (NCVET QP translation).     |
| TERM\_OCC\_002                                                                                                                                | Assistant Electrician  | సహాయక ఎలక్ట్రీషియన్ (Sahayaka Electrician)                        | सहायक इलेक्ट्रीशियन (Sahayak Electrician)            | Technician laying domestic wiring and panels.                          | Verified Official (CSDCI Model Curriculum).   |
| TERM\_OCC\_003                                                                                                                                | Plumber - General      | సాధారణ ప్లంబర్ (Sadharana Plumber)                                | सामान्य प्लंबर (Samanya Plumber)                     | Technician fixing water supply and drainage systems.                   | Verified Official (WMPSC Curriculum).         |
| TERM\_OCC\_004                                                                                                                                | Solar PV Installer     | సోలార్ పీవీ ఇన్‌స్టాలర్ (Solar PV Installer)                      | सोलर पीवी इंस्टॉलर (सूर्यमित्र) (Solar PV Installer) | Technician assembling rooftop solar panels and inverters.              | Verified Official (SCGJ Suryamitra Register). |
| TERM\_OCC\_005                                                                                                                                | Two Wheeler Technician | ద్విచక్ర వాహన సర్వీస్ టెక్నీషియన్ (Dvichakra Vahana Service Tech) | दोपहिया सेवा तकनीशियन (Dopahiya Seva Technician)     | Mechanic servicing motorcycles and scooters.                           | Verified Official (ASDC Curriculum).          |
| TERM\_CON\_001                                                                                                                                | Skill Gap              | నైపుణ్య లోపం (Naipunya Lopam)                                     | कौशल अंतर (Kaushal Antar)                            | The missing competencies needed to obtain a trade certificate.         | Machine-assisted localized translation        |
| TERM\_CON\_002                                                                                                                                | Capital Subsidy        | పెట్టుబడి సబ్సిడీ (Pettubadi Subsidy)                             | पूंजीगत सब्सिडी (Poonjigat Subsidy)                  | Non-repayable government funding reducing bank loan principal.         | Machine-assisted localized translation.       |
| TERM\_CON\_003                                                                                                                                | Self-Employment        | స్వయం ఉపాధి (Swayam Upadhi)                                       | स्वरोजगार (Swarojgar)                                | Establishing one's own micro-enterprise rather than working for wages. | Verified Official (MoSPI Survey Terms).       |
| TERM\_CON\_004                                                                                                                                | Wage Employment        | వేతన ఉపాధి (Vetana Upadhi)                                        | वेतन रोजगार (Vetan Rojgar)                           | Working in a factory, shop, or enterprise for fixed wages.             | Verified Official (MoSPI Survey Terms).       |



PART 19 — Voice Assessment Dataset

The voice diagnostic flow guides low-literacy users through a sequence of spoken inquiries. Spoken responses are converted into structured database parameters that drive the underlying matching algorithms:

| **Question IDCategoryVoice Question (English)Voice Question (Telugu)Voice Question (Hindi)Expected Data TypePermitted Input OptionsTarget Database ColumnSystem Rationale** |            |                                                                 |                                                                                         |                                                                                    |                |                                                                                                                       |                                        |                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| Q\_VOICE\_001                                                                                                                                                               | Profile    | What is your age?                                               | మీ వయస్సు ఎంత?                                                                          | आपकी उम्र कितनी है?                                                                | Integer        | 18 to 70                                                                                                              | user\_profile.age                      | Validates minimum and maximum age thresholds for schemes.                             |
| Q\_VOICE\_002                                                                                                                                                               | Geography  | Which district do you live in?                                  | మీరు ఏ జిల్లాలో నివసిస్తున్నారు?                                                        | आप किस जिले में रहते हैं?                                                          | Categorical    | AP 26 Districts / National List                                                                                       | user\_profile.district                 | Links to local skill demand and available training centers.                           |
| Q\_VOICE\_003                                                                                                                                                               | Education  | What is your highest completed schooling?                       | మీరు ఎంతవరకు చదువుకున్నారు?                                                             | आपने कहाँ तक पढ़ाई की है?                                                          | Categorical    | none, 5th\_pass, 8th\_pass, 10th\_pass, 12th\_pass, iti\_diploma, graduate                                            | user\_profile.education\_level         | Verifies prerequisite entry criteria for NSQF qualification packs.                    |
| Q\_VOICE\_004                                                                                                                                                               | Skills     | What work or trade do you already know?                         | మీకు ఇప్పటికే తెలిసిన పని లేదా నైపుణ్యం ఏమిటి?                                          | आपको पहले से कौन सा काम या हुनर आता है?                                            | Multi-Select   | tailoring, electrical, plumbing, two\_wheeler, carpentry[span\_83]\(start\_span)[span\_83]\(end\_span), masonry, none | user\_skill\_profile.trade\_code       | Identifies baseline competencies for skill-gap and RPL mapping.                       |
| Q\_VOICE\_005                                                                                                                                                               | Experience | How many years have you been doing this work?                   | మీరు ఈ పనిని ఎన్ని సంవత్సరాల నుండి చేస్తున్నారు?                                        | आप यह काम कितने सालों से कर रहे हैं?                                               | Integer        | 0 to 40                                                                                                               | user\_skill\_profile.years\_experience | Determines eligibility for RPL fast-track vs full-length fresh skilling.              |
| Q\_VOICE\_006                                                                                                                                                               | Intent     | Do you want a monthly salary job or to start your own business? | మీరు జీతం వచ్చే ఉద్యోగం చేయాలనుకుంటున్నారా లేక సొంత వ్యాపారం ప్రారంభించాలనుకుంటున్నారా? | क्या आप वेतन वाली नौकरी करना चाहते हैं या अपना खुद का व्यवसाय शुरू करना चाहते हैं? | Single Select  | wage\_employment, self\_employment, both                                                                              | user\_profile.pathway\_preference      | Branches recommendations into wage employment vs micro-enterprise paths.              |
| Q\_VOICE\_007                                                                                                                                                               | Finance    | What is your total family income in a year?                     | మీ కుటుంబ వార్షిక ఆదాయం ఎంత?                                                            | आपके परिवार की साल भर की कुल कमाई कितनी है?                                        | Float / Range  | under\_1lakh, 1lakh\_to\_3lakh, above\_3lakh                                                                          | user\_profile.annual\_income           | Enforces Double Poverty Line (< Rs. 3 Lakh) criteria for PM-AJAY and NSFDC subsidies. |
| Q\_VOICE\_008                                                                                                                                                               | Tools      | Do you own any machines or tools for this work?                 | మీ వద్ద పనికి సంబంధించిన యంత్రాలు లేదా ఉపకరణాలు ఉన్నాయా?                                | क्या आपके पास काम करने के लिए कोई मशीन या औजार हैं?                                | Boolean / Text | sewing\_machine, basic\_tools, none                                                                                   | user\_profile.tools\_owned             | Offsets initial capital expenditure requirements in micro-enterprise modeling.        |



PART 20 — SQLite Database Design

The relational database architecture is structured around normalized entity sets enforcing referential integrity, domain check constraints, and indexed retrieval paths.

The structural relationships connecting the system entities operate as follows:

⚬ An individual beneficiary in `user_profile` maintains a one-to-many relationship with `user_skill_profile` to capture multiple self-reported competencies.

⚬ Trade competencies link to the normalized `skills` catalog, which connects through `skill_occupation_mapping` to formal `occupations`.

⚬ Each occupation maps directly to NCVET-approved `nsqf_qualifications`.

⚬ A single qualification branches into accredited `courses` offered at physical `training_cen[span_35](start_span)[span_35](end_span)[span_37](start_span)[span_37](end_span)tres`, as well as evaluated `business_options` for self-employment.

⚬ Each enterprise option defines an itemized bill of materials in `business_equipment` and links through `scheme_business_mapping`to eligible `government_schemes`.

⚬ District-level industrial priorities in `district_skill_demand` contextualize occupational recommendations against local economic opportunities.

The complete Data Definition Language (DDL) specifications are defined below:

`[sql]`
`CREATE TABLE user_profile (`
`user_id TEXT PRIMARY KEY,`
`spoken_name TEXT,`
`age INTEGER CHECK(age >= 15 AND age <= 80),`
`gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'OTHER')),`
`caste_category TEXT CHECK(caste_category IN ('SC', 'ST', 'OBC', 'GENERAL')),`
`sub_caste TEXT,`
`state TEXT DEFAULT 'Andhra Pradesh',`
`district TEXT NOT NULL,`
`mandal_or_block TEXT,`
`village_or_town TEXT,`
`preferred_language TEXT CHECK(preferred_language IN ('en', 'te', 'hi')),`
`education_level TEXT CHECK(education_level IN ('none', '5th_pass', '8th_pass', '10th_pass', '12th_pass', 'iti_diploma', 'graduate')),`
`annual_income REAL DEFAULT 0.0,`
`pathway_preference TEXT CHECK(pathway_preference IN ('wage_employment', 'self_employment', 'both')),`
`created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`
`updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
`);`

`CREATE TABLE skills (`
`skill_id TEXT PRIMARY KEY,`
`canonical_name TEXT UNIQUE NOT NULL,`
`domain TEXT NOT NULL,`
`description TEXT,`
`verification_type TEXT CHECK(verification_type IN ('Official `—` Primary Source', 'Official `—` Government-Backed', 'Derived `—` Research Mapping', 'Indicative `—` Market Estimate', 'Unverified')),`
`source_reference TEXT NOT NULL`
`);`

`CREATE TABLE occupations (`
`occupation_id TEXT PRIMARY KEY,`
`occupation_title TEXT NOT NULL,`
`nco_code TEXT NOT NULL,`
`sector_skill_council TEXT NOT NULL,`
`entry_education TEXT NOT NULL,`
`self_employment_potential TEXT CHECK(self_employment_potential IN ('High', 'Medium', 'Low')),`
`verification_status TEXT NOT NULL`
`);`

`CREATE TABLE nsqf_qualifications (`
`qualification_code TEXT PRIMARY KEY,`
`qualification_name TEXT NOT NULL,`
`sector TEXT NOT NULL,`
`nsqf_level INTEGER CHECK(nsqf_level BETWEEN 1 AND 10),`
`theory_hours INTEGER NOT NULL,`
`practical_hours INTEGER NOT NULL,`
`employability_hours INTEGER DEFAULT 60,`
`total_hours INTEGER NOT NULL,`
`entry_requirement TEXT NOT NULL,`
`official_source_url TEXT NOT NULL,`
`last_verified DATE NOT NULL`
`);`

`CREATE TABLE skill_occupation_mapping (`
`mapping_id TEXT PRIMARY KEY,`
`skill_id TEXT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,`
`occupation_id TEXT NOT NULL REFERENCES occupations(occupation_id) ON DELETE CASCADE,`
`relevance_weight REAL CHECK(relevance_weight BETWEEN 0.0 AND 1.0)`
`);`

`CREATE TABLE courses (`
`course_id TEXT PRIMARY KEY,`
`course_name TEXT NOT NULL,`
`qualification_code TEXT NOT NULL REFERENCES nsqf_qualifications(qualification_code),`
`delivery_mode TEXT CHECK(delivery_mode IN ('Classroom', 'Practical Lab', 'Apprenticeship', 'Hybrid')),`
`duration_hours INTEGER NOT NULL,`
`curriculum_url TEXT`
`);`

`CREATE TABLE training_centres (`
`centre_id TEXT PRIMARY KEY,`
`centre_name TEXT NOT NULL,`
`operating_agency TEXT NOT NULL,`
`district TEXT NOT NULL,`
`state TEXT DEFAULT 'Andhra Pradesh',`
`pincode TEXT NOT NULL,`
`address TEXT NOT NULL,`
`contact_phone TEXT,`
`is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1))`
`);`

`CREATE TABLE district_skill_demand (`
`demand_id TEXT PRIMARY KEY,`
`district TEXT NOT NULL,`
`state TEXT DEFAULT 'Andhra Pradesh',`
`occupation_id TEXT NOT NULL REFERENCES occupations(occupation_id),`
`demand_indicator TEXT CHECK(demand_indicator IN ('High', 'Medium', 'Low', 'Unknown')),`
`demand_source_document TEXT NOT NULL,`
`last_updated DATE NOT NULL`
`);`

`CREATE TABLE business_options (`
`business_id TEXT PRIMARY KEY,`
`business_title TEXT NOT NULL,`
`mapped_qualification TEXT NOT NULL REFERENCES nsqf_qualifications(qualification_code),`
`indicative_capex REAL NOT NULL,`
`indicative_opex_60d REAL NOT NULL,`
`total_investment REAL NOT NULL,`
`estimated_monthly_margin REAL,`
`payback_months INTEGER,`
`data_classification TEXT DEFAULT 'Derived `—` Research Mapping'`
`);`

`CREATE TABLE business_equipment (`
`equipment_id TEXT PRIMARY KEY,`
`business_id TEXT NOT NULL REFERENCES business_options(business_id) ON DELETE CASCADE,`
`equipment_name TEXT NOT NULL,`
`is_mandatory INTEGER DEFAULT 1 CHECK(is_mandatory IN (0, 1)),`
`quantity INTEGER DEFAULT 1,`
`unit_price_estimate REAL NOT NULL,`
`price_source_type TEXT DEFAULT 'Indicative `—` Market Estimate'`
`);`

`CREATE TABLE government_schemes (`
`scheme_id TEXT PRIMARY KEY,`
`scheme_name TEXT NOT NULL,`
`official_code TEXT,`
`ministry TEXT NOT NULL,`
`target_caste TEXT CHECK(target_caste IN ('SC_ONLY', 'ALL_CATEGORIES', 'SPECIAL_CATEGORY')),`
`gender_restriction TEXT CHECK(gender_restriction IN ('FEMALE_ONLY', 'ANY')),`
`max_family_income REAL,`
`min_age INTEGER DEFAULT 18,`
`max_age INTEGER DEFAULT 65,`
`max_loan_amount REAL,`
`max_subsidy_amount REAL,`
`subsidy_percentage REAL,`
`interest_rate REAL,`
`application_portal_url TEXT NOT NULL,`
`is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),`
`verification_status TEXT NOT NULL`
`);`

`CREATE TABLE scheme_business_mapping (`
`scheme_map_id TEXT PRIMARY KEY,`
`scheme_id TEXT NOT NULL REFERENCES government_schemes(scheme_id) ON DELETE CASCADE,`
`business_id TEXT NOT NULL REFERENCES business_options(business_id) ON DELETE CASCADE,`
`funding_nature TEXT CHECK(funding_nature IN ('CAPITAL_SUBSIDY', 'TERM_LOAN', 'WORKING_CAPITAL', 'COMPOSITE'))`
`);`

`CREATE INDEX idx_user_district ON user_profile(district);`
`CREATE INDEX idx_demand_district ON district_skill_demand(district, occupation_id);`
`CREATE INDEX idx_course_qualification ON courses(qualification_code);`
`CREATE INDEX idx_business_qualification ON business_options(mapped_qualification);`
`CREATE INDEX idx_scheme_caste_income ON government_schemes(target_caste, max_family_income);`


PART 21 — JSON Dataset Structure

Machine-readable JSON structures allow seamless ingestion into document-oriented search indices, caching layers, and microservices.

JSON Structure: NSQF Qualification Record

`[json]`
`{`
`"qualification_code": "AMH/Q1947",`
`"qualification_name": "Self Employed Tailor",`
`"version": "3.0",`
`"sector": "Apparel, Made-Ups & Home Furnishing",`
`"sub_sector": "Apparel",`
`"nsqf_level": 4,`
`"notional_hours": {`
`"theory": 90,`
`"practical": 240,`
`"employability_skills": 60,`
`"on_the_job_training": 0,`
`"total": 390`
`},`
`"entry_requirements": {`
`"minimum_education": "8th Class pass",`
`"minimum_age": 18,`
`"prior_experience": "NIL with 8th pass, or 3 years relevant experience with 5th pass"`
`},`
`"compulsory_nos": [`
`{ "nos_code": "AMH/N1947", "nos_name": "Draft and cut fabric for garments", "credits": 4 },`
`{ "nos_code": "AMH/N1948", "nos_name": "Stitch and assemble garment components", "credits": 5 },`
`{ "nos_code": "AMH/N1949", "nos_name": "Alter and fit garments as per customer request", "credits": 3 },`
`{ "nos_code": "DGT/VSQ/N0102", "nos_name": "Employability Skills", "credits": 2 }`
`],`
`"provenance": {`
`"regulatory_body": "NCVET",`
`"approval_meeting": "13th NSQC Meeting",`
`"source_url": "https://pmajay.dosje.gov.in/Writereaddata/Guidelines.pdf",`
`"verification_status": "Official `—` Primary Source",`
`"last_audit": "2026-04-16"`
`}`
`}`


JSON Structure: Microenterprise Livelihood Record

`[json]`
`{`
`"business_id": "BIZ_APP_001",`
`"business_title": "Rural Women Tailoring & Boutique Centre",`
`"mapped_job_role": "Self Employed Tailor (AMH/Q1947)",`
`"financial_breakdown_inr": {`
`"capital_expenditure_capex": 42000.00,`
`"operational_expenditure_opex_60d": 18000.00,`
`"total_initial_investment": 60000.00,`
`"estimated_monthly_net_margin": 15000.00,`
`"payback_period_months": 6`
`},`
`"equipment_bom": [`
`{`
`"item_id": "EQ_SEW_001",`
`"item_name": "Industrial Single Needle Direct-Drive Lockstitch Machine",`
`"quantity": 1,`
`"mandatory": true,`
`"indicative_price_inr": 28000.00,`
`"pricing_basis": "Indicative `—` Market Estimate"`
`},`
`{`
`"item_id": "EQ_SEW_002",`
`"item_name": "Heavy Dry Steam Press Iron and Board",`
`"quantity": 1,`
`"mandatory": true,`
`"indicative_price_inr": 6000.00,`
`"pricing_basis": "Indicative `—` Market Estimate"`
`},`
`{`
`"item_id": "EQ_SEW_003",`
`"item_name": "Pattern Drafting Shear, Rulers, Cutting Table Wooden Setup",`
`"quantity": 1,`
`"mandatory": true,`
`"indicative_price_inr": 8000.00,`
`"pricing_basis": "Indicative `—` Market Estimate"`
`}`
`],`
`"applicable_funding_schemes": [`
`{`
`"scheme_id": "SCH_NSFDC_MSY",`
`"scheme_name": "Mahila Samriddhi Yojana",`
`"loan_percentage": 90,`
`"interest_rate_pa": 4.0,`
`"subsidy_applicable": "Under PM-AJAY GIA Convergence up to 50%"`
`}`
`],`
`"provenance": {`
`"classification": "Derived `—` Research Mapping",`
`"verified_by_analyst": "Skilling Enterprise Engine",`
`"verification_status": "Verified Against MSME Benchmarks",`
`"last_audit": "2026-04-16"`
`}`
`}`


PART 22 — RAG / Knowledge Base Structure

The knowledge base employs a clear separation between structured relational data and unstructured document retrieval to preserve factual precision:

The operational data flow routes user queries through parallel validation tracks:

⚬ A spoken voice query is transcribed and parsed into explicit parameters (caste, age, location, existing skills, income).

⚬ Quantitative constraints and eligibility checks execute deterministically against the SQLite database.

⚬ Policy documents, administrative manuals, and grievance redressal frameworks are queried from the ChromaDB vector collection.

⚬ The deterministic database output and retrieved policy context are synthesized by the LLM into localized speech responses.

Storage Segmentation Strategy

⚬ Structured Relational Store (SQLite): Enforces hard constraints, numerical eligibility thresholds, NCVET qualification pack codes, notional hours, accredited training center coordinates, and foreign key linkages. The LLM is strictly prohibited from dynamically computing these values.

⚬ Document Vector Store (ChromaDB): Houses unstructured administrative guidelines, operational circulars, scheme application instructions, escalation hierarchies, and legal protections under the SC/ST Prevention of Atrocities Act.

Document Chunking and Metadata Schema

⚬ Source Document: PM-AJAY Centrally Sponsored Scheme Guidelines (May 2023).

⚬ Chunk Size: 400 Tokens (Overlap: 50 Tokens).

⚬ Metadata Payload:

`[json]`
`{`
`"source_id": "SRC_GOI_PMAJAY_2023",`
`"chapter": 3,`
`"component": "Grants-in-Aid",`
`"subject": "Skill Development and Women Earmarks",`
`"statutory_page": 19,`
`"authority": "MoSJE",`
`"target_demographic": "SC"`
`}`


⚬ Source Document: NSFDC Operational Guidelines and Lending Policies.

⚬ Chunk Size: 350 Tokens (Overlap: 40 Tokens).

⚬ Metadata Payload:

`[json]`
`{`
`"source_id": "SRC_GOI_NSFDC_2023",`
`"scheme_code": "MSY",`
`"target_gender": "Female",`
`"income_limit": 300000,`
`"interest_rate": 4.0,`
`"portal": "https://nsfdc.nic.in"`
`}`


⚬ Source Document: APSSDC District Skill Gap Study & Operational Guidelines.

⚬ Chunk Size: 500 Tokens (Overlap: 60 Tokens).

⚬ Metadata Payload:

`[json]`
`{`
`"source_id": "SRC_AP_APSSDC_2024",`
`"state": "Andhra Pradesh",`
`"district": "Bapatla",`
`"theme": "Local Industrial Clusters and Training Infrastructure"`
`}`


PART 23 — Data Provenance & Verification

Source Verification Hierarchy

To maintain strict data integrity, information ingested into SkillSphere is classified across four operational tiers:

⚬ Tier 1 (Authoritative Primary Government Sources): Gazettes of India, official departmental notifications from `dosje.gov.in`, NCVET national qualification files, MoSPI PLFS reports, and Census of India publications. Records from these sources are treated as absolute truth.

⚬ Tier 2 (Official Ecosystem Sources): State Skill Development Mission circulars (`apssdc.in`), Sector Skill Council curriculum documents, and public sector bank lending schedules. These records require verification against primary departmental releases.

⚬ Tier 3 (Derived Institutional Mappings): System calculations that compare baseline competencies against mandatory qualification standards. These are tagged explicitly as `Derived — Research Mapping`.

⚬ Tier 4 (Indicative Market Data): Prevailing commercial estimates for machinery costs, toolkits, and raw materials. These are classified as `Indicative — Market Estim[span_46](start_span)[span_46](end_span)[span_51](start_span)[span_51](end_span)ate` and reviewed biannually.

Anti-Hallucination Guardrail Protocol

Every recommendation delivered to the user must maintain end-to-end traceability through an auditable verification trail:

⚬ The user is matched to a specific recommendation identifier (e.g., `SCH_NSFDC_MSY`).

⚬ The system cross-references the matching database row and corresponding ChromaDB source chunk.

⚬ The interface retrieves the primary statutory document name, section number, and official government portal URL.

Operational safeguards enforce three mandatory protocols:

⚬ Negative Constraint Enforcement: The generative model is barred from stating eligibility unless the deterministic rule engine emits a signed boolean `TRUE` flag for that scheme.

⚬ Statutory Earmark Guard: If a project proposal lacks a direct funding allocation under the district's PM-AJAY Perspective Plan, the system must declare: *"This course is aligned with NSQF standards and Skill India networks; however, direct PM-AJAY GIA subsidy depends on current District Level Convergence Committee (DLCC) sanctions"*.

⚬ Data Conflict Resolution: If two official sources conflict (such as discrepancies between older portal text and revised guidelines), the record with the more recent publication date takes precedence. The older version is archived with an audit trail documenting the update.

PART 24 — Dataset Coverage

The table below summarizes dataset coverage, record counts, and provenance classifications across all functional entities:

| **Dataset Segment EntityTotal Master RecordsPrimary Source Records (Tier 1)Ecosystem Records (Tier 2)Derived System Records (Tier 3)Indicative Market RecordsRecords Requiring Manual Audit** |     |            |           |            |            |          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- | --------- | ---------- | ---------- | -------- |
| user\_profile\_fields                                                                                                                                                                         | 16  | 16 (100%)  | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| skills                                                                                                                                                                                        | 14  | 14 (100%)  | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| occupations                                                                                                                                                                                   | 6   | 6 (100%)   | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| nsqf\_qualifications                                                                                                                                                                          | 6   | 6 (100%)   | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| skill\_gaps                                                                                                                                                                                   | 4   | 0 (0%)     | 0 (0%)    | 4 (100%)   | 0 (0%)     | 0        |
| courses                                                                                                                                                                                       | 6   | 4 (66.7%)  | 2 (33.3%) | 0 (0%)     | 0 (0%)     | 0        |
| training\_centres                                                                                                                                                                             | 5   | 5 (100%)   | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| district\_skill\_demand                                                                                                                                                                       | 7   | 5 (71.4%)  | 2 (28.6%) | 0 (0%)     | 0 (0%)     | 0        |
| business\_options                                                                                                                                                                             | 4   | 0 (0%)     | 0 (0%)    | 4 (100%)   | 0 (0%)     | 0        |
| business\_equipment                                                                                                                                                                           | 12  | 0 (0%)     | 0 (0%)    | 0 (0%)     | 12 (100%)  | 2        |
| government\_schemes                                                                                                                                                                           | 5   | 5 (100%)   | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| scheme\_eligibility                                                                                                                                                                           | 8   | 8 (100%)   | 0 (0%)    | 0 (0%)     | 0 (0%)     | 0        |
| scheme\_business\_mapping                                                                                                                                                                     | 8   | 4 (50%)    | 0 (0%)    | 4 (50%)    | 0 (0%)     | 0        |
| Aggregate Metrics                                                                                                                                                                             | 101 | 69 (68.3%) | 4 (4.0%)  | 16 (15.8%) | 12 (11.9%) | 2 (2.0%) |



PART 25 — DATA GAPS

To ensure transparency, data limitations identified during research are documented below:

⚬ Andhra Pradesh Reorganized District Granularity: Following the April 2022 reorganization of Andhra Pradesh from 13 to 26 districts, several newly formed districts (such as Bapatla, Palnadu, and Manyam) lack finalized, standalone District Skill Development Plans (DSDPs). Skilling demand for these locations is currently interpolated from parent district documents (such as Guntur and Prakasam) alongside recent APSSDC administrative releases.

⚬ Dynamic District Livelihood Allocations: Real-time fund availability under the GIA component of PM-AJAY is not published via an automated public API. Allocations depend on Project Appraisal cum Convergence Committee (PACC) minutes and annual State Perspective Plans. System recommendations must explicitly note that local GIA capital subsidies remain subject to active district DLCC sanction limits.

⚬ Hyper-Local Equipment Pricing: Indicative capital costs for machinery (such as industrial single-needle lockstitch machines and pipe threading equipment) reflect regional dealer estimates in Andhra Pradesh and major trade portals. These prices fluctuate based on transport costs, taxes, and brand availability, and must be treated as indicative market baselines.

⚬ Multilingual National Occupational Standards Granularity: While NSQF Qualification Pack overviews and course titles are available in Telugu and Hindi, detailed National Occupational Standards (NOS) performance criteria and technical training handbooks are published primarily in English. The conversational engine's voice interactions therefore utilize verified colloquial vernacular translations to bridge this gap.

PART 26 — IMPLEMENTATION RECOMMENDATION

To translate this research architecture into the operational SkillSphere / Sarathi AI platform for the Smart India Hackathon 2026, development should proceed through four sequential phases:

Database Deployment and Seeding

⚬ Initialize the SQLite relational database using the Data Definition Language schema provided in Part 20.

⚬ Seed master tables with verified data records from Parts 3, 5, 6, 7, 9, 10, 15, and 17.

⚬ Enforce foreign key constraints across skills, qualifications, courses, and government welfare schemes to maintain data integrity.

Deterministic Rule Engine Implementation

⚬ Implement boolean eligibility validators in application code (Python or Node.js) based on the criteria in Part 16, rather than relying on generative model prompts.

⚬ Program heuristic skill-gap diagnostic logic that maps user competencies against mandatory NOS units to recommend specific bridge courses.

⚬ Configure ranking algorithms to prioritize schemes offering higher net capital subsidies to eligible SC beneficiaries.

Vector Knowledge Base Configuration

⚬ Populate a ChromaDB vector store with chunked policy PDFs and operational manuals (Part 22), indexing the PM-AJAY May 2023 Guidelines, NSFDC Lending Policies, and APSSDC district publications.

⚬ Tag each chunk with rich administrative metadata (scheme code, chapter, target demographic, page number) to support filtered semantic retrieval.

Voice Orchestration and Multilingual Delivery

⚬ Integrate multilingual Automated Speech Recognition (ASR) models (such as Bhashini or Whisper) calibrated for Telugu, Hindi, and English to execute the conversational assessment workflow in Part 19.

⚬ Map extracted speech entities directly to fields in `user_profile` and `user_skill_profile`.

⚬ Pass deterministic database matches and retrieved policy chunks to the LLM to synthesize natural, supportive conversational explanations, directing beneficiaries to their nearest District Social Welfare Office or APSSDC Skill Hub.




Sources used in the report
pradhan mantri - anusuchit jaati abhyuday yojana (pm-ajay)

Government of India - PM-AJAY

GIA-17021/1/2026-PMAJAY - Government of India

GIA-17021/1/2026-PMAJAY - Government of India

IND PLFS 2024 Questionnaire | PDF - Scribd

The self-employment paradox in India: growing numbers, declining

वार्षिक रिपोर्ि, पीएलएफएस, 2025/Annual Report, PLFS, 2025

f'tritt, q1qe1qlfiq8, 2023-24 ANNUAL REPORT, PLFS, 2023-24

Gendered Pattern of Labour Force Participation in India

13th Meeting of the National Skills Qualifications Committee (NSQC)

Trainer Qualification Requirements for MMKVY | PDF - Scribd

Assistant Electrician Qualification Pack | PDF | Electrical Wiring

Assistant Electrician - Amazon S3

Assistant Electrician Curriculum PDF - Scribd

Participant Handbook - The Skill Council for Persons with Disability

Plumber General Model Curriculum Guide | PDF | Plumbing - Scribd

Plumber - General - wmpsc

Model Curriculum - Bihar Skill Development Mission

District Skill Development Plan for Tiruvannamalai

A Guide to Government Subsidy Loan for Businesses in India

National Scheduled Castes Finance and Development Corporation

GOA STATE SCHEDULED CASTES AND OTHER BACKWARD

NSFDC - Schemes, Features, Certificate, Courses, Training Partners

National Institutes for SC welfare | Vikaspedia

AP & Telangana Mala Madiga SC Caste Census Data 2011

Livelihoods and Well-Being of a Community in Scheduled Castes

Solar PV Installer (Suryamitra) - Amazon S3

Solar PV Installer (Suryamitra) - Amazon S3

PMKVY Available Courses - Rita Charitable Trust

Suryamitra Solar PV Installer Curriculum | PDF | Photovoltaic System

Auto Service Technician (Two Wheelers) - ASC/Q1411 (NSQF Level 4)

Model Curriculum - Government ITI, Latur

QP - Two Wheeler Service Technician | PDF - Scribd

Apssdc District Skill Development Office in Bapatla - PlanetSpark

andhra pradesh state skill development corporation

District Institute Of Education And Training Parlakhemundi in

Empowering Andhra Pradesh through Skill Development

APSSDC's skill based ecosystem strives to balance IT skills with

Andhra Pradesh State Skill Development Corporation Proposes

SC CORPORATION | Kakinada District | India




Sources read but not used
Government of India - PM-AJAY

SCA-11014/31/2021-SCA to SCSP Government of India - PM-AJAY

r - Pradhan Mantri Anusuchit Jaati Abhyuday Yojna (PM-AJAY)

GIA-17021/1/2026-PMAJAY - Government of India

\:::m,,, - PM-AJAY - Ministry of Social Justice and Empowerment

government of india - lok sabha

About PM Anusuchit Jaati Abhyuday Yojana: UPSC Current Affairs

Periodic Labour Force Survey (PLFS)

JUNE 2025 S

STATE OF WORKING INDIA 2023 - Azim Premji University

The Namesake Equality - Advisory on Women Workforce Participation

े कमचा रय के लए अनुदेश Instructions to Field Staff

QP CON\_Q0602\_v4.0 | PDF | Electricity | Electrician - Scribd

empanelment of service providers for the rpl training of registered

SELECTION OF TRAINING PROVIDERS To establish ... - Skill council

\\\:ff\:T,JJ38l3 - Ministry of Skill Development and Entrepreneurship

Ghani Khan Choudhury Institute of Engineering and Technology

Rajashtna Skills & Livelihoods Development Corporation

National Academy of Construction

PLUMBER - AWS

Textbook XII Plumber General - Compressed | PDF | Plumbing - Scribd

Vadhvan Port Project Limited - Skill council

COMPANY INFORMATION - NSFDC

Annual Report on Social Justice 2020-21 | PDF | Government Of India

NSFDC Education Loan Scheme up to ₹30 lakh for SC students.

2.pdf

How is the NSFDC Scheme uplifting scheduled caste entrepreneurs

Scheduled Castes (SCs) and Tribes (STs) in Andhra Pradesh

Installation of Solar PV System and Maintenance - PSSCIVE, Bhopal

Solar PV Installer Curriculum Overview | PDF | Photovoltaic System

Solar PV Installer Curriculum Overview | PDF | Photovoltaics - Scribd

Solar Panel Installation Technician Curriculum | PDF - Scribd

RULE book for Skill BAsed Training, Internships and Placements

PMKVY 2.0 Job roles - Sunaina Samriddhi Foundation - Slideshare

APSSDC Training Partners EOI 2025-26 | PDF - Scribd

AP State Skill Development Corporation - Facebook

AP Keen on Shifting NAC Training Centres to APSSDC




Thoughts