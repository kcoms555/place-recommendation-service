import pymysql
import time
import os

class soft_app_db:
	def __init__(self):
		self.conn = pymysql.connect(
			user	= os.environ['DBID'],
			passwd	= os.environ['DBPW'],
			host	= os.environ['DBHOST'],
			db	='softapp',
			charset='utf8'
		)
		self.db = self.conn.cursor(pymysql.cursors.DictCursor)

	def get_stations_from_db(self):
		station_in_db = {}
		if self.db.execute("select * from bike_station_info") > 0:
			result = self.db.fetchall()
			for item in result:
				station_in_db[item['stationId']] = {'stationName': item['stationName'], 'stationLatitude': item['stationLatitude'], 'stationLongitude': item['stationLongitude']}
		return station_in_db

	def get_bike_log_from_db(self):
		if self.db.execute("select * from bike_log") > 0:
			return self.db.fetchall()

	def insert_new_station(self, stationId, stationName, stationLatitude, stationLongitude):
		self.db.execute("insert into bike_station_info values(%s, %s, %s, %s)", 
			(stationId, stationName, stationLatitude, stationLongitude))

	def insert_new_bike_log(self, timestamp, stationId, rackTotCnt, parkingBikeTotCnt, shared):
		self.db.execute("insert into bike_log values(%s, %s, %s, %s, %s)", 
			(timestamp, stationId, rackTotCnt, parkingBikeTotCnt, shared))

	def insert_new_bike_change_log(self, timestamp, stationId, rackTotCntChange, parkingBikeTotCntChange, sharedChange):
		self.db.execute("insert into bike_change_log values(%s, %s, %s, %s, %s)", 
			(timestamp, stationId, rackTotCntChange, parkingBikeTotCntChange, sharedChange))
	def commit(self):
		self.conn.commit()
