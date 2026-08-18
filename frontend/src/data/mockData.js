export const mockAnalysis = {
    id: "analysis-001",
    fileName: "sample-code.py",
    status: "completed",
    language: "Python",
    score: 72,

    summary: {
        totalIssues: 3,
        critical: 1,
        high: 1,
        medium: 1,
        low: 0,
    },

    findings: [
        {
            id: 1,
            type: "Performance",
            severity: "high",
            title: "Nested loop detected",
            description:
                "A nested loop may result in O(n²) time complexity and increase CPU consumption.",
            line: 12,
            recommendation:
                "Consider using a more efficient data structure or algorithm to reduce unnecessary iterations.",
        },
        {
            id: 2,
            type: "Database",
            severity: "critical",
            title: "N+1 query pattern",
            description:
                "Multiple database queries are executed inside a loop, which can increase processing time and resource usage.",
            line: 28,
            recommendation:
                "Use batch queries or eager loading to reduce the number of database calls.",
        },
        {
            id: 3,
            type: "API",
            severity: "medium",
            title: "Repeated API calls",
            description:
                "The same API resource is requested multiple times instead of reusing the existing response.",
            line: 41,
            recommendation:
                "Cache the API response and reuse it when the same data is required.",
        },
    ],
};