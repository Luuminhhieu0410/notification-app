import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import pg from 'pg';
import importContract from './content-import-contract.cjs';

const { Client } = pg;
const {countByContentType, validateDataset} = importContract;

const normalize = (value) =>
    String(value)
        .normalize('NFC')
        .toLocaleLowerCase('vi')
        .replace(/[“”"'`….,!?;:()[\]{}\-–—_\/\\|]+/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();

const argv = new Map(
    process.argv.slice(2).map((argument) => {
        const [key, ...parts] = argument.replace(/^--/, '').split('=');
        return [key, parts.length ? parts.join('=') : 'true'];
    }),
);

const fileArgument = argv.get('file');

if (!fileArgument) {
    throw new Error(
        'Missing --file. Example: node scripts/import-content-json.mjs --file=data/content/v1/morning-mixed-humor-batch-v5.vi.json',
    );
}

const file = resolve(process.cwd(), fileArgument);
const apply = argv.get('apply') === 'true';

const data = JSON.parse(await readFile(file, 'utf8'));
validateDataset(data);

function parseTag(rawTag, itemKey) {
    if (!Array.isArray(rawTag) || rawTag.length !== 2) {
        throw new Error(`${itemKey}: every tag must be [category, slug]`);
    }

    const [rawCategory, rawSlug] = rawTag;

    const category = String(rawCategory).trim();
    const slug = String(rawSlug).trim();

    if (!category || !slug) {
        throw new Error(`${itemKey}: tag category and slug cannot be empty`);
    }

    if (category.length > 50) {
        throw new Error(`${itemKey}: tag category exceeds 50 characters`);
    }

    if (slug.length > 100) {
        throw new Error(`${itemKey}: tag slug exceeds 100 characters`);
    }

    return {
        category,
        slug,
        name: slug.replaceAll('_', ' '),
    };
}

function mapItem(item) {
    const key = String(item.key ?? '').trim();

    if (!key) {
        throw new Error('Every item requires key');
    }

    if (key.length > 150) {
        throw new Error(`${key}: key exceeds 150 characters`);
    }

    if (typeof item.text !== 'string' || !item.text.trim()) {
        throw new Error(`${key}: text is required`);
    }

    if (!Array.isArray(item.tags) || item.tags.length === 0) {
        throw new Error(`${key}: tags must be a non-empty array`);
    }

    const tagMap = new Map();

    for (const rawTag of item.tags) {
        const tag = parseTag(rawTag, key);

        tagMap.set(
            `${tag.category}:${tag.slug}`,
            tag,
        );
    }

    const contentType = String(
        item.contentType ?? data.defaults.contentType,
    ).trim();
    const rawAuthorSlug = item.authorSlug ?? data.defaults.authorSlug ?? null;
    const authorSlug = rawAuthorSlug === null
        ? null
        : String(rawAuthorSlug).trim();

    if (!contentType) {
        throw new Error(`${key}: contentType cannot be empty`);
    }

    if (contentType.length > 100) {
        throw new Error(`${key}: contentType exceeds 100 characters`);
    }

    if (rawAuthorSlug !== null && !authorSlug) {
        throw new Error(`${key}: authorSlug cannot be empty`);
    }

    if (authorSlug && authorSlug.length > 150) {
        throw new Error(`${key}: authorSlug exceeds 150 characters`);
    }

    return {
        key,
        text: item.text.trim(),
        contentType,
        authorSlug,

        languageCode:
            item.languageCode ??
            data.defaults.languageCode,

        status:
            item.status ??
            data.defaults.status,

        origin:
            item.origin ??
            data.defaults.origin,

        rights:
            item.rights ??
            data.defaults.rights,

        tags: [...tagMap.values()],

        metadata: {
            datasetId: data.dataset.id,
            ...(item.metadata ?? {}),
        },
    };
}

const mappedItems = data.items.map(mapItem);

const uniqueInput = new Map();
const inputTexts = new Map();

const duplicateInputKeys = [];
const duplicateInputTexts = [];

for (const item of mappedItems) {
    if (uniqueInput.has(item.key)) {
        duplicateInputKeys.push(item.key);
    } else {
        uniqueInput.set(item.key, item);
    }

    const normalizedText = normalize(item.text);

    if (inputTexts.has(normalizedText)) {
        duplicateInputTexts.push({
            firstKey: inputTexts.get(normalizedText),
            duplicateKey: item.key,
        });
    } else {
        inputTexts.set(
            normalizedText,
            item.key,
        );
    }
}

if (duplicateInputKeys.length) {
    throw new Error(
        `Duplicate item keys: ${[
            ...new Set(duplicateInputKeys),
        ].join(', ')}`,
    );
}

if (duplicateInputTexts.length) {
    throw new Error(
        `Duplicate item texts in input: ${JSON.stringify(
            duplicateInputTexts,
        )}`,
    );
}

if (!apply) {
    const byContentType = countByContentType(mappedItems);

    console.log(
        JSON.stringify(
            {
                mode: 'dry-run',
                file,
                dataset: data.dataset.id,
                items: mappedItems.length,
                uniqueTexts: inputTexts.size,
                byContentType,
                next: `node scripts/import-content-json.mjs --file=${fileArgument} --apply=true`,
            },
            null,
            2,
        ),
    );

    process.exit(0);
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

async function findOrCreateTag(
    client,
    tag,
) {
    const id = randomUUID();

    const result = await client.query(
        `
            INSERT INTO tags (
                id,
                category,
                slug,
                name,
                created_at
            )
            VALUES ($1, $2, $3, $4, NOW())

                ON CONFLICT (category, slug)
      DO UPDATE SET
                name = EXCLUDED.name

                             RETURNING id
        `,
        [
            id,
            tag.category,
            tag.slug,
            tag.name,
        ],
    );

    return result.rows[0].id;
}

const client = new Client({
    connectionString:
    process.env.DATABASE_URL,
});

await client.connect();

try {
    await client.query('BEGIN');

    await client.query(
        `
      SELECT pg_advisory_xact_lock(
        hashtextextended($1, 0)
      )
    `,
        ['content-import'],
    );

    const existingRows =
        await client.query(`
            SELECT
                id,
                key,
                text
            FROM contents
        `);

    const existingByKey = new Map(
        existingRows.rows.map((row) => [
            row.key,
            row,
        ]),
    );

    const existingByText = new Map(
        existingRows.rows.map((row) => [
            normalize(row.text),
            row,
        ]),
    );

    const contentTypeRows = await client.query(`
        SELECT id, slug, is_active
        FROM content_types
    `);
    const contentTypesBySlug = new Map(
        contentTypeRows.rows.map((row) => [row.slug, row]),
    );
    const authorRows = await client.query(`
        SELECT id, slug
        FROM authors
    `);
    const authorsBySlug = new Map(
        authorRows.rows.map((row) => [row.slug, row]),
    );

    let inserted = 0;
    let skipped = 0;

    const duplicateTexts = [];

    for (const item of mappedItems) {
        const contentType = contentTypesBySlug.get(item.contentType);
        if (!contentType) {
            throw new Error(
                `${item.key}: unknown contentType slug ${item.contentType}`,
            );
        }
        if (!contentType.is_active) {
            throw new Error(
                `${item.key}: contentType ${item.contentType} is inactive`,
            );
        }

        const author = item.authorSlug
            ? authorsBySlug.get(item.authorSlug)
            : null;
        if (item.authorSlug && !author) {
            throw new Error(
                `${item.key}: unknown authorSlug ${item.authorSlug}`,
            );
        }

        const existingKey =
            existingByKey.get(item.key);

        if (existingKey) {
            if (
                normalize(existingKey.text) !==
                normalize(item.text)
            ) {
                throw new Error(
                    `${item.key}: key already exists with different text; create a new key instead of editing immutable content`,
                );
            }

            skipped += 1;
            continue;
        }

        const normalizedText =
            normalize(item.text);

        const existingText =
            existingByText.get(
                normalizedText,
            );

        if (existingText) {
            duplicateTexts.push({
                key: item.key,
                existingKey:
                existingText.key,
            });

            skipped += 1;
            continue;
        }

        const contentId =
            randomUUID();

        await client.query(
            `
                INSERT INTO contents (
                    id,
                    key,
                    text,
                    content_type_id,
                    author_id,
                    language_code,
                    status,
                    origin,
                    rights,
                    metadata,
                    created_at,
                    updated_at
                )
                VALUES (
                           $1,
                           $2,
                           $3,
                           $4,
                           $5,
                           $6,
                           $7,
                           $8,
                           $9,
                           $10::jsonb,
                           NOW(),
                           NOW()
                       )
            `,
            [
                contentId,
                item.key,
                item.text,
                contentType.id,
                author?.id ?? null,
                item.languageCode,
                item.status,
                item.origin,
                item.rights,
                JSON.stringify(
                    item.metadata,
                ),
            ],
        );

        for (const tag of item.tags) {
            const tagId =
                await findOrCreateTag(
                    client,
                    tag,
                );

            await client.query(
                `
                    INSERT INTO content_tags (
                        content_id,
                        tag_id
                    )
                    VALUES ($1, $2)

                        ON CONFLICT DO NOTHING
                `,
                [
                    contentId,
                    tagId,
                ],
            );
        }

        const insertedRow = {
            id: contentId,
            key: item.key,
            text: item.text,
        };

        existingByKey.set(
            item.key,
            insertedRow,
        );

        existingByText.set(
            normalizedText,
            insertedRow,
        );

        inserted += 1;
    }

    await client.query('COMMIT');

    console.log(
        JSON.stringify(
            {
                mode: 'applied',
                dataset:
                data.dataset.id,
                inserted,
                skipped,
                duplicateTexts,
            },
            null,
            2,
        ),
    );
} catch (error) {
    await client.query(
        'ROLLBACK',
    );

    throw error;
} finally {
    await client.end();
}
