import { createClient } from '@clickhouse/client'

const client = createClient({
    url: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? 'admin',
    database: process.env.CLICKHOUSE_DB ?? 'bigdata',
})

export default client