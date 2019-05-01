import consolePatch from '../../../../shared-lib/src/consolePatch'
import { getJamSnapshotRequestModel } from '../../api-models/getJamSnapshotRequestModel';
import * as queries from "../../db/queries";
import moment = require("moment");

let model = <getJamSnapshotRequestModel> {
    date: "2018-08-03",
    fields: ["id", "latitude", "longitude", "street"],
    countOnly: false,
    maxLat: 0,
    maxLon: 40,
    minLat: -100,
    minLon: 0,
    num: 50,
    offset: 0,
    time: "17:30:00",
    getSnapshotDateTime: function(){
        return moment("2018-08-03 17:30:00").toDate();
    },
};


queries.getJamListSnapshotQuery(model)
    .then(
        function(r) { 
            console.log("done");

        })
    .catch(err => {throw err;});