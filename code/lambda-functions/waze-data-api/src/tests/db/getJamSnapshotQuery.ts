import consolePatch from '../../../../shared-lib/src/consolePatch'
import { getJamSnapshotRequestModel } from '../../api-models/getJamSnapshotRequestModel';
import * as queries from "../../db/queries";
import moment = require("moment");

let model = <getJamSnapshotRequestModel> {
    date: "2018-08-01",
    fields: ["id", "latitude", "longitude", "street"],
    countOnly: false,
    maxLat: -100,
    maxLon: 40,
    minLat: 0,
    minLon: 0,
    num: 50,
    offset: 0,
    time: "00:00:00",
    getSnapshotDateTime: function(){
        return moment("2018-08-01 00:00:00").toDate();
    },
};


queries.getJamListSnapshotQuery(model)
    .then(
        function(r) { 
            console.log("done");

        })
    .catch(err => {throw err;});