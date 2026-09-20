from typing import List, Dict, Any

class CandidateRankingEngine:
    """
    Deterministic Skill-Match Distance & Ranking Engine.
    Computes exact candidate skill overlap score:
    Score = (Matched Skills / Required Skills) * 60 + (Normalized CGPA / 10) * 40.
    """

    @classmethod
    def rank_candidates(
        cls,
        eligible_candidates: List[Dict[str, Any]],
        required_skills: List[str]
    ) -> List[Dict[str, Any]]:
        req_skills_lower = set(s.lower().strip() for s in required_skills)
        ranked = []

        for cand in eligible_candidates:
            cand_skills = set(s.lower().strip() for s in cand.get("skills", []))
            matched = req_skills_lower.intersection(cand_skills)
            missing = req_skills_lower.difference(cand_skills)

            skill_match_ratio = len(matched) / max(len(req_skills_lower), 1)
            cgpa = float(cand.get("cgpa", 0.0))

            # Deterministic composite score (out of 100)
            composite_score = round((skill_match_ratio * 60.0) + ((cgpa / 10.0) * 40.0), 1)

            ranked.append({
                **cand,
                "compositeMatchScore": composite_score,
                "matchedSkills": list(matched),
                "missingSkills": list(missing),
                "skillMatchPct": round(skill_match_ratio * 100, 1)
            })

        # Deterministic sort: highest composite score first, then higher CGPA
        ranked.sort(key=lambda x: (x["compositeMatchScore"], x["cgpa"]), reverse=True)

        for idx, item in enumerate(ranked):
            item["rank"] = idx + 1

        return ranked
