from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer

import urlparse

import json

import shelve

import datetime

import sys

import os



TIME_FORMAT = '%d.%m.%Y %H:%M:%S.%f'

DB_NAME =  "db.db"



class HttpProcessor(BaseHTTPRequestHandler):

    def do_GET(self):

        if "/get" in self.path:

            fields = self.get_fields()

            if not fields:

                print "There are no parameters"

                return

            callgroup = fields.get("callgroup")

            pickupgroup = fields.get("pickupgroup")

            if callgroup is None or pickupgroup is None:

                print "There are no pickupgroup or no callgroup"

                self.send_error(404)

                return None

            db = shelve.open( DB_NAME)

            data = []

            for key in db.keys():

                if "callgroup" in db[key] and "pickupgroup" in db[key] and str(db[key]["callgroup"]) == str(callgroup) and str(db[key]["pickupgroup"]) == str(pickupgroup):

                    entry = db[key]

                    data.append(entry)

            # Make simple dict for json

            self.send_json(data)

            db.close()



    def do_POST(self):

        data = self.get_json_data()

        if "uid" not in data:

            print "There are no a number"

            return

        uid = str(data["uid"])

        print data

        if "/put" in self.path:

            db = shelve.open( DB_NAME)

            db[uid] = data

            db.close()

            data = {"status": 200, "message": "OK"}

            self.send_json(data)

        elif "/del" in self.path:

            db = shelve.open( DB_NAME)

            if uid in db:

                del db[uid]

            data = {"status": 200, "message": "OK"}

            self.send_json(data)



    def send_json(self, data):

        self.send_response(200)

        self.send_header('Content-Type', 'application/json')

        self.end_headers()

        self.wfile.write(json.dumps(data))



    def get_json_data(self):

        length = int(self.headers.getheader('content-length'))

        field_data = self.rfile.read(length)

        try:

            data = json.loads(field_data)

        except:

            print "JSON error:" + field_data

            self.send_error(404)

            return None

        return data



    def get_fields(self):

        fields_data = self.path.split("?")

        if len(fields_data) < 2:

            return

        GET = {}

        args = fields_data[1].split('&')

        for arg in args:

            t = arg.split('=')

            if len(t) > 1:

                k, v = arg.split('=')

                GET[k] = v

        return GET



if __name__ == "__main__":

    if os.path.exists( DB_NAME):

        os.remove( DB_NAME)

    host = "192.168.1.254"

    port = 8000

    serv = HTTPServer((host, port), HttpProcessor)

    print "Server running at {}:{}".format(host, port)

    serv.serve_forever()

