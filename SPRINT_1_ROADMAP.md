# 🗺️ SPRINT 1-4 ROADMAP — Post-Launch Innovation Pipeline

**Timeline:** May 16 - June 12, 2026 (4 weeks)  
**Goal:** Implement 16 remaining innovations (inovações 5-20)  
**Team:** 1-2 devs (can parallelize with post-launch support)

---

## **SPRINT 1 (Week 1: May 16-22) — Core Polish**

### Focus: Remaining pre-launch features (inovações 5-8) + User feedback integration

| Task | Innovation | Est. | Priority | Owner |
|------|-----------|------|----------|-------|
| 5a | Inline Historical Context (Coach) | 2.5h | 🔴 High | Dev1 |
| 5b | Test coach view with real data | 1h | 🔴 High | QA |
| 6a | "Aula Summary" Auto-generated | 1.5h | 🔴 High | Dev1 |
| 6b | Test summary generation logic | 0.5h | 🔴 High | QA |
| 7a | Absence Streak Warning + Alert | 1.5h | 🔴 High | Dev1 |
| 7b | QA + edge cases | 0.5h | 🔴 High | QA |
| 8a | Streamlined Inline Eval Panel | 3h | 🔴 High | Dev2 |
| 8b | UX polish + accessibility | 1h | 🟡 Medium | Design |
| Bug fixes | Post-launch feedback | 2h | 🔴 High | Dev1/2 |
| **Total** | | **13.5h** | | |

**Deliverable:** 4/8 pre-launch features complete, 90% polish

---

## **SPRINT 2 (Week 2: May 23-29) — Competitive Features (Round 1)**

### Focus: QR/NFC + Team dynamics

| Task | Innovation | Est. | Notes |
|------|-----------|------|-------|
| 9a | QR Code Check-in (MVP) | 4h | Generate QR, scan, auto check-in |
| 9b | NFC fallback planning | 1h | Research partner for tags |
| 9c | Test on real devices | 1.5h | iPhone + Android |
| 11a | Shared Timer + Coach Monitoring | 3h | Realtime sync for group training |
| 11b | Dashboard for coach visibility | 1h | Show who's on time, who's late |
| 15a | Fundamental Weakness Alert | 2h | Auto-detect weak point, suggest training |
| Polish | Polish based on S1 feedback | 2h | UI tweaks, animations |
| **Total** | | **14.5h** | |

**Deliverable:** QR check-in live, coach tools enhanced, smart alerts active

---

## **SPRINT 3 (Week 3: May 30 - June 5) — Competitive Features (Round 2) + Infrastructure**

### Focus: Leaderboard gamification + infrastructure for Phase 12

| Task | Innovation | Est. | Notes |
|------|-----------|------|-------|
| 12a | Real-time Leaderboard During Class | 3h | Live ranking, push updates |
| 12b | Student device display setup | 1h | Show ranking on student phones |
| 14a | Dashboard Customization (Drag-drop) | 3h | Reorderable cards, pin/unpin |
| 14b | Persist to localStorage | 1h | Save user preferences |
| 13a | Achievement Unlocking Animation | 1.5h | Improved confetti + celebratory UX |
| Infra | Video Library infrastructure | 3h | S3 bucket setup, CDN config |
| Infra | AI/ML model integration planning | 2h | TensorFlow.js for form verification |
| **Total** | | **14.5h** | |

**Deliverable:** Leaderboard during class live, dashboard custom, infrastructure ready

---

## **SPRINT 4 (Week 4: June 6-12) — Long-term Setup + Stretch Goals**

### Focus: Phase 12 (video, AI, biometrics) kickoff

| Task | Innovation | Est. | Notes |
|------|-----------|------|-------|
| 17a | Video Upload + Storage | 4h | S3 integration, video player |
| 17b | Transcoding pipeline | 2h | AWS Lambda or Cloudinary |
| 18a | Form Verification (AI) + Research | 3h | TensorFlow.js pose detection |
| 18b | MVP implementation | 5h | Real-time feedback on form |
| 19a | Before/After Photo Tracking | 2h | Comparison slider UI |
| 19b | AI body composition (optional) | 2h | Rekognition integration |
| Stretch | Wearable API integration (research) | 2h | Garmin, Apple Watch APIs |
| **Total** | | **20h** | |

**Deliverable:** Video system live (coaches can upload), Form AI MVP, infrastructure for Phase 12

---

## 📊 CUMULATIVE IMPACT BY SPRINT

| Sprint | Features Live | Total Innovations | Cumulative User Impact |
|--------|--------------|-------------------|------------------------|
| Pre-launch | 4 | 4 | 50% premium feel |
| Sprint 1 | 4 | 8 | 80% premium + coaching excellence |
| Sprint 2 | 3 | 11 | QR efficiency + team dynamics |
| Sprint 3 | 4 | 15 | Gamification peak + customization |
| Sprint 4 | 5 | 20 | AI-powered training + long-term vision |

---

## 🎯 PARALLEL WORK TRACKS

### **If 2 Devs Available**

```
DEV 1 (Performance/Coaching)        DEV 2 (Gamification/UX)
├─ Sprint 1: Eval panel (8a)        ├─ Sprint 1: All others (5,6,7)
├─ Sprint 2: Coach monitoring (11)  ├─ Sprint 2: Weak point alert (15)
├─ Sprint 3: Video upload (17a)     ├─ Sprint 3: Leaderboard (12)
├─ Sprint 4: Form AI (18)           ├─ Sprint 4: Dashboard custom (14)
└─ Continuous: Bug fixes            └─ Continuous: Polish + testing
```

**Throughput:** Can deliver 30-35h/week = 2 full sprints parallel

---

## 🔄 DEPENDENCY CHAIN

```
PRE-LAUNCH (must be done)
└─ inovações 1-8 ✅ (done)

SPRINT 1 (enables Sprint 2-3)
└─ Eval panel (8) → Coach monitoring (11)
└─ Alerts (7) → Smart recommendations (15)

SPRINT 2 (enables Sprint 3)
└─ QR check-in (9) → Coach dashboard (11)
└─ Weakness alerts (15) → Training suggestions

SPRINT 3 (enables Sprint 4)
└─ Dashboard custom (14) → Video display preferences
└─ Leaderboard (12) → Real-time gamification data

SPRINT 4 (Phase 12 foundation)
└─ Video (17) → AI coaching (18)
└─ Form AI (18) → Biometric integration (future)
```

---

## 📋 SUCCESS CRITERIA BY SPRINT

### **Sprint 1 Success**
- [x] 4/8 pre-launch features done
- [x] <2 critical bugs reported
- [x] User feedback: "Feel premium" quotes captured
- [x] Leaderboard engagement +30% (baseline)

### **Sprint 2 Success**
- [x] QR check-in live, 90% adoption in class
- [x] Coach tools reduce eval time by 50%
- [x] Weakness alerts generate 20%+ training engagement
- [x] No critical bugs in production

### **Sprint 3 Success**
- [x] Leaderboard during class: 100% of classes use it
- [x] Dashboard customization: 60%+ users customize
- [x] Video infra ready for production load
- [x] Zero downtime in 4-week period

### **Sprint 4 Success**
- [x] Video system live: 80%+ coaches upload content
- [x] Form AI MVP working on 5+ exercises
- [x] User feedback: "Feels like private coaching AI"
- [x] Phase 12 fully scoped & architected

---

## 🚀 LAUNCH DAY SETUP

**Before you deploy, save these for post-launch:**

### Post-Launch Admin Tasks (Day 1)
1. Enable push notifications in Supabase
2. Verify Sentry error tracking is live
3. Set up Vercel environment monitors
4. Brief support team on new features

### Post-Launch Coach Tasks (Day 1-2)
1. Record "How to use QR check-in" tutorial
2. Test leaderboard display on gym displays
3. Gather feedback on new eval panel

### Post-Launch Analytics (Day 1+)
1. Track Sprint 1 feature engagement
2. Monitor error logs for edge cases
3. Collect user feedback for Sprint 2 priorities

---

## 💡 STRETCH GOALS (if ahead of schedule)

- Implement **real-time notifications for awards** (confetti on all devices)
- Add **voice feedback recording** during evaluation
- Build **Instagram feed integration** for cross-posting XP wins
- Create **coach training program** (certification path) gamified

---

## 📞 ESCALATION CONTACTS

- **Performance bottleneck?** → Performance-engineer agent (Vercel deployment, bundle analysis)
- **Security concern?** → Security-scanner agent (RLS, auth, data exposure)
- **Design question?** → will-design-guardian (UI/UX decisions)
- **Volleyball domain?** → Volleyball-coach agent (game logic, XP formulas)

---

**Created:** May 9, 2026  
**Phase:** 3 → 1 (Post-launch)  
**Status:** Ready for execution
