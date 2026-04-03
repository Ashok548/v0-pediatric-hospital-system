import { Prisma } from '@carenest/database';

type SequenceTable =
    | 'op_visit_sequences'
    | 'bill_sequences'
    | 'prescription_sequences'
    | 'lab_order_sequences';

/**
 * Atomically increments and returns the next sequence value for a given year.
 * Uses PostgreSQL INSERT … ON CONFLICT DO UPDATE to guarantee atomicity
 * even under concurrent requests. Must be called inside a transaction.
 */
export async function nextSequenceValue(
    tx: Prisma.TransactionClient,
    table: SequenceTable,
    year: number,
): Promise<number> {
    // Single atomic upsert-and-increment — no separate read needed
    const rows = await tx.$queryRawUnsafe<{ last_value: number }[]>(`
        INSERT INTO ${table} (id, year, last_value, updated_at)
        VALUES (1, $1, 1, NOW())
        ON CONFLICT (id, year)
        DO UPDATE SET last_value = ${table}.last_value + 1, updated_at = NOW()
        RETURNING last_value
    `, year);

    if (!rows || rows.length === 0) {
        throw new Error(`Sequence table "${table}" returned no row for year ${year}`);
    }
    return Number(rows[0].last_value);
}
