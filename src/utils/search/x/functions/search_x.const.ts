export const sqlQuery = `WITH search_terms AS (
    SELECT
        unnest(string_to_array($1, ' ')) AS term
),
ranked_results AS (
    SELECT
        t.id,
        t.title,
        t.summary,
        ts_rank(
            setweight(to_tsvector('french', coalesce(t.title, '')), 'A') ||
            setweight(to_tsvector('french', coalesce(t.summary, '')), 'B'),
            to_tsquery('french', search_terms.term)
        ) AS rank
    FROM
        "public"."XSubject" t,
        search_terms
    WHERE
        to_tsvector('french', coalesce(t.title, '')) ||
        to_tsvector('french', coalesce(t.summary, '')) @@ to_tsquery('french', search_terms.term)
)
SELECT
    id,
    title,
    summary,
    sum(rank) AS total_rank
FROM
    ranked_results
GROUP BY
    id, title, summary
ORDER BY
    total_rank DESC
LIMIT 10;`;
