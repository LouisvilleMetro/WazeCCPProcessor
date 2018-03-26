CREATE SCHEMA waze;

CREATE TABLE waze.signals
(
"id"                                BIGINT PRIMARY KEY NOT NULL,
"date_start"                        TIMESTAMP WITH TIME ZONE,
"date_end"                          TIMESTAMP WITH TIME ZONE,
CONSTRAINT "unique_date_start"      UNIQUE("date_start"),
CONSTRAINT "unique_date_end"      UNIQUE("date_end")
);

CREATE TABLE waze.jams 
(
  "id"                  BIGINT PRIMARY KEY NOT NULL,
  "uuid"                VARCHAR[500] NOT NULL,
  "pub_millis"          BIGINT NOT NULL,
  "start_node"          VARCHAR[500],
  "end_node"            VARCHAR[500],
  "road_type"           INTEGER,
  "street"              VARCHAR[500],
  "city"                VARCHAR[500],
  "country"             VARCHAR[500],
  "delay"               INTEGER,
  "speed"               float4,
  "length"              INTEGER,
  "turn_type"           VARCHAR[500],
  "level"               INTEGER,
  "blocking_alert_id"   VARCHAR[500]
);

    id = Column("JamId", Integer, primary_key=True)
    object_id = Column("JamObjectId", Unicode)
    dateStart = Column("JamDateStart", DateTime(timezone=True),
                       ForeignKey("MongoRecord.MgrcDateStart", ondelete="CASCADE"), nullable=False)
    dateEnd = Column("JamDateEnd", DateTime(timezone=True))
    city = Column("JamDscCity", Unicode)
    coords = Column("JamDscCoordinatesLonLat", typeJSON)
    roadType = Column("JamDscRoadType", Integer)
    segments = Column("JamDscSegments", typeJSON)
    street = Column("JamDscStreet", Unicode)
    endNode = Column("JamDscStreetEndNode", Unicode)
    turnType = Column("JamDscTurnType", Unicode)
    jam_type = Column("JamDscType", Unicode)
    level = Column("JamIndLevelOfTraffic", Integer)
    length = Column("JamQtdLengthMeters", Integer)
    speed = Column("JamSpdMetersPerSecond", Float)
    delay = Column("JamTimeDelayInSeconds", Integer)
    pubMillis = Column("JamTimePubMillis", BigInteger)
    uuid = Column("JamUuid", Integer)
    
    __table_args__ = (UniqueConstraint("JamDateStart", "JamUuid", name="JamDateUuid"),)

CREATE TABLE waze.alerts 
(
  "id"                            BIGINT PRIMARY KEY NOT NULL,
  "uuid"                          VARCHAR[500] NOT NULL, 
  "pub_millis"                    BIGINT NOT NULL,
  "road_type"                     INTEGER,
  "street"                        VARCHAR[500],
  "city"                          VARCHAR[500],
  "country"                       VARCHAR[500],
  "magvar"                        INTEGER,
  "reliability"                   INTEGER,
  "report_description"            VARCHAR[500],
  "report_rating"                 INTEGER,
  "type"                          VARCHAR[500],
  "subtype"                       VARCHAR[500],
  "report_by_municipality_user"   BOOLEAN,
  "thumbs_up"                     INTEGER,
  "jam_id"                        VARCHAR[500] REFERENCES waze.jams (uuid),
  "irregularity_id"               VARCHAR[500] REFERENCES waze.irregularities (uuid)
);

CREATE TABLE waze.irregularities 
(
  "id"                      BIGINT PRIMARY KEY NOT NULL,
  "uuid"                    VARCHAR[500] NOT NULL,
  "detection_date_millis"   BIGINT NOT NULL,
  "detection_date"          TIMESTAMP,
  "update_date_millis"      BIGINT NOT NULL,
  "update_date"             TIMESTAMP,
  "street"                  VARCHAR[500],
  "city"                    VARCHAR[500],
  "country"                 VARCHAR[500],
  "is_highway"              BOOLEAN,
  "speed"                   float4,
  "regular_speed"           float4,
  "delay_seconds"           INTEGER,
  "seconds"                 INTEGER,
  "length"                  INTEGER,
  "trend"                   INTEGER,
  "type"                    VARCHAR[500],
  "severity"                float4,
  "jam_level"               INTEGER,
  "drivers_count"           INTEGER,
  "alerts_count"            INTEGER,
  "n_thumbs_up"             INTEGER,
  "n_comments"              INTEGER,
  "n_images"                INTEGER
);


CREATE TABLE waze.coordinates 
(
  "id"                BIGINT PRIMARY KEY NOT NULL,
  "latitude"          float8 NOT NULL,
  "longitude"         float8 NOT NULL,
  "order"             INTEGER NOT NULL,
  "jam_id"            BIGINT REFERENCES waze.jams (id),
  "irregularity_id"   BIGINT REFERENCES waze.irregularities (id),
  "alert_id"          BIGINT REFERENCES waze.alerts (id)
);

CREATE TABLE waze.roads 
(
  "id"      INTEGER PRIMARY KEY NOT NULL,
  "value"   INTEGER NOT NULL,
  "name"    VARCHAR[100] NOT NULL
);

CREATE TABLE waze.alert_types 
(
  "id"        BIGINT PRIMARY KEY NOT NULL,
  "type"      VARCHAR[500] NOT NULL,
  "subtype"   VARCHAR[500]
);

