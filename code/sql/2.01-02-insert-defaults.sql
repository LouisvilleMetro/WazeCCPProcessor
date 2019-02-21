/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use if not exists liberally

Any errors will fail the script
***************************************************************************************/

INSERT INTO waze.coordinate_type (id, type_name) VALUES (1, 'Line') ON CONFLICT DO NOTHING;
INSERT INTO waze.coordinate_type (id, type_name) VALUES (2, 'Turn Line') ON CONFLICT DO NOTHING;
INSERT INTO waze.coordinate_type (id, type_name) VALUES (3, 'Location') ON CONFLICT DO NOTHING;

-- load roads
INSERT INTO waze.roads (value, name) VALUES (1, 'Streets') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (2, 'Primary Street') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (3, 'Freeways') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (4, 'Ramps') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (5, 'Trails') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (6, 'Primary') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (7, 'Secondary') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (8, '4X4 Trails') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (9, 'Walkway') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (10, 'Pedestrian') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (11, 'Exit') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (12, '?') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (13, '?') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (14, '4X4 Trails') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (15, 'Ferry crossing') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (16, 'Stairway') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (17, 'Private road') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (18, 'Railroads') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (19, 'Runway/Taxiway') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (20, 'Parking lot road') ON CONFLICT DO NOTHING;
INSERT INTO waze.roads (value, name) VALUES (21, 'Service road') ON CONFLICT DO NOTHING;

-- load alert_types
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'ACCIDENT_MINOR') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'ACCIDENT_MAJOR') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'NO_SUBTYPE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_MODERATE_TRAFFIC') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_HEAVY_TRAFFIC') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_STAND_STILL_TRAFFIC') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_LIGHT_TRAFFIC') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'NO_SUBTYPE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_OBJECT') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_POT_HOLE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_ROAD_KILL') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_CAR_STOPPED') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_ANIMALS') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_MISSING_SIGN') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FOG') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HAIL') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAVY_RAIN') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAVY_SNOW') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FLOOD') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_MONSOON') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_TORNADO') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAT_WAVE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HURRICANE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FREEZING_RAIN') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_LANE_CLOSED') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_OIL') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_ICE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_CONSTRUCTION') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_CAR_STOPPED') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'NO_SUBTYPE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('MISC', 'NO_SUBTYPE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('CONSTRUCTION', 'NO_SUBTYPE') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_HAZARD') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_CONSTRUCTION') ON CONFLICT DO NOTHING;
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_EVENT') ON CONFLICT DO NOTHING;
