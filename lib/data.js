// Public data the agent is allowed to use. Every number has a source.
// Nothing here is invented; fields not disclosed in the source are null.

export const FUNNEL = {
  year: 2026,
  jee_main_unique_appeared: 1538468,
  josaa_total_seats: 67323,
  josaa_breakdown: { IIT_incl_IISc: 18951, NIT: 25162, IIIT: 11518, GFTI: 11692 },
  telangana_private_share: {
    private_seats_filled: 73874,
    private_seats_total: 86387,
    note: "TGEAPCET 2026 Phase-II: private colleges filled 85.5% of their seats; most Telangana engineering students study in private colleges.",
  },
  sources: [
    { name: "PW: JEE Main 2026 result statistics (NTA data)", url: "https://www.pw.live/iit-jee/exams/jee-mains-2026-results-statistics" },
    { name: "Collegedunia: JoSAA 2026 seat matrix", url: "https://collegedunia.com/news/e-301-josaa-seat-matrix-for-iiits" },
    { name: "Deccan Chronicle: TGEAPCET 2026 Phase-II allotment", url: "https://www.deccanchronicle.com/southern-states/telangana/tgeapcet-2026-phase-ii-allotment-80167-seats-filled-14257-remain-vacant-1973277" },
  ],
};

export function funnelShare() {
  return +((FUNNEL.josaa_total_seats / FUNNEL.jee_main_unique_appeared) * 100).toFixed(1);
}

// UG 4-year placement data as filed by each institute in NIRF 2025 (academic year 2023-24).
// type: "govt" is shown only as a reference point.
export const COLLEGES = [
  { name: "JNTUH College of Engineering (Govt, reference)", city: "Hyderabad", state: "Telangana", type: "govt", graduating: 1301, placed: 867, median_lpa: 9.42, source: "https://www.careers360.com/colleges/jntuh-college-of-engineering-hyderabad/placement" },
  { name: "CBIT", city: "Hyderabad", state: "Telangana", type: "private", graduating: null, placed: 786, median_lpa: 6.0, source: "https://www.careers360.com/colleges/chaitanya-bharathi-institute-of-technology-hyderabad" },
  { name: "VNR VJIET", city: "Hyderabad", state: "Telangana", type: "private", graduating: null, placed: 1107, median_lpa: 5.0, source: "https://www.careers360.com/colleges/vnr-vignana-jyothi-institute-of-engineering-and-technology-hyderabad/placement" },
  { name: "Malla Reddy Engineering College (MREC)", city: "Secunderabad", state: "Telangana", type: "private", graduating: 1115, placed: 897, median_lpa: 4.2, source: "https://www.careers360.com/university/malla-reddy-deemed-be-university-secunderabad" },
  { name: "Malla Reddy College of Engineering", city: "Dhulapally", state: "Telangana", type: "private", graduating: null, placed: 351, median_lpa: 4.34, source: "https://www.careers360.com/colleges/malla-reddy-college-of-engineering-dhulapally" },
  { name: "Vidya Jyothi Institute of Technology (VJIT)", city: "Hyderabad", state: "Telangana", type: "private", graduating: null, placed: 798, median_lpa: 4.28, source: "https://www.careers360.com/colleges/vidya-jyothi-institute-of-technology-hyderabad/placement" },
  { name: "Malla Reddy Engg College & Mgmt Sciences", city: "Medchal", state: "Telangana", type: "private", graduating: null, placed: 196, median_lpa: 2.78, source: "https://www.careers360.com/colleges/malla-reddy-engineering-college-and-management-sciences-medchal/placement" },
  { name: "KL University", city: "Guntur", state: "Andhra Pradesh", type: "private", graduating: null, placed: null, median_lpa: 7.6, source: "https://www.shiksha.com/university/kl-deemed-to-be-university-guntur-30751/courses/be-btech-bc" },
];

export const DATA_CAVEAT =
  "Placement figures are self-reported by each institute to NIRF and are not independently audited. Medians are for all UG branches, not CSE alone.";

export function collegesFor(state) {
  const s = (state || "").toLowerCase();
  const list = COLLEGES.filter((c) =>
    s.includes("andhra") ? c.state === "Andhra Pradesh" || c.type === "govt" || c.state === "Telangana" : true
  );
  return list.map((c) => ({
    ...c,
    placed_pct: c.graduating && c.placed ? Math.round((c.placed / c.graduating) * 100) : null,
  }));
}

// What NIAT can honestly claim. No invented placement numbers.
export const NIAT_FACTS = {
  what: "NIAT (NxtWave Institute of Advanced Technologies) runs an industry upskilling program on campus alongside a UGC/AICTE-approved B.Tech awarded by its partner universities.",
  admission: "Through NAT (NxtWave Assessment Test), an online aptitude/maths/critical-thinking test, followed by 1:1 counselling. Registration fee Rs 1,200. NAT does not guarantee university admission; each partner university decides independently.",
  fees: "Reported range Rs 2 to 4.5 lakh per year depending on campus and partner university (Rs 8 to 18 lakh total). Merit scholarships based on NAT score.",
  edge: [
    "Students build real web applications from the first year instead of waiting for final-year placement training.",
    "NIAT reports 200+ stipend internships for students in their first year.",
    "Access to advanced tech clubs: AI, drones, robotics.",
    "Parent company NxtWave's learners have been hired by 2,000+ companies (Amazon, Accenture, IBM, Deloitte and more).",
  ],
  honest_caveat:
    "NIAT started in 2023, so no B.Tech batch has graduated yet and there is no official final placement record. The fair comparison today is internships and skills built in years 1 to 3.",
  sources: [
    { name: "NIAT program page (ccbp.in)", url: "https://nxtwaveprograms.ccbp.in/niat" },
    { name: "CollegeDost: NIAT placements and internships", url: "https://collegedost.in/blog/engineering-colleges/niat-placements/" },
    { name: "CollegeDost: NAT registration 2026", url: "https://collegedost.in/blog/engineering-colleges/nat-registration-2026/" },
  ],
};

export const NAT_URL = "https://www.niatindia.com/";
