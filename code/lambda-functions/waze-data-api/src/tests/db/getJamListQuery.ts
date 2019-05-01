import consolePatch from '../../../../shared-lib/src/consolePatch'
import { getJamListRequestModel } from '../../api-models/getJamListRequestModel';
import * as queries from "../../db/queries";
import moment = require("moment");

let model = <getJamListRequestModel> {
    startDate: "2018-08-03",
    startTime: "17:30:00",
    endDate: "2018-09-03",
    endTime: "18:30:00",
    fields: ["id", "latitude", "longitude", "street"],
    countOnly: false,
    maxLat: 0,
    maxLon: 40,
    minLat: -100,
    minLon: 0,
    num: 50,
    offset: 0,
    

    getStartDateTime: function(){
        return moment("2018-08-03 17:30:00").toDate();
    },
    getEndDateTime: function(){
        return moment("2018-08-03 18:30:00").toDate();
    }
};


queries.getJamsList(model)
    .then(
        function(r) { 
            console.log("done");

        })
    .catch(err => {throw err;});