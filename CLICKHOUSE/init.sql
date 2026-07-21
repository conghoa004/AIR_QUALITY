--- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS hoaze;

--- USE DATABASE
USE hoaze;

--- DROP AND RECREATE TABLE air_quality_analytics
DROP TABLE IF EXISTS hoaze.air_quality_analytics;

---  CREATE TABLE air_quality_analytics
CREATE TABLE air_quality_analytics
(
    `id` UUID DEFAULT generateUUIDv4(),

    `sensor_id` UInt32,
    `area` LowCardinality(String),
    `location_name` LowCardinality(String),

    `datetimeLocal` DateTime64(3, 'Asia/Ho_Chi_Minh'),
    `timezone` LowCardinality(String),

    `latitude` Float64,
    `longitude` Float64,
    `owner_name` LowCardinality(String),
    `provider` LowCardinality(String),

    `co_avg` Float32,
    `no2_avg` Float32,
    `so2_avg` Float32,
    `pm25_avg` Float32,
    `pm10_avg` Float32,
    `o3_avg` Float32,
    `o3_8h_avg` Float32,

    `aqi_co` Float32,
    `aqi_no2` Float32,
    `aqi_so2` Float32,
    `aqi_pm25` Float32,
    `aqi_pm10` Float32,
    `aqi_o3` Float32,

    `aqi_total` Float32,
    `main_pollutant` LowCardinality(String),

    `unit` LowCardinality(String),

    `inserted_at` DateTime DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(datetimeLocal)
ORDER BY (sensor_id, datetimeLocal)
SETTINGS index_granularity = 8192;

--- DROP AND RECREATE TABLE air_quality_realtime
DROP TABLE IF EXISTS hoaze.air_quality_realtime;

--- CREATE TABLE air_quality_realtime
CREATE TABLE hoaze.air_quality_realtime
(
    `id` UUID DEFAULT generateUUIDv4(),

    `sensor_id` UInt32,
    `area` LowCardinality(String),
    `location_name` LowCardinality(String),

    `datetimeLocal` DateTime64(3, 'Asia/Ho_Chi_Minh'),
    `timezone` LowCardinality(String),

    `latitude` Float64,
    `longitude` Float64,
    `owner_name` LowCardinality(String),
    `provider` LowCardinality(String),

    `co_avg` Float32,
    `no2_avg` Float32,
    `so2_avg` Float32,
    `pm25_avg` Float32,
    `pm10_avg` Float32,
    `o3_avg` Float32,
    `o3_8h_avg` Float32,

    `aqi_co` Float32,
    `aqi_no2` Float32,
    `aqi_so2` Float32,
    `aqi_pm25` Float32,
    `aqi_pm10` Float32,
    `aqi_o3` Float32,

    `aqi_total` Float32,
    `main_pollutant` LowCardinality(String),

    `unit` LowCardinality(String),

    `inserted_at` DateTime DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(datetimeLocal)
ORDER BY (sensor_id, datetimeLocal)
SETTINGS index_granularity = 8192;