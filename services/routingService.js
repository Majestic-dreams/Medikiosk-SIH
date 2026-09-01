const {
    getCaseRecords,
    getCanonicalSymptomRecords
} = require("./datasetService");


// ==========================================
// TEXT NORMALIZATION
// ==========================================

function normalizeText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// ==========================================
// TOKENIZATION
// ==========================================

function tokenize(value) {

    const text = normalizeText(value);

    if (!text) {
        return [];
    }

    return text.split(" ");
}


// ==========================================
// WORD MATCH SCORE
// ==========================================

function wordMatchScore(input, target) {

    const inputWords = new Set(
        tokenize(input)
    );

    const targetWords =
        tokenize(target);

    if (
        inputWords.size === 0 ||
        targetWords.length === 0
    ) {
        return 0;
    }

    let matches = 0;

    for (const word of targetWords) {

        if (inputWords.has(word)) {
            matches++;
        }
    }

    return matches / targetWords.length;
}


// ==========================================
// FIND BEST CASE MATCH
// ==========================================

function findBestCaseMatch(patientInput) {

    const cases =
        getCaseRecords();

    const complaint =
        patientInput.chief_complaint || "";

    let bestMatch = null;
    let bestScore = 0;


    for (const record of cases) {

        const complaintScore =
            wordMatchScore(
                complaint,
                record.canonical_complaint
            );


        const utteranceScore =
            wordMatchScore(
                complaint,
                record.patient_utterance
            );


        const score =
            Math.max(
                complaintScore,
                utteranceScore
            );


        if (score > bestScore) {

            bestScore = score;

            bestMatch = record;
        }
    }


    // --------------------------------------
    // Minimum reliable case-match threshold
    // --------------------------------------

    const MIN_CASE_MATCH_SCORE = 0.30;


    if (
        !bestMatch ||
        bestScore < MIN_CASE_MATCH_SCORE
    ) {

        return {

            record: null,

            score: 0

        };
    }


    return {

        record: bestMatch,

        score: bestScore

    };
}


// ==========================================
// FIND CANONICAL SYMPTOM
// ==========================================

function findCanonicalMatch(patientInput) {

    const records =
        getCanonicalSymptomRecords();

    const complaint =
        patientInput.chief_complaint || "";

    let bestMatch = null;
    let bestScore = 0;


    for (const record of records) {

        const normalizedSymptom =
            record.normalized_symptom || "";

        const symptomGroup =
            record.symptom_group || "";


        const symptomScore =
            wordMatchScore(
                complaint,
                normalizedSymptom
            );


        const groupScore =
            wordMatchScore(
                complaint,
                symptomGroup
            );


        const score =
            Math.max(
                symptomScore,
                groupScore
            );


        if (score > bestScore) {

            bestScore = score;

            bestMatch = record;
        }
    }


    return {

        record: bestMatch,

        score: bestScore

    };
}


// ==========================================
// CHECK WHETHER CLARIFICATION ANSWERS EXIST
// ==========================================

function hasClarificationAnswers(
    clarificationAnswers
) {

    if (
        !clarificationAnswers ||
        typeof clarificationAnswers !== "object" ||
        Array.isArray(clarificationAnswers)
    ) {

        return false;
    }


    return Object.keys(
        clarificationAnswers
    ).length > 0;
}


// ==========================================
// EVALUATE CLARIFICATION ANSWERS
// ==========================================
//
// IMPORTANT:
// This function does NOT diagnose illness.
//
// It only checks whether an answer indicates
// that human review should occur.
//
// ==========================================

function evaluateClarificationAnswers(
    clarificationAnswers
) {

    const answers =
        clarificationAnswers || {};


    const answerValues =
        Object.values(answers)
            .map(value =>
                normalizeText(value)
            )
            .filter(Boolean);


    if (answerValues.length === 0) {

        return {

            has_answers: false,

            concerning: false

        };
    }


    // --------------------------------------
    // Responses treated as concerning
    // --------------------------------------

    const concerningAnswers = [

        "yes",

        "true",

        "positive"

    ];


    const concerning =
        answerValues.some(
            answer =>
                concerningAnswers.includes(
                    answer
                )
        );


    return {

        has_answers: true,

        concerning

    };
}


// ==========================================
// SAFETY EVALUATION
// ==========================================
//
// This layer is for routing safety only.
// It does NOT diagnose diseases.
//
// ==========================================

function evaluateSafety(
    caseMatch,
    canonicalMatch,
    clarificationAnswers = {}
) {

    const caseRecord =
        caseMatch?.record;

    const canonicalRecord =
        canonicalMatch?.record;


    const clarificationState =
        evaluateClarificationAnswers(
            clarificationAnswers
        );


    const hasAnswers =
        clarificationState.has_answers;


    // ======================================
    // DATASET SAFETY FIELDS
    // ======================================

    const escalationRequired =
        normalizeText(
            caseRecord?.escalation_required
        );


    const clarificationRequired =
        normalizeText(
            caseRecord?.clarification_required
        );


    const canonicalEscalation =
        normalizeText(
            canonicalRecord?.escalation_required
        );


    const canonicalClarification =
        normalizeText(
            canonicalRecord?.clarification_required
        );


    // ======================================
    // STEP 1 — CLARIFICATION ANSWER SAFETY
    // ======================================
    //
    // A concerning response does not mean
    // a diagnosis has been made.
    //
    // It simply sends the case to
    // human review.
    //
    // ======================================

    if (
        clarificationState.concerning
    ) {

        return {

            level: "ESCALATION",

            requires_human_review: true,

            escalation_required: true,

            clarification_required: false,

            reason:
                "Patient clarification responses require human review."

        };
    }


    // ======================================
    // STEP 2 — DATASET ESCALATION
    // ======================================

    if (

        escalationRequired &&

        ![
            "no",
            "none",
            "false",
            "0"
        ].includes(
            escalationRequired
        )

    ) {

        return {

            level: "ESCALATION",

            requires_human_review: true,

            escalation_required: true,

            clarification_required: false,

            reason:
                caseRecord.escalation_required

        };
    }


    if (

        canonicalEscalation &&

        ![
            "no",
            "none",
            "false",
            "0"
        ].includes(
            canonicalEscalation
        )

    ) {

        return {

            level: "ESCALATION",

            requires_human_review: true,

            escalation_required: true,

            clarification_required: false,

            reason:
                canonicalRecord.escalation_required

        };
    }


    // ======================================
    // STEP 3 — CLARIFICATION REQUIRED
    // ======================================
    //
    // If answers have already been provided,
    // do NOT ask the same clarification
    // questions again.
    //
    // ======================================

    if (

        clarificationRequired &&

        ![
            "no",
            "none",
            "false",
            "0"
        ].includes(
            clarificationRequired
        ) &&

        !hasAnswers

    ) {

        return {

            level: "CLARIFICATION",

            requires_human_review: false,

            escalation_required: false,

            clarification_required: true,

            reason:
                caseRecord.clarification_required

        };
    }


    if (

        canonicalClarification &&

        ![
            "no",
            "none",
            "false",
            "0"
        ].includes(
            canonicalClarification
        ) &&

        !hasAnswers

    ) {

        return {

            level: "CLARIFICATION",

            requires_human_review: false,

            escalation_required: false,

            clarification_required: true,

            reason:
                canonicalRecord.clarification_required

        };
    }


    // ======================================
    // STEP 4 — NORMAL
    // ======================================

    return {

        level: "NORMAL",

        requires_human_review: false,

        escalation_required: false,

        clarification_required: false,

        reason: null

    };
}


// ==========================================
// MAIN ROUTING FUNCTION
// ==========================================

function routePatient(patientInput) {

    // --------------------------------------
    // Extract chief complaint
    // --------------------------------------

    const chiefComplaint =
        patientInput?.symptoms?.chief_complaint ||
        patientInput?.chief_complaint ||
        "";


    // --------------------------------------
    // Extract clarification answers
    // --------------------------------------

    const clarificationAnswers =
        patientInput?.clarification_answers ||
        {};


    // --------------------------------------
    // Validate chief complaint
    // --------------------------------------

    if (!chiefComplaint) {

        return {

            success: false,

            error:
                "chief_complaint is required."

        };
    }


    // --------------------------------------
    // Routing input
    // --------------------------------------

    const routingInput = {

        chief_complaint:
            chiefComplaint

    };


    // ======================================
    // STEP 1 — FIND CLOSEST CASE
    // ======================================

    const caseMatch =
        findBestCaseMatch(
            routingInput
        );


    // ======================================
    // STEP 2 — FIND CANONICAL SYMPTOM
    // ======================================

    const canonicalMatch =
        findCanonicalMatch(
            routingInput
        );


    // ======================================
    // STEP 3 — SAFETY EVALUATION
    // ======================================

    const safety =
        evaluateSafety(

            caseMatch,

            canonicalMatch,

            clarificationAnswers

        );


    // ======================================
    // STEP 4 — ESCALATION
    // ======================================

    if (
        safety.level ===
        "ESCALATION"
    ) {

        return {

            success: true,

            routing_status:
                "ESCALATION",

            requires_human_review:
                true,

            escalation_required:
                true,

            clarification_required:
                false,

            routing: null,

            safety_reason:
                safety.reason,

            matched_case:
                caseMatch.record?.case_id ||
                null,

            case_match_score:
                caseMatch.score,

            matched_symptom:
                canonicalMatch.record?.symptom_id ||
                null

        };
    }


    // ======================================
    // STEP 5 — CLARIFICATION REQUIRED
    // ======================================

    if (
        safety.level ===
        "CLARIFICATION"
    ) {

        const record =
            caseMatch.record;


        return {

            success: true,

            routing_status:
                "CLARIFICATION_REQUIRED",

            requires_human_review:
                false,

            escalation_required:
                false,

            clarification_required:
                true,

            clarification_questions:
                record?.missing_information ||
                null,

            provisional_routing: {

                ayush_system:
                    record?.preferred_ayush_system ||
                    null,

                department:
                    record?.preferred_consultation ||
                    null,

                alternative_department:
                    record?.alternative_consultation ||
                    null

            },

            matched_case:
                record?.case_id ||
                null,

            case_match_score:
                caseMatch.score

        };
    }


    // ======================================
    // STEP 6 — NO RELIABLE MATCH
    // ======================================

    if (

        !caseMatch.record &&

        (
            !canonicalMatch.record ||

            canonicalMatch.score < 0.20
        )

    ) {

        return {

            success: true,

            routing_status:
                "INSUFFICIENT_MATCH",

            requires_human_review:
                true,

            escalation_required:
                false,

            clarification_required:
                false,

            routing: null,

            safety_reason:
                "The available dataset did not provide a sufficiently reliable routing match.",

            matched_case:
                null,

            case_match_score:
                0,

            matched_symptom:
                null

        };
    }


    // ======================================
    // STEP 7 — CASE-BASED ROUTING
    // ======================================

    if (
        caseMatch.record
    ) {

        const record =
            caseMatch.record;


        return {

            success: true,

            routing_status:
                "ROUTED",

            requires_human_review:
                false,

            escalation_required:
                false,

            clarification_required:
                false,

            routing: {

                ayush_system:
                    record.preferred_ayush_system ||
                    null,

                department:
                    record.preferred_consultation ||
                    null,

                alternative_department:
                    record.alternative_consultation ||
                    null,

                routing_confidence:
                    record.routing_confidence ||
                    null

            },

            match: {

                case_id:
                    record.case_id,

                score:
                    caseMatch.score

            },

            matched_case:
                record.case_id

        };
    }


    // ======================================
    // STEP 8 — CANONICAL ROUTING FALLBACK
    // ======================================

    if (

        canonicalMatch.record &&

        canonicalMatch.score >= 0.20

    ) {

        const record =
            canonicalMatch.record;


        return {

            success: true,

            routing_status:
                "ROUTED",

            requires_human_review:
                false,

            escalation_required:
                false,

            clarification_required:
                false,

            routing: {

                ayush_system:
                    record.primary_ayush_system ||

                    record.preferred_ayush_system ||

                    null,

                department:
                    record.suggested_department ||

                    record.preferred_consultation ||

                    null,

                alternative_department:
                    record.alternative_consultation ||

                    null,

                routing_confidence:
                    record.routing_confidence ||

                    null

            },

            match: {

                symptom_id:
                    record.symptom_id ||
                    null,

                normalized_symptom:
                    record.normalized_symptom ||
                    null,

                score:
                    canonicalMatch.score

            }

        };
    }


    // ======================================
    // FINAL FALLBACK
    // ======================================

    return {

        success: true,

        routing_status:
            "INSUFFICIENT_MATCH",

        requires_human_review:
            true,

        escalation_required:
            false,

        clarification_required:
            false,

        routing: null,

        safety_reason:
            "No reliable routing decision could be established."

    };
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    routePatient

};